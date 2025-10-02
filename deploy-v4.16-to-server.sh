#!/bin/bash
# v4.16服务器部署脚本
# 用途: 将v4.14、v4.15、v4.16部署到生产服务器
# 执行位置: 服务器 /www/wwwroot/stock-tracker
# 执行时间: 2025-10-03

echo "=========================================="
echo "开始部署 v4.16 到生产服务器"
echo "=========================================="
echo ""

# 1. 检查当前Git状态
echo "[步骤1] 检查当前Git版本..."
cd /www/wwwroot/stock-tracker || exit 1
CURRENT_COMMIT=$(git log --oneline -1 | cut -d' ' -f1)
echo "当前版本: $CURRENT_COMMIT"
echo ""

# 2. 拉取最新代码
echo "[步骤2] 从GitHub拉取最新代码..."
git fetch origin main
git pull origin main

# 检查是否成功拉取
if [ $? -eq 0 ]; then
    echo "✅ Git拉取成功"
    NEW_COMMIT=$(git log --oneline -1 | cut -d' ' -f1)
    echo "新版本: $NEW_COMMIT"

    # 显示更新的提交历史
    echo ""
    echo "新增的提交:"
    git log --oneline $CURRENT_COMMIT..$NEW_COMMIT
else
    echo "❌ Git拉取失败"
    exit 1
fi
echo ""

# 3. 验证关键代码是否存在
echo "[步骤3] 验证v4.16代码是否存在..."
if grep -q "min-w-\[70vw\]" src/app/page.tsx; then
    echo "✅ 找到v4.16代码标识 (min-w-[70vw])"
else
    echo "⚠️  未找到v4.16代码，但继续执行构建"
fi

if grep -q "get7TradingDaysFromCalendar" src/app/api/stocks/route.ts; then
    echo "✅ 找到v4.14代码标识 (Tushare交易日历)"
else
    echo "⚠️  未找到v4.14代码"
fi
echo ""

# 4. 停止现有容器
echo "[步骤4] 停止现有Docker容器..."
docker compose down
echo ""

# 5. 清理旧镜像（可选但推荐）
echo "[步骤5] 清理旧Docker镜像..."
OLD_IMAGE_ID=$(docker images stock-tracker-app -q)
if [ -n "$OLD_IMAGE_ID" ]; then
    echo "旧镜像ID: $OLD_IMAGE_ID"
    docker rmi $OLD_IMAGE_ID || echo "旧镜像仍在使用或已被清理"
fi
echo ""

# 6. 重新构建镜像（无缓存）
echo "[步骤6] 重新构建Docker镜像（无缓存）..."
docker compose build --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Docker镜像构建成功"
    NEW_IMAGE_ID=$(docker images stock-tracker-app -q | head -1)
    echo "新镜像ID: $NEW_IMAGE_ID"
else
    echo "❌ Docker镜像构建失败"
    exit 1
fi
echo ""

# 7. 启动新容器
echo "[步骤7] 启动新Docker容器..."
docker compose up -d

if [ $? -eq 0 ]; then
    echo "✅ Docker容器启动成功"
else
    echo "❌ Docker容器启动失败"
    exit 1
fi
echo ""

# 8. 等待容器就绪
echo "[步骤8] 等待应用启动（15秒）..."
sleep 15
echo ""

# 9. 检查容器状态
echo "[步骤9] 检查容器运行状态..."
docker ps | grep stock-tracker
echo ""

# 10. 验证容器内代码版本
echo "[步骤10] 验证容器内代码版本..."
CONTAINER_COMMIT=$(docker exec stock-tracker-app git log --oneline -1 2>/dev/null | cut -d' ' -f1)
if [ -n "$CONTAINER_COMMIT" ]; then
    echo "容器内Git版本: $CONTAINER_COMMIT"
    if [ "$CONTAINER_COMMIT" = "$NEW_COMMIT" ]; then
        echo "✅ 容器内代码版本正确"
    else
        echo "⚠️  容器内代码版本可能不匹配"
    fi
else
    echo "⚠️  无法获取容器内Git版本（容器内可能没有.git目录，这是正常的）"
fi
echo ""

# 11. 检查应用健康状态
echo "[步骤11] 检查应用健康状态..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 应用HTTP响应正常 (200 OK)"
else
    echo "⚠️  应用HTTP响应异常 (HTTP $HTTP_CODE)"
fi
echo ""

# 12. 查看最近日志
echo "[步骤12] 查看应用最近日志..."
docker compose logs --tail=20 app
echo ""

# 13. 部署摘要
echo "=========================================="
echo "部署完成摘要"
echo "=========================================="
echo "原始版本: $CURRENT_COMMIT"
echo "新版本:   $NEW_COMMIT"
echo "镜像ID:   $NEW_IMAGE_ID"
echo "HTTP状态: $HTTP_CODE"
echo ""
echo "访问地址: http://bk.yushuo.click"
echo ""
echo "验证步骤:"
echo "1. 访问 http://bk.yushuo.click"
echo "2. 按 Ctrl+Shift+R 强制刷新清除浏览器缓存"
echo "3. 点击任意日期的涨停家数（如\"8只涨停\"）"
echo "4. 检查弹窗布局:"
echo "   - 容器宽度约70%（不是60%）"
echo "   - 板块卡片3列显示（不是4列）"
echo "   - 表格列宽更宽（名称90px、状态60px、日期70px）"
echo "   - 字体更大（12px）"
echo "   - 蓝色渐变表头"
echo ""
echo "如果仍未生效，请执行:"
echo "docker exec stock-tracker-app cat src/app/page.tsx | grep 'min-w-\[70vw\]'"
echo "=========================================="
