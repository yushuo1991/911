#!/bin/bash
# K线功能部署修复脚本 - v4.8.11
# 用途: 解决K线功能不显示的问题（重新构建Docker镜像）
# 日期: 2025-10-12

set -e  # 遇到错误立即退出

echo "========================================"
echo "K线功能部署修复脚本 - v4.8.11"
echo "========================================"
echo ""

# 步骤1: 进入项目目录
echo "[1/10] 进入项目目录..."
cd /www/wwwroot/stock-tracker || { echo "❌ 项目目录不存在"; exit 1; }
echo "✅ 当前目录: $(pwd)"
echo ""

# 步骤2: 拉取最新代码
echo "[2/10] 拉取最新代码..."
git fetch origin
git pull origin main
echo "✅ 代码已更新"
echo ""

# 步骤3: 验证代码版本
echo "[3/10] 验证代码版本..."
CURRENT_COMMIT=$(git log -1 --format="%h %s")
echo "当前commit: $CURRENT_COMMIT"
if [[ "$CURRENT_COMMIT" == *"v4.8.11"* ]] || [[ "$CURRENT_COMMIT" == *"05f6263"* ]]; then
    echo "✅ 代码版本正确 (v4.8.11)"
else
    echo "⚠️  警告: 当前commit可能不是v4.8.11"
    echo "继续部署..."
fi
echo ""

# 步骤4: 备份当前镜像（可选）
echo "[4/10] 备份当前Docker镜像..."
docker tag stock-tracker-app:latest stock-tracker-app:backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo "ℹ️  无需备份（镜像不存在）"
echo "✅ 镜像已备份"
echo ""

# 步骤5: 停止当前容器
echo "[5/10] 停止当前容器..."
docker compose down
echo "✅ 容器已停止"
echo ""

# 步骤6: 清理悬空镜像（可选，释放空间）
echo "[6/10] 清理悬空镜像..."
docker image prune -f || echo "ℹ️  无悬空镜像需要清理"
echo ""

# 步骤7: 重新构建（无缓存）⭐ 关键步骤
echo "[7/10] 重新构建Docker镜像（无缓存）..."
echo "⚠️  这一步可能需要3-5分钟，请耐心等待..."
docker compose build --no-cache
echo "✅ 镜像构建完成"
echo ""

# 步骤8: 启动新容器
echo "[8/10] 启动新容器..."
docker compose up -d
echo "✅ 容器已启动"
echo ""

# 步骤9: 等待服务启动
echo "[9/10] 等待服务启动（30秒）..."
sleep 30
echo "✅ 服务已启动"
echo ""

# 步骤10: 验证部署
echo "[10/10] 验证部署..."
echo ""

echo "---------- 容器状态 ----------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep stock-tracker || echo "❌ 容器未运行"
echo ""

echo "---------- 镜像信息 ----------"
docker images | grep stock-tracker | head -3
echo ""

echo "---------- 应用日志（最后20行）----------"
docker logs --tail 20 stock-tracker-app 2>&1
echo ""

echo "---------- API测试 ----------"
API_TEST=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3002/api/stocks?date=$(date +%Y-%m-%d)&mode=7days")
if [ "$API_TEST" = "200" ]; then
    echo "✅ API响应正常 (HTTP $API_TEST)"
else
    echo "⚠️  API响应异常 (HTTP $API_TEST)"
fi
echo ""

echo "========================================"
echo "部署完成！"
echo "========================================"
echo ""
echo "🎉 K线功能修复部署完成！"
echo ""
echo "📋 下一步操作:"
echo "1. 访问 http://bk.yushuo.click"
echo "2. 强制刷新浏览器: Ctrl+Shift+R (Windows/Linux) 或 Cmd+Shift+R (Mac)"
echo "3. 点击任意板块名称"
echo "4. 在弹窗右上角应该看到\"显示K线\"按钮"
echo "5. 点击按钮验证K线图显示功能"
echo ""
echo "📄 详细诊断报告: K-LINE-DIAGNOSTIC-REPORT.md"
echo ""
echo "❓ 如果问题仍然存在:"
echo "- 检查浏览器缓存是否已清除"
echo "- 打开浏览器开发者工具(F12)查看Console错误"
echo "- 查看完整应用日志: docker logs -f stock-tracker-app"
echo ""
