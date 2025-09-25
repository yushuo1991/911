#!/bin/bash
# Docker容器修复脚本 - 502错误自动修复
# 适用于宝塔面板Docker部署

echo "=== Stock Tracker Docker 修复脚本 ==="
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"

# 创建日志目录
mkdir -p /www/wwwroot/stock-tracker/log

# 修复步骤1: 停止并清理旧容器
echo "步骤1: 清理旧容器..."
docker stop stock-tracker-app 2>/dev/null
docker rm stock-tracker-app 2>/dev/null
echo "✅ 旧容器已清理"

# 修复步骤2: 重新构建Docker镜像
echo "步骤2: 重新构建Docker镜像..."
cd /www/wwwroot/stock-tracker
docker build -t stock-tracker:latest . 2>&1 | tee log/docker-build.log
if [ $? -eq 0 ]; then
    echo "✅ Docker镜像构建成功"
else
    echo "❌ Docker镜像构建失败，请检查日志: log/docker-build.log"
    exit 1
fi

# 修复步骤3: 确保数据目录权限正确
echo "步骤3: 设置数据目录权限..."
mkdir -p /www/wwwroot/stock-tracker/data
chmod 755 /www/wwwroot/stock-tracker/data
chown -R 1001:1001 /www/wwwroot/stock-tracker/data
echo "✅ 数据目录权限已设置"

# 修复步骤4: 启动新容器（使用正确的配置）
echo "步骤4: 启动新容器..."
docker run -d \
  --name stock-tracker-app \
  --restart always \
  -p 3000:3000 \
  -v /www/wwwroot/stock-tracker/data:/app/data \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e HOSTNAME=0.0.0.0 \
  -e TUSHARE_TOKEN=2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211 \
  -e NEXT_PUBLIC_API_URL=http://bk.yushuo.click \
  -e NEXT_PUBLIC_API_BASE_URL=http://bk.yushuo.click/api \
  -e NEXTAUTH_SECRET=stock-tracker-secret-key-2024 \
  -e NEXTAUTH_URL=http://bk.yushuo.click \
  stock-tracker:latest

if [ $? -eq 0 ]; then
    echo "✅ 容器启动成功"
else
    echo "❌ 容器启动失败"
    exit 1
fi

# 修复步骤5: 等待应用启动
echo "步骤5: 等待应用启动..."
sleep 10

# 修复步骤6: 检查容器状态
echo "步骤6: 检查容器状态..."
docker ps | grep stock-tracker-app
if [ $? -eq 0 ]; then
    echo "✅ 容器运行中"
else
    echo "❌ 容器未运行"
    docker logs stock-tracker-app
    exit 1
fi

# 修复步骤7: 测试应用连通性
echo "步骤7: 测试应用连通性..."
for i in {1..30}; do
    if curl -s -f http://127.0.0.1:3000 >/dev/null 2>&1; then
        echo "✅ 应用连接成功"
        break
    fi
    echo "等待应用启动... ($i/30)"
    sleep 2
done

# 修复步骤8: 测试API接口
echo "步骤8: 测试API接口..."
curl -I http://127.0.0.1:3000/api/stocks 2>&1 | tee log/api-test.log

# 修复步骤9: 重载Nginx配置
echo "步骤9: 重载Nginx配置..."
nginx -t && nginx -s reload
echo "✅ Nginx配置已重载"

# 修复步骤10: 最终测试
echo "步骤10: 最终连接测试..."
echo "直接访问测试:"
curl -I http://107.173.154.147:3000
echo ""
echo "域名访问测试:"
curl -I http://bk.yushuo.click
echo ""

echo "=== 修复完成 ==="
echo "容器状态:"
docker ps | grep stock-tracker-app
echo ""
echo "端口监听:"
netstat -tlnp | grep :3000
echo ""
echo "请在浏览器访问: http://bk.yushuo.click"
echo "API测试地址: http://bk.yushuo.click/api/stocks"