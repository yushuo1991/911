#!/bin/bash

# ===================================
# 股票追踪系统 - Docker部署脚本
# ===================================

set -e

echo "🚀 开始部署股票追踪系统到Docker..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker未安装，请先安装Docker${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose未安装${NC}"
    exit 1
fi

# 获取Docker Compose命令
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo -e "${GREEN}✅ Docker环境检查通过${NC}"

# 停止并删除旧容器
echo "🛑 停止旧容器..."
$DOCKER_COMPOSE down

# 构建新镜像
echo "🔨 构建Docker镜像..."
$DOCKER_COMPOSE build --no-cache

# 启动容器
echo "▶️  启动容器..."
$DOCKER_COMPOSE up -d

# 等待服务启动
echo "⏳ 等待服务启动（30秒）..."
sleep 30

# 检查容器状态
echo "📊 检查容器状态..."
$DOCKER_COMPOSE ps

# 检查应用健康状态
echo "🏥 检查应用健康状态..."
if curl -f http://localhost:3002 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 应用部署成功！${NC}"
    echo -e "${GREEN}🌐 访问地址: http://localhost:3002${NC}"
else
    echo -e "${YELLOW}⚠️  应用可能还在启动中${NC}"
    echo "📋 查看日志: $DOCKER_COMPOSE logs -f stock-tracker"
fi

echo ""
echo "📝 常用命令:"
echo "  查看日志: $DOCKER_COMPOSE logs -f"
echo "  停止服务: $DOCKER_COMPOSE stop"
echo "  启动服务: $DOCKER_COMPOSE start"
echo "  重启服务: $DOCKER_COMPOSE restart"

echo ""
echo -e "${GREEN}✨ 部署完成！${NC}"
