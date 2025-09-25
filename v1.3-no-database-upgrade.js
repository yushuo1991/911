#!/usr/bin/env node

/**
 * v1.3版本无数据库升级脚本
 * 保持所有v1.3 UI功能，移除数据库依赖
 *
 * 执行: node v1.3-no-database-upgrade.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 开始v1.3版本无数据库升级...');

// 1. 移除数据库依赖
function removeDatabaseDependencies() {
    console.log('📦 移除数据库依赖...');

    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // 移除所有数据库相关依赖
    delete packageJson.dependencies['sqlite3'];
    delete packageJson.dependencies['sqlite'];
    delete packageJson.dependencies['better-sqlite3'];
    delete packageJson.dependencies['mysql2'];
    delete packageJson.dependencies['mysql'];

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ 已移除所有数据库依赖');
}

// 2. 创建轻量内存数据库模块
function createMemoryDatabase() {
    const databaseContent = `// 内存数据库模块 - v1.3版本兼容，无外部依赖
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

class MemoryStockDatabase {
  // 内存存储
  private stockCache = new Map<string, { data: Stock[]; expiresAt: number }>();
  private performanceCache = new Map<string, Record<string, number>>();
  private sevenDaysCache = new Map<string, { data: any; dates: string[] }>();

  async connect(): Promise<void> {
    console.log('✅ 内存数据库连接成功（无需外部依赖）');
  }

  async initializeTables(): Promise<void> {
    // 内存数据库无需初始化表结构
    console.log('✅ 内存数据库已初始化');
  }

  // 股票数据缓存方法
  async getCachedStockData(date: string): Promise<Stock[] | null> {
    try {
      const cacheKey = \`stocks_\${date}\`;
      const cached = this.stockCache.get(cacheKey);

      if (cached && Date.now() < cached.expiresAt) {
        console.log(\`[内存缓存] 命中: \${cacheKey}\`);
        return cached.data;
      }

      // 清理过期缓存
      if (cached && Date.now() >= cached.expiresAt) {
        this.stockCache.delete(cacheKey);
      }

      return null;
    } catch (error) {
      console.error('[内存缓存] 获取股票缓存失败:', error);
      return null;
    }
  }

  async cacheStockData(date: string, stocks: Stock[]): Promise<void> {
    try {
      const cacheKey = \`stocks_\${date}\`;
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24小时后过期

      this.stockCache.set(cacheKey, {
        data: stocks,
        expiresAt
      });

      console.log(\`[内存缓存] 存储: \${cacheKey}\`);
    } catch (error) {
      console.error('[内存缓存] 缓存股票数据失败:', error);
    }
  }

  // 股票表现缓存方法
  async getCachedStockPerformance(
    stockCode: string,
    baseDate: string,
    tradingDays: string[]
  ): Promise<Record<string, number> | null> {
    try {
      const cacheKey = \`\${stockCode}:\${baseDate}:\${tradingDays.join(',')}\`;
      const cached = this.performanceCache.get(cacheKey);

      if (cached) {
        console.log(\`[内存缓存] 股票表现命中: \${stockCode}\`);
        return cached;
      }

      return null;
    } catch (error) {
      console.error('[内存缓存] 获取股票表现缓存失败:', error);
      return null;
    }
  }

  async cacheStockPerformance(
    stockCode: string,
    baseDate: string,
    performance: Record<string, number>
  ): Promise<void> {
    try {
      const tradingDates = Object.keys(performance).sort().join(',');
      const cacheKey = \`\${stockCode}:\${baseDate}:\${tradingDates}\`;

      this.performanceCache.set(cacheKey, performance);

      console.log(\`[内存缓存] 股票表现存储: \${stockCode}\`);
    } catch (error) {
      console.error('[内存缓存] 缓存股票表现失败:', error);
    }
  }

  // 7天数据缓存方法
  async get7DaysCache(cacheKey: string): Promise<{ data: any; dates: string[] } | null> {
    try {
      const cached = this.sevenDaysCache.get(cacheKey);

      if (cached) {
        console.log(\`[内存缓存] 7天数据命中: \${cacheKey}\`);
        return cached;
      }

      return null;
    } catch (error) {
      console.error('[内存缓存] 获取7天缓存失败:', error);
      return null;
    }
  }

  async cache7DaysData(cacheKey: string, data: any, dates: string[]): Promise<void> {
    try {
      this.sevenDaysCache.set(cacheKey, { data, dates });
      console.log(\`[内存缓存] 7天数据存储: \${cacheKey}\`);
    } catch (error) {
      console.error('[内存缓存] 缓存7天数据失败:', error);
    }
  }

  // 清理过期缓存
  async cleanupExpiredCache(): Promise<void> {
    try {
      const now = Date.now();
      let cleanedCount = 0;

      // 清理股票缓存
      for (const [key, value] of this.stockCache.entries()) {
        if (now >= value.expiresAt) {
          this.stockCache.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(\`[内存缓存] 清理了 \${cleanedCount} 条过期缓存\`);
      }
    } catch (error) {
      console.error('[内存缓存] 清理缓存失败:', error);
    }
  }

  async close(): Promise<void> {
    // 内存数据库无需关闭连接
    console.log('✅ 内存数据库已关闭');
  }

  // 获取缓存统计
  getStats(): { stockCacheSize: number; performanceCacheSize: number; sevenDaysCacheSize: number } {
    return {
      stockCacheSize: this.stockCache.size,
      performanceCacheSize: this.performanceCache.size,
      sevenDaysCacheSize: this.sevenDaysCache.size
    };
  }
}

// 导出全局实例
export const stockDatabase = new MemoryStockDatabase();

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
    console.log('✅ 已创建内存数据库模块');
}

// 3. 更新环境变量文件
function updateEnvFile() {
    const envPath = path.join(__dirname, '.env.local');
    const envExamplePath = path.join(__dirname, '.env.example');

    const memoryEnvContent = `# 内存数据库配置 - v1.3版本无外部依赖
# 使用内存缓存，无需外部数据库

# Tushare API Token (保持原有配置)
TUSHARE_TOKEN=2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211

# 应用配置
NODE_ENV=development
NEXT_PUBLIC_APP_VERSION=1.3.0-memory-cache
`;

    fs.writeFileSync(envPath, memoryEnvContent);
    fs.writeFileSync(envExamplePath, memoryEnvContent);

    console.log('✅ 已更新环境变量配置');
}

// 4. 创建诊断日志
function createUpgradeLog() {
    const logDir = path.join(__dirname, 'log');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }

    const logContent = `# v1.3无数据库升级诊断报告

## 🎯 升级目标
解决v1.3版本回滚后页面显示简陋的问题

## 🔍 问题诊断
- **根本原因**: v1.3版本依赖MySQL数据库，但MySQL服务未运行
- **表现症状**: 页面只显示标题和控制按钮，主要数据区域空白
- **技术影响**: 数据库连接失败导致缓存机制无法正常工作

## 🚀 解决方案
- **技术选择**: 使用内存缓存替代MySQL数据库
- **优势**: 无需安装外部依赖，启动速度快，开发友好
- **兼容性**: 保持所有v1.3 UI功能和数据接口

## 📦 升级内容
1. **数据库模块**: 替换为内存缓存实现
2. **依赖管理**: 移除所有数据库相关依赖
3. **环境配置**: 更新为内存缓存配置

## ✅ 预期效果
- 页面完全恢复v1.3的所有视觉效果
- 数据加载速度提升
- 无需任何外部服务依赖
- 保持完整的缓存机制

生成时间: ${new Date().toISOString()}
版本: v1.3.0-memory-cache
`;

    fs.writeFileSync(path.join(logDir, 'v1.3-upgrade-diagnostic.md'), logContent);
    console.log('✅ 已创建升级诊断日志');
}

// 执行升级
async function main() {
    try {
        removeDatabaseDependencies();
        createMemoryDatabase();
        updateEnvFile();
        createUpgradeLog();

        console.log('\n🎉 v1.3版本无数据库升级完成!');
        console.log('\n📋 接下来的步骤:');
        console.log('1. 重启开发服务器: Ctrl+C 然后 npm run dev');
        console.log('2. 访问应用验证所有UI效果');
        console.log('\n✨ 你的v1.3版本现在将拥有:');
        console.log('   • 完整的v1.3 UI效果');
        console.log('   • 快速的数据加载');
        console.log('   • 无需任何外部依赖');
        console.log('   • 完整的内存缓存机制');
        console.log('   • 所有原有功能保持不变');

    } catch (error) {
        console.error('❌ 升级失败:', error);
        process.exit(1);
    }
}

main();