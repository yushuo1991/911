import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// SQLite数据库路径
const DB_DIR = join(process.cwd(), 'data');
const DB_PATH = join(DB_DIR, 'stock_tracker.db');

// 确保数据目录存在
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

export class SQLiteDatabase {
  private static instance: SQLiteDatabase;
  private db: Database.Database;

  private constructor() {
    this.db = new Database(DB_PATH);

    // 性能优化配置
    this.db.pragma('journal_mode = WAL'); // 启用WAL模式提高并发性能
    this.db.pragma('synchronous = NORMAL'); // 平衡安全性和性能
    this.db.pragma('cache_size = 20000'); // 增加缓存大小到20MB
    this.db.pragma('temp_store = MEMORY'); // 临时数据使用内存
    this.db.pragma('mmap_size = 268435456'); // 使用256MB内存映射
    this.db.pragma('page_size = 4096'); // 优化页面大小
    this.db.pragma('auto_vacuum = INCREMENTAL'); // 增量自动清理
    this.db.pragma('wal_autocheckpoint = 1000'); // WAL自动检查点

    console.log('[SQLite] 数据库性能优化配置已应用');
  }

  public static getInstance(): SQLiteDatabase {
    if (!SQLiteDatabase.instance) {
      SQLiteDatabase.instance = new SQLiteDatabase();
    }
    return SQLiteDatabase.instance;
  }

