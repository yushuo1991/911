import { NextRequest, NextResponse } from 'next/server';
  import { Stock, LimitUpApiResponse, StockPerformance, TrackingData } from '@/types/stock';
  import { generateTradingDays, generateMockPerformance, sortStocksByBoard, calculateStats } from '@/lib/utils';
  import { stockDatabase } from '@/lib/database';
  import { get7TradingDaysFromCalendar, getValidTradingDays } from '@/lib/enhanced-trading-calendar';

  const TUSHARE_TOKEN = process.env.TUSHARE_TOKEN || '';

  // 智能缓存系统
  interface CacheEntry {
    data: Record<string, number>;
    timestamp: number;
    expiry: number;
  }

  interface SevenDaysCacheEntry {
    data: Record<string, any>;
    timestamp: number;
    expiry: number;
  }

  class StockDataCache {
    private cache = new Map<string, CacheEntry>();
    private sevenDaysCache = new Map<string, SevenDaysCacheEntry>();
    private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时
    private readonly SEVEN_DAYS_CACHE_DURATION = 5 * 60 * 1000; // 7天数据缓存5分钟（v4.8.9修复：浏览器缓存问题）

    private getCacheKey(stockCode: string, tradingDays: string[]): string {
      return `${stockCode}:${tradingDays.join(',')}`;
    }

    get(stockCode: string, tradingDays: string[]): Record<string, number> | null {
      const key = this.getCacheKey(stockCode, tradingDays);
      const entry = this.cache.get(key);

      if (!entry) return null;

      // 检查缓存是否过期
      if (Date.now() > entry.expiry) {
        this.cache.delete(key);
        return null;
      }

      console.log(`[缓存] 命中缓存: ${stockCode}`);
      return entry.data;
    }

    set(stockCode: string, tradingDays: string[], data: Record<string, number>): void {
      const key = this.getCacheKey(stockCode, tradingDays);
      const now = Date.now();

      this.cache.set(key, {
        data,
        timestamp: now,
        expiry: now + this.CACHE_DURATION
      });

      console.log(`[缓存] 存储数据: ${stockCode}`);
    }

    clear(): void {
      this.cache.clear();
      console.log(`[缓存] 清空缓存`);
    }

    // 7天数据缓存方法
    get7DaysCache(cacheKey: string): Record<string, any> | null {
      const entry = this.sevenDaysCache.get(cacheKey);

      if (!entry) return null;

      // 检查缓存是否过期
      if (Date.now() > entry.expiry) {
        this.sevenDaysCache.delete(cacheKey);
        return null;
      }

      console.log(`[7天缓存] 命中缓存: ${cacheKey}`);
      return entry.data;
    }

    set7DaysCache(cacheKey: string, data: Record<string, any>): void {
      const now = Date.now();

      this.sevenDaysCache.set(cacheKey, {
        data,
        timestamp: now,
        expiry: now + this.SEVEN_DAYS_CACHE_DURATION
      });

      console.log(`[7天缓存] 存储数据: ${cacheKey}`);
    }

    getStats(): { size: number; hitRate: number; sevenDaysSize: number } {
      return {
        size: this.cache.size,
        hitRate: 0, // 简化版本，实际应该追踪命中率
        sevenDaysSize: this.sevenDaysCache.size
      };
    }
  }

  // 中文数字转阿拉伯数字的板位转换函数
  function normalizeBoardType(tdType: string): string {
    if (!tdType) return '1板';

    // 中文数字到阿拉伯数字的映射
    const chineseToArabic: Record<string, string> = {
      '首': '1',
      '一': '1',
      '二': '2',
      '三': '3',
      '四': '4',
      '五': '5',
      '六': '6',
      '七': '7',
      '八': '8',
      '九': '9',
      '十': '10'
    };

    // 如果包含"板"字，提取板位数字
    if (tdType.includes('板')) {
      // 匹配中文数字+板，如"二板"、"三板"
      for (const [chinese, arabic] of Object.entries(chineseToArabic)) {
        if (tdType.includes(chinese + '板')) {
          return arabic + '板';
        }
      }
      // 匹配"首板"
      if (tdType.includes('首板')) {
        return '1板';
      }
      // 如果已经是阿拉伯数字形式（如"2板"），直接返回
      const arabicMatch = tdType.match(/(\d+)板/);
      if (arabicMatch) {
        return arabicMatch[0];
      }
    }

    // 处理连板类型（如"2连板"）
    const lianbanMatch = tdType.match(/(\d+)连板/);
    if (lianbanMatch) {
      return lianbanMatch[1] + '板';
    }

    // 默认返回首板
    return '1板';
  }

  // 全局缓存实例
  const stockCache = new StockDataCache();

  // API调用频率控制
  class ApiRateController {
    private requestTimes: number[] = [];
    private readonly MAX_REQUESTS_PER_MINUTE = 700; // 留100次缓冲

    async checkAndWait(): Promise<void> {
      const now = Date.now();

      // 清理1分钟前的记录
      this.requestTimes = this.requestTimes.filter(time => now - time < 60000);

      // 检查是否达到限制
      if (this.requestTimes.length >= this.MAX_REQUESTS_PER_MINUTE) {
        const oldestRequest = Math.min(...this.requestTimes);
        const waitTime = 60000 - (now - oldestRequest) + 1000; // 额外等待1秒

        console.log(`[频率控制] 等待 ${waitTime}ms 避免频率限制`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      this.requestTimes.push(now);
    }

    getStats(): { currentRequests: number; maxRequests: number } {
      const now = Date.now();
      this.requestTimes = this.requestTimes.filter(time => now - time < 60000);

      return {
        currentRequests: this.requestTimes.length,
        maxRequests: this.MAX_REQUESTS_PER_MINUTE
      };
    }
  }

  // 全局频率控制器
  const rateController = new ApiRateController();

  async function getLimitUpStocks(date: string): Promise<Stock[]> {
    console.log(`[API] 开始获取${date}的涨停个股数据`);

    try {
      // 首先尝试从数据库获取缓存数据
      const cachedStocks = await stockDatabase.getCachedStockData(date);
      if (cachedStocks && cachedStocks.length > 0) {
        console.log(`[数据库] 使用缓存数据，${cachedStocks.length}只股票`);
        return cachedStocks;
      }

      // 缓存未命中，从外部API获取
      const result = await tryGetLimitUpStocks(date);
      if (result.length > 0) {
        console.log(`[API] 成功获取数据，${result.length}只股票`);

        // 缓存到数据库
        try {
          await stockDatabase.cacheStockData(date, result);
        } catch (cacheError) {
          console.log(`[数据库] 缓存股票数据失败:`, cacheError);
        }

        return result;
      } else {
        console.log(`[API] API返回空数据`);
        return [];
      }
    } catch (error) {
      const err = error as any;
      console.log(`[API] 获取数据失败: ${err}`);

      // 尝试从数据库获取旧数据作为降级
      const fallbackData = await stockDatabase.getCachedStockData(date);
      if (fallbackData && fallbackData.length > 0) {
        console.log(`[数据库] 使用降级缓存数据`);
        return fallbackData;
      }

      return [];
    }
  }

  async function tryGetLimitUpStocks(date: string): Promise<Stock[]> {
    try {
      console.log(`[API] 尝试获取${date}的涨停个股数据`);

      const url = 'https://apphis.longhuvip.com/w1/api/index.php';

      // 构建POST请求数据 - 使用正确的参数名和日期格式
      const formData = new URLSearchParams({
        Date: date.replace(/-/g, ''),  // 大写Date，转换为YYYYMMDD格式
        Index: '0',
        PhoneOSNew: '2',
        VerSion: '5.21.0.1',
        a: 'GetPlateInfo_w38',
        apiv: 'w42',
        c: 'HisLimitResumption',
        st: '20'
      });

      console.log(`[API] 请求URL: ${url}`);
      console.log(`[API] 请求参数: ${formData.toString()}`);

      // 设置15秒超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
          'Accept': '*/*',
          'User-Agent': 'lhb/5.21.1 (com.kaipanla.www; build:1; iOS 18.6.2) Alamofire/4.9.1',
          'Accept-Language': 'zh-Hans-CN;q=1.0, en-CN;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log(`[API] 响应状态: ${response.status}`);
      console.log(`[API] 响应头: ${JSON.stringify(Object.fromEntries(response.headers))}`);
      console.log(`[API] 完整响应: ${responseText}`);

      let data: LimitUpApiResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[API] JSON解析失败: ${parseError}`);
        console.error(`[API] 响应内容: ${responseText}`);
        throw new Error(`API返回的不是有效的JSON格式`);
      }

      // 处理API返回的list数据格式
      if (data.list && Array.isArray(data.list)) {
        const stocks: Stock[] = [];

        data.list.forEach(category => {
          const zsName = category.ZSName || '未分类';

          if (category.StockList && Array.isArray(category.StockList)) {
            // 逆序处理股票列表，让首板股票显示在最下面
            const reversedStockList = [...category.StockList].reverse();
            reversedStockList.forEach((stockData: any[]) => {
              // stockData是一个数组，索引说明：
              // [0]: 股票代码, [1]: 股票名称, [9]: 板位类型
              // [6]: 成交额（元）- v4.8.8新增
              // [7]: 涨停时间（格式：HH:MM）- v4.8.24新增
              const rawStockCode = stockData[0];
              const stockCode = normalizeStockCode(rawStockCode); // v4.20.2：规范化代码
              const stockName = stockData[1];
              const tdType = stockData[9] || '首板';
              const amountInYuan = parseFloat(stockData[6]) || 0; // 成交额（元）
              const amountInYi = amountInYuan / 100000000; // 转换为亿元
              const limitUpTime = stockData[7] || '09:30'; // 涨停时间，默认9:30

              // 调试日志：记录前3个股票的完整数组结构
              if (stocks.length < 3) {
                console.log(`[API] stockData数组结构 [${stockName}]:`, JSON.stringify(stockData.slice(0, 15)));
                console.log(`[API] 涨停时间 (索引7): ${stockData[7]}, 板位类型 (索引9): ${stockData[9]}`);
              }

              stocks.push({
                StockName: stockName,
                StockCode: stockCode,
                ZSName: zsName,
                TDType: tdType,
                Amount: Math.round(amountInYi * 100) / 100, // 保留2位小数
                LimitUpTime: limitUpTime // v4.8.24新增：涨停时间
              });
            });
          }
        });

        if (stocks.length > 0) {
          console.log(`[API] 成功解析list数据，${stocks.length}只股票`);
          // v4.8.25诊断：检查前5个股票的涨停时间分布
          const timeDistribution = new Map<string, number>();
          stocks.slice(0, Math.min(20, stocks.length)).forEach(stock => {
            const time = stock.LimitUpTime || 'undefined';
            timeDistribution.set(time, (timeDistribution.get(time) || 0) + 1);
          });
          console.log(`[API] 前20个股票涨停时间分布:`, Object.fromEntries(timeDistribution));
          return stocks;
        }
      }

      // 兼容处理原有的数据格式
      if (data.data && Array.isArray(data.data)) {
        console.log(`[API] 成功获取直接数据，${data.data.length}只股票`);
        return data.data;
      } else if (data.List && Array.isArray(data.List)) {
        const stocks: Stock[] = [];
        data.List.forEach(list => {
          if (list.TD && Array.isArray(list.TD)) {
            list.TD.forEach(td => {
              if (td.Stock && Array.isArray(td.Stock)) {
                td.Stock.forEach(stock => {
                  const zsName = stock.ZSName || td.ZSName || list.ZSName || '未分类';
                  const tdType = stock.TDType || td.TDType || '首板';

                  stocks.push({
                    StockName: stock.StockName,
                    StockCode: stock.StockID,
                    ZSName: zsName,
                    TDType: tdType
                  });
                });
              }
            });
          }
        });

        if (stocks.length > 0) {
          console.log(`[API] 成功解析列表数据，${stocks.length}只股票`);
          return stocks;
        }
      }

      throw new Error('API返回数据格式异常');

    } catch (error) {
      const err = error as any;
      console.log(`[API] 获取真实数据失败: ${err}`);
      // 返回空数组而不是模拟数据，避免误导
      return [];
    }
  }

// v4.20.2新增：规范化股票代码（修复7位代码问题）
function normalizeStockCode(rawCode: string): string {
  const code = rawCode.trim();
  
  // 标准股票代码应该是6位数字
  if (code.length === 6) {
    return code; // 已经是标准格式
  }
  
  // 如果长度大于6位，尝试截取
  if (code.length > 6) {
    // 创业板：300xxx
    if (code.startsWith('300')) {
      const normalized = code.slice(0, 6);
      console.log(`[代码规范化] 创业板: ${code} → ${normalized}`);
      return normalized;
    }
    
    // 科创板：688xxx
    if (code.startsWith('688')) {
      const normalized = code.slice(0, 6);
      console.log(`[代码规范化] 科创板: ${code} → ${normalized}`);
      return normalized;
    }
    
    // 深市主板：000xxx, 001xxx, 002xxx, 003xxx
    if (code.startsWith('00')) {
      const normalized = code.slice(0, 6);
      console.log(`[代码规范化] 深市主板: ${code} → ${normalized}`);
      return normalized;
    }
    
    // 上交所：6xxxxx
    if (code.startsWith('6')) {
      const normalized = code.slice(0, 6);
      console.log(`[代码规范化] 上交所: ${code} → ${normalized}`);
      return normalized;
    }
    
    // 北交所：8xxxxx, 4xxxxx
    if (code.startsWith('8') || code.startsWith('4')) {
      const normalized = code.slice(0, 6);
      console.log(`[代码规范化] 北交所: ${code} → ${normalized}`);
      return normalized;
    }
  }
  
  console.warn(`[代码规范化] 无法规范化代码: ${code}，保持原样`);
  return code;
}

// 转换股票代码格式为Tushare格式
function convertStockCodeForTushare(stockCode: string): string {
  // 股票代码格式转换：000001 -> 000001.SZ, 600000 -> 600000.SH
  if (stockCode.startsWith('60') || stockCode.startsWith('68') || stockCode.startsWith('51')) {
    return `${stockCode}.SH`; // 上交所
  } else if (stockCode.startsWith('00') || stockCode.startsWith('30') || stockCode.startsWith('12')) {
    return `${stockCode}.SZ`; // 深交所
  } else if (stockCode.startsWith('43') || stockCode.startsWith('83') || stockCode.startsWith('87')) {
    return `${stockCode}.BJ`; // 北交所
  }
  return `${stockCode}.SZ`; // 默认深交所
}

  // v4.8.18新增：使用Tushare API批量获取个股真实成交额
  async function getBatchStockAmount(stockCodes: string[], tradeDate: string): Promise<Map<string, number>> {
    const result = new Map<string, number>();

    // 初始化所有股票为0
    stockCodes.forEach(code => result.set(code, 0));

    try {
      console.log(`[成交额API] 批量获取${stockCodes.length}只股票在${tradeDate}的成交额`);

      // 频率控制
      await rateController.checkAndWait();

      // 构建批量查询参数
      const tsCodes = stockCodes.map(code => convertStockCodeForTushare(code));
      const tradeDateFormatted = tradeDate.replace(/-/g, '');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('https://api.tushare.pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_name: 'daily',
          token: TUSHARE_TOKEN,
          params: {
            trade_date: tradeDateFormatted
          },
          fields: 'ts_code,trade_date,amount' // 成交额字段（单位：千元）
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Tushare成交额API HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (data.msg && data.msg.includes('每分钟最多访问该接口')) {
        console.log(`[成交额API] Tushare频率限制: ${data.msg}`);
        throw new Error('RATE_LIMIT');
      }

      if (data.code === 0 && data.data && data.data.items) {
        console.log(`[成交额API] 获取到${data.data.items.length}条成交额数据`);

        // 解析数据
        data.data.items.forEach((item: any[]) => {
          const tsCode = item[0]; // ts_code
          const amountInK = parseFloat(item[2]) || 0; // amount（千元）
          const amountInYi = amountInK / 100000; // 转换为亿元

          // 转换回原始股票代码
          const originalCode = stockCodes.find(code =>
            convertStockCodeForTushare(code) === tsCode
          );

          if (originalCode) {
            result.set(originalCode, Math.round(amountInYi * 100) / 100); // 保留2位小数
          }
        });

        console.log(`[成交额API] 成功获取${result.size}只股票的真实成交额`);
      } else {
        console.log(`[成交额API] API返回无效数据:`, data);
      }

    } catch (error) {
      const err = error as any;
      if (err.name === 'AbortError') {
        console.log(`[成交额API] 请求超时`);
      } else if (err.message === 'RATE_LIMIT') {
        console.log(`[成交额API] 遇到频率限制`);
      } else {
        console.log(`[成交额API] 请求失败: ${error}`);
      }
    }

    return result;
  }

  // 批量获取多只股票多个日期的数据
  async function getBatchStockDaily(stockCodes: string[], tradeDates: string[]): Promise<Map<string, Record<string,
  number>>> {
    const result = new Map<string, Record<string, number>>();

    // 为所有股票初始化空数据
    stockCodes.forEach(code => {
      result.set(code, {});
      tradeDates.forEach(date => {
        result.get(code)![date] = 0;
      });
    });

    try {
      console.log(`[批量API] 请求数据: ${stockCodes.length}只股票 × ${tradeDates.length}个交易日`);

      // 频率控制
      await rateController.checkAndWait();

      // 构建批量查询参数 - 查询所有股票的所有日期
      const tsCodes = stockCodes.map(code => convertStockCodeForTushare(code));

      // 修复：转换日期格式 YYYY-MM-DD -> YYYYMMDD
      const tradeDatesFormatted = tradeDates.map(d => d.replace(/-/g, ''));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

      const response = await fetch('https://api.tushare.pro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_name: 'daily',
          token: TUSHARE_TOKEN,
          params: {
            ts_code: tsCodes.join(','),
            start_date: Math.min(...tradeDatesFormatted.map(d => parseInt(d))).toString(),
            end_date: Math.max(...tradeDatesFormatted.map(d => parseInt(d))).toString()
          },
          fields: 'ts_code,trade_date,pct_chg'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Tushare API HTTP error: ${response.status}`);
      }

      const data = await response.json();

      // 检查频率限制
      if (data.msg && data.msg.includes('每分钟最多访问该接口')) {
        console.log(`[批量API] Tushare频率限制: ${data.msg}`);
        throw new Error('RATE_LIMIT');
      }

      if (data.code === 0 && data.data && data.data.items) {
        console.log(`[批量API] 获取到${data.data.items.length}条数据记录`);

        // 解析数据
        data.data.items.forEach((item: any[]) => {
          const tsCode = item[0];
          const tradeDateTushare = item[1]; // YYYYMMDD格式
          const pctChg = parseFloat(item[2]) || 0;

          // 转换回YYYY-MM-DD格式以匹配tradeDates
          const tradeDateISO = `${tradeDateTushare.slice(0,4)}-${tradeDateTushare.slice(4,6)}-${tradeDateTushare.slice(6,8)}`;

          // 转换回原始股票代码
          const originalCode = stockCodes.find(code =>
            convertStockCodeForTushare(code) === tsCode
          );

          if (originalCode && tradeDates.includes(tradeDateISO)) {
            result.get(originalCode)![tradeDateISO] = pctChg;
          }
        });

        console.log(`[批量API] 成功解析数据，覆盖${stockCodes.length}只股票`);
      } else {
        console.log(`[批量API] API返回无效数据:`, data);
      }

    } catch (error) {
      const err = error as any;
      if (err.name === 'AbortError') {
        console.log(`[批量API] 请求超时`);
      } else if (err.message === 'RATE_LIMIT') {
        console.log(`[批量API] 遇到频率限制`);
        throw error;
      } else {
        console.log(`[批量API] 请求失败: ${error}`);
      }
    }

    return result;
  }

  // 带智能重试的单股票数据获取
  async function getTushareStockDaily(stockCode: string, tradeDate: string, retryCount = 0): Promise<number> {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000;

    try {
      // 频率控制
      await rateController.checkAndWait();

      const tsCode = convertStockCodeForTushare(stockCode);
      // 修复：Tushare API需要YYYYMMDD格式，转换YYYY-MM-DD -> YYYYMMDD
      const tradeDateFormatted = tradeDate.replace(/-/g, '');
      console.log(`[单个API] 请求数据: ${tsCode} on ${tradeDate} (Tushare格式: ${tradeDateFormatted}) (重试${retryCount})`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('https://api.tushare.pro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_name: 'daily',
          token: TUSHARE_TOKEN,
          params: {
            ts_code: tsCode,
            trade_date: tradeDateFormatted
          },
          fields: 'ts_code,trade_date,pct_chg'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (data.msg && data.msg.includes('每分钟最多访问该接口')) {
        throw new Error('RATE_LIMIT');
      }

      if (data.code === 0 && data.data && data.data.items && data.data.items.length > 0) {
        const pctChg = parseFloat(data.data.items[0][2]) || 0;
        console.log(`[单个API] ${tsCode}在${tradeDate}: ${pctChg}%`);
        return pctChg;
      }

      console.log(`[单个API] ${tsCode}在${tradeDate}无数据`);
      return 0;

    } catch (error) {
      const err = error as any;
      if (err.message === 'RATE_LIMIT') {
        if (retryCount < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, retryCount); // 指数退避
          console.log(`[单个API] 频率限制，${delay}ms后重试`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return getTushareStockDaily(stockCode, tradeDate, retryCount + 1);
        }
        throw error;
      }

      if (err.name === 'AbortError') {
        console.log(`[单个API] 请求超时: ${stockCode}`);
      } else {
        console.log(`[单个API] 请求失败: ${stockCode} - ${error}`);
      }

      return 0;
    }
  }

  // 添加延时函数避免API限流
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async function getStockPerformance(stockCode: string, tradingDays: string[], baseDate?: string): Promise<Record<string, number>> {
    console.log(`[数据获取] 开始获取${stockCode}的表现数据`);

    // 1. 首先检查内存缓存
    const cachedData = stockCache.get(stockCode, tradingDays);
    if (cachedData) {
      return cachedData;
    }

    // 2. 检查数据库缓存（如果提供了baseDate）
    if (baseDate) {
      try {
        const dbCachedData = await stockDatabase.getCachedStockPerformance(stockCode, baseDate, tradingDays);
        if (dbCachedData) {
          // 存储到内存缓存以提高后续访问速度
          stockCache.set(stockCode, tradingDays, dbCachedData);
          return dbCachedData;
        }
      } catch (dbError) {
        console.log(`[数据库] 获取缓存失败: ${dbError}`);
      }
    }

    // 2. 尝试从Tushare API获取真实数据
    try {
      console.log(`[数据获取] 从Tushare API获取${stockCode}的真实数据`);

      const performance: Record<string, number> = {};

      // 逐个日期获取数据，包含智能重试
      for (let i = 0; i < tradingDays.length; i++) {
        const day = tradingDays[i];

        try {
          const pctChg = await getTushareStockDaily(stockCode, day);
          performance[day] = pctChg;
          console.log(`[数据获取] ${stockCode}在${day}: ${pctChg}%`);

          // 适当延时避免过快请求
          if (i < tradingDays.length - 1) {
            await delay(200); // 200ms间隔
          }

        } catch (error) {
          const err = error as any;
          if (err.message === 'RATE_LIMIT') {
            console.log(`[数据获取] ${stockCode}遇到频率限制，降级到模拟数据`);
            // 对于频率限制，使用模拟数据填充剩余日期
            const mockData = generateMockPerformance(stockCode, tradingDays);

            // 保留已获取的真实数据，用模拟数据填充未获取的
            tradingDays.forEach(date => {
              if (performance[date] === undefined) {
                performance[date] = mockData[date];
              }
            });

            // 缓存混合数据
            stockCache.set(stockCode, tradingDays, performance);
            return performance;
          }

          console.log(`[数据获取] ${stockCode}在${day}获取失败: ${error}，使用0值`);
          performance[day] = 0;
        }
      }

      console.log(`[数据获取] 成功获取${stockCode}的完整Tushare数据`);

      // 缓存真实数据到内存
      stockCache.set(stockCode, tradingDays, performance);

      // 如果提供了baseDate，也缓存到数据库
      if (baseDate) {
        try {
          await stockDatabase.cacheStockPerformance(stockCode, baseDate, performance);
        } catch (dbError) {
          console.log(`[数据库] 缓存股票表现数据失败: ${dbError}`);
        }
      }

      return performance;

    } catch (error) {
      const err = error as any;
      console.log(`[数据获取] ${stockCode}整体获取失败: ${err}，降级到模拟数据`);

      // 3. 最终降级：使用模拟数据
      try {
        const mockData = generateMockPerformance(stockCode, tradingDays);
        console.log(`[数据获取] ${stockCode}使用模拟数据`);

        // 缓存模拟数据（短期缓存）
        stockCache.set(stockCode, tradingDays, mockData);
        return mockData;

      } catch (mockError) {
        console.log(`[数据获取] ${stockCode}模拟数据生成失败: ${mockError}`);

        // 4. 兜底：返回0值
        const zeroData: Record<string, number> = {};
        tradingDays.forEach(day => {
          zeroData[day] = 0;
        });
        return zeroData;
      }
    }
  }

  export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const mode = searchParams.get('mode'); // 新增：支持不同模式

    if (!date) {
      return NextResponse.json(
        { success: false, error: '请提供日期参数' },
        { status: 400 }
      );
    }

    try {
      // 支持单日模式和7天模式
      if (mode === '7days') {
        return await get7DaysData(date);
      } else {
        return await getSingleDayData(date);
      }

    } catch (error) {
      const err = error as any;
      console.error('[API] 处理请求时出错:', err);
      return NextResponse.json(
        {
          success: false,
          error: err instanceof Error ? err.message : '服务器内部错误'
        },
        { status: 500 }
      );
    }
  }

  // 原有的单日数据获取逻辑
  async function getSingleDayData(date: string) {
    console.log(`[API] 开始处理${date}的跟踪数据`);

    // 添加超时控制
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API处理超时')), 45000); // 45秒超时
    });

    // 获取涨停个股数据（带超时）
    const limitUpStocksPromise = getLimitUpStocks(date);
    const limitUpStocks = await Promise.race([limitUpStocksPromise, timeoutPromise]) as Stock[];

    if (!limitUpStocks || limitUpStocks.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          date,
          trading_days: [],
          categories: {},
          stats: {
            total_stocks: 0,
            category_count: 0,
            profit_ratio: 0
          }
        }
      });
    }

    // 获取交易日 - v4.8.10修复：使用真实交易日历排除节假日
    const tradingDays = await getValidTradingDays(date, 5);
    console.log(`[API] 生成交易日（已排除节假日）: ${tradingDays}`);

    // 按分类整理数据
    const categories: Record<string, StockPerformance[]> = {};

    for (const stock of limitUpStocks) {
      const category = stock.ZSName || '其他';
      const performance = await getStockPerformance(stock.StockCode, tradingDays);
      const totalReturn = Object.values(performance).reduce((sum, val) => sum + val, 0);

      const stockPerformance: StockPerformance = {
        name: stock.StockName,
        code: stock.StockCode,
        td_type: stock.TDType, // v4.21.6修复：保留原始TDType格式（如"13天12板"），不进行转换
        performance,
        total_return: Math.round(totalReturn * 100) / 100,
        amount: stock.Amount, // v4.8.26修复：添加成交额字段（与7天数据保持一致）
        limitUpTime: stock.LimitUpTime // v4.8.24新增：涨停时间
      };

      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(stockPerformance);
    }

    // 按板位优先排序，同板位内按涨停时间排序
    Object.keys(categories).forEach(category => {
      categories[category] = sortStocksByBoard(categories[category]);
    });

    // 计算统计数据
    const stats = calculateStats(categories);

    // 添加系统统计信息
    const cacheStats = stockCache.getStats();
    const rateStats = rateController.getStats();

    const result: TrackingData = {
      date,
      trading_days: tradingDays,
      categories,
      stats
    };

    console.log(`[API] 数据处理完成: ${stats.total_stocks}只股票, ${stats.category_count}个分类`);
    console.log(`[缓存统计] 缓存大小: ${cacheStats.size}, 命中率: ${cacheStats.hitRate}%`);
    console.log(`[频率统计] 当前请求数: ${rateStats.currentRequests}/${rateStats.maxRequests}`);
    console.log(`[数据源] 使用真实Tushare API数据`);

    return NextResponse.json({
      success: true,
      data: result
    });
  }

  // 新增：7天数据获取逻辑
  async function get7DaysData(endDate: string) {
    console.log(`[API] 开始处理7天数据，结束日期: ${endDate}`);

    // 使用Tushare交易日历获取真实的7个交易日（排除节假日）
    const sevenDays = await get7TradingDaysFromCalendar(endDate);
    console.log(`[API] 7天交易日（已排除节假日）: ${sevenDays}`);

    // 检查7天数据缓存（内存优先）
    const cacheKey = `7days:${sevenDays.join(',')}:${endDate}`;
    const memoryCachedResult = stockCache.get7DaysCache(cacheKey);

    if (memoryCachedResult) {
      console.log(`[API] 使用7天内存缓存数据`);
      return NextResponse.json({
        success: true,
        data: memoryCachedResult,
        dates: sevenDays,
        cached: true
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // 检查数据库缓存
    try {
      const dbCachedResult = await stockDatabase.get7DaysCache(cacheKey);
      if (dbCachedResult) {
        console.log(`[API] 使用7天数据库缓存数据`);

        // 存储到内存缓存
        stockCache.set7DaysCache(cacheKey, dbCachedResult.data);

        return NextResponse.json({
          success: true,
          data: dbCachedResult.data,
          dates: dbCachedResult.dates,
          cached: true
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
    } catch (dbError) {
      console.log(`[数据库] 获取7天缓存失败: ${dbError}`);
    }

    const result: Record<string, any> = {};

    // 为每一天获取数据
    for (const day of sevenDays) {
      try {
        console.log(`[API] 处理日期: ${day}`);

        // 获取当天涨停股票
        const limitUpStocks = await getLimitUpStocks(day);

        if (!limitUpStocks || limitUpStocks.length === 0) {
          result[day] = {
            date: day,
            categories: {},
            stats: { total_stocks: 0, category_count: 0, profit_ratio: 0 },
            followUpData: {}
          };
          continue;
        }

        // v4.8.18新增：使用Tushare API批量获取真实成交额
        const stockCodes = limitUpStocks.map(s => s.StockCode);
        const realAmounts = await getBatchStockAmount(stockCodes, day);
        console.log(`[API] 获取${day}的真实成交额，覆盖${realAmounts.size}只股票`);

        // 获取该天后5个交易日（用于溢价计算）- v4.8.10修复：使用真实交易日历排除节假日
        const followUpDays = await getValidTradingDays(day, 5);

        // v4.29.5诊断：写入服务器日志文件
        const fs = require('fs');
        const path = require('path');
        const logFile = path.join(process.cwd(), 'debug-server.log');

        const logLines = [];
        logLines.push(`\n${'='.repeat(80)}`);
        logLines.push(`服务器端数据分析 - ${day}`);
        logLines.push(`时间: ${new Date().toISOString()}`);
        logLines.push(`${'='.repeat(80)}`);
        logLines.push(`总股票数: ${limitUpStocks.length}`);
        logLines.push(`\n板块分类详情:`);

        const sectorStats: Record<string, { total: number, lianban: number, tianban: number, samples: any[] }> = {};

        for (const stock of limitUpStocks) {
          const category = stock.ZSName || '其他';
          const tdType = stock.TDType;

          if (!sectorStats[category]) {
            sectorStats[category] = { total: 0, lianban: 0, tianban: 0, samples: [] };
          }

          sectorStats[category].total++;

          const isLianban = tdType.includes('连板') && !tdType.includes('天');
          const isTianban = tdType.includes('天') && tdType.includes('板');

          if (isLianban) {
            sectorStats[category].lianban++;
            if (sectorStats[category].samples.length < 3) {
              sectorStats[category].samples.push({ name: stock.StockName, tdType });
            }
          } else if (isTianban) {
            sectorStats[category].tianban++;
          }
        }

        Object.entries(sectorStats).sort((a, b) => b[1].total - a[1].total).forEach(([sector, stats]) => {
          const isExcluded = sector === '其他' || sector === 'ST板块';
          const status = isExcluded ? '❌排除' : '✓包含';
          logLines.push(`\n【${sector}】 (${status})`);
          logLines.push(`  总股票: ${stats.total}只`);
          logLines.push(`  连板股票: ${stats.lianban}只`);
          logLines.push(`  X天Y板股票: ${stats.tianban}只`);
          if (stats.samples.length > 0) {
            logLines.push(`  连板样本:`);
            stats.samples.forEach(s => {
              logLines.push(`    - ${s.name}: "${s.tdType}"`);
            });
          }
        });

        const totalLianban = Object.values(sectorStats).reduce((sum, s) => sum + s.lianban, 0);
        const includedLianban = Object.entries(sectorStats)
          .filter(([sector]) => sector !== '其他' && sector !== 'ST板块')
          .reduce((sum, [_, stats]) => sum + stats.lianban, 0);

        logLines.push(`\n${'='.repeat(80)}`);
        logLines.push(`统计汇总:`);
        logLines.push(`  总连板股票: ${totalLianban}只`);
        logLines.push(`  包含板块中的连板: ${includedLianban}只 (会显示在前端)`);
        logLines.push(`  排除板块中的连板: ${totalLianban - includedLianban}只 (不显示)`);
        logLines.push(`${'='.repeat(80)}\n`);

        fs.appendFileSync(logFile, logLines.join('\n'), 'utf-8');
        console.log(`[诊断v4.29.5] 日志已写入: ${logFile}`);

        // 按分类整理数据
        const categories: Record<string, StockPerformance[]> = {};
        const followUpData: Record<string, Record<string, Record<string, number>>> = {};
        const sectorAmounts: Record<string, number> = {}; // v4.8.8新增：板块成交额汇总

        for (const stock of limitUpStocks) {
          const category = stock.ZSName || '其他';

          // 获取后续5日表现（传入baseDate用于数据库缓存）
          const followUpPerformance = await getStockPerformance(stock.StockCode, followUpDays, day);
          const totalReturn = Object.values(followUpPerformance).reduce((sum, val) => sum + val, 0);

          // v4.8.18修改：使用Tushare真实成交额替代API假数据
          const realAmount = realAmounts.get(stock.StockCode) || 0;

          const stockPerformance: StockPerformance = {
            name: stock.StockName,
            code: stock.StockCode,
            td_type: stock.TDType, // v4.21.6修复：保留原始TDType格式（如"13天12板"），不进行转换
            performance: { [day]: 10.0 }, // 涨停日当天固定为10%
            total_return: Math.round(totalReturn * 100) / 100,
            amount: realAmount, // v4.8.18修改：使用Tushare真实成交额（亿元）
            limitUpTime: stock.LimitUpTime // v4.8.24新增：涨停时间
          };

          if (!categories[category]) {
            categories[category] = [];
            sectorAmounts[category] = 0; // 初始化板块成交额
          }
          categories[category].push(stockPerformance);

          // v4.8.18修改：使用真实成交额累加板块成交额
          if (realAmount > 0) {
            sectorAmounts[category] += realAmount;
          }

          // 存储后续表现数据
          if (!followUpData[category]) {
            followUpData[category] = {};
          }
          followUpData[category][stock.StockCode] = followUpPerformance;
        }

        // 排序
        Object.keys(categories).forEach(category => {
          categories[category] = sortStocksByBoard(categories[category]);
        });

        // 计算统计数据
        const stats = calculateStats(categories);

        // v4.8.8新增：四舍五入板块成交额到两位小数
        Object.keys(sectorAmounts).forEach(category => {
          sectorAmounts[category] = Math.round(sectorAmounts[category] * 100) / 100;
        });

        result[day] = {
          date: day,
          categories,
          stats,
          followUpData,
          sectorAmounts // v4.8.8新增：板块成交额汇总（亿元）
        };

      } catch (error) {
        console.error(`[API] 处理${day}数据失败:`, error);
        result[day] = {
          date: day,
          categories: {},
          stats: { total_stocks: 0, category_count: 0, profit_ratio: 0 },
          followUpData: {}
        };
      }
    }

    console.log(`[API] 7天数据处理完成，存储到缓存`);

    // 缓存7天数据结果到内存，减少后续API调用
    stockCache.set7DaysCache(cacheKey, result);

    // 也缓存到数据库
    try {
      await stockDatabase.cache7DaysData(cacheKey, result, sevenDays);
      console.log(`[数据库] 7天数据已缓存到数据库`);
    } catch (dbError) {
      console.log(`[数据库] 7天数据缓存失败: ${dbError}`);
    }

    return NextResponse.json({
      success: true,
      data: result,
      dates: sevenDays,
      cached: false
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }

  // generate7TradingDays 函数已移除
  // 现在使用 get7TradingDaysFromCalendar 从 Tushare 获取真实交易日历（包含节假日信息）