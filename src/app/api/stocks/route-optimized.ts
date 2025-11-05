import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { Stock, StockPerformance, TrackingData } from '@/types/stock';
import { generateTradingDays, generateMockPerformance, sortStocksByBoard, calculateStats } from '@/lib/utils';

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'stock_user',
  password: 'StockPass123!',
  database: 'stock_db',
  charset: 'utf8mb4'
};

// 从数据库获取股票基础信息
async function getStocksFromDatabase(date: string): Promise<Stock[]> {
  const connection = await mysql.createConnection(dbConfig);

  try {
    const [rows] = await connection.execute(
      'SELECT stock_code, stock_name, category, td_type FROM stocks WHERE date = ? ORDER BY id',
      [date]
    );

    const stocks = (rows as any[]).map(row => ({
      StockCode: row.stock_code,
      StockName: row.stock_name,
      ZSName: row.category,
      TDType: row.td_type
    }));

    console.log(`[数据库] 从数据库获取到${stocks.length}只股票的基础信息`);
    return stocks;

  } catch (error) {
    console.log(`[数据库] 获取股票基础信息失败: ${error}`);
    return [];
  } finally {
    await connection.end();
  }
}

// 从数据库获取股票表现数据
async function getPerformanceFromDatabase(baseDate: string, tradingDays: string[]): Promise<Map<string, Record<string, number>>> {
  const connection = await mysql.createConnection(dbConfig);
  const result = new Map<string, Record<string, number>>();

  try {
    const [rows] = await connection.execute(
      'SELECT stock_code, trading_date, pct_change FROM stock_performance WHERE base_date = ? AND trading_date IN (?)',
      [baseDate, tradingDays]
    );

    // 按股票代码分组数据
    (rows as any[]).forEach(row => {
      const stockCode = row.stock_code;
      const tradingDate = row.trading_date;
      const pctChange = parseFloat(row.pct_change) || 0;

      if (!result.has(stockCode)) {
        result.set(stockCode, {});
      }
      result.get(stockCode)![tradingDate] = pctChange;
    });

    console.log(`[数据库] 从数据库获取到${result.size}只股票的表现数据`);
    return result;

  } catch (error) {
    console.log(`[数据库] 获取股票表现数据失败: ${error}`);
    return new Map();
  } finally {
    await connection.end();
  }
}

// 检查数据库中是否有完整的数据
async function hasCompleteDataInDatabase(date: string): Promise<boolean> {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // 检查是否有股票基础数据
    const [stockRows] = await connection.execute(
      'SELECT COUNT(*) as stock_count FROM stocks WHERE date = ?',
      [date]
    );
    const stockCount = (stockRows as any[])[0].stock_count;

    if (stockCount === 0) {
      console.log(`[数据库] ${date}没有股票基础数据`);
      return false;
    }

    // 检查是否有表现数据
    const [perfRows] = await connection.execute(
      'SELECT COUNT(*) as perf_count FROM stock_performance WHERE base_date = ?',
      [date]
    );
    const perfCount = (perfRows as any[])[0].perf_count;

    const hasCompleteData = stockCount > 0 && perfCount > 0;
    console.log(`[数据库] ${date}数据完整性检查: 股票${stockCount}只, 表现记录${perfCount}条, 完整性: ${hasCompleteData}`);

    return hasCompleteData;

  } catch (error) {
    console.log(`[数据库] 数据完整性检查失败: ${error}`);
    return false;
  } finally {
    await connection.end();
  }
}

