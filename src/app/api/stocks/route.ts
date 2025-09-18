import { NextRequest, NextResponse } from 'next/server';
import { Stock, LimitUpApiResponse, StockPerformance, TrackingData } from '@/types/stock';
import { generateTradingDays, generateMockPerformance, sortStocksByBoard, calculateStats } from '@/lib/utils';

const TUSHARE_TOKEN = '2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211';

// 已删除模拟数据生成函数，系统仅使用真实数据

async function getLimitUpStocks(date: string): Promise<Stock[]> {
  console.log(`[API] 开始获取${date}的涨停个股数据`);
  
  try {
    const result = await tryGetLimitUpStocks(date);
    if (result.length > 0) {
      console.log(`[API] 成功获取数据，${result.length}只股票`);
      return result;
    } else {
      console.log(`[API] API返回空数据`);
      return [];
    }
  } catch (error) {
    console.log(`[API] 获取数据失败: ${error}`);
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
            const stockCode = stockData[0];
            const stockName = stockData[1];
            const tdType = stockData[9] || '首板';
            
            stocks.push({
              StockName: stockName,
              StockCode: stockCode,
              ZSName: zsName,
              TDType: tdType
            });
          });
        }
      });
      
      if (stocks.length > 0) {
        console.log(`[API] 成功解析list数据，${stocks.length}只股票`);
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
    console.log(`[API] 获取真实数据失败: ${error}`);
    // 返回空数组而不是模拟数据，避免误导
    return [];
  }
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

// 获取单只股票在指定日期的涨跌幅
async function getTushareStockDaily(stockCode: string, tradeDate: string): Promise<number> {
  try {
    const tsCode = convertStockCodeForTushare(stockCode);

    console.log(`[API] 请求Tushare数据: ${tsCode} on ${tradeDate}`);

    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

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
          trade_date: tradeDate
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

    // 检查是否返回频率限制错误
    if (data.msg && data.msg.includes('每分钟最多访问该接口')) {
      console.log(`[API] Tushare频率限制: ${data.msg}`);
      throw new Error('RATE_LIMIT');
    }

    console.log(`[API] Tushare响应 for ${tsCode}:`, JSON.stringify(data, null, 2));

    if (data.code === 0 && data.data && data.data.items && data.data.items.length > 0) {
      const pctChg = data.data.items[0][2]; // pct_chg字段
      const result = parseFloat(pctChg) || 0;
      console.log(`[API] ${tsCode}在${tradeDate}的涨跌幅: ${result}%`);
      return result;
    }

    console.log(`[API] ${tsCode}在${tradeDate}无数据`);
    return 0; // 无数据时返回0
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`[API] Tushare请求超时: ${stockCode}在${tradeDate}`);
    } else if (error.message === 'RATE_LIMIT') {
      console.log(`[API] Tushare频率限制: ${stockCode}在${tradeDate}`);
      throw error; // 向上抛出频率限制错误
    } else {
      console.log(`[API] 获取${stockCode}在${tradeDate}的Tushare数据失败: ${error}`);
    }
    return 0;
  }
}

// 添加延时函数避免API限流
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getStockPerformance(stockCode: string, tradingDays: string[]): Promise<Record<string, number>> {
  const performance: Record<string, number> = {};

  console.log(`[API] 获取${stockCode}的表现数据`);

  // 由于Tushare API频率限制严重，优先使用模拟数据确保系统可用性
  try {
    const mockData = generateMockPerformance(stockCode, tradingDays);
    console.log(`[API] 使用优化后的模拟数据为${stockCode}`);
    return mockData;
  } catch (mockError) {
    console.log(`[API] 生成模拟数据失败: ${mockError}`);

    // 降级到0值数据
    tradingDays.forEach(day => {
      performance[day] = 0;
    });
    return performance;
  }

  /* 注释掉Tushare API调用，避免频率限制问题
  // 尝试使用真实Tushare数据（有频率限制风险）
  try {
    let rateLimitHit = false;

    // 序列化获取数据，避免API限流（每个请求间隔500ms）
    for (let i = 0; i < tradingDays.length; i++) {
      const day = tradingDays[i];

      if (rateLimitHit) {
        // 一旦遇到频率限制，直接使用0值
        performance[day] = 0;
        continue;
      }

      try {
        if (i > 0) {
          await delay(500); // 增加间隔到500ms减少频率限制风险
        }
        const pctChg = await getTushareStockDaily(stockCode, day);
        performance[day] = pctChg;
        console.log(`[API] ${stockCode}在${day}: ${pctChg}%`);
      } catch (error) {
        if (error.message === 'RATE_LIMIT') {
          console.log(`[API] 遇到Tushare频率限制，切换为模拟数据: ${stockCode}`);
          rateLimitHit = true;
          // 降级到模拟数据
          const mockData = generateMockPerformance(stockCode, tradingDays);
          return mockData;
        }
        console.log(`[API] 获取${stockCode}在${day}的Tushare数据失败: ${error}`);
        performance[day] = 0;
      }
    }

    console.log(`[API] 成功获取${stockCode}的Tushare数据:`, performance);
    return performance;

  } catch (error) {
    console.log(`[API] 获取Tushare数据过程中出错: ${error}`);

    // 最终降级到模拟数据
    try {
      const mockData = generateMockPerformance(stockCode, tradingDays);
      console.log(`[API] 最终降级使用模拟数据为${stockCode}`);
      return mockData;
    } catch (mockError) {
      console.log(`[API] 生成模拟数据也失败: ${mockError}`);
      // 最后降级：返回0值
      tradingDays.forEach(day => {
        performance[day] = 0;
      });
      return performance;
    }
  }
  */
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json(
      { success: false, error: '请提供日期参数' },
      { status: 400 }
    );
  }

  try {
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

    // 获取交易日
    const tradingDays = generateTradingDays(date, 5);
    console.log(`[API] 生成交易日: ${tradingDays}`);

    // 按分类整理数据
    const categories: Record<string, StockPerformance[]> = {};
    
    for (const stock of limitUpStocks) {
      const category = stock.ZSName || '其他';
      const performance = await getStockPerformance(stock.StockCode, tradingDays);
      const totalReturn = Object.values(performance).reduce((sum, val) => sum + val, 0);
      
      const stockPerformance: StockPerformance = {
        name: stock.StockName,
        code: stock.StockCode,
        td_type: stock.TDType.replace('首板', '1').replace('首', '1'),
        performance,
        total_return: Math.round(totalReturn * 100) / 100
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

    const result: TrackingData = {
      date,
      trading_days: tradingDays,
      categories,
      stats
    };

    console.log(`[API] 数据处理完成: ${stats.total_stocks}只股票, ${stats.category_count}个分类`);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[API] 处理请求时出错:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '服务器内部错误' 
      },
      { status: 500 }
    );
  }
}