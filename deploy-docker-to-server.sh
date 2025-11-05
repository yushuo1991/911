#!/bin/bash

# 涨停板系统 v4.8.25 - Docker 一键部署脚本
# 用途：在服务器上快速部署 Docker 版本
# 使用：bash deploy-docker-to-server.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  涨停板系统 v4.8.25 Docker 部署${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker 未安装${NC}"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker 环境检查通过${NC}"
echo ""

# 进入项目目录
cd /www/wwwroot/stock-tracker || exit 1
echo -e "${YELLOW}[1/8] 当前目录: $(pwd)${NC}"
echo ""

# 拉取最新代码
echo -e "${YELLOW}[2/8] 拉取最新代码...${NC}"
git pull origin main
echo -e "${GREEN}✓ 代码更新完成${NC}"
echo ""

# 检查必要文件
echo -e "${YELLOW}[3/8] 检查必要文件...${NC}"
required_files=("Dockerfile" "docker-compose.yml" ".env" "init.sql")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ 缺少文件: $file${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ $file${NC}"
done
echo ""

# 停止旧容器
echo -e "${YELLOW}[4/8] 停止旧容器...${NC}"
docker compose down 2>/dev/null || true
echo -e "${GREEN}✓ 旧容器已停止${NC}"
echo ""

# 清理 Docker 资源
echo -e "${YELLOW}[5/8] 清理 Docker 资源...${NC}"
echo "清理前:"
docker system df

docker system prune -f
docker builder prune -f

echo ""
echo "清理后:"
docker system df
echo -e "${GREEN}✓ 清理完成${NC}"
echo ""

# 构建镜像（带进度显示）
echo -e "${YELLOW}[6/8] 构建 Docker 镜像...${NC}"
echo -e "${BLUE}提示: 这可能需要 3-5 分钟，请耐心等待${NC}"
echo ""

# 使用 BuildKit 加速构建
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

docker compose build --no-cache --progress=plain

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ 镜像构建成功${NC}"
else
    echo ""
    echo -e "${RED}✗ 镜像构建失败${NC}"
    echo -e "${YELLOW}建议：查看上方错误日志排查问题${NC}"
    exit 1
fi
echo ""

# 启动容器
echo -e "${YELLOW}[7/8] 启动容器...${NC}"
docker compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 容器启动成功${NC}"
else
    echo -e "${RED}✗ 容器启动失败${NC}"
    exit 1
fi
echo ""

# 等待服务就绪
echo -e "${YELLOW}[8/8] 等待服务启动...${NC}"
sleep 10

# 检查容器状态
echo ""
echo "容器状态:"
docker ps | grep stock-tracker

echo ""
echo -e "${YELLOW}应用日志:${NC}"
docker logs stock-tracker-app --tail 20

echo ""
echo -e "${YELLOW}数据库日志:${NC}"
docker logs stock-tracker-mysql --tail 10

# 健康检查
echo ""
echo -e "${YELLOW}健康检查...${NC}"
if curl -s http://localhost:3002 > /dev/null; then
    echo -e "${GREEN}✓ 应用运行正常${NC}"
else
    echo -e "${RED}⚠ 应用可能还在启动中${NC}"
    echo -e "${YELLOW}请稍后访问: https://bk.yushuo.click${NC}"
fi

# 显示完成信息
echo ""
echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "${YELLOW}访问地址:${NC}"
echo "  - 生产环境: https://bk.yushuo.click"
echo "  - 本地测试: http://localhost:3002"
echo ""
echo -e "${YELLOW}常用命令:${NC}"
echo "  - 查看日志: docker logs stock-tracker-app -f"
echo "  - 查看状态: docker ps"
echo "  - 重启服务: docker compose restart"
echo "  - 停止服务: docker compose down"
echo "  - 进入容器: docker exec -it stock-tracker-app sh"
echo ""
echo -e "${YELLOW}数据库命令:${NC}"
echo "  - 连接数据库: docker exec -it stock-tracker-mysql mysql -u stock_user -p"
echo "  - 密码: stock_password_2025"
echo ""
