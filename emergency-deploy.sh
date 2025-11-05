#!/bin/bash

# 紧急部署脚本 - 2025-09-29
# 目标：恢复生产服务到可工作状态

set -e

SERVER="root@107.173.154.147"
LOCAL_DIR="C:/Users/yushu/Desktop/stock-tracker - 副本"
CONTAINER_NAME="stock-app"
REMOTE_TMP="/tmp"

echo "🚀 开始紧急部署..."
echo "📅 时间: $(date)"
echo "🎯 目标: 修复生产环境500错误"

# 1. 传输关键修复文件到服务器临时目录
echo "📁 传输文件到服务器..."
scp "$LOCAL_DIR/tailwind.config.js" "$SERVER:$REMOTE_TMP/tailwind.config.js"
scp "$LOCAL_DIR/src/app/globals.css" "$SERVER:$REMOTE_TMP/globals.css"
scp "$LOCAL_DIR/src/app/page.tsx" "$SERVER:$REMOTE_TMP/page.tsx"

echo "✅ 文件传输完成"

# 2. SSH到服务器执行部署
echo "🔧 在服务器上执行部署..."
ssh "$SERVER" << 'ENDSSH'
set -e

echo "📋 检查当前Docker容器状态..."
docker ps -a | grep stock-app || echo "容器未运行"

echo "📂 复制文件到容器..."
# 复制文件到容器
docker cp /tmp/tailwind.config.js stock-app:/app/tailwind.config.js
docker cp /tmp/globals.css stock-app:/app/src/app/globals.css
docker cp /tmp/page.tsx stock-app:/app/src/app/page.tsx

echo "🧹 清理构建缓存..."
# 清理Next.js缓存
docker exec stock-app rm -rf /app/.next
docker exec stock-app rm -rf /app/node_modules/.cache

echo "🏗️ 在容器内重新构建..."
# 重新构建应用
docker exec stock-app npm run build

echo "🔄 重启容器..."
# 重启容器以确保所有更改生效
docker restart stock-app

# 等待容器启动
echo "⏳ 等待服务启动..."
sleep 10

echo "🏥 检查服务健康状态..."
# 检查服务状态
docker ps | grep stock-app
docker logs --tail=20 stock-app

echo "🌐 测试服务响应..."
# 测试HTTP响应
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
echo "HTTP响应码: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 部署成功！服务已恢复正常"
    echo "🎉 生产服务地址: http://107.173.154.147:3000"
else
    echo "❌ 服务仍有问题，HTTP响应码: $HTTP_CODE"
    echo "📋 最近日志:"
    docker logs --tail=50 stock-app
    exit 1
fi

echo "🗑️ 清理临时文件..."
rm -f /tmp/tailwind.config.js /tmp/globals.css /tmp/page.tsx

ENDSSH

echo "🎊 紧急部署完成!"
echo "📊 请访问 http://107.173.154.147:3000 验证服务状态"
echo "📝 部署日志已记录到服务器"