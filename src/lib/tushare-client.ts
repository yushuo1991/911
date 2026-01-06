/**
 * Tushare API统一客户端
 * 提供交易日历、日线数据等接口，带缓存和错误处理
 */

interface TushareResponse<T = any> {
  code: number;
  msg: string;
  data: {
    fields: string[];
    items: any[][];
  };
}

interface TradingCalendarItem {
  cal_date: string;
  is_open: number;
}

interface DailyPriceItem {
  ts_code: string;
  trade_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  pre_close: number;
  change: number;
  pct_chg: number;
  vol: number;
  amount: number;
}

/**
 * Tushare API客户端单例类
 */
class TushareClient {
  private static instance: TushareClient;
  private readonly API_URL = 'http://api.tushare.pro';
  private readonly TOKEN = '2dfbc221e9d37ad0b23bcbf2e1e5b5208c1f80d4c2b7e2c3fc87b999';

  // 交易日历缓存 (4小时)
  private tradingCalendarCache: Map<string, { data: TradingCalendarItem[]; timestamp: number }> = new Map();
  private readonly CALENDAR_CACHE_TTL = 4 * 60 * 60 * 1000;

  // 日线数据缓存 (1小时)
  private dailyPriceCache: Map<string, { data: DailyPriceItem[]; timestamp: number }> = new Map();
  private readonly DAILY_PRICE_CACHE_TTL = 60 * 60 * 1000;

  private constructor() {}

  public static getInstance(): TushareClient {
    if (!TushareClient.instance) {
      TushareClient.instance = new TushareClient();
    }
    return TushareClient.instance;
  }

  /**
   * 通用API调用方法
   */
  private async callApi<T = any>(
    apiName: string,
    params: Record<string, any>,
    fields?: string
  ): Promise<TushareResponse<T>> {
    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_name: apiName,
        token: this.TOKEN,
        params: params,
        fields: fields || '',
      }),
      signal: AbortSignal.timeout(15000), // 15秒超时
    });

    if (!response.ok) {
      throw new Error(`Tushare API HTTP错误: ${response.status}`);
    }

    const result = await response.json();

    if (result.code !== 0) {
      throw new Error(`Tushare API错误: ${result.msg}`);
    }

    return result;
  }

  /**
   * 获取交易日历
   * @param startDate 开始日期 YYYYMMDD
   * @param endDate 结束日期 YYYYMMDD
   * @returns 交易日历数据
   */
  public async getTradingCalendar(
    startDate: string,
    endDate: string
  ): Promise<TradingCalendarItem[]> {
    const cacheKey = `${startDate}_${endDate}`;

    // 检查缓存
    const cached = this.tradingCalendarCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CALENDAR_CACHE_TTL) {
      console.log(`[TushareClient] 交易日历缓存命中: ${cacheKey}`);
      return cached.data;
    }

    try {
      const response = await this.callApi<TradingCalendarItem>(
        'trade_cal',
        {
          exchange: 'SSE',
          start_date: startDate,
          end_date: endDate,
        }
      );

      const data = response.data.items.map((item) => ({
        cal_date: item[0],
        is_open: item[1],
      }));

      // 存入缓存
      this.tradingCalendarCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      console.log(`[TushareClient] 交易日历查询成功: ${startDate} ~ ${endDate}, 共${data.length}天`);
      return data;
    } catch (error) {
      console.error('[TushareClient] 交易日历查询失败:', error);
      throw error;
    }
  }

  /**
   * 获取日线数据
   * @param tsCode 股票代码（如 600000.SH）
   * @param startDate 开始日期 YYYYMMDD
   * @param endDate 结束日期 YYYYMMDD
   * @returns 日线数据
   */
  public async getDailyPrice(
    tsCode: string,
    startDate: string,
    endDate: string
  ): Promise<DailyPriceItem[]> {
    const cacheKey = `${tsCode}_${startDate}_${endDate}`;

    // 检查缓存
    const cached = this.dailyPriceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.DAILY_PRICE_CACHE_TTL) {
      return cached.data;
    }

    try {
      const response = await this.callApi<DailyPriceItem>(
        'daily',
        {
          ts_code: tsCode,
          start_date: startDate,
          end_date: endDate,
        }
      );

      const data = response.data.items.map((item) => ({
        ts_code: item[0],
        trade_date: item[1],
        open: item[2],
        high: item[3],
        low: item[4],
        close: item[5],
        pre_close: item[6],
        change: item[7],
        pct_chg: item[8],
        vol: item[9],
        amount: item[10],
      }));

      // 存入缓存
      this.dailyPriceCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error(`[TushareClient] 日线数据查询失败 (${tsCode}):`, error);
      throw error;
    }
  }

  /**
   * 批量获取日线数据（支持多个股票）
   * @param tsCodes 股票代码数组
   * @param startDate 开始日期 YYYYMMDD
   * @param endDate 结束日期 YYYYMMDD
   * @returns 股票代码 -> 日线数据的Map
   */
  public async getBatchDailyPrice(
    tsCodes: string[],
    startDate: string,
    endDate: string
  ): Promise<Map<string, DailyPriceItem[]>> {
    const result = new Map<string, DailyPriceItem[]>();

    // 并发请求，每批10个
    const batchSize = 10;
    for (let i = 0; i < tsCodes.length; i += batchSize) {
      const batch = tsCodes.slice(i, i + batchSize);
      const promises = batch.map(async (tsCode) => {
        try {
          const data = await this.getDailyPrice(tsCode, startDate, endDate);
          return { tsCode, data };
        } catch (error) {
          console.warn(`[TushareClient] 批量查询失败: ${tsCode}`, error);
          return { tsCode, data: [] };
        }
      });

      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ tsCode, data }) => {
        result.set(tsCode, data);
      });
    }

    return result;
  }

  /**
   * 清空所有缓存
   */
  public clearCache(): void {
    this.tradingCalendarCache.clear();
    this.dailyPriceCache.clear();
    console.log('[TushareClient] 缓存已清空');
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats(): {
    calendarCacheSize: number;
    dailyPriceCacheSize: number;
  } {
    return {
      calendarCacheSize: this.tradingCalendarCache.size,
      dailyPriceCacheSize: this.dailyPriceCache.size,
    };
  }
}

// 导出单例实例
export const tushareClient = TushareClient.getInstance();
export type { TradingCalendarItem, DailyPriceItem };
