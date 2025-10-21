import { NextRequest, NextResponse } from 'next/server';

/**
 * 分时图快照定时任务API
 * 用途：每天15点自动抓取当天涨停股票的分时图并存储
 * 触发方式：
 *   1. 手动触发：POST /api/snapshot-scheduler
 *   2. 定时任务：使用cron或系统定时任务调用
 */

// POST: 执行分时图快照任务
export async function POST(request: NextRequest) {
  console.log('[分时图快照定时任务] 开始执行');

  try {
    // 验证请求来源
    const authHeader = request.headers.get('authorization');
    const validToken = process.env.SCHEDULER_TOKEN || 'default-secure-token';

    if (authHeader !== `Bearer ${validToken}`) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const today = new Date().toISOString().split('T')[0];

    console.log(`[分时图快照定时任务] 开始处理日期: ${today}`);

    // 步骤1: 获取当天涨停股票列表
    console.log('[分时图快照定时任务] 步骤1: 获取涨停股票列表');
    const stocksResponse = await fetch(`${baseUrl}/api/stocks?date=${today}&mode=single`);
    
    if (!stocksResponse.ok) {
      throw new Error(`获取涨停股票失败: HTTP ${stocksResponse.status}`);
    }

    const stocksData = await stocksResponse.json();
    
    if (!stocksData.success || !stocksData.data) {
      throw new Error('涨停股票数据格式错误');
    }

    // 提取所有涨停股票
    const limitUpStocks: Array<{ code: string; name: string }> = [];
    const categories = stocksData.data.categories || {};
    
    for (const [sectorName, stocks] of Object.entries<any>(categories)) {
      if (Array.isArray(stocks)) {
        stocks.forEach(stock => {
          limitUpStocks.push({
            code: stock.code,
            name: stock.name,
          });
        });
      }
    }

    console.log(`[分时图快照定时任务] 找到 ${limitUpStocks.length} 只涨停股票`);

    if (limitUpStocks.length === 0) {
      return NextResponse.json({
        success: true,
        message: '今日无涨停股票，无需抓取分时图',
        data: {
          date: today,
          totalStocks: 0,
          savedSnapshots: 0,
        },
      });
    }

    // 步骤2: 批量保存分时图快照
    console.log('[分时图快照定时任务] 步骤2: 保存分时图快照');
    const snapshotResponse = await fetch(`${baseUrl}/api/minute-snapshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: today,
        stocks: limitUpStocks,
      }),
    });

    if (!snapshotResponse.ok) {
      throw new Error(`保存分时图失败: HTTP ${snapshotResponse.status}`);
    }

    const snapshotResult = await snapshotResponse.json();

    console.log(`[分时图快照定时任务] 快照保存完成 - 成功: ${snapshotResult.data?.success}, 失败: ${snapshotResult.data?.failed}`);

    // 步骤3: 清理过期数据（超过14天）
    console.log('[分时图快照定时任务] 步骤3: 清理过期快照');
    const cleanupResponse = await fetch(`${baseUrl}/api/minute-snapshot`, {
      method: 'DELETE',
    });

    let cleanupResult = null;
    if (cleanupResponse.ok) {
      cleanupResult = await cleanupResponse.json();
      console.log(`[分时图快照定时任务] 清理完成 - 删除 ${cleanupResult.data?.deletedRecords} 条记录`);
    }

    return NextResponse.json({
      success: true,
      message: '分时图快照定时任务完成',
      data: {
        date: today,
        totalStocks: limitUpStocks.length,
        snapshotResults: snapshotResult.data,
        cleanupResults: cleanupResult?.data,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[分时图快照定时任务] 执行失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '定时任务执行失败',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET: 获取定时任务状态
export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // 获取今天的快照统计
    // 这里可以添加更多状态检查逻辑
    
    return NextResponse.json({
      success: true,
      status: {
        scheduler: '分时图快照定时任务',
        schedule: '每天 15:00',
        retention: '保留14天',
        lastCheck: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('[分时图快照定时任务] 状态检查失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '状态检查失败',
      },
      { status: 500 }
    );
  }
}

