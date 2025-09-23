#!/bin/bash

# 宝塔面板Docker部署脚本
# 适用于股票追踪系统在宝塔面板中的Docker容器部署

set -e

echo "🚀 开始宝塔面板Docker部署 - 股票追踪系统"

# 配置变量
CONTAINER_NAME="stock-tracker-app"
IMAGE_NAME="stock-tracker"
PORT="3000"

# 1. 停止并删除现有容器
echo "📦 停止并删除现有容器..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# 2. 删除旧镜像
echo "🗑️ 清理旧镜像..."
docker rmi $IMAGE_NAME 2>/dev/null || true

# 3. 构建新镜像
echo "🔨 构建Docker镜像..."
docker build -t $IMAGE_NAME .

# 4. 运行新容器
echo "🚀 启动新容器..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $PORT:3000 \
  -v $(pwd)/log:/app/log \
  -e NODE_ENV=production \
  -e TZ=Asia/Shanghai \
  $IMAGE_NAME

# 5. 等待容器启动
echo "⏳ 等待应用启动..."
sleep 10

# 6. 检查容器状态
if docker ps | grep -q $CONTAINER_NAME; then
    echo "✅ 部署成功!"
    echo "📍 应用访问地址: http://localhost:$PORT"
    echo "📊 容器状态:"
    docker ps | grep $CONTAINER_NAME
    echo ""
    echo "📝 查看日志: docker logs $CONTAINER_NAME"
    echo "🔄 重启容器: docker restart $CONTAINER_NAME"
    echo "🛑 停止容器: docker stop $CONTAINER_NAME"
else
    echo "❌ 部署失败，请检查日志:"
    docker logs $CONTAINER_NAME
    exit 1
fi

echo ""
echo "🎉 宝塔面板Docker部署完成!"