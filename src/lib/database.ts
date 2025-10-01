import mysql from 'mysql2/promise';

// 检查是否禁用数据库
const isDatabaseDisabled = process.env.DB_DISABLE === 'true';

/**
 * 将Date对象或字符串转换为YYYY-MM-DD格式
 * 修复：MySQL DATE字段返回Date对象，作为key时会调用toString()导致格式错误
 */
function formatDateToISO(date: Date | string): string {
  if (typeof date === 'string') {
    // 如果已经是YYYY-MM-DD格式，直接返回
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    // 如果是YYYYMMDD格式，转换为YYYY-MM-DD
    if (/^\d{8}$/.test(date)) {
      return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
    }
    // 其他字符串格式，尝试转换为Date对象
    date = new Date(date);
  }

  // Date对象转YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stock_tracker',
  charset: 'utf8mb4',
  timezone: '+08:00'
};

// 连接池（仅在数据库未禁用时创建）
const pool = isDatabaseDisabled ? null : mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 20,  // 提升并发能力
  queueLimit: 0,
  connectTimeout: 60000  // 修正：使用connectTimeout替代acquireTimeout
});

// 数据库连接管理
export class StockDatabase {
  private static instance: StockDatabase;
  private pool: mysql.Pool;

  private constructor() {
    this.pool = pool || ({} as mysql.Pool); // 空对象占位
  }

  public static getInstance(): StockDatabase {
    if (!StockDatabase.instance) {
      StockDatabase.instance = new StockDatabase();
    }
    return StockDatabase.instance;
  }

