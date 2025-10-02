#!/bin/bash
# DevOps部署诊断脚本 - v4.3版本更新检查
# 生成时间: 2025-09-30
# 目标: 诊断为什么代码更新后浏览器没有变化

echo "================================"
echo "DevOps部署诊断 - v4.3版本"
echo "================================"
echo ""

# 进入项目目录
cd /www/wwwroot/stock-tracker || exit 1

echo "📋 步骤1: 检查服务器上的Git代码状态"
echo "----------------------------------------"
echo "当前分支和最新提交:"
git log -1 --oneline
echo ""
echo "工作目录状态:"
git status --short
echo ""

echo "📂 步骤2: 检查服务器上的关键新文件"
echo "----------------------------------------"
echo "检查 StockPremiumChart.tsx:"
if [ -f "src/components/StockPremiumChart.tsx" ]; then
    ls -lh src/components/StockPremiumChart.tsx
    echo "✅ 文件存在 ($(wc -l < src/components/StockPremiumChart.tsx) 行)"
else
    echo "❌ 文件不存在!"
fi
echo ""

echo "检查 chartHelpers.ts:"
if [ -f "src/lib/chartHelpers.ts" ]; then
    ls -lh src/lib/chartHelpers.ts
    echo "✅ 文件存在 ($(wc -l < src/lib/chartHelpers.ts) 行)"
else
    echo "❌ 文件不存在!"
fi
echo ""

echo "检查 page.tsx 中的新组件引用:"
if grep -q "StockPremiumChart" src/app/page.tsx; then
    echo "✅ page.tsx 包含 StockPremiumChart 引用"
    echo "引用位置:"
    grep -n "StockPremiumChart" src/app/page.tsx | head -5
else
    echo "❌ page.tsx 不包含 StockPremiumChart 引用!"
fi
echo ""

echo "检查 package.json 中的 recharts 依赖:"
if grep -q "recharts" package.json; then
    echo "✅ package.json 包含 recharts"
    grep "recharts" package.json
else
    echo "❌ package.json 不包含 recharts!"
fi
echo ""

echo "🐳 步骤3: 检查Docker容器状态"
echo "----------------------------------------"
echo "容器运行状态:"
docker compose ps
echo ""

echo "容器健康检查:"
docker compose exec -T stock-tracker curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost:3000
echo ""

echo "📦 步骤4: 检查容器内的文件"
echo "----------------------------------------"
echo "检查容器内 StockPremiumChart.tsx:"
if docker compose exec -T stock-tracker test -f /app/src/components/StockPremiumChart.tsx; then
    echo "✅ 容器内文件存在"
    docker compose exec -T stock-tracker ls -lh /app/src/components/StockPremiumChart.tsx
    docker compose exec -T stock-tracker wc -l /app/src/components/StockPremiumChart.tsx
else
    echo "❌ 容器内文件不存在!"
fi
echo ""

echo "检查容器内 chartHelpers.ts:"
if docker compose exec -T stock-tracker test -f /app/src/lib/chartHelpers.ts; then
    echo "✅ 容器内文件存在"
    docker compose exec -T stock-tracker ls -lh /app/src/lib/chartHelpers.ts
    docker compose exec -T stock-tracker wc -l /app/src/lib/chartHelpers.ts
else
    echo "❌ 容器内文件不存在!"
fi
echo ""

echo "检查容器内 page.tsx 的新组件引用:"
if docker compose exec -T stock-tracker grep -q "StockPremiumChart" /app/src/app/page.tsx; then
    echo "✅ 容器内 page.tsx 包含 StockPremiumChart"
    docker compose exec -T stock-tracker grep -n "StockPremiumChart" /app/src/app/page.tsx | head -5
else
    echo "❌ 容器内 page.tsx 不包含 StockPremiumChart!"
fi
echo ""

echo "🔧 步骤5: 检查依赖安装"
echo "----------------------------------------"
echo "检查容器内 node_modules:"
if docker compose exec -T stock-tracker test -d /app/node_modules/recharts; then
    echo "✅ recharts 已安装"
    docker compose exec -T stock-tracker ls -ld /app/node_modules/recharts
else
    echo "❌ recharts 未安装!"
fi
echo ""

echo "检查容器内 package.json:"
docker compose exec -T stock-tracker grep "recharts" /app/package.json || echo "❌ 容器内 package.json 不包含 recharts"
echo ""

echo "🏗️ 步骤6: 检查Next.js构建"
echo "----------------------------------------"
echo "检查 .next 目录:"
docker compose exec -T stock-tracker ls -lhd /app/.next
echo ""

echo "检查 BUILD_ID:"
if docker compose exec -T stock-tracker test -f /app/.next/BUILD_ID; then
    echo "当前 BUILD_ID:"
    docker compose exec -T stock-tracker cat /app/.next/BUILD_ID
else
    echo "❌ BUILD_ID 文件不存在!"
fi
echo ""

echo "检查 .next 目录修改时间:"
docker compose exec -T stock-tracker stat /app/.next | grep Modify
echo ""

echo "检查构建文件数量:"
docker compose exec -T stock-tracker find /app/.next -type f | wc -l
echo ""

echo "🔍 步骤7: 对比文件MD5"
echo "----------------------------------------"
echo "服务器 page.tsx MD5:"
md5sum src/app/page.tsx
echo ""
echo "容器内 page.tsx MD5:"
docker compose exec -T stock-tracker md5sum /app/src/app/page.tsx
echo ""

echo "服务器 package.json MD5:"
md5sum package.json
echo ""
echo "容器内 package.json MD5:"
docker compose exec -T stock-tracker md5sum /app/package.json
echo ""

echo "📊 步骤8: 检查构建日志"
echo "----------------------------------------"
echo "最近的容器日志 (最后50行):"
docker compose logs --tail=50 stock-tracker | grep -E "(StockPremiumChart|recharts|error|Error|BUILD)"
echo ""

echo "🌐 步骤9: 检查实际响应"
echo "----------------------------------------"
echo "检查页面响应头:"
docker compose exec -T stock-tracker curl -I http://localhost:3000 2>/dev/null | grep -E "(HTTP|ETag|Cache)"
echo ""

echo "检查页面源代码是否包含新组件:"
docker compose exec -T stock-tracker curl -s http://localhost:3000 2>/dev/null | grep -o "StockPremiumChart" | head -1 && echo "✅ 页面包含 StockPremiumChart" || echo "❌ 页面不包含 StockPremiumChart"
echo ""

echo "🔎 步骤10: 检查Dockerfile配置"
echo "----------------------------------------"
echo "当前 Dockerfile 内容:"
cat Dockerfile
echo ""

echo "================================"
echo "诊断完成！"
echo "================================"
echo ""
echo "💡 关键检查点总结:"
echo "1. 服务器文件是否是最新版本"
echo "2. 容器内文件是否与服务器一致"
echo "3. node_modules 是否包含新依赖"
echo "4. .next 构建是否是最新的"
echo "5. 页面实际输出是否包含新代码"
echo ""