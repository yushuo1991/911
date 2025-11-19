import { NextRequest, NextResponse } from 'next/server';
import { stockDatabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('[数据状态API] 开始检查数据更新状态');

    // 导入 mysql2 来直接查询数据库
    const mysql = require('mysql2/promise');
    
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'stock_tracker',
      timezone: '+08:00'
    };

    const conn = await mysql.createConnection(dbConfig);

    // 获取股票涨停数据统计
    const [stockData] = await conn.query(`
      SELECT 
        MAX(updated_at) as latest_update, 
        MAX(trade_date) as latest_date, 
        COUNT(*) as total_count,
        COUNT(DISTINCT trade_date) as total_dates
      FROM stock_data
    `);

    // 获取最近5个交易日的数据
    const [recentDays] = await conn.query(`
      SELECT 
        trade_date, 
        COUNT(*) as stock_count,
        MAX(updated_at) as update_time
      FROM stock_data 
      GROUP BY trade_date 
      ORDER BY trade_date DESC 
      LIMIT 5
    `);

    // 获取股票表现数据统计
    const [perfData] = await conn.query(`
      SELECT 
        MAX(updated_at) as latest_update, 
        MAX(base_date) as latest_base_date, 
        COUNT(*) as total_count,
        COUNT(DISTINCT base_date) as total_base_dates
      FROM stock_performance
    `);

    // 获取7天缓存数据统计
    const [cacheData] = await conn.query(`
      SELECT 
        COUNT(*) as total, 
        SUM(expires_at > NOW()) as active,
        MAX(created_at) as latest_created
      FROM seven_days_cache
    `);

    let cacheDetails = [];
    if (cacheData[0].total > 0) {
      const [details] = await conn.query(`
        SELECT cache_key, created_at, expires_at 
        FROM seven_days_cache 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      cacheDetails = details;
    }

    // 尝试获取分时图快照信息
    let snapshotData = null;
    let recentSnapshots = [];
    try {
      const [snapData] = await conn.query(`
        SELECT 
          MAX(trade_date) as latest_date, 
          COUNT(*) as total_count,
          COUNT(DISTINCT trade_date) as total_dates
        FROM minute_chart_snapshots
      `);
      snapshotData = snapData[0];

      const [recentSnaps] = await conn.query(`
        SELECT trade_date, COUNT(*) as count 
        FROM minute_chart_snapshots 
        GROUP BY trade_date 
        ORDER BY trade_date DESC 
        LIMIT 5
      `);
      recentSnapshots = recentSnaps;
    } catch (e) {
      console.log('[数据状态API] 分时图快照表不存在');
    }

    await conn.end();

    // 构建响应数据
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      server_time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      data: {
        stock_data: {
          latest_update: stockData[0].latest_update,
          latest_date: stockData[0].latest_date,
          total_count: stockData[0].total_count,
          total_dates: stockData[0].total_dates,
          recent_days: recentDays
        },
        stock_performance: {
          latest_update: perfData[0].latest_update,
          latest_base_date: perfData[0].latest_base_date,
          total_count: perfData[0].total_count,
          total_base_dates: perfData[0].total_base_dates
        },
        seven_days_cache: {
          total: cacheData[0].total,
          active: cacheData[0].active,
          latest_created: cacheData[0].latest_created,
          recent_caches: cacheDetails
        },
        minute_snapshots: snapshotData ? {
          latest_date: snapshotData.latest_date,
          total_count: snapshotData.total_count,
          total_dates: snapshotData.total_dates,
          recent_snapshots: recentSnapshots
        } : null
      }
    };

    console.log('[数据状态API] 数据检查完成');

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[数据状态API] 检查失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}


