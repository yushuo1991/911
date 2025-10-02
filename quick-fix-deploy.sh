#!/bin/bash

# 快速修复脚本 - 直接操作
SERVER="root@107.173.154.147"
LOCAL_DIR="C:/Users/yushu/Desktop/stock-tracker - 副本"

echo "🚀 快速修复部署中..."

# 传输文件
scp "$LOCAL_DIR/tailwind.config.js" "$SERVER:/tmp/tailwind.config.js"
scp "$LOCAL_DIR/src/app/globals.css" "$SERVER:/tmp/globals.css"
scp "$LOCAL_DIR/src/app/page.tsx" "$SERVER:/tmp/page.tsx"

# 直接操作
ssh "$SERVER" << 'EOF'
# 删除问题文件
docker exec stock-app rm -f /app/src/app/api/cron/route-complex-backup.ts
docker exec stock-app rm -f /app/src/app/api/cron/route-simple-backup.ts

# 复制新文件
docker cp /tmp/tailwind.config.js stock-app:/app/tailwind.config.js
docker cp /tmp/globals.css stock-app:/app/src/app/globals.css
docker cp /tmp/page.tsx stock-app:/app/src/app/page.tsx

# 清理并重建
docker exec stock-app rm -rf /app/.next
docker exec stock-app npm run build

# 重启
docker restart stock-app

sleep 15

# 检查
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
echo "HTTP响应码: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 修复成功！"
else
    echo "❌ 仍有问题"
    docker logs --tail=20 stock-app
fi

rm -f /tmp/tailwind.config.js /tmp/globals.css /tmp/page.tsx
EOF