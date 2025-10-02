#!/bin/bash

# ===================================
# Git自动部署脚本
# ===================================

set -e

SERVER="root@yushuo.click"
PASSWORD="gJ75hNHdy90TA4qGo9"
PROJECT_DIR="/www/wwwroot/stock-tracker"

echo "🚀 开始Git自动部署..."

# 使用sshpass执行远程命令
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER << 'ENDSSH'

set -e

echo "=== 进入项目目录 ==="
cd /www/wwwroot/stock-tracker || {
    echo "项目目录不存在，开始克隆..."
    mkdir -p /www/wwwroot
    cd /www/wwwroot
    # 这里需要替换为实际的Git仓库地址
    echo "❌ 错误：项目目录不存在且未配置Git仓库"
    exit 1
}

echo ""
echo "=== 检查Git状态 ==="
git status || {
    echo "❌ 不是Git仓库"
    exit 1
}

echo ""
echo "=== 拉取最新代码 ==="
git fetch --all
git reset --hard origin/main || git reset --hard origin/master

echo ""
echo "=== 检查Docker环境 ==="
docker --version
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Compose未安装"
    exit 1
fi
echo "使用: $DOCKER_COMPOSE"

echo ""
echo "=== 赋予执行权限 ==="
chmod +x deploy.sh

echo ""
echo "=== 执行部署 ==="
./deploy.sh

echo ""
echo "✅ 部署完成！"
echo "🌐 访问地址: http://yushuo.click:3002"

ENDSSH

echo ""
echo "✨ Git自动部署完成！"