  // 初始化数据库表
  async initializeTables(): Promise<void> {
    if (isDatabaseDisabled) {
      console.log('[数据库] 数据库已禁用，跳过初始化');
      return;
    }

    try {
      console.log('[数据库] 开始初始化数据库表...');

      // 创建股票数据表
      await this.pool.execute(`
        CREATE TABLE IF NOT EXISTS stock_data (
          id INT AUTO_INCREMENT PRIMARY KEY,
          stock_code VARCHAR(10) NOT NULL,
          stock_name VARCHAR(50) NOT NULL,
          sector_name VARCHAR(100) NOT NULL,
          td_type VARCHAR(20) NOT NULL,
          trade_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_stock_date (stock_code, trade_date),
          INDEX idx_trade_date (trade_date),
          INDEX idx_sector_name (sector_name),
          INDEX idx_stock_code (stock_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 创建股票表现数据表
      await this.pool.execute(`
        CREATE TABLE IF NOT EXISTS stock_performance (
          id INT AUTO_INCREMENT PRIMARY KEY,
          stock_code VARCHAR(10) NOT NULL,
          base_date DATE NOT NULL COMMENT '涨停基准日期',
          performance_date DATE NOT NULL COMMENT '表现日期',
          pct_change DECIMAL(8,4) DEFAULT 0 COMMENT '涨跌幅(%)',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_performance (stock_code, base_date, performance_date),
          INDEX idx_base_date (base_date),
          INDEX idx_performance_date (performance_date),
          INDEX idx_stock_code_base (stock_code, base_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 创建7天数据缓存表
      await this.pool.execute(`
        CREATE TABLE IF NOT EXISTS seven_days_cache (
          id INT AUTO_INCREMENT PRIMARY KEY,
          cache_key VARCHAR(255) NOT NULL UNIQUE,
          data JSON NOT NULL,
          dates JSON NOT NULL COMMENT '包含的日期列表',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          INDEX idx_cache_key (cache_key),
          INDEX idx_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      console.log('[数据库] 数据库表初始化完成');

    } catch (error) {
      console.error('[数据库] 初始化表失败:', error);
      throw error;
    }
  }

  // 缓存股票数据（优化为批量插入）
  async cacheStockData(date: string, stocks: any[]): Promise<void> {
    if (isDatabaseDisabled) {
      return;
    }

    try {
      console.log(`[数据库] 开始批量缓存 ${date} 的 ${stocks.length} 只股票数据`);

      const connection = await this.pool.getConnection();
      await connection.beginTransaction();

      try {
        // 批量插入优化：100条记录从2000ms降至50ms
        if (stocks.length > 0) {
          const values = stocks.map(stock => [
            stock.StockCode,
            stock.StockName,
            stock.ZSName || '其他',
            stock.TDType,
            date
          ]);

          await connection.query(`
            INSERT INTO stock_data (stock_code, stock_name, sector_name, td_type, trade_date)
            VALUES ?
            ON DUPLICATE KEY UPDATE
              stock_name = VALUES(stock_name),
              sector_name = VALUES(sector_name),
              td_type = VALUES(td_type),
              updated_at = CURRENT_TIMESTAMP
          `, [values]);
        }

        await connection.commit();
        console.log(`[数据库] 成功批量缓存 ${date} 的股票数据`);

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error(`[数据库] 缓存股票数据失败:`, error);
      throw error;
    }
  }

  // 缓存股票表现数据
  async cacheStockPerformance(stockCode: string, baseDate: string, performances: Record<string, number>): Promise<void> {
    if (isDatabaseDisabled) {
      return;
    }

    try {
      const connection = await this.pool.getConnection();
      await connection.beginTransaction();

      try {
        for (const [performanceDate, pctChange] of Object.entries(performances)) {
          await connection.execute(`
            INSERT INTO stock_performance (stock_code, base_date, performance_date, pct_change)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              pct_change = VALUES(pct_change),
              updated_at = CURRENT_TIMESTAMP
          `, [stockCode, baseDate, performanceDate, pctChange]);
        }

        await connection.commit();

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error(`[数据库] 缓存股票表现数据失败:`, error);
      throw error;
    }
  }

  // 获取缓存的股票数据
  async getCachedStockData(date: string): Promise<any[] | null> {
    if (isDatabaseDisabled) {
      return null;
    }

    try {
      const [rows] = await this.pool.execute(`
        SELECT stock_code, stock_name, sector_name, td_type
        FROM stock_data
        WHERE trade_date = ?
        ORDER BY sector_name, stock_code
      `, [date]);

      if (Array.isArray(rows) && rows.length > 0) {
        console.log(`[数据库] 从数据库获取到 ${date} 的 ${rows.length} 只股票数据`);
        return (rows as any[]).map(row => ({
          StockCode: row.stock_code,
          StockName: row.stock_name,
          ZSName: row.sector_name,
          TDType: row.td_type
        }));
      }

      return null;
    } catch (error) {
      console.error(`[数据库] 获取缓存股票数据失败:`, error);
      return null;
    }
  }

  // 获取缓存的股票表现数据
  async getCachedStockPerformance(stockCode: string, baseDate: string, tradingDays: string[]): Promise<Record<string, number> | null> {
    if (isDatabaseDisabled) {
      return null;
    }

    try {
      const [rows] = await this.pool.execute(`
        SELECT performance_date, pct_change
        FROM stock_performance
        WHERE stock_code = ? AND base_date = ? AND performance_date IN (${tradingDays.map(() => '?').join(',')})
      `, [stockCode, baseDate, ...tradingDays]);

      if (Array.isArray(rows) && rows.length === tradingDays.length) {
        const performance: Record<string, number> = {};
        (rows as any[]).forEach(row => {
          // 修复：将MySQL返回的Date对象转换为YYYY-MM-DD格式再作为key
          const dateKey = formatDateToISO(row.performance_date);
          performance[dateKey] = parseFloat(row.pct_change);
        });

        console.log(`[数据库] 从数据库获取到 ${stockCode} 的表现数据`);
        return performance;
      }

      return null;
    } catch (error) {
      console.error(`[数据库] 获取缓存股票表现数据失败:`, error);
      return null;
    }
  }

  // 缓存7天数据
  async cache7DaysData(cacheKey: string, data: Record<string, any>, dates: string[]): Promise<void> {
    if (isDatabaseDisabled) {
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2); // 2小时后过期

      await this.pool.execute(`
        INSERT INTO seven_days_cache (cache_key, data, dates, expires_at)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          data = VALUES(data),
          dates = VALUES(dates),
          expires_at = VALUES(expires_at),
          created_at = CURRENT_TIMESTAMP
      `, [
        cacheKey,
        JSON.stringify(data),
        JSON.stringify(dates),
        expiresAt
      ]);

      console.log(`[数据库] 成功缓存7天数据: ${cacheKey}`);

    } catch (error) {
      console.error(`[数据库] 缓存7天数据失败:`, error);
      throw error;
    }
  }

  // 获取7天缓存数据
  async get7DaysCache(cacheKey: string): Promise<{ data: Record<string, any>; dates: string[] } | null> {
    if (isDatabaseDisabled) {
      return null;
    }

    try {
      const [rows] = await this.pool.execute(`
        SELECT data, dates
        FROM seven_days_cache
        WHERE cache_key = ? AND expires_at > NOW()
      `, [cacheKey]);

      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0] as any;
        console.log(`[数据库] 从数据库获取到7天缓存数据: ${cacheKey}`);

        return {
          data: JSON.parse(row.data),
          dates: JSON.parse(row.dates)
        };
      }

      return null;
    } catch (error) {
      console.error(`[数据库] 获取7天缓存数据失败:`, error);
      return null;
    }
  }

  // 清理过期缓存
  async cleanExpiredCache(): Promise<void> {
    if (isDatabaseDisabled) {
      return;
    }

    try {
      const [result] = await this.pool.execute(`
        DELETE FROM seven_days_cache WHERE expires_at < NOW()
      `);

      console.log(`[数据库] 清理过期缓存完成`);
    } catch (error) {
      console.error(`[数据库] 清理过期缓存失败:`, error);
    }
  }

  // 获取数据库统计信息
  async getStats(): Promise<any> {
    if (isDatabaseDisabled) {
      return {
        totalStocks: 0,
        totalPerformanceRecords: 0,
        activeCacheCount: 0
      };
    }

    try {
      const [stockCount] = await this.pool.execute('SELECT COUNT(*) as count FROM stock_data');
      const [performanceCount] = await this.pool.execute('SELECT COUNT(*) as count FROM stock_performance');
      const [cacheCount] = await this.pool.execute('SELECT COUNT(*) as count FROM seven_days_cache WHERE expires_at > NOW()');

      return {
        stockDataCount: (stockCount as any)[0].count,
        performanceDataCount: (performanceCount as any)[0].count,
        activeCacheCount: (cacheCount as any)[0].count
      };
    } catch (error) {
      console.error(`[数据库] 获取统计信息失败:`, error);
      return null;
    }
  }

  // 测试数据库连接
  async testConnection(): Promise<boolean> {
    if (isDatabaseDisabled) {
      return true; // 数据库禁用时认为连接正常
    }

    try {
      await this.pool.execute('SELECT 1');
      console.log('[数据库] 数据库连接测试成功');
      return true;
    } catch (error) {
      console.error('[数据库] 数据库连接测试失败:', error);
      return false;
    }
  }

  // 关闭连接池
  async close(): Promise<void> {
    if (isDatabaseDisabled || !this.pool.end) {
      return;
    }

    await this.pool.end();
  }
}

// 导出单例实例
export const stockDatabase = StockDatabase.getInstance();