// 获取涨停股票数据（降级到API）
async function getLimitUpStocksFromAPI(date: string): Promise<Stock[]> {
  console.log(`[API降级] 从API获取${date}的涨停股票数据`);

  try {
    const url = 'https://apphis.longhuvip.com/w1/api/index.php';
    const formData = new URLSearchParams({
      Date: date.replace(/-/g, ''),
      Index: '0',
      PhoneOSNew: '2',
      VerSion: '5.21.0.1',
      a: 'GetPlateInfo_w38',
      apiv: 'w42',
      c: 'HisLimitResumption',
      st: '20'
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'Accept': '*/*',
        'User-Agent': 'lhb/5.21.1 (com.kaipanla.www; build:1; iOS 18.6.2) Alamofire/4.9.1',
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    const data = JSON.parse(responseText);

    const stocks: Stock[] = [];

    if (data.list && Array.isArray(data.list)) {
      data.list.forEach((category: any) => {
        const zsName = category.ZSName || '未分类';
        if (category.StockList && Array.isArray(category.StockList)) {
          const reversedStockList = [...category.StockList].reverse();
          reversedStockList.forEach((stockData: any[]) => {
            stocks.push({
              StockName: stockData[1],
              StockCode: stockData[0],
              ZSName: zsName,
              TDType: stockData[9] || '首板'
            });
          });
        }
      });
    }

    console.log(`[API降级] 成功获取${stocks.length}只股票`);
    return stocks;

  } catch (error) {
    console.log(`[API降级] 获取失败: ${error}`);
    return [];
  }
}

// 生成模拟表现数据作为降级方案
function generateFallbackPerformance(stocks: Stock[], tradingDays: string[]): Map<string, Record<string, number>> {
  const result = new Map<string, Record<string, number>>();

  stocks.forEach(stock => {
    const performance = generateMockPerformance(stock.StockCode, tradingDays);
    result.set(stock.StockCode, performance);
  });

  console.log(`[降级方案] 生成${stocks.length}只股票的模拟表现数据`);
  return result;
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
    console.log(`[API] 开始处理${date}的跟踪数据（优化版本）`);
    const startTime = Date.now();

    // 1. 首先检查数据库中是否有完整的预加载数据
    const hasCompleteData = await hasCompleteDataInDatabase(date);

    let stocks: Stock[] = [];
    let performanceMap: Map<string, Record<string, number>> = new Map();

    if (hasCompleteData) {
      console.log(`[缓存命中] 使用数据库中的预加载数据`);

      // 从数据库获取预加载的数据
      stocks = await getStocksFromDatabase(date);
      const tradingDays = generateTradingDays(date, 5);
      performanceMap = await getPerformanceFromDatabase(date, tradingDays);

      // 检查表现数据完整性
      const missingPerformanceStocks = stocks.filter(stock => !performanceMap.has(stock.StockCode));
      if (missingPerformanceStocks.length > 0) {
        console.log(`[缓存] ${missingPerformanceStocks.length}只股票缺少表现数据，使用模拟数据补充`);
        const fallbackPerformance = generateFallbackPerformance(missingPerformanceStocks, tradingDays);
        missingPerformanceStocks.forEach(stock => {
          performanceMap.set(stock.StockCode, fallbackPerformance.get(stock.StockCode)!);
        });
      }

    } else {
      console.log(`[缓存未命中] 数据库中无完整数据，降级到API获取`);

      // 降级方案：从API获取数据
      stocks = await getLimitUpStocksFromAPI(date);

      if (stocks.length === 0) {
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
            },
            cache_status: 'no_data'
          }
        });
      }

      // 生成模拟表现数据
      const tradingDays = generateTradingDays(date, 5);
      performanceMap = generateFallbackPerformance(stocks, tradingDays);
    }

    // 2. 处理数据并构建响应
    const tradingDays = generateTradingDays(date, 5);
    const categories: Record<string, StockPerformance[]> = {};

    stocks.forEach(stock => {
      const category = stock.ZSName || '其他';
      const performance = performanceMap.get(stock.StockCode) || {};
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
    });

    // 按板位优先排序
    Object.keys(categories).forEach(category => {
      categories[category] = sortStocksByBoard(categories[category]);
    });

    // 计算统计数据
    const stats = calculateStats(categories);

    const duration = Date.now() - startTime;
    const result: TrackingData = {
      date,
      trading_days: tradingDays,
      categories,
      stats
    };

    console.log(`[API] 数据处理完成: ${stats.total_stocks}只股票, ${stats.category_count}个分类, 耗时${duration}ms`);

    return NextResponse.json({
      success: true,
      data: result,
      cache_status: hasCompleteData ? 'hit' : 'miss',
      performance: {
        duration_ms: duration,
        data_source: hasCompleteData ? 'database' : 'api_fallback'
      }
    });

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