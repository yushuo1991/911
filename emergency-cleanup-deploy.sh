#!/bin/bash

# 紧急清理部署脚本 - 2025-09-29
# 目标：完全清理容器并重新部署

set -e

SERVER="root@107.173.154.147"
LOCAL_DIR="C:/Users/yushu/Desktop/stock-tracker - 副本"
CONTAINER_NAME="stock-app"
REMOTE_TMP="/tmp"

echo "🚀 开始紧急清理部署..."
echo "📅 时间: $(date)"

# 1. 传输关键文件
echo "📁 传输文件到服务器..."
scp "$LOCAL_DIR/tailwind.config.js" "$SERVER:$REMOTE_TMP/tailwind.config.js"
scp "$LOCAL_DIR/src/app/globals.css" "$SERVER:$REMOTE_TMP/globals.css"
scp "$LOCAL_DIR/src/app/page.tsx" "$SERVER:$REMOTE_TMP/page.tsx"

# 2. SSH执行清理和部署
ssh "$SERVER" << 'ENDSSH'
set -e

echo "🛑 停止容器..."
docker stop stock-app || true

echo "🗑️ 删除容器..."
docker rm stock-app || true

echo "🏗️ 重新创建容器..."
# 使用简化的方式重新创建容器
docker run -d \
  --name stock-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -v /root/stock-tracker:/app \
  -w /app \
  node:18-alpine sh -c "npm install && npm run build && npm start"

echo "⏳ 等待容器启动..."
sleep 15

echo "📂 复制修复文件到工作目录..."
# 复制文件到宿主机目录
cp /tmp/tailwind.config.js /root/stock-tracker/tailwind.config.js
cp /tmp/globals.css /root/stock-tracker/src/app/globals.css
cp /tmp/page.tsx /root/stock-tracker/src/app/page.tsx

echo "🧹 清理备份文件..."
# 删除可能导致构建失败的备份文件
rm -f /root/stock-tracker/src/app/api/cron/route-complex-backup.ts
rm -f /root/stock-tracker/src/app/api/cron/route-simple-backup.ts

echo "🔄 重启容器以应用更改..."
docker restart stock-app

echo "⏳ 等待服务完全启动..."
sleep 20

echo "🏥 检查服务状态..."
docker ps | grep stock-app
docker logs --tail=30 stock-app

echo "🌐 测试服务响应..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
echo "HTTP响应码: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 部署成功！服务已恢复正常"
    echo "🎉 生产服务地址: http://107.173.154.147:3000"
else
    echo "❌ 服务仍有问题，HTTP响应码: $HTTP_CODE"
    echo "📋 容器日志:"
    docker logs --tail=100 stock-app
fi

echo "🗑️ 清理临时文件..."
rm -f /tmp/tailwind.config.js /tmp/globals.css /tmp/page.tsx

ENDSSH

echo "🎊 部署完成!"
echo "📊 请访问 http://107.173.154.147:3000 验证服务状态"