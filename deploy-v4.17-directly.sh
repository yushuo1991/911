#!/bin/bash
# v4.17 直接服务器部署脚本（无需GitHub）
# 用途: 直接在服务器上应用v4.17更改
# 执行位置: 服务器 /www/wwwroot/stock-tracker

echo "=========================================="
echo "开始直接部署 v4.17（无需GitHub同步）"
echo "=========================================="
echo ""

cd /www/wwwroot/stock-tracker || exit 1

# 备份当前文件
echo "[步骤1] 备份当前page.tsx..."
cp src/app/page.tsx src/app/page.tsx.backup-$(date +%Y%m%d-%H%M%S)
echo "✅ 备份完成"
echo ""

# 应用v4.17更改
echo "[步骤2] 应用v4.17更改..."

# 找到涨停数弹窗的布局部分（第928-1036行）
# 修改: grid布局 → 纵向单列布局，table响应式
sed -i '928,1036s/grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-1.5/space-y-1.5/' src/app/page.tsx
sed -i '928,1036s/<div className="overflow-x-auto">/</' src/app/page.tsx
sed -i '928,1036s/<table className="w-full border-collapse">/<table className="w-full border-collapse table-fixed">/' src/app/page.tsx

# 修改列宽为百分比
sed -i '928,1036s/w-\[70px\]/w-[12%]/' src/app/page.tsx
sed -i '928,1036s/w-\[35px\]/w-[8%]/' src/app/page.tsx
sed -i '928,1036s/min-w-\[50px\]/w-[13%]/' src/app/page.tsx
sed -i '928,1036s/w-\[50px\]/w-[10%]/' src/app/page.tsx

# 修改容器宽度和padding
sed -i 's/min-w-\[70vw\] max-w-\[95vw\]/min-w-[85vw] max-w-[98vw]/' src/app/page.tsx
sed -i 's/p-3 border border-gray-300 shadow-sm/rounded border border-gray-300 shadow-sm p-1.5/' src/app/page.tsx

echo "✅ 代码修改完成"
echo ""

# 停止容器
echo "[步骤3] 停止Docker容器..."
docker compose down
echo ""

# 重新构建
echo "[步骤4] 重新构建镜像..."
docker compose build --no-cache
echo ""

# 启动容器
echo "[步骤5] 启动新容器..."
docker compose up -d
echo ""

# 等待启动
echo "[步骤6] 等待应用启动（15秒）..."
sleep 15
echo ""

# 检查状态
echo "[步骤7] 检查部署状态..."
docker ps | grep stock-tracker
curl -I http://localhost:3002
echo ""

echo "=========================================="
echo "v4.17 部署完成！"
echo "=========================================="
echo ""
echo "访问 http://bk.yushuo.click 验证更改"
echo "按 Ctrl+Shift+R 强制刷新浏览器缓存"
echo ""
echo "验证要点:"
echo "1. 点击涨停家数（如\"73只涨停\"）"
echo "2. 弹窗应为纵向单列布局"
echo "3. 无横向滚动条"
echo "4. 字号更小（9-10px）"
echo "5. 所有列完整显示"
echo ""
