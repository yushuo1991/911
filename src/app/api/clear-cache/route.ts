import { NextRequest, NextResponse } from 'next/server';
import { stockDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const type = searchParams.get('type') || 'all'; // all, stocks, performance, 7days, all-performance

  try {
    let cleared = 0;
    let details: string[] = [];

    if (type === 'all' || type === 'stocks') {
      // 清除涨停股票缓存
      if (date) {
        await stockDatabase.clearStockDataCache(date);
        cleared++;
        details.push(`${date} 涨停股票缓存`);
        console.log(`[清除缓存] 已清除 ${date} 的涨停股票缓存`);
      }
    }

    if (type === 'all' || type === 'performance') {
      // 清除股票表现缓存
      if (date) {
        await stockDatabase.clearPerformanceCache(date);
        cleared++;
        details.push(`${date} 股票表现缓存`);
        console.log(`[清除缓存] 已清除 ${date} 的股票表现缓存`);
      }
    }

    // v4.8.36新增：清除所有股票表现缓存（用于修复错误数据）
    if (type === 'all-performance') {
      const affectedRows = await stockDatabase.clearAllPerformanceCache();
      cleared++;
      details.push(`所有股票表现缓存 (${affectedRows}条)`);
      console.log(`[清除缓存] 已清除所有股票表现缓存，共 ${affectedRows} 条记录`);
    }

    if (type === 'all' || type === '7days') {
      // 清除7天数据缓存
      await stockDatabase.clear7DaysCache();
      cleared++;
      details.push('7天数据缓存');
      console.log(`[清除缓存] 已清除7天数据缓存`);
    }

    return NextResponse.json({
      success: true,
      message: `成功清除 ${cleared} 类缓存`,
      details: details,
      date: date,
      type: type
    });

  } catch (error) {
    console.error('[清除缓存] 错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '清除缓存失败'
      },
      { status: 500 }
    );
  }
}

// 也支持GET请求
export async function GET(request: NextRequest) {
  return POST(request);
}




