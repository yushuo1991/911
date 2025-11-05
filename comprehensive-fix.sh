#!/bin/bash

SERVER="root@107.173.154.147"
LOCAL_DIR="C:/Users/yushu/Desktop/stock-tracker - 副本"

echo "🚀 综合修复中..."

# 传输文件
scp "$LOCAL_DIR/tailwind.config.js" "$SERVER:/tmp/tailwind.config.js"
scp "$LOCAL_DIR/src/app/globals.css" "$SERVER:/tmp/globals.css"
scp "$LOCAL_DIR/src/app/page.tsx" "$SERVER:/tmp/page.tsx"

ssh "$SERVER" << 'EOF'
echo "🗑️ 删除所有问题文件..."
# 删除所有backup和enhanced文件
docker exec stock-app rm -f /app/src/app/api/cron/route-complex-backup.ts
docker exec stock-app rm -f /app/src/app/api/cron/route-simple-backup.ts
docker exec stock-app rm -f /app/src/app/api/cron/route-enhanced.ts
docker exec stock-app rm -f /app/src/lib/enhanced-trading-calendar.ts
docker exec stock-app rm -f /app/src/app/api/stocks/route-backup.ts
docker exec stock-app rm -f /app/src/app/page-backup.tsx
docker exec stock-app rm -f /app/src/components/StockTracker-backup.tsx

echo "📂 复制修复文件..."
docker cp /tmp/tailwind.config.js stock-app:/app/tailwind.config.js
docker cp /tmp/globals.css stock-app:/app/src/app/globals.css
docker cp /tmp/page.tsx stock-app:/app/src/app/page.tsx

echo "🧹 清理构建缓存..."
docker exec stock-app rm -rf /app/.next
docker exec stock-app rm -rf /app/node_modules/.cache

echo "🏗️ 重新构建..."
docker exec stock-app npm run build > /tmp/build.log 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 构建成功！"
    echo "🔄 重启容器..."
    docker restart stock-app

    echo "⏳ 等待服务启动..."
    sleep 20

    echo "🌐 测试服务..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    echo "HTTP响应码: $HTTP_CODE"

    if [ "$HTTP_CODE" = "200" ]; then
        echo "🎉 修复成功！服务已恢复: http://107.173.154.147:3000"
    else
        echo "❌ 服务响应异常"
        docker logs --tail=30 stock-app
    fi
else
    echo "❌ 构建失败"
    cat /tmp/build.log
fi

rm -f /tmp/tailwind.config.js /tmp/globals.css /tmp/page.tsx /tmp/build.log
EOF