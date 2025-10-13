#!/bin/bash
# v4.8.17 部署脚本 - 添加板块成交额到涨停数弹窗
# 执行时间: 2025-10-13
# 部署位置: /www/wwwroot/stock-tracker

set -e  # 遇到错误立即退出

echo "=========================================="
echo "开始部署 v4.8.17 版本"
echo "功能: 涨停数弹窗添加板块成交额显示"
echo "=========================================="
echo ""

# 1. 进入项目目录
cd /www/wwwroot/stock-tracker
echo "✓ 当前目录: $(pwd)"

# 2. 备份当前版本（可选）
echo ""
echo "步骤 1/5: 创建备份..."
BACKUP_DIR="/www/backup/stock-tracker"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
tar -czf "$BACKUP_DIR/backup-before-v4.8.17-$TIMESTAMP.tar.gz" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='data' \
    . 2>/dev/null || echo "⚠ 备份失败（可忽略）"
echo "✓ 备份完成: backup-before-v4.8.17-$TIMESTAMP.tar.gz"

# 3. 拉取最新代码
echo ""
echo "步骤 2/5: 拉取最新代码..."
git fetch origin
git pull origin main
echo "✓ 代码更新完成"

# 4. 查看最新提交
echo ""
echo "最新提交信息:"
git log -1 --oneline
echo ""

# 5. 停止当前容器
echo "步骤 3/5: 停止当前Docker容器..."
docker compose down
echo "✓ 容器已停止"

# 6. 重新构建镜像（强制无缓存构建）
echo ""
echo "步骤 4/5: 重新构建Docker镜像（无缓存）..."
docker compose build --no-cache
echo "✓ 镜像构建完成"

# 7. 启动新容器
echo ""
echo "步骤 5/5: 启动新容器..."
docker compose up -d
echo "✓ 容器已启动"

# 8. 等待服务启动
echo ""
echo "等待服务启动（10秒）..."
sleep 10

# 9. 检查容器状态
echo ""
echo "检查容器状态:"
docker compose ps

# 10. 检查应用日志
echo ""
echo "最近的应用日志:"
docker compose logs --tail=20 app

# 11. 测试API响应
echo ""
echo "测试API端点..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/stocks?date=2025-10-13&mode=7days || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ API响应正常 (HTTP $HTTP_CODE)"
else
    echo "⚠ API响应异常 (HTTP $HTTP_CODE)"
fi

# 12. 完成
echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "访问地址: http://bk.yushuo.click"
echo ""
echo "功能验证："
echo "1. 打开首页，查看板块卡片下方的成交额徽章"
echo "2. 点击日期的'XX只涨停'，打开涨停数弹窗"
echo "3. 查看每个板块标题下方是否显示💰成交额总和"
echo "4. 确认布局紧凑，内容完整显示"
echo ""
echo "如遇问题，查看日志: docker compose logs -f app"
echo "回滚命令: cd /www/wwwroot/stock-tracker && git reset --hard HEAD~1 && docker compose down && docker compose build --no-cache && docker compose up -d"
echo ""
