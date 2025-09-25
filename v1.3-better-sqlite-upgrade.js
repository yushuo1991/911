#!/usr/bin/env node

/**
 * v1.3版本 Better SQLite升级脚本
 * 使用better-sqlite3替代sqlite3，无需编译
 *
 * 执行: node v1.3-better-sqlite-upgrade.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 开始v1.3版本 Better SQLite升级...');

// 1. 检查并安装Better SQLite依赖
function installBetterSQLiteDependencies() {
    console.log('📦 安装Better SQLite依赖...');

    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // 添加Better SQLite依赖，移除其他SQLite依赖
    if (!packageJson.dependencies) {
        packageJson.dependencies = {};
    }

    // 添加Better SQLite3（预编译版本，无需Visual Studio）
    packageJson.dependencies['better-sqlite3'] = '^9.6.0';

    // 移除所有其他SQLite相关依赖
    delete packageJson.dependencies['sqlite3'];
    delete packageJson.dependencies['sqlite'];
    delete packageJson.dependencies['mysql2'];
    delete packageJson.dependencies['mysql'];

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ 已更新package.json，添加Better SQLite依赖');
}

// 2. 创建Better SQLite数据库模块
function createBetterSQLiteDatabase() {
    const databaseContent = `// Better SQLite数据库模块 - v1.3版本兼容
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface Stock {
  StockName: string;
  StockCode: string;
  ZSName: string;
  TDType: string;
}

export interface CacheEntry {
  id?: number;
  cache_key: string;
  data: string;
  created_at: string;
  expires_at: string;
}

export interface StockPerformanceCache {
  id?: number;
  stock_code: string;
  base_date: string;
  trading_dates: string;
  performance_data: string;
  created_at: string;
}

export interface SevenDaysCache {
  id?: number;
  cache_key: string;
  data: string;
  dates: string;
  created_at: string;
}

class BetterSQLiteStockDatabase {
  private db: Database.Database | null = null;
  private dbPath = path.join(process.cwd(), 'stock_cache.db');

  async connect(): Promise<void> {
    try {
      // 确保数据库文件目录存在
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // 连接数据库（如果不存在会自动创建）
      this.db = new Database(this.dbPath);

      // 设置数据库优化选项
      this.db.exec('PRAGMA journal_mode = WAL');
      this.db.exec('PRAGMA synchronous = NORMAL');
      this.db.exec('PRAGMA cache_size = 1000');
      this.db.exec('PRAGMA temp_store = memory');

      await this.initializeTables();
      console.log('✅ Better SQLite数据库连接成功');
    } catch (error) {
      console.error('❌ Better SQLite数据库连接失败:', error);
      throw error;
    }
  }

  async initializeTables(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未连接');
    }

    try {
      // 创建股票缓存表
      this.db.exec(\`
        CREATE TABLE IF NOT EXISTS stock_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cache_key TEXT UNIQUE NOT NULL,
          data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL
        );
      \`);

      // 创建股票表现缓存表
      this.db.exec(\`
        CREATE TABLE IF NOT EXISTS stock_performance_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          stock_code TEXT NOT NULL,
          base_date TEXT NOT NULL,
          trading_dates TEXT NOT NULL,
          performance_data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(stock_code, base_date, trading_dates)
        );
      \`);

      // 创建7天数据缓存表
      this.db.exec(\`
        CREATE TABLE IF NOT EXISTS seven_days_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cache_key TEXT UNIQUE NOT NULL,
          data TEXT NOT NULL,
          dates TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      \`);

      // 创建索引
      this.db.exec(\`
        CREATE INDEX IF NOT EXISTS idx_stock_cache_key ON stock_cache(cache_key);
        CREATE INDEX IF NOT EXISTS idx_stock_cache_expires ON stock_cache(expires_at);
        CREATE INDEX IF NOT EXISTS idx_performance_stock_date ON stock_performance_cache(stock_code, base_date);
        CREATE INDEX IF NOT EXISTS idx_seven_days_key ON seven_days_cache(cache_key);
      \`);

      console.log('✅ 数据库表结构初始化完成');
    } catch (error) {
      console.error('❌ 数据库表初始化失败:', error);
      throw error;
    }
  }

  // 股票数据缓存方法
  async getCachedStockData(date: string): Promise<Stock[] | null> {
    if (!this.db) return null;

    try {
      const cacheKey = \`stocks_\${date}\`;
      const stmt = this.db.prepare(
        'SELECT data FROM stock_cache WHERE cache_key = ? AND expires_at > datetime("now")'
      );
      const row = stmt.get(cacheKey) as { data: string } | undefined;

      if (row) {
        console.log(\`[Better SQLite缓存] 命中: \${cacheKey}\`);
        return JSON.parse(row.data);
      }

      return null;
    } catch (error) {
      console.error('[Better SQLite] 获取股票缓存失败:', error);
      return null;
    }
  }

  async cacheStockData(date: string, stocks: Stock[]): Promise<void> {
    if (!this.db) return;

    try {
      const cacheKey = \`stocks_\${date}\`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期

      const stmt = this.db.prepare(
        \`INSERT OR REPLACE INTO stock_cache (cache_key, data, expires_at)
         VALUES (?, ?, ?)\`
      );

      stmt.run(cacheKey, JSON.stringify(stocks), expiresAt.toISOString());

      console.log(\`[Better SQLite缓存] 存储: \${cacheKey}\`);
    } catch (error) {
      console.error('[Better SQLite] 缓存股票数据失败:', error);
    }
  }

  // 股票表现缓存方法
  async getCachedStockPerformance(
    stockCode: string,
    baseDate: string,
    tradingDays: string[]
  ): Promise<Record<string, number> | null> {
    if (!this.db) return null;

    try {
      const tradingDatesStr = tradingDays.join(',');
      const stmt = this.db.prepare(
        'SELECT performance_data FROM stock_performance_cache WHERE stock_code = ? AND base_date = ? AND trading_dates = ?'
      );
      const row = stmt.get(stockCode, baseDate, tradingDatesStr) as { performance_data: string } | undefined;

      if (row) {
        console.log(\`[Better SQLite缓存] 股票表现命中: \${stockCode}\`);
        return JSON.parse(row.performance_data);
      }

      return null;
    } catch (error) {
      console.error('[Better SQLite] 获取股票表现缓存失败:', error);
      return null;
    }
  }

  async cacheStockPerformance(
    stockCode: string,
    baseDate: string,
    performance: Record<string, number>
  ): Promise<void> {
    if (!this.db) return;

    try {
      const tradingDates = Object.keys(performance).sort().join(',');

      const stmt = this.db.prepare(
        \`INSERT OR REPLACE INTO stock_performance_cache (stock_code, base_date, trading_dates, performance_data)
         VALUES (?, ?, ?, ?)\`
      );

      stmt.run(stockCode, baseDate, tradingDates, JSON.stringify(performance));

      console.log(\`[Better SQLite缓存] 股票表现存储: \${stockCode}\`);
    } catch (error) {
      console.error('[Better SQLite] 缓存股票表现失败:', error);
    }
  }

  // 7天数据缓存方法
  async get7DaysCache(cacheKey: string): Promise<{ data: any; dates: string[] } | null> {
    if (!this.db) return null;

    try {
      const stmt = this.db.prepare(
        'SELECT data, dates FROM seven_days_cache WHERE cache_key = ?'
      );
      const row = stmt.get(cacheKey) as { data: string; dates: string } | undefined;

      if (row) {
        console.log(\`[Better SQLite缓存] 7天数据命中: \${cacheKey}\`);
        return {
          data: JSON.parse(row.data),
          dates: JSON.parse(row.dates)
        };
      }

      return null;
    } catch (error) {
      console.error('[Better SQLite] 获取7天缓存失败:', error);
      return null;
    }
  }

  async cache7DaysData(cacheKey: string, data: any, dates: string[]): Promise<void> {
    if (!this.db) return;

    try {
      const stmt = this.db.prepare(
        \`INSERT OR REPLACE INTO seven_days_cache (cache_key, data, dates)
         VALUES (?, ?, ?)\`
      );

      stmt.run(cacheKey, JSON.stringify(data), JSON.stringify(dates));

      console.log(\`[Better SQLite缓存] 7天数据存储: \${cacheKey}\`);
    } catch (error) {
      console.error('[Better SQLite] 缓存7天数据失败:', error);
    }
  }

  // 清理过期缓存
  async cleanupExpiredCache(): Promise<void> {
    if (!this.db) return;

    try {
      const stmt = this.db.prepare(
        'DELETE FROM stock_cache WHERE expires_at <= datetime("now")'
      );
      const result = stmt.run();

      if (result.changes && result.changes > 0) {
        console.log(\`[Better SQLite] 清理了 \${result.changes} 条过期缓存\`);
      }
    } catch (error) {
      console.error('[Better SQLite] 清理缓存失败:', error);
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('✅ Better SQLite数据库连接已关闭');
    }
  }
}

// 导出全局实例
export const stockDatabase = new BetterSQLiteStockDatabase();

// 自动连接数据库
stockDatabase.connect().catch(console.error);

export default stockDatabase;
`;

    const dbPath = path.join(__dirname, 'src', 'lib', 'database.ts');

    // 备份原数据库文件
    if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, dbPath + '.mysql.backup');
        console.log('✅ 已备份原MySQL数据库文件');
    }

    // 确保目录存在
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    fs.writeFileSync(dbPath, databaseContent);
    console.log('✅ 已创建Better SQLite数据库模块');
}

// 3. 更新环境变量文件
function updateEnvFile() {
    const envPath = path.join(__dirname, '.env.local');
    const envExamplePath = path.join(__dirname, '.env.example');

    const sqliteEnvContent = `# Better SQLite数据库配置 - v1.3版本
# 数据库文件将自动在项目根目录创建为 stock_cache.db

# Tushare API Token (保持原有配置)
TUSHARE_TOKEN=2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211

# 应用配置
NODE_ENV=development
NEXT_PUBLIC_APP_VERSION=1.3.0-better-sqlite
`;

    fs.writeFileSync(envPath, sqliteEnvContent);
    fs.writeFileSync(envExamplePath, sqliteEnvContent);

    console.log('✅ 已更新环境变量配置');
}

// 4. 创建数据库初始化脚本
function createInitScript() {
    const initContent = `#!/usr/bin/env node

/**
 * Better SQLite数据库初始化脚本
 * 运行: node scripts/init-better-sqlite.js
 */

