#!/bin/bash
# v4.8.5 服务器部署脚本（修复sed转义问题）

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              🚀 v4.8.5 服务器部署脚本                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

cd /www/wwwroot/stock-tracker || exit 1

# [1/7] 备份当前版本
echo "🔄 [1/7] 备份当前page.tsx..."
cp src/app/page.tsx src/app/page.tsx.backup-before-v4.8.5
echo "✅ 已备份到: src/app/page.tsx.backup-before-v4.8.5"
echo ""

# [2/7] 应用v4.8.5修改 - 使用Perl正则（更强大）
echo "📝 [2/7] 应用v4.8.5修改..."

# 修改状态徽章样式
perl -i -pe 's/px-\[3px\] py-0 rounded-sm text-\[8px\] font-bold leading-tight/px-1 py-0.5 rounded text-[9px] font-bold/g' src/app/page.tsx

# 修改溢价徽章样式
perl -i -pe 's/px-\[3px\] py-0 rounded-sm text-\[8px\] font-medium leading-tight whitespace-nowrap/px-1.5 py-0.5 rounded text-[9px] font-medium whitespace-nowrap/g' src/app/page.tsx

echo "✅ 代码修改完成"
echo ""

# [3/7] 验证修改
echo "🔍 [3/7] 验证修改..."
if grep -q "text-\[9px\] font-bold" src/app/page.tsx && grep -q "text-\[9px\] font-medium" src/app/page.tsx; then
  echo "✅ 验证通过：找到 text-[9px] 样式"
else
  echo "❌ 验证失败：未找到预期样式"
  echo "恢复备份..."
  cp src/app/page.tsx.backup-before-v4.8.5 src/app/page.tsx
  exit 1
fi
echo ""

# [4/7] 获取容器ID
echo "📦 [4/7] 获取容器ID..."
CONTAINER_ID=$(docker ps | grep stock-tracker-app | awk '{print $1}')
if [ -z "$CONTAINER_ID" ]; then
  echo "❌ 错误：未找到运行中的stock-tracker-app容器"
  echo "尝试启动容器..."
  docker compose up -d
  sleep 10
  CONTAINER_ID=$(docker ps | grep stock-tracker-app | awk '{print $1}')
fi
echo "容器ID: $CONTAINER_ID"
echo ""

# [5/7] 复制代码到容器
echo "📂 [5/7] 复制修改后的代码到容器..."
docker cp src/app/page.tsx $CONTAINER_ID:/app/src/app/page.tsx
if [ $? -eq 0 ]; then
  echo "✅ 代码已复制到容器"
else
  echo "❌ 复制失败，尝试重启容器后再复制"
  docker restart $CONTAINER_ID
  sleep 10
  docker cp src/app/page.tsx $CONTAINER_ID:/app/src/app/page.tsx
fi
echo ""

# [6/7] 重启容器应用
echo "🔄 [6/7] 重启容器应用..."
docker exec $CONTAINER_ID sh -c "pkill -f 'node.*next'" 2>/dev/null || true
sleep 3
docker restart $CONTAINER_ID
echo "✅ 容器已重启"
echo ""

# [7/7] 等待启动并验证
echo "⏳ [7/7] 等待15秒启动..."
sleep 15
echo ""

echo "🔍 检查部署状态:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 容器状态:"
docker ps | grep stock-tracker
echo ""
echo "🌐 HTTP响应:"
curl -I http://localhost:3002
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              ✅ v4.8.5 部署完成！                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "🔗 访问地址: http://bk.yushuo.click"
echo "💡 验证步骤:"
echo "   1. 按 Ctrl+Shift+R 强制刷新浏览器"
echo "   2. 点击任意'涨停数'（如'73只涨停'）"
echo "   3. 观察徽章样式:"
echo "      ✓ 溢价徽章: 9px字号, 较大padding"
echo "      ✓ 状态徽章: 9px字号"
echo "      ✓ 圆角: rounded（非rounded-sm）"
echo ""
echo "🔄 如需回滚到v4.8.4:"
echo "   cp src/app/page.tsx.backup-before-v4.8.5 src/app/page.tsx"
echo "   docker cp src/app/page.tsx $CONTAINER_ID:/app/src/app/page.tsx"
echo "   docker restart $CONTAINER_ID"
echo ""
