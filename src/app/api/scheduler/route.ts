import { NextRequest, NextResponse } from 'next/server';
import { stockDatabase } from '@/lib/database';

// 定时任务API - 每天18点自动执行数据缓存
export async function POST(request: NextRequest) {
  console.log('[定时任务] 开始执行每日数据缓存任务');

  try {
    // 验证请求来源（可选：添加认证token）
    const authHeader = request.headers.get('authorization');
    const validToken = process.env.SCHEDULER_TOKEN || 'default-token';

    if (authHeader !== `Bearer ${validToken}`) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    // 初始化数据库
    await stockDatabase.initializeTables();

    // 获取最近7个交易日
    const today = new Date();
    const sevenDays = generate7TradingDays(today.toISOString().split('T')[0]);

    console.log(`[定时任务] 开始缓存最近7天数据: ${sevenDays.join(', ')}`);

    let successCount = 0;
    let errorCount = 0;

    // 为每一天预缓存数据
    for (const date of sevenDays) {
      try {
        console.log(`[定时任务] 预缓存 ${date} 的数据`);

        // 直接调用API获取并缓存数据
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stocks?date=${date}&mode=7days`);

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            successCount++;
            console.log(`[定时任务] ${date} 数据缓存成功`);
          } else {
            errorCount++;
            console.log(`[定时任务] ${date} 数据缓存失败: ${result.error}`);
          }
        } else {
          errorCount++;
          console.log(`[定时任务] ${date} API请求失败: ${response.status}`);
        }

      } catch (dateError) {
        errorCount++;
        console.error(`[定时任务] ${date} 处理异常:`, dateError);
      }

      // 适当延时避免过快请求
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 清理过期缓存
    await stockDatabase.cleanExpiredCache();

    // 获取数据库统计信息
    const stats = await stockDatabase.getStats();

    console.log(`[定时任务] 缓存任务完成 - 成功: ${successCount}, 失败: ${errorCount}`);

    return NextResponse.json({
      success: true,
      message: '定时缓存任务完成',
      stats: {
        processedDays: sevenDays.length,
        successCount,
        errorCount,
        cacheStats: stats
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const err = error as any;
    console.error('[定时任务] 执行失败:', err);

    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : '定时任务执行失败',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// 获取定时任务状态
export async function GET(request: NextRequest) {
  try {
    // 获取数据库统计
    const stats = await stockDatabase.getStats();
    const isConnected = await stockDatabase.testConnection();

    return NextResponse.json({
      success: true,
      status: {
        databaseConnected: isConnected,
        stats: stats,
        lastUpdate: new Date().toISOString()
      }
    });

  } catch (error) {
    const err = error as any;
    console.error('[定时任务] 状态检查失败:', err);

    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : '状态检查失败'
      },
      { status: 500 }
    );
  }
}

// 生成最近7个交易日（工作日，排除周末）
function generate7TradingDays(endDate: string): string[] {
  const dates = [];
  const end = new Date(endDate);
  let current = new Date(end);

  while (dates.length < 7) {
    // 跳过周末
    if (current.getDay() !== 0 && current.getDay() !== 6) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() - 1);
  }

  return dates.reverse(); // 返回从早到晚的顺序
}