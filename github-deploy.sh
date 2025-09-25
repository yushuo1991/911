#!/bin/bash
# GitHub自动克隆部署脚本
# 适用于宝塔面板Docker部署

echo "=== GitHub自动克隆部署 Stock Tracker ==="
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"

# 配置变量
REPO_URL="https://github.com/your-username/stock-tracker.git"  # 请替换为你的实际仓库地址
DEPLOY_PATH="/www/wwwroot/stock-tracker"
BRANCH="main"
CONTAINER_NAME="stock-tracker-app"
IMAGE_NAME="stock-tracker:latest"

# 创建日志目录
mkdir -p ${DEPLOY_PATH}/log

# 记录部署开始
echo "$(date '+%Y-%m-%d %H:%M:%S') - 开始GitHub部署" >> ${DEPLOY_PATH}/log/deploy.log

# 步骤1: 检查Git是否安装
echo "步骤1: 检查Git环境..."
if ! command -v git &> /dev/null; then
    echo "❌ Git未安装，正在安装..."
    yum install -y git || apt-get update && apt-get install -y git
fi
echo "✅ Git环境正常"

# 步骤2: 备份当前版本
echo "步骤2: 备份当前版本..."
if [ -d "${DEPLOY_PATH}" ]; then
    BACKUP_DIR="${DEPLOY_PATH}_backup_$(date +%Y%m%d_%H%M%S)"
    echo "备份到: ${BACKUP_DIR}"
    cp -r ${DEPLOY_PATH} ${BACKUP_DIR}
    echo "✅ 备份完成"
fi

# 步骤3: 停止当前容器
echo "步骤3: 停止当前Docker容器..."
docker stop ${CONTAINER_NAME} 2>/dev/null || echo "容器未运行"
docker rm ${CONTAINER_NAME} 2>/dev/null || echo "容器不存在"
echo "✅ 容器已清理"

# 步骤4: 克隆最新代码
echo "步骤4: 从GitHub克隆最新代码..."
if [ -d "${DEPLOY_PATH}/.git" ]; then
    echo "更新现有仓库..."
    cd ${DEPLOY_PATH}
    git fetch origin
    git reset --hard origin/${BRANCH}
    git pull origin ${BRANCH}
else
    echo "克隆新仓库..."
    rm -rf ${DEPLOY_PATH}
    git clone -b ${BRANCH} ${REPO_URL} ${DEPLOY_PATH}
fi

if [ $? -eq 0 ]; then
    echo "✅ 代码克隆/更新成功"
    cd ${DEPLOY_PATH}
    echo "当前版本: $(git log --oneline -1)"
else
    echo "❌ 代码克隆/更新失败"
    exit 1
fi

# 步骤5: 构建Docker镜像
echo "步骤5: 构建Docker镜像..."
cd ${DEPLOY_PATH}
docker build -t ${IMAGE_NAME} . 2>&1 | tee log/docker-build-$(date +%Y%m%d_%H%M%S).log

if [ $? -eq 0 ]; then
    echo "✅ Docker镜像构建成功"
else
    echo "❌ Docker镜像构建失败"
    exit 1
fi

# 步骤6: 设置数据目录权限
echo "步骤6: 设置数据目录权限..."
mkdir -p ${DEPLOY_PATH}/data
chmod 755 ${DEPLOY_PATH}/data
chown -R 1001:1001 ${DEPLOY_PATH}/data
echo "✅ 数据目录权限设置完成"

# 步骤7: 启动新容器
echo "步骤7: 启动新Docker容器..."
docker run -d \
  --name ${CONTAINER_NAME} \
  --restart always \
  -p 3000:3000 \
  -v ${DEPLOY_PATH}/data:/app/data \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e HOSTNAME=0.0.0.0 \
  -e TUSHARE_TOKEN=2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211 \
  -e NEXT_PUBLIC_API_URL=http://bk.yushuo.click \
  -e NEXT_PUBLIC_API_BASE_URL=http://bk.yushuo.click/api \
  -e NEXTAUTH_SECRET=stock-tracker-secret-key-2024 \
  -e NEXTAUTH_URL=http://bk.yushuo.click \
  ${IMAGE_NAME}

if [ $? -eq 0 ]; then
    echo "✅ 容器启动成功"
else
    echo "❌ 容器启动失败"
    docker logs ${CONTAINER_NAME}
    exit 1
fi

# 步骤8: 等待服务启动并测试
echo "步骤8: 等待服务启动..."
sleep 15

for i in {1..30}; do
    if curl -s -f http://127.0.0.1:3000 >/dev/null 2>&1; then
        echo "✅ 服务启动成功"
        break
    fi
    echo "等待服务启动... ($i/30)"
    sleep 2
done

# 步骤9: 测试API接口
echo "步骤9: 测试API接口..."
curl -I http://127.0.0.1:3000/api/stocks 2>&1 | tee log/api-test-$(date +%Y%m%d_%H%M%S).log

# 步骤10: 重载Nginx
echo "步骤10: 重载Nginx配置..."
nginx -t && nginx -s reload
echo "✅ Nginx配置已重载"

# 记录部署完成
echo "$(date '+%Y-%m-%d %H:%M:%S') - GitHub部署完成" >> ${DEPLOY_PATH}/log/deploy.log

echo ""
echo "=== 部署完成 ==="
echo "📱 访问地址: http://bk.yushuo.click"
echo "🔗 API测试: http://bk.yushuo.click/api/stocks"
echo "📊 容器状态:"
docker ps | grep ${CONTAINER_NAME}
echo ""
echo "📝 部署日志已保存到: ${DEPLOY_PATH}/log/"