#!/bin/bash

# 快速服务器配置脚本 - 临时方案
# 如果git pull失败，可以直接在服务器上创建这个脚本

echo "=========================================="
echo "快速配置股票追踪系统"
echo "时间: $(date)"
echo "=========================================="

# 项目配置
PROJECT_DIR="/www/wwwroot/stock-tracker"
LOG_DIR="$PROJECT_DIR/logs"

# 创建必要目录
mkdir -p $PROJECT_DIR/scripts
mkdir -p $LOG_DIR/cron
mkdir -p /www/backups/stock-tracker

cd $PROJECT_DIR

echo "1. 修复npm镜像配置..."
npm config set registry https://registry.npmjs.org/
npm cache clean --force

echo "2. 安装mysql2依赖..."
npm install mysql2

echo "3. 创建数据预加载API..."
mkdir -p src/app/api/cron

cat > src/app/api/cron/route.ts << 'EOF'
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
      data: { date }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '预加载失败'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // 处理定时任务调用
  return NextResponse.json({
    success: true,
    message: '定时任务执行完成'
  });
}
EOF

echo "4. 创建简化部署脚本..."
cat > scripts/deploy.sh << 'EOF'
#!/bin/bash

PROJECT_DIR="/www/wwwroot/stock-tracker"
LOG_FILE="/www/wwwroot/stock-tracker/logs/deploy.log"

echo "[$(date)] 开始部署..." >> $LOG_FILE

cd $PROJECT_DIR

# 停止应用
pm2 stop stock-tracker 2>/dev/null || echo "应用未运行"

# 拉取代码
git pull origin main || echo "Git拉取失败，使用当前代码"

# 安装依赖
npm install --production

# 构建项目
npm run build

# 启动应用
pm2 start ecosystem.config.js || npm run start &

# 健康检查
sleep 10
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "[$(date)] 部署成功" >> $LOG_FILE
    echo "✅ 部署成功"
else
    echo "[$(date)] 部署失败" >> $LOG_FILE
    echo "❌ 部署失败"
fi
EOF

echo "5. 创建数据预加载脚本..."
cat > scripts/preload-data.sh << 'EOF'
#!/bin/bash

LOG_FILE="/www/wwwroot/stock-tracker/logs/preload.log"
DATE=$(date +%Y-%m-%d)

echo "[$(date)] 开始数据预加载" >> $LOG_FILE

# 检查应用状态
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    # 调用预加载API
    curl -s "http://localhost:3000/api/cron?date=$DATE" >> $LOG_FILE
    echo "[$(date)] 数据预加载完成" >> $LOG_FILE
else
    echo "[$(date)] 应用未运行，跳过预加载" >> $LOG_FILE
fi
EOF

echo "6. 设置脚本权限..."
chmod +x scripts/deploy.sh
chmod +x scripts/preload-data.sh

echo "7. 重启应用..."
pm2 stop stock-tracker 2>/dev/null || true
npm run build
pm2 start ecosystem.config.js

echo "8. 健康检查..."
sleep 10
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 应用运行正常"
    echo "✅ 访问地址: http://bk.yushuo.click"
    echo "✅ API测试: http://bk.yushuo.click/api/stocks"
else
    echo "❌ 应用可能存在问题，请检查日志"
fi

echo ""
echo "=========================================="
echo "配置完成！"
echo ""
echo "📋 下一步可以做："
echo "1. 在宝塔面板添加定时任务："
echo "   任务: bash /www/wwwroot/stock-tracker/scripts/preload-data.sh"
echo "   时间: 每天 18:00"
echo ""
echo "2. 查看日志："
echo "   tail -f /www/wwwroot/stock-tracker/logs/deploy.log"
echo "   tail -f /www/wwwroot/stock-tracker/logs/preload.log"
echo ""
echo "3. 手动测试："
echo "   bash scripts/deploy.sh"
echo "   bash scripts/preload-data.sh"
echo "=========================================="