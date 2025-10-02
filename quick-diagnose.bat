@echo off
chcp 65001 >nul
echo ================================
echo 快速诊断 - v4.3部署问题
echo ================================
echo.

echo 🔍 执行快速诊断命令...
echo.

REM 直接通过SSH执行诊断命令
ssh root@yushuo.click "bash -s" << 'EOF' > quick-diagnostic-20250930.txt 2>&1
cd /www/wwwroot/stock-tracker

echo "=== 1. Git 状态 ==="
git log -1 --oneline
git status -s

echo ""
echo "=== 2. 服务器文件检查 ==="
echo "StockPremiumChart.tsx:"
ls -lh src/components/StockPremiumChart.tsx 2>/dev/null || echo "❌ 不存在"
echo "chartHelpers.ts:"
ls -lh src/lib/chartHelpers.ts 2>/dev/null || echo "❌ 不存在"
echo "page.tsx 引用检查:"
grep -c "StockPremiumChart" src/app/page.tsx 2>/dev/null || echo "❌ 无引用"

echo ""
echo "=== 3. 容器内文件检查 ==="
echo "容器状态:"
docker compose ps
echo ""
echo "容器内文件:"
docker compose exec -T stock-tracker ls /app/src/components/StockPremiumChart.tsx 2>/dev/null || echo "❌ 容器内文件不存在"
docker compose exec -T stock-tracker ls /app/src/lib/chartHelpers.ts 2>/dev/null || echo "❌ 容器内文件不存在"
docker compose exec -T stock-tracker grep -c "StockPremiumChart" /app/src/app/page.tsx 2>/dev/null || echo "❌ 容器内无引用"

echo ""
echo "=== 4. 依赖检查 ==="
echo "服务器 package.json:"
grep "recharts" package.json 2>/dev/null || echo "❌ 无recharts"
echo "容器内 node_modules:"
docker compose exec -T stock-tracker ls /app/node_modules/recharts 2>/dev/null && echo "✅ recharts已安装" || echo "❌ recharts未安装"

echo ""
echo "=== 5. 构建检查 ==="
echo "BUILD_ID:"
docker compose exec -T stock-tracker cat /app/.next/BUILD_ID 2>/dev/null || echo "❌ 无BUILD_ID"
echo ".next 修改时间:"
docker compose exec -T stock-tracker stat -c %y /app/.next 2>/dev/null

echo ""
echo "=== 6. MD5对比 ==="
echo "服务器 page.tsx:"
md5sum src/app/page.tsx
echo "容器内 page.tsx:"
docker compose exec -T stock-tracker md5sum /app/src/app/page.tsx 2>/dev/null

echo ""
echo "=== 7. 实际响应检查 ==="
docker compose exec -T stock-tracker curl -I http://localhost:3000 2>/dev/null | grep -E "HTTP|ETag"
docker compose exec -T stock-tracker curl -s http://localhost:3000 2>/dev/null | grep -o "StockPremiumChart" | head -1 && echo "✅ 页面包含新组件" || echo "❌ 页面无新组件"

echo ""
echo "=== 8. Dockerfile检查 ==="
cat Dockerfile

echo ""
echo "=== 诊断完成 ==="
EOF

echo.
echo 📋 快速诊断完成，报告已保存到: quick-diagnostic-20250930.txt
echo.
echo 正在显示报告...
echo ================================
type quick-diagnostic-20250930.txt
echo ================================
echo.
pause