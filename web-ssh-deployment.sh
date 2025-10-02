#!/bin/bash

# Stock Tracker v4.1 Docker Deployment Script
# Copy and paste this entire script into your Web SSH terminal

cd /www/wwwroot/stock-tracker

echo "=== 📦 开始部署 股票追踪系统 v4.1-docker ==="
echo ""

echo "▶ 1/10 检查当前Git状态..."
git status
echo ""

echo "▶ 2/10 拉取最新代码..."
git fetch --all
git reset --hard origin/main
git pull origin main
echo ""

echo "▶ 3/10 验证关键文件..."
ls -lh Dockerfile docker-compose.yml deploy.sh init.sql
echo ""

echo "▶ 4/10 停止旧容器（如果存在）..."
docker-compose down 2>/dev/null || echo "没有运行中的容器"
echo ""

echo "▶ 5/10 清理旧镜像和容器..."
docker system prune -f
echo ""

echo "▶ 6/10 执行Docker部署..."
chmod +x deploy.sh
./deploy.sh
echo ""

echo "▶ 7/10 等待服务启动（30秒）..."
sleep 30
echo ""

echo "▶ 8/10 检查容器状态..."
docker-compose ps
echo ""

echo "▶ 9/10 查看应用日志（最近50行）..."
docker-compose logs --tail=50 stock-tracker
echo ""

echo "▶ 10/10 测试本地访问..."
curl -I http://localhost:3002
echo ""

echo "✅ 部署完成！"
echo ""
echo "📊 部署摘要:"
echo "  - 项目路径: /www/wwwroot/stock-tracker"
echo "  - 容器状态: $(docker-compose ps --format json | jq -r '.[].State' 2>/dev/null || echo '运行中')"
echo "  - 本地端口: 3002"
echo "  - 访问地址: http://bk.yushuo.click"
echo ""
echo "🔍 后续检查:"
echo "  1. 访问 http://bk.yushuo.click 查看页面"
echo "  2. 检查数据是否正常加载"
echo "  3. 测试各项功能是否正常"