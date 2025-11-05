#!/bin/bash
# 解决服务器Git冲突并部署v4.20

echo "=========================================="
echo "解决Git冲突并部署v4.20"
echo "=========================================="
echo ""

cd /www/wwwroot/stock-tracker || exit 1

# 检查当前状态
echo "[步骤1] 检查当前修改..."
git status
echo ""

# 备份本地修改
echo "[步骤2] 备份服务器本地修改..."
cp src/app/page.tsx src/app/page.tsx.server-backup-$(date +%Y%m%d-%H%M%S)
echo "✅ 备份完成"
echo ""

# 放弃本地修改，接受GitHub最新版本
echo "[步骤3] 放弃服务器本地修改，使用GitHub v4.20版本..."
git checkout -- src/app/page.tsx
echo "✅ 本地修改已重置"
echo ""

# 拉取最新代码
echo "[步骤4] 拉取v4.20代码..."
git pull origin main
echo "✅ 代码已更新到:"
git log --oneline -3
echo ""

# 停止容器
echo "[步骤5] 停止旧容器..."
docker compose down
echo ""

# 清理缓存
echo "[步骤6] 清理Docker缓存..."
docker image prune -f
echo ""

# 重新构建
echo "[步骤7] 重新构建镜像..."
docker compose build
echo ""

# 启动容器
echo "[步骤8] 启动新容器..."
docker compose up -d
echo ""

# 等待启动
echo "[步骤9] 等待应用启动（20秒）..."
sleep 20
echo ""

# 检查状态
echo "[步骤10] 检查部署状态..."
docker ps | grep stock-tracker
echo ""
curl -I http://localhost:3002
echo ""

echo "=========================================="
echo "✅ v4.20 部署完成！"
echo "=========================================="
echo ""
echo "访问 http://bk.yushuo.click 验证更改"
echo "按 Ctrl+Shift+R 强制刷新浏览器缓存"
echo ""
echo "验证要点:"
echo "  1. 点击涨停家数（如'73只涨停'）"
echo "  2. 溢价徽章更小（6px字号）"
echo "  3. 圆角更精致（2px）"
echo "  4. 整体更精致、数据密度更高"
echo ""
