#!/bin/bash

# 快速修复脚本 - 解决cron API 404问题
echo "🔧 开始修复cron API 404问题..."

cd /www/wwwroot/stock-tracker

echo "1. 停止应用..."
pm2 stop all 2>/dev/null || killall node 2>/dev/null || echo "没有运行的进程"

echo "2. 清理构建缓存..."
rm -rf .next
rm -rf node_modules/.cache

echo "3. 重新构建..."
npm run build

echo "4. 检查构建结果..."
if [ -f ".next/server/app/api/cron/route.js" ]; then
    echo "✅ cron路由构建成功"
else
    echo "❌ cron路由构建失败"
    find .next/server/app -name "*.js" | grep api
fi

echo "5. 重启应用..."
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
else
    npm start &
fi

echo "6. 等待启动完成..."
sleep 15

echo "7. 测试API..."
curl -s "http://localhost:3000/api/cron?date=2025-09-21"

echo ""
echo "🎉 修复完成！如果看到JSON响应，说明修复成功。"