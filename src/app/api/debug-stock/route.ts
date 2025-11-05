import { NextRequest, NextResponse } from 'next/server';

const TUSHARE_TOKEN = process.env.TUSHARE_TOKEN || '';

// 转换股票代码格式为Tushare格式
function convertStockCodeForTushare(stockCode: string): string {
  if (stockCode.startsWith('60') || stockCode.startsWith('68') || stockCode.startsWith('51')) {
    return `${stockCode}.SH`; // 上交所
  } else if (stockCode.startsWith('00') || stockCode.startsWith('30') || stockCode.startsWith('12')) {
    return `${stockCode}.SZ`; // 深交所
  } else if (stockCode.startsWith('43') || stockCode.startsWith('83') || stockCode.startsWith('87')) {
    return `${stockCode}.BJ`; // 北交所
  }
  return `${stockCode}.SZ`; // 默认深交所
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stockCode = searchParams.get('code');
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  if (!stockCode || !startDate || !endDate) {
    return NextResponse.json(
      { success: false, error: '请提供股票代码(code)、开始日期(start)和结束日期(end)' },
      { status: 400 }
    );
  }

  try {
    const tsCode = convertStockCodeForTushare(stockCode);
    const startDateFormatted = startDate.replace(/-/g, '');
    const endDateFormatted = endDate.replace(/-/g, '');

    console.log(`[Debug] 查询股票: ${stockCode} (${tsCode})`);
    console.log(`[Debug] 日期范围: ${startDate} 到 ${endDate}`);

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
          start_date: startDateFormatted,
          end_date: endDateFormatted
        },
        fields: 'ts_code,trade_date,pct_chg,close,pre_close'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 0) {
      return NextResponse.json({
        success: false,
        error: data.msg || '请求失败',
        rawResponse: data
      });
    }

    // 解析数据
    const result = {
      stockCode: stockCode,
      tsCode: tsCode,
      dateRange: `${startDate} 到 ${endDate}`,
      data: [] as any[]
    };

    if (data.data && data.data.items) {
      data.data.items.forEach((item: any[]) => {
        const tradeDateTushare = item[1]; // YYYYMMDD格式
        const pctChg = parseFloat(item[2]) || 0;
        const close = parseFloat(item[3]) || 0;
        const preClose = parseFloat(item[4]) || 0;
        
        // 转换为YYYY-MM-DD格式
        const tradeDateISO = `${tradeDateTushare.slice(0,4)}-${tradeDateTushare.slice(4,6)}-${tradeDateTushare.slice(6,8)}`;

        result.data.push({
          date: tradeDateISO,
          pct_chg: pctChg,
          close: close,
          pre_close: preClose,
          manual_calc: preClose > 0 ? ((close - preClose) / preClose * 100).toFixed(2) : 0
        });
      });

      // 按日期排序
      result.data.sort((a, b) => a.date.localeCompare(b.date));
    }

    return NextResponse.json({
      success: true,
      ...result,
      totalDays: result.data.length
    });

  } catch (error) {
    const err = error as any;
    console.error('[Debug] 错误:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : '服务器内部错误'
      },
      { status: 500 }
    );
  }
}

