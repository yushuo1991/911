#!/bin/bash
# 一键修复脚本 - v4.3部署问题
# 解决Docker容器更新后浏览器未显示新版本的问题
# 生成时间: 2025-09-30

set -e  # 遇到错误立即退出

echo "================================"
echo "🚀 一键修复 - v4.3部署问题"
echo "================================"
echo ""

# 进入项目目录
cd /www/wwwroot/stock-tracker || exit 1

echo "📋 当前Git状态:"
git log -1 --oneline
echo ""

echo "🔄 步骤1: 停止并删除现有容器"
echo "----------------------------------------"
docker compose down
echo "✅ 容器已停止"
echo ""

echo "🗑️ 步骤2: 清理Docker缓存和旧镜像"
echo "----------------------------------------"
# 删除项目相关的镜像
docker images | grep stock-tracker | awk '{print $3}' | xargs -r docker rmi -f || true
# 清理构建缓存
docker builder prune -f
# 清理悬空镜像
docker image prune -f
echo "✅ Docker缓存已清理"
echo ""

echo "📦 步骤3: 清理本地构建产物"
echo "----------------------------------------"
# 删除 .next 目录
rm -rf .next
echo "已删除 .next/"
# 删除 node_modules (可选，但能确保依赖是最新的)
rm -rf node_modules
echo "已删除 node_modules/"
echo "✅ 本地构建产物已清理"
echo ""

echo "🔨 步骤4: 重新构建并启动 (无缓存)"
echo "----------------------------------------"
# 使用 --no-cache 和 --pull 确保完全重新构建
docker compose build --no-cache --pull
echo "✅ 镜像构建完成"
echo ""

echo "🚀 步骤5: 启动容器"
echo "----------------------------------------"
docker compose up -d
echo "✅ 容器已启动"
echo ""

echo "⏳ 步骤6: 等待容器启动完成..."
echo "----------------------------------------"
sleep 5
echo ""

echo "🔍 步骤7: 验证部署"
echo "----------------------------------------"
echo "容器状态:"
docker compose ps
echo ""

echo "健康检查:"
docker compose exec -T stock-tracker curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost:3000 || echo "⚠️ 健康检查失败"
echo ""

echo "检查新文件是否存在:"
docker compose exec -T stock-tracker test -f /app/src/components/StockPremiumChart.tsx && echo "✅ StockPremiumChart.tsx 存在" || echo "❌ StockPremiumChart.tsx 不存在"
docker compose exec -T stock-tracker test -f /app/src/lib/chartHelpers.ts && echo "✅ chartHelpers.ts 存在" || echo "❌ chartHelpers.ts 不存在"
echo ""

echo "检查依赖安装:"
docker compose exec -T stock-tracker test -d /app/node_modules/recharts && echo "✅ recharts 已安装" || echo "❌ recharts 未安装"
echo ""

echo "检查页面内容:"
docker compose exec -T stock-tracker curl -s http://localhost:3000 2>/dev/null | grep -o "StockPremiumChart" | head -1 && echo "✅ 页面包含新组件" || echo "❌ 页面不包含新组件"
echo ""

echo "当前 ETag:"
docker compose exec -T stock-tracker curl -I http://localhost:3000 2>/dev/null | grep -i etag || echo "无ETag"
echo ""

echo "BUILD_ID:"
docker compose exec -T stock-tracker cat /app/.next/BUILD_ID 2>/dev/null || echo "❌ 无BUILD_ID"
echo ""

echo "================================"
echo "✅ 修复完成！"
echo "================================"
echo ""
echo "📊 验证结果:"
echo "请检查上述输出，确认："
echo "  1. 容器状态为 running"
echo "  2. HTTP状态码为 200"
echo "  3. 新文件都存在"
echo "  4. recharts 已安装"
echo "  5. 页面包含新组件"
echo ""
echo "🌐 现在请在浏览器中："
echo "  1. 强制刷新页面 (Ctrl+Shift+R 或 Cmd+Shift+R)"
echo "  2. 或清除浏览器缓存后刷新"
echo "  3. 检查 ETag 是否已更新"
echo ""
echo "如果问题仍然存在，请查看容器日志："
echo "  docker compose logs -f stock-tracker"
echo ""