async function initializeDatabase() {
  try {
    console.log('🚀 开始初始化Better SQLite数据库...');

    // 动态导入ES模块
    const { stockDatabase } = await import('../src/lib/database.js');

    await stockDatabase.connect();
    console.log('✅ 数据库初始化成功!');

    // 清理旧的过期缓存
    await stockDatabase.cleanupExpiredCache();
    console.log('✅ 清理完成');

    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

initializeDatabase();
`;

    const scriptsDir = path.join(__dirname, 'scripts');
    if (!fs.existsSync(scriptsDir)) {
        fs.mkdirSync(scriptsDir);
    }

    fs.writeFileSync(path.join(scriptsDir, 'init-better-sqlite.js'), initContent);
    console.log('✅ 已创建Better SQLite数据库初始化脚本');
}

// 执行升级
async function main() {
    try {
        installBetterSQLiteDependencies();
        createBetterSQLiteDatabase();
        updateEnvFile();
        createInitScript();

        console.log('\n🎉 v1.3版本 Better SQLite升级完成!');
        console.log('\n📋 接下来的步骤:');
        console.log('1. 运行: npm install');
        console.log('2. 运行: node scripts/init-better-sqlite.js');
        console.log('3. 运行: npm run dev');
        console.log('\n✨ 你的v1.3版本现在将拥有:');
        console.log('   • 完整的缓存功能');
        console.log('   • 快速的数据加载');
        console.log('   • 无需MySQL服务');
        console.log('   • 无需Visual Studio编译工具');
        console.log('   • 所有原有UI功能');

    } catch (error) {
        console.error('❌ 升级失败:', error);
        process.exit(1);
    }
}

main();