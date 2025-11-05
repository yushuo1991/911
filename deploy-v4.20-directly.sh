#!/bin/bash
# v4.20 直接服务器部署脚本（无需GitHub）
# 用途: 直接在服务器上应用v4.20超精细化改动
# 执行位置: 服务器 /www/wwwroot/stock-tracker

echo "=========================================="
echo "开始直接部署 v4.20 超精细化优化"
echo "=========================================="
echo ""

cd /www/wwwroot/stock-tracker || exit 1

# 备份当前文件
echo "[步骤1] 备份当前page.tsx..."
cp src/app/page.tsx src/app/page.tsx.backup-$(date +%Y%m%d-%H%M%S)
echo "✅ 备份完成"
echo ""

# 应用v4.20更改
echo "[步骤2] 应用v4.20超精细化更改..."

# 找到涨停数弹窗表格部分（第968-1031行）
# 修改1: 表头字号 7px → 6px，垂直padding py-0.5 → py-[2px]
sed -i '972,982s/text-\[7px\]/text-[6px]/g' src/app/page.tsx
sed -i '972,982s/py-0\.5/py-[2px]/g' src/app/page.tsx

# 修改2: 股票名称字号 7px → 6px
sed -i '997s/text-\[7px\]/text-[6px]/' src/app/page.tsx

# 修改3: 状态徽章 - 7px→6px, px-1→px-[3px], rounded→rounded-sm, 添加leading-none
sed -i '1005s/px-1 py-0\.5 rounded text-\[7px\] font-bold/px-[3px] rounded-sm text-[6px] font-bold leading-none/' src/app/page.tsx

# 修改4: 溢价值徽章 - 7px→6px, px-0.5→px-[2px], rounded→rounded-sm, 添加leading-none
sed -i '1017s/px-0\.5 rounded text-\[7px\] font-medium/px-[2px] rounded-sm text-[6px] font-medium leading-none/' src/app/page.tsx

# 修改5: 累计溢价徽章 - 同上
sed -i '1024s/px-0\.5 rounded text-\[7px\] font-bold/px-[2px] rounded-sm text-[6px] font-bold leading-none/' src/app/page.tsx

echo "✅ 代码修改完成"
echo ""

# 验证修改
echo "[步骤3] 验证修改..."
echo "检查关键改动:"
grep -n "text-\[6px\]" src/app/page.tsx | head -5
grep -n "leading-none" src/app/page.tsx | head -3
echo ""

# 停止容器
echo "[步骤4] 停止Docker容器..."
docker compose down
echo ""

# 重新构建（使用缓存，避免EOF错误）
echo "[步骤5] 重新构建镜像（使用缓存）..."
docker compose build
echo ""

# 启动容器
echo "[步骤6] 启动新容器..."
docker compose up -d
echo ""

# 等待启动
echo "[步骤7] 等待应用启动（20秒）..."
sleep 20
echo ""

# 检查状态
echo "[步骤8] 检查部署状态..."
docker ps | grep stock-tracker
curl -I http://localhost:3002
echo ""

echo "=========================================="
echo "✅ v4.20 超精细化部署完成！"
echo "=========================================="
echo ""
echo "访问 http://bk.yushuo.click 验证更改"
echo "按 Ctrl+Shift+R 强制刷新浏览器缓存"
echo ""
echo "验证要点:"
echo "  1. 点击涨停家数（如'73只涨停'）"
echo "  2. 溢价徽章更小（6px字号，更紧凑padding）"
echo "  3. 圆角更精致（2px圆角）"
echo "  4. 整体更精致、数据密度更高"
echo "  5. 3-4列网格布局保持不变"
echo "  6. 无横向滚动条"
echo ""
echo "详细改动:"
echo "  - 字号: 7px → 6px (全部元素)"
echo "  - 表头垂直padding: py-0.5 → py-[2px]"
echo "  - 状态徽章: px-1 → px-[3px]"
echo "  - 溢价徽章: px-0.5 → px-[2px]"
echo "  - 圆角: rounded(4px) → rounded-sm(2px)"
echo "  - 行高: 添加leading-none"
echo ""
