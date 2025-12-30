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
  list?: Array<{
    ZSName: string;
    StockList: Array<any>;
  }>;
  data?: Array<any>;
  List?: Array<any>;
}

/**
 * 涨停数据API客户端单例类
 */
class LimitUpClient {
  private static instance: LimitUpClient;
  private readonly API_URL = 'https://apphis.longhuvip.com/w1/api/index.php';

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

      // 构建POST请求数据
      const formData = new URLSearchParams({
        Date: dateParam,
        Index: '0',
        PhoneOSNew: '2',
        VerSion: '5.21.0.1',
        a: 'GetPlateInfo_w38',
        apiv: 'w42',
        c: 'HisLimitResumption',
        st: '20'
      });

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
          'Accept': '*/*',
          'User-Agent': 'lhb/5.21.1 (com.kaipanla.www; build:1; iOS 18.6.2) Alamofire/4.9.1',
        },
        body: formData,
        signal: AbortSignal.timeout(15000), // 15秒超时
      });

      if (!response.ok) {
        throw new Error(`涨停API HTTP错误: ${response.status}`);
      }

      const result: LimitUpApiResponse = await response.json();

      // 解析list格式数据
      const stocks: LimitUpStock[] = [];

      if (result.list && Array.isArray(result.list)) {
        result.list.forEach(category => {
          const zsName = category.ZSName || '其他';

          if (category.StockList && Array.isArray(category.StockList)) {
            const reversedStockList = [...category.StockList].reverse();
            reversedStockList.forEach((stockData: any[]) => {
              const stockCode = stockData[0];
              const stockName = stockData[1];
              const tdType = stockData[9] || '首板';
              const amountInYuan = parseFloat(stockData[6]) || 0;
              const amountInYi = amountInYuan / 100000000;
              const limitUpTime = stockData[7] || '09:30';

              // 数据清洗：过滤无效数据
              if (
                stockCode &&
                stockName &&
                !stockName.includes('退市') &&
                !stockCode.startsWith('4') &&
                !stockCode.startsWith('8')
              ) {
                stocks.push({
                  StockCode: stockCode,
                  StockName: stockName,
                  ZSName: zsName,
                  TDType: tdType,
                  Amount: Math.round(amountInYi * 100) / 100,
                  LimitUpTime: limitUpTime
                });
              }
            });
          }
        });
      }

      // 存入缓存
      this.cache.set(cacheKey, {
        data: stocks,
        timestamp: Date.now(),
      });

      console.log(`[LimitUpClient] 涨停数据查询成功: ${date}, 共${stocks.length}只`);
      return stocks;
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
