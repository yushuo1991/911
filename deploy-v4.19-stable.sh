#!/bin/bash
# v4.19 稳定部署脚本 - 解决EOF错误
# 执行位置: 服务器 /www/wwwroot/stock-tracker

echo "=========================================="
echo "开始部署 v4.19（稳定方案）"
echo "=========================================="
echo ""

cd /www/wwwroot/stock-tracker || exit 1

# 步骤1: 拉取代码
echo "[步骤1] 拉取最新代码..."
git pull origin main
echo "✅ 当前版本:"
git log --oneline -1
echo ""

# 步骤2: 停止旧容器
echo "[步骤2] 停止旧容器..."
docker compose down
echo "✅ 容器已停止"
echo ""

# 步骤3: 清理旧镜像释放空间
echo "[步骤3] 清理悬空镜像..."
docker image prune -f
echo "✅ 镜像清理完成"
echo ""

# 步骤4: 分步构建（避免超时）
echo "[步骤4] 构建新镜像（增加内存限制）..."
# 使用--memory参数限制内存，避免OOM
docker compose build --no-cache --memory 2g
BUILD_STATUS=$?

if [ $BUILD_STATUS -ne 0 ]; then
  echo "❌ 构建失败，尝试备用方案..."
  echo ""

  # 备用方案：不使用--no-cache，利用缓存加速
  echo "[备用方案] 使用缓存构建..."
  docker compose build
  BUILD_STATUS=$?

  if [ $BUILD_STATUS -ne 0 ]; then
    echo "❌ 备用构建也失败，请检查服务器资源"
    exit 1
  fi
fi

echo "✅ 镜像构建完成"
echo ""

# 步骤5: 启动容器
echo "[步骤5] 启动新容器..."
docker compose up -d
echo "✅ 容器已启动"
echo ""

# 步骤6: 等待启动
echo "[步骤6] 等待应用启动（20秒）..."
sleep 20
echo ""

# 步骤7: 健康检查
echo "[步骤7] 健康检查..."
echo "容器状态:"
docker ps | grep stock-tracker
echo ""
echo "HTTP响应:"
curl -I http://localhost:3002
echo ""

# 步骤8: 显示日志（最后20行）
echo "[步骤8] 应用日志（最后20行）:"
docker compose logs --tail=20 app
echo ""

echo "=========================================="
echo "✅ v4.19 部署完成！"
echo "=========================================="
echo ""
echo "📌 访问 http://bk.yushuo.click 验证"
echo "📌 按 Ctrl+Shift+R 强制刷新浏览器"
echo ""
echo "验证要点:"
echo "  1. 点击涨停数弹窗（如'73只涨停'）"
echo "  2. 溢价色块更小（7px字号）"
echo "  3. 无横向滚动条"
echo "  4. 3-4列板块并排显示"
echo ""
