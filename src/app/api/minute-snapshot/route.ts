import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import http from 'http';

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stock_tracker',
};

// 分时图存储目录
const SNAPSHOT_DIR = path.join(process.cwd(), 'data', 'minute-snapshots');

// 确保目录存在
async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// 下载分时图
async function downloadMinuteChart(stockCode: string): Promise<Buffer> {
  const codeFormat = stockCode.startsWith('6') ? `sh${stockCode}` : `sz${stockCode}`;
  const url = `http://image.sinajs.cn/newchart/min/n/${codeFormat}.gif`;
  
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// GET: 读取分时图快照
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');
  const code = searchParams.get('code');

  if (!date || !code) {
    return NextResponse.json(
      { success: false, error: '缺少参数: date 和 code' },
      { status: 400 }
    );
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute<any[]>(
      'SELECT file_path FROM minute_chart_snapshots WHERE trade_date = ? AND stock_code = ?',
      [date, code]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: '未找到该日期的分时图快照' },
        { status: 404 }
      );
    }

    const filePath = rows[0].file_path;
    const fullPath = path.join(process.cwd(), filePath);
    
    // 读取文件
    const imageBuffer = await fs.readFile(fullPath);
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'public, max-age=86400', // 缓存1天
      },
    });
  } catch (error: any) {
    console.error('[分时图快照API] 读取失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

// POST: 保存分时图快照
export async function POST(request: NextRequest) {
  let connection;
  try {
    const body = await request.json();
    const { date, stocks } = body;

    if (!date || !stocks || !Array.isArray(stocks)) {
      return NextResponse.json(
        { success: false, error: '参数错误' },
        { status: 400 }
      );
    }

    // 确保存储目录存在
    await ensureDir(SNAPSHOT_DIR);
    const dateDir = path.join(SNAPSHOT_DIR, date);
    await ensureDir(dateDir);

    connection = await mysql.createConnection(dbConfig);
    
    const results = {
      total: stocks.length,
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const stock of stocks) {
      try {
        const { code, name } = stock;
        
        // 下载分时图
        const imageBuffer = await downloadMinuteChart(code);
        
        // 保存文件
        const fileName = `${code}.gif`;
        const relativePath = `data/minute-snapshots/${date}/${fileName}`;
        const fullPath = path.join(dateDir, fileName);
        await fs.writeFile(fullPath, imageBuffer);
        
        // 保存到数据库
        await connection.execute(
          `INSERT INTO minute_chart_snapshots (trade_date, stock_code, stock_name, file_path, file_size)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), file_size = VALUES(file_size)`,
          [date, code, name, relativePath, imageBuffer.length]
        );
        
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          code: stock.code,
          name: stock.name,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `分时图快照保存完成`,
      data: results,
    });
  } catch (error: any) {
    console.error('[分时图快照API] 保存失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

// DELETE: 清理旧快照（超过14天）
export async function DELETE(request: NextRequest) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 计算14天前的日期
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    // 查询要删除的记录
    const [rows] = await connection.execute<any[]>(
      'SELECT file_path FROM minute_chart_snapshots WHERE trade_date < ?',
      [cutoffDateStr]
    );
    
    // 删除文件
    let deletedFiles = 0;
    for (const row of rows) {
      try {
        const fullPath = path.join(process.cwd(), row.file_path);
        await fs.unlink(fullPath);
        deletedFiles++;
      } catch (error) {
        // 文件可能已不存在，忽略错误
      }
    }
    
    // 删除数据库记录
    const [result] = await connection.execute<any>(
      'DELETE FROM minute_chart_snapshots WHERE trade_date < ?',
      [cutoffDateStr]
    );
    
    // 清理空目录
    try {
      const dateDirs = await fs.readdir(SNAPSHOT_DIR);
      for (const dir of dateDirs) {
        if (dir < cutoffDateStr) {
          const dirPath = path.join(SNAPSHOT_DIR, dir);
          await fs.rm(dirPath, { recursive: true, force: true });
        }
      }
    } catch (error) {
      // 忽略目录清理错误
    }
    
    return NextResponse.json({
      success: true,
      message: `已清理 ${result.affectedRows} 条超过14天的记录`,
      data: {
        deletedRecords: result.affectedRows,
        deletedFiles,
        cutoffDate: cutoffDateStr,
      },
    });
  } catch (error: any) {
    console.error('[分时图快照API] 清理失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

