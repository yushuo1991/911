/**
 * 涨停数据API统一客户端
 * 提供涨停股票数据查询接口，带缓存和错误处理
 */

interface LimitUpStock {
  StockCode: string;
  StockName: string;
  ZSName: string;
  TDType: string;
  Amount?: number;
  LimitUpTime?: string;
}

interface LimitUpApiResponse {
  code: number;
  msg: string;
  data: {
    Count: number;
    DataInfoList: LimitUpStock[];
  };
}

/**
 * 涨停数据API客户端单例类
 */
class LimitUpClient {
  private static instance: LimitUpClient;
  private readonly API_URL = 'https://flash-api.10jqka.com.cn/api/v1/stock_rank/real_time/limit_up';

  // 涨停数据缓存 (5分钟)
  private cache: Map<string, { data: LimitUpStock[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  private constructor() {}

  public static getInstance(): LimitUpClient {
    if (!LimitUpClient.instance) {
      LimitUpClient.instance = new LimitUpClient();
    }
    return LimitUpClient.instance;
  }

  /**
   * 获取涨停股票数据
   * @param date 日期 YYYY-MM-DD格式
   * @returns 涨停股票列表
   */
  public async getLimitUpStocks(date: string): Promise<LimitUpStock[]> {
    const cacheKey = date;

    // 检查缓存
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`[LimitUpClient] 涨停数据缓存命中: ${date}`);
      return cached.data;
    }

    try {
      // 转换日期格式：YYYY-MM-DD -> YYYYMMDD
      const dateParam = date.replace(/-/g, '');

      const response = await fetch(`${this.API_URL}?date=${dateParam}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000), // 15秒超时
      });

      if (!response.ok) {
        throw new Error(`涨停API HTTP错误: ${response.status}`);
      }

      const result: LimitUpApiResponse = await response.json();

      if (result.code !== 0 || !result.data) {
        throw new Error(`涨停API错误: ${result.msg || '未知错误'}`);
      }

      const data = result.data.DataInfoList || [];

      // 数据清洗：过滤掉无效数据
      const cleanedData = data.filter((stock) => {
        return (
          stock.StockCode &&
          stock.StockName &&
          stock.TDType &&
          !stock.StockName.includes('退市') &&
          !stock.StockCode.startsWith('4') && // 过滤北交所
          !stock.StockCode.startsWith('8') // 过滤北交所
        );
      });

      // 存入缓存
      this.cache.set(cacheKey, {
        data: cleanedData,
        timestamp: Date.now(),
      });

      console.log(`[LimitUpClient] 涨停数据查询成功: ${date}, 共${cleanedData.length}只`);
      return cleanedData;
    } catch (error) {
      console.error(`[LimitUpClient] 涨停数据查询失败 (${date}):`, error);
      throw error;
    }
  }

  /**
   * 批量获取涨停数据（支持多个日期）
   * @param dates 日期数组 YYYY-MM-DD格式
   * @returns 日期 -> 涨停股票的Map
   */
  public async getBatchLimitUpStocks(dates: string[]): Promise<Map<string, LimitUpStock[]>> {
    const result = new Map<string, LimitUpStock[]>();

    // 并发请求，每批3个（避免触发限流）
    const batchSize = 3;
    for (let i = 0; i < dates.length; i += batchSize) {
      const batch = dates.slice(i, i + batchSize);
      const promises = batch.map(async (date) => {
        try {
          const data = await this.getLimitUpStocks(date);
          return { date, data };
        } catch (error) {
          console.warn(`[LimitUpClient] 批量查询失败: ${date}`, error);
          return { date, data: [] };
        }
      });

      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ date, data }) => {
        result.set(date, data);
      });

      // 批次间延迟500ms，避免限流
      if (i + batchSize < dates.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return result;
  }

  /**
   * 清空缓存
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('[LimitUpClient] 缓存已清空');
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats(): {
    cacheSize: number;
    cachedDates: string[];
  } {
    return {
      cacheSize: this.cache.size,
      cachedDates: Array.from(this.cache.keys()),
    };
  }
}

// 导出单例实例
export const limitUpClient = LimitUpClient.getInstance();
export type { LimitUpStock, LimitUpApiResponse };