  // 初始化数据库表
  initializeTables(): void {
    try {
      console.log('[SQLite] 开始初始化数据库表...');

      // 创建股票数据表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS stock_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          stock_code TEXT NOT NULL,
          stock_name TEXT NOT NULL,
          sector_name TEXT,
          sector_code TEXT,
          td_type TEXT,
          total_return REAL DEFAULT 0,
          trading_date TEXT NOT NULL,
          timestamp INTEGER DEFAULT (strftime('%s', 'now')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(stock_code, trading_date)
        )
      `);

      // 创建股票表现数据表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS stock_performance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          stock_code TEXT NOT NULL,
          trading_date TEXT NOT NULL,
          base_date TEXT NOT NULL,
          pct_change REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME,
          UNIQUE(stock_code, trading_date, base_date)
        )
      `);

      // 创建7天数据缓存表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS seven_days_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cache_key TEXT UNIQUE NOT NULL,
          cache_data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL
        )
      `);

      // 创建数据刷新日志表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS data_refresh_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          refresh_date TEXT NOT NULL,
          status TEXT NOT NULL,
          records_count INTEGER DEFAULT 0,
          error_message TEXT,
          refresh_time DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建索引优化查询性能
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_stock_data_date ON stock_data(trading_date);
        CREATE INDEX IF NOT EXISTS idx_stock_data_code ON stock_data(stock_code);
        CREATE INDEX IF NOT EXISTS idx_stock_performance_lookup ON stock_performance(stock_code, base_date);
        CREATE INDEX IF NOT EXISTS idx_cache_key ON seven_days_cache(cache_key);
        CREATE INDEX IF NOT EXISTS idx_cache_expires ON seven_days_cache(expires_at);
      `);

      console.log('[SQLite] 数据库表初始化完成');
    } catch (error) {
      console.error('[SQLite] 初始化数据库表失败:', error);
      throw error;
    }
  }

  // 缓存股票数据
  async cacheStockData(stockCode: string, stockName: string, sectorName: string, sectorCode: string,
                       tdType: string, totalReturn: number, tradingDate: string): Promise<void> {
    try {
      // 数据库层最终验证，防止空值导致约束失败
      if (!stockCode || !stockName || !tradingDate ||
          typeof stockCode !== 'string' || typeof stockName !== 'string' ||
          stockCode.trim() === '' || stockName.trim() === '') {
        console.log(`[SQLite] 跳过无效股票数据: code="${stockCode}", name="${stockName}", date="${tradingDate}"`);
        return; // 直接返回，不抛出错误
      }

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO stock_data
        (stock_code, stock_name, sector_name, sector_code, td_type, total_return, trading_date, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        stockCode.trim(),
        stockName.trim(),
        sectorName || '',
        sectorCode || '',
        tdType || '首板',
        totalReturn || 0,
        tradingDate.trim(),
        Date.now()
      );
    } catch (error) {
      console.error(`[SQLite] 缓存股票数据失败: ${error}`);
      console.error(`[SQLite] 问题数据: code="${stockCode}", name="${stockName}", sector="${sectorName}", date="${tradingDate}"`);
      // 不再抛出错误，避免中断整个流程
    }
  }

  // 获取缓存的股票数据
  getCachedStockData(tradingDate: string): any[] {
    try {
      const stmt = this.db.prepare(`
        SELECT stock_code, stock_name, sector_name, sector_code, td_type, total_return
        FROM stock_data
        WHERE trading_date = ?
        ORDER BY total_return DESC
      `);

      return stmt.all(tradingDate);
    } catch (error) {
      console.error(`[SQLite] 获取缓存股票数据失败: ${error}`);
      return [];
    }
  }

  // 缓存股票表现数据
  async cacheStockPerformance(stockCode: string, baseDate: string, performanceData: Record<string, number>): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO stock_performance
        (stock_code, trading_date, base_date, pct_change, expires_at)
        VALUES (?, ?, ?, ?, datetime('now', '+1 day'))
      `);

      const transaction = this.db.transaction(() => {
        for (const [tradingDate, pctChange] of Object.entries(performanceData)) {
          stmt.run(stockCode, tradingDate, baseDate, pctChange);
        }
      });

      transaction();
    } catch (error) {
      console.error(`[SQLite] 缓存股票表现数据失败: ${error}`);
      throw error;
    }
  }

  // 获取缓存的股票表现数据
  getCachedStockPerformance(stockCode: string, baseDate: string, tradingDays: string[]): Record<string, number> | null {
    try {
      const placeholders = tradingDays.map(() => '?').join(',');
      const stmt = this.db.prepare(`
        SELECT trading_date, pct_change
        FROM stock_performance
        WHERE stock_code = ? AND base_date = ?
        AND trading_date IN (${placeholders})
        AND expires_at > datetime('now')
      `);

      const rows = stmt.all(stockCode, baseDate, ...tradingDays);

      if (rows.length === tradingDays.length) {
        const result: Record<string, number> = {};
        rows.forEach((row: any) => {
          result[row.trading_date] = row.pct_change;
        });
        return result;
      }

      return null;
    } catch (error) {
      console.error(`[SQLite] 获取缓存股票表现数据失败: ${error}`);
      return null;
    }
  }

  // 缓存7天数据
  async cache7DaysData(cacheKey: string, data: any): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO seven_days_cache
        (cache_key, cache_data, expires_at)
        VALUES (?, ?, datetime('now', '+4 hours'))
      `);

      stmt.run(cacheKey, JSON.stringify(data));
    } catch (error) {
      console.error(`[SQLite] 缓存7天数据失败: ${error}`);
      throw error;
    }
  }

  // 获取7天缓存数据
  get7DaysCache(cacheKey: string): any | null {
    try {
      const stmt = this.db.prepare(`
        SELECT cache_data
        FROM seven_days_cache
        WHERE cache_key = ? AND expires_at > datetime('now')
      `);

      const row = stmt.get(cacheKey) as any;

      if (row) {
        return JSON.parse(row.cache_data);
      }

      return null;
    } catch (error) {
      console.error(`[SQLite] 获取7天缓存数据失败: ${error}`);
      return null;
    }
  }

  // 清理过期数据
  cleanupExpiredData(): void {
    try {
      // 清理过期的股票表现数据
      this.db.exec(`
        DELETE FROM stock_performance
        WHERE expires_at < datetime('now')
      `);

      // 清理过期的缓存数据
      this.db.exec(`
        DELETE FROM seven_days_cache
        WHERE expires_at < datetime('now')
      `);

      // 清理7天前的股票数据
      this.db.exec(`
        DELETE FROM stock_data
        WHERE created_at < datetime('now', '-7 days')
      `);

      console.log('[SQLite] 过期数据清理完成');
    } catch (error) {
      console.error('[SQLite] 清理过期数据失败:', error);
    }
  }

  // 记录数据刷新日志
  logDataRefresh(refreshDate: string, status: 'success' | 'error', recordsCount: number = 0, errorMessage?: string): void {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO data_refresh_log (refresh_date, status, records_count, error_message)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(refreshDate, status, recordsCount, errorMessage || null);
    } catch (error) {
      console.error('[SQLite] 记录刷新日志失败:', error);
    }
  }

  // 获取最近的刷新日志
  getRecentRefreshLog(limit: number = 10): any[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM data_refresh_log
        ORDER BY refresh_time DESC
        LIMIT ?
      `);

      return stmt.all(limit);
    } catch (error) {
      console.error('[SQLite] 获取刷新日志失败:', error);
      return [];
    }
  }

  // 获取数据库统计信息
  getDatabaseStats(): any {
    try {
      const stockDataCount = this.db.prepare('SELECT COUNT(*) as count FROM stock_data').get() as any;
      const performanceCount = this.db.prepare('SELECT COUNT(*) as count FROM stock_performance').get() as any;
      const cacheCount = this.db.prepare('SELECT COUNT(*) as count FROM seven_days_cache').get() as any;

      return {
        stockDataRecords: stockDataCount.count,
        performanceRecords: performanceCount.count,
        cacheRecords: cacheCount.count,
        dbPath: DB_PATH
      };
    } catch (error) {
      console.error('[SQLite] 获取统计信息失败:', error);
      return {};
    }
  }

  // 关闭数据库连接
  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}

// 导出单例实例
export const sqliteDatabase = SQLiteDatabase.getInstance();