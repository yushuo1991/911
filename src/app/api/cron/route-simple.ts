import { NextRequest, NextResponse } from 'next/server';

// 简化版数据预加载API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // 这里可以添加数据预加载逻辑
    console.log(`预加载${date}的数据`);

    return NextResponse.json({
      success: true,
      message: `数据预加载完成`,
      data: {
        date,
        timestamp: new Date().toISOString(),
        status: 'API正常工作'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '预加载失败'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'preload';

    // 验证请求来源（简单的安全措施）
    const authToken = request.headers.get('authorization');
    const validToken = 'Bearer cron-token-2025';

    if (authToken !== validToken) {
      return NextResponse.json({ success: false, error: '未授权的请求' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: '定时任务执行完成',
      data: { action, timestamp: new Date().toISOString() }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '执行失败'
    }, { status: 500 });
  }
}