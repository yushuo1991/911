#!/bin/bash
# v4.8.8 部署诊断脚本

echo "=========================================="
echo "🔍 v4.8.8 部署诊断开始"
echo "=========================================="
echo ""

# 1. 检查当前Git版本
echo "📌 1. 检查Git提交版本"
cd /www/wwwroot/stock-tracker
CURRENT_COMMIT=$(git rev-parse --short HEAD)
LATEST_COMMIT=$(git rev-parse --short origin/main)
echo "   当前提交: $CURRENT_COMMIT"
echo "   最新提交: $LATEST_COMMIT"
if [ "$CURRENT_COMMIT" = "$LATEST_COMMIT" ]; then
    echo "   ✅ 代码版本正确"
else
    echo "   ❌ 代码版本不一致，需要拉取最新代码"
fi
echo ""

# 2. 检查关键文件修改
echo "📌 2. 检查v4.8.8关键代码是否存在"

# 检查缓存时间修改
echo "   检查缓存时间修改（应为30分钟）:"
grep "SEVEN_DAYS_CACHE_DURATION = 30 \* 60 \* 1000" src/app/api/stocks/route.ts > /dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ 缓存时间已修改为30分钟"
else
    echo "   ❌ 缓存时间未修改"
    echo "   实际内容:"
    grep "SEVEN_DAYS_CACHE_DURATION" src/app/api/stocks/route.ts | head -1
fi

# 检查Amount字段
echo "   检查Stock类型Amount字段:"
grep "Amount\?: number" src/types/stock.ts > /dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Stock.Amount字段已添加"
else
    echo "   ❌ Stock.Amount字段未添加"
fi

# 检查sectorAmounts字段
echo "   检查DayData.sectorAmounts字段:"
grep "sectorAmounts\?: Record<string, number>" src/types/stock.ts > /dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ DayData.sectorAmounts字段已添加"
else
    echo "   ❌ DayData.sectorAmounts字段未添加"
fi

# 检查成交额提取代码
echo "   检查成交额提取逻辑:"
grep "stockData\[6\]" src/app/api/stocks/route.ts > /dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ 成交额提取代码已添加"
else
    echo "   ❌ 成交额提取代码未添加"
fi

# 检查前端显示代码
echo "   检查前端成交额显示:"
grep "sectorAmounts" src/app/page.tsx > /dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ 前端成交额显示代码已添加"
else
    echo "   ❌ 前端成交额显示代码未添加"
fi
echo ""

# 3. 检查Docker容器状态
echo "📌 3. 检查Docker容器状态"
docker ps --filter "name=stock-tracker-app" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 4. 检查服务响应
echo "📌 4. 检查服务HTTP响应"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002)
echo "   HTTP状态码: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ 服务响应正常"
else
    echo "   ❌ 服务响应异常"
fi
echo ""

# 5. 检查容器日志（最近20行）
echo "📌 5. 检查容器日志（最近20行）"
docker logs --tail 20 stock-tracker-app 2>&1 | grep -E "(Ready|error|warn|v4.8.8)"
echo ""

# 6. 检查API响应数据
echo "📌 6. 测试API数据结构"
API_RESPONSE=$(curl -s "http://localhost:3002/api/stocks?date=2025-10-09&mode=7days" | head -c 500)
echo "   API响应前500字符:"
echo "   $API_RESPONSE"
echo ""

# 检查sectorAmounts是否在响应中
echo "   检查API是否返回sectorAmounts:"
curl -s "http://localhost:3002/api/stocks?date=2025-10-09&mode=7days" | grep -o "sectorAmounts" | head -1
if [ $? -eq 0 ]; then
    echo "   ✅ API返回包含sectorAmounts"
else
    echo "   ❌ API返回不包含sectorAmounts"
fi
echo ""

# 7. 检查构建是否使用了新代码
echo "📌 7. 检查Docker镜像构建时间"
docker images stock-tracker-stock-tracker --format "{{.CreatedAt}}"
echo ""

# 8. 总结和建议
echo "=========================================="
echo "📋 诊断总结"
echo "=========================================="
echo ""

# 如果代码不一致，给出修复建议
if [ "$CURRENT_COMMIT" != "$LATEST_COMMIT" ]; then
    echo "⚠️  发现问题: 代码版本不是最新"
    echo ""
    echo "🔧 修复方案:"
    echo "   执行以下命令更新代码并重新部署:"
    echo ""
    echo "   git fetch origin && git pull origin main && docker compose down && docker compose build --no-cache && docker compose up -d"
    echo ""
fi

# 检查是否需要重新构建
echo "💡 如果代码已更新但功能未生效，请执行:"
echo "   1. 强制重新构建: docker compose build --no-cache"
echo "   2. 重启容器: docker compose down && docker compose up -d"
echo "   3. 清除浏览器缓存: Ctrl+Shift+R 或 Ctrl+F5"
echo ""

echo "=========================================="
echo "✅ 诊断完成"
echo "=========================================="
