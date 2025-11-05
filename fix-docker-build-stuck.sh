#!/bin/bash

# 涨停板系统 - Docker 构建卡住修复脚本
# 用途：解决 Docker 构建过程中卡住的问题
# 使用：bash fix-docker-build-stuck.sh

set -e

echo "========================================"
echo "  Docker 构建修复脚本"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 步骤 1：检查系统资源
echo -e "${YELLOW}[1/6] 检查系统资源...${NC}"
echo "内存使用："
free -h
echo ""
echo "磁盘使用："
df -h /
echo ""
echo "Docker 磁盘使用："
docker system df
echo ""

# 步骤 2：停止所有容器
echo -e "${YELLOW}[2/6] 停止所有相关容器...${NC}"
docker compose down 2>/dev/null || true
docker stop $(docker ps -q) 2>/dev/null || true
echo -e "${GREEN}✓ 容器已停止${NC}"
echo ""

# 步骤 3：清理 Docker 资源
echo -e "${YELLOW}[3/6] 清理 Docker 资源...${NC}"
echo "清理前磁盘占用："
docker system df

echo ""
echo "执行清理..."
docker system prune -a -f
docker builder prune -a -f
docker volume prune -f

echo ""
echo "清理后磁盘占用："
docker system df
echo -e "${GREEN}✓ 清理完成${NC}"
echo ""

# 步骤 4：检查 Dockerfile 和配置
echo -e "${YELLOW}[4/6] 检查配置文件...${NC}"
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}✗ Dockerfile 不存在${NC}"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}✗ docker-compose.yml 不存在${NC}"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env 文件不存在，请确保环境变量已配置${NC}"
fi

echo -e "${GREEN}✓ 配置文件检查完成${NC}"
echo ""

# 步骤 5：优化构建（提供选择）
echo -e "${YELLOW}[5/6] 选择构建方式：${NC}"
echo "1) 优化构建（限制资源，推荐）"
echo "2) 标准构建（可能较慢）"
echo "3) 跳过构建，使用 PM2 直接运行"
echo ""
read -p "请选择 [1-3]: " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}使用优化构建模式...${NC}"

        # 创建临时 docker-compose 配置
        cat > docker-compose.build.yml <<EOF
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      shm_size: 2gb
      args:
        - BUILDKIT_INLINE_CACHE=1
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
    extends:
      file: docker-compose.yml
      service: app
EOF

        echo "开始构建（限制内存 2GB，CPU 2核）..."
        docker compose -f docker-compose.yml -f docker-compose.build.yml build --no-cache

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ 构建成功${NC}"
            rm -f docker-compose.build.yml
        else
            echo -e "${RED}✗ 构建失败${NC}"
            rm -f docker-compose.build.yml
            exit 1
        fi
        ;;

    2)
        echo ""
        echo -e "${YELLOW}使用标准构建模式...${NC}"
        docker compose build --no-cache

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ 构建成功${NC}"
        else
            echo -e "${RED}✗ 构建失败${NC}"
            exit 1
        fi
        ;;

    3)
        echo ""
        echo -e "${YELLOW}跳过 Docker 构建，使用 PM2 运行...${NC}"

        # 检查 Node.js
        if ! command -v node &> /dev/null; then
            echo -e "${RED}✗ Node.js 未安装${NC}"
            exit 1
        fi

        # 检查 PM2
        if ! command -v pm2 &> /dev/null; then
            echo "安装 PM2..."
            npm install -g pm2
        fi

        # 安装依赖
        echo "安装依赖..."
        npm ci --production

        # 构建应用
        echo "构建应用..."
        npm run build

        # 停止旧进程
        pm2 stop stock-tracker 2>/dev/null || true
        pm2 delete stock-tracker 2>/dev/null || true

        # 启动应用
        echo "启动应用..."
        pm2 start npm --name stock-tracker -- start
        pm2 save

        echo -e "${GREEN}✓ 应用已启动${NC}"
        echo ""
        pm2 list

        exit 0
        ;;

    *)
        echo -e "${RED}无效选择${NC}"
        exit 1
        ;;
esac

# 步骤 6：启动服务
echo ""
echo -e "${YELLOW}[6/6] 启动服务...${NC}"
docker compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 服务启动成功${NC}"
else
    echo -e "${RED}✗ 服务启动失败${NC}"
    exit 1
fi

# 等待服务启动
echo ""
echo "等待服务启动..."
sleep 5

# 检查容器状态
echo ""
echo "容器状态："
docker ps

# 检查应用健康
echo ""
echo "检查应用健康状态..."
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ 应用运行正常${NC}"
else
    echo -e "${YELLOW}⚠ 应用可能还在启动中，请稍后检查${NC}"
    echo "查看日志："
    echo "  docker logs stock-tracker -f"
fi

echo ""
echo "========================================"
echo -e "${GREEN}  修复完成！${NC}"
echo "========================================"
echo ""
echo "后续操作："
echo "  - 查看日志: docker logs stock-tracker -f"
echo "  - 查看状态: docker ps"
echo "  - 重启服务: docker compose restart"
echo "  - 访问应用: https://bk.yushuo.click"
echo ""
