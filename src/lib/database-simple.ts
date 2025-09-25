// 内存版数据库 - 适用于宝塔面板Docker部署
// 避免SQLite和MySQL的复杂依赖问题

export class SimpleDatabase {
  private cache = new Map<string, any>();
  private stockCache = new Map<string, any>();
  private performanceCache = new Map<string, any>();

  constructor() {
    console.log('[数据库] 使用内存缓存模式');
  }

  // 缓存股票数据
  async cacheStockData(stockCode: string, stockName: string, sectorName: string, boardType: string, tdType: string, price: number, date: string) {
    const key = `${date}_stocks`;
    if (!this.stockCache.has(key)) {
      this.stockCache.set(key, []);
    }
    const stocks = this.stockCache.get(key);
    const existingIndex = stocks.findIndex((s: any) => s.stock_code === stockCode);

    const stockData = {
      stock_code: stockCode,
      stock_name: stockName,
      sector_name: sectorName,
      board_type: boardType,
      td_type: tdType,
      price: price,
      date: date
    };

    if (existingIndex >= 0) {
      stocks[existingIndex] = stockData;
    } else {
      stocks.push(stockData);
    }

    console.log(`[缓存] 股票数据已缓存: ${stockCode} - ${stockName}`);
  }

  // 获取缓存的股票数据
  getCachedStockData(date: string) {
    const key = `${date}_stocks`;
    const result = this.stockCache.get(key) || [];
    console.log(`[缓存] 获取股票数据: ${date}, 共${result.length}条记录`);
    return result;
  }

  // 缓存股票表现数据
  async cacheStockPerformance(stockCode: string, baseDate: string, performance: Record<string, number>) {
    const tradingDays = Object.keys(performance).join(',');
    const key = `${stockCode}_${baseDate}_${tradingDays}`;
    this.performanceCache.set(key, performance);
    console.log(`[缓存] 股票表现数据已缓存: ${stockCode}`);
  }

  // 获取缓存的股票表现数据
  async getCachedStockPerformance(stockCode: string, baseDate: string, tradingDays: string[]): Promise<Record<string, number> | null> {
    const tradingDaysStr = tradingDays.join(',');
    const key = `${stockCode}_${baseDate}_${tradingDaysStr}`;
    const result = this.performanceCache.get(key) || null;
    if (result) {
      console.log(`[缓存] 股票表现数据命中: ${stockCode}`);
    }
    return result;
  }

  // 缓存7天数据
  async cache7DaysData(cacheKey: string, data: any) {
    this.cache.set(cacheKey, data);
    console.log(`[缓存] 7天数据已缓存: ${cacheKey}`);
  }

  // 获取7天缓存数据
  async get7DaysCache(cacheKey: string) {
    const result = this.cache.get(cacheKey) || null;
    if (result) {
      console.log(`[缓存] 7天数据命中: ${cacheKey}`);
    }
    return result;
  }

  // 初始化数据库表（空实现）
  initializeTables() {
    console.log('[数据库] 内存缓存初始化完成');
  }

  // 获取缓存统计
  getStats() {
    return {
      stockCacheSize: this.stockCache.size,
      performanceCacheSize: this.performanceCache.size,
      sevenDaysCacheSize: this.cache.size,
      totalCacheSize: this.cache.size + this.stockCache.size + this.performanceCache.size
    };
  }
}

// 导出单例实例
export const stockDatabase = new SimpleDatabase();
export const database = stockDatabase;
export default stockDatabase;