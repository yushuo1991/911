#!/bin/bash
# 快速部署v4.11修复状态列问题

echo "=========================================="
echo "🚀 快速部署v4.11版本"
echo "=========================================="

# 确保在正确目录
cd /www/wwwroot/stock-tracker

# 备份当前版本
echo "1. 备份当前版本..."
BACKUP_DIR="/www/backup/stock-tracker/pre-v4.11-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r . $BACKUP_DIR
echo "   备份到: $BACKUP_DIR"

# 拉取最新代码
echo ""
echo "2. 拉取最新代码..."
git fetch origin
git checkout main
git pull origin main

# 检查版本
echo ""
echo "3. 当前版本:"
git log --oneline -1

# 清除Docker缓存并重新构建
echo ""
echo "4. 重新构建Docker镜像..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 等待启动
echo ""
echo "5. 等待应用启动 (30秒)..."
sleep 30

# 检查容器状态
echo ""
echo "6. 容器状态:"
docker ps | grep stock-tracker

# 测试API
echo ""
echo "7. 测试API响应:"
curl -s http://localhost:3000/api/stocks | jq 'keys | .[0]' || echo "API测试失败"

echo ""
echo "=========================================="
echo "✅ 部署完成！"
echo "=========================================="
echo ""
echo "验证步骤："
echo "1. 访问 bk.yushuo.click"
echo "2. 点击任意日期的'XX只涨停'"
echo "3. 检查弹窗中'状态'列是否显示连板数（如'3板'、'首板'）"
echo "4. 确认不是显示数字（如'+6.7'、'+10.0'）"
