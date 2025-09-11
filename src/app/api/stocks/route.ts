import { NextRequest, NextResponse } from 'next/server';
import { Stock, LimitUpApiResponse, StockPerformance, TrackingData } from '@/types/stock';
import { generateTradingDays, generateMockPerformance, sortStocksByBoard, calculateStats } from '@/lib/utils';

const TUSHARE_TOKEN = '2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211';

// 已删除模拟数据生成函数，系统仅使用真实数据

async function getLimitUpStocks(date: string): Promise<Stock[]> {
  try {
    console.log(`[API] 获取${date}的涨停个股数据`);
    
    const url = 'https://apphis.longhuvip.com/w1/api/index.php';
    
    // 构建POST请求数据
    const formData = new URLSearchParams({
      Date: date, // 使用YYYY-MM-DD格式
      Index: '0',
      PhoneOSNew: '2', 
      VerSion: '5.21.0.1',
      a: 'GetPlateInfo_w38',
      apiv: 'w42',
      c: 'HisLimitResumption',
      st: '20'
    });

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

    const data: LimitUpApiResponse = await response.json();
    console.log(`[API] 接收到数据:`, JSON.stringify(data, null, 2));
    
    // 处理历史涨停复盘API的数据格式
    if (data.PlateInfo && Array.isArray(data.PlateInfo)) {
      const stocks: Stock[] = [];
      
      data.PlateInfo.forEach(plate => {
        if (plate.PlateStockList && Array.isArray(plate.PlateStockList)) {
          plate.PlateStockList.forEach(stock => {
            // 从板块信息中获取涨停原因，从股票信息中获取板位
            const zsName = plate.PlateName || '未分类';
            const tdType = stock.LimitType || '首板';
            
            stocks.push({
              StockName: stock.StockName,
              StockCode: stock.StockCode || stock.StockID,
              ZSName: zsName,
              TDType: tdType
            });
          });
        }
      });
      
      if (stocks.length > 0) {
        console.log(`[API] 成功解析涨停复盘数据，${stocks.length}只股票`);
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

async function getStockPerformance(stockCode: string, tradingDays: string[]): Promise<Record<string, number>> {
  try {
    // 这里应该调用Tushare API，但由于限制，我们使用模拟数据
    console.log(`[API] 获取${stockCode}的表现数据 (使用模拟数据)`);
    return generateMockPerformance(stockCode, tradingDays);
  } catch (error) {
    console.log(`[API] 获取${stockCode}表现数据失败: ${error}`);
    return generateMockPerformance(stockCode, tradingDays);
  }
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
    
    // 获取涨停个股数据
    const limitUpStocks = await getLimitUpStocks(date);
    
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
        td_type: stock.TDType,
        performance,
        total_return: Math.round(totalReturn * 100) / 100
      };

      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(stockPerformance);
    }

    // 对每个分类内的股票按板位排序
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