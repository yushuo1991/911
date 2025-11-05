#!/bin/bash
# 智能诊断和修复脚本 - v4.3部署问题
# 自动检测问题根因并提供针对性修复
# 生成时间: 2025-09-30

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd /www/wwwroot/stock-tracker || exit 1

echo -e "${BLUE}================================"
echo "🔍 智能诊断 - v4.3部署问题"
echo -e "================================${NC}"
echo ""

# 诊断标记
ISSUE_FOUND=0
NEED_REBUILD=0
NEED_RESTART=0
NEED_CACHE_CLEAR=0

echo -e "${YELLOW}📋 阶段1: 收集系统信息${NC}"
echo "----------------------------------------"
echo "当前Git提交: $(git log -1 --oneline)"
echo "容器状态:"
docker compose ps
echo ""

echo -e "${YELLOW}🔍 阶段2: 文件完整性检查${NC}"
echo "----------------------------------------"

# 检查服务器文件
echo "检查服务器关键文件..."
FILES_MISSING_SERVER=0
if [ ! -f "src/components/StockPremiumChart.tsx" ]; then
    echo -e "${RED}❌ 服务器缺失: StockPremiumChart.tsx${NC}"
    FILES_MISSING_SERVER=1
    ISSUE_FOUND=1
else
    echo -e "${GREEN}✅ StockPremiumChart.tsx 存在 ($(wc -l < src/components/StockPremiumChart.tsx) 行)${NC}"
fi

if [ ! -f "src/lib/chartHelpers.ts" ]; then
    echo -e "${RED}❌ 服务器缺失: chartHelpers.ts${NC}"
    FILES_MISSING_SERVER=1
    ISSUE_FOUND=1
else
    echo -e "${GREEN}✅ chartHelpers.ts 存在 ($(wc -l < src/lib/chartHelpers.ts) 行)${NC}"
fi

if ! grep -q "StockPremiumChart" src/app/page.tsx; then
    echo -e "${RED}❌ page.tsx 未引用 StockPremiumChart${NC}"
    FILES_MISSING_SERVER=1
    ISSUE_FOUND=1
else
    echo -e "${GREEN}✅ page.tsx 包含 StockPremiumChart 引用${NC}"
fi

if ! grep -q "recharts" package.json; then
    echo -e "${RED}❌ package.json 缺少 recharts 依赖${NC}"
    FILES_MISSING_SERVER=1
    ISSUE_FOUND=1
else
    echo -e "${GREEN}✅ package.json 包含 recharts${NC}"
fi
echo ""

# 如果服务器文件就缺失，需要先解决Git问题
if [ $FILES_MISSING_SERVER -eq 1 ]; then
    echo -e "${RED}⚠️ 致命错误: 服务器文件不完整！${NC}"
    echo "可能原因:"
    echo "  1. Git pull 未成功"
    echo "  2. 文件冲突未解决"
    echo "  3. 文件被意外删除"
    echo ""
    echo "建议操作:"
    echo "  git status  # 检查文件状态"
    echo "  git pull    # 重新拉取"
    echo "  git log -1  # 确认提交"
    exit 1
fi

# 检查容器内文件
echo "检查容器内文件..."
FILES_MISSING_CONTAINER=0
if ! docker compose exec -T stock-tracker test -f /app/src/components/StockPremiumChart.tsx 2>/dev/null; then
    echo -e "${RED}❌ 容器内缺失: StockPremiumChart.tsx${NC}"
    FILES_MISSING_CONTAINER=1
    NEED_REBUILD=1
    ISSUE_FOUND=1
else
    echo -e "${GREEN}✅ 容器内存在 StockPremiumChart.tsx${NC}"
fi

if ! docker compose exec -T stock-tracker test -f /app/src/lib/chartHelpers.ts 2>/dev/null; then
    echo -e "${RED}❌ 容器内缺失: chartHelpers.ts${NC}"
    FILES_MISSING_CONTAINER=1
    NEED_REBUILD=1
    ISSUE_FOUND=1
else
    echo -e "${GREEN}✅ 容器内存在 chartHelpers.ts${NC}"
fi

if ! docker compose exec -T stock-tracker grep -q "StockPremiumChart" /app/src/app/page.tsx 2>/dev/null; then
    echo -e "${RED}❌ 容器内 page.tsx 未引用 StockPremiumChart${NC}"
    FILES_MISSING_CONTAINER=1
    NEED_REBUILD=1
    ISSUE_FOUND=1
else
    echo -e "${GREEN}✅ 容器内 page.tsx 包含引用${NC}"
fi
echo ""

echo -e "${YELLOW}🔍 阶段3: MD5完整性对比${NC}"
echo "----------------------------------------"
SERVER_MD5=$(md5sum src/app/page.tsx | awk '{print $1}')
CONTAINER_MD5=$(docker compose exec -T stock-tracker md5sum /app/src/app/page.tsx 2>/dev/null | awk '{print $1}')

echo "服务器 page.tsx MD5: $SERVER_MD5"
echo "容器内 page.tsx MD5: $CONTAINER_MD5"

if [ "$SERVER_MD5" != "$CONTAINER_MD5" ]; then
    echo -e "${RED}❌ MD5不匹配 - 容器内文件与服务器不同！${NC}"
    NEED_REBUILD=1
    ISSUE_FOUND=1
else
    echo -e "${GREEN}✅ MD5匹配${NC}"
fi
echo ""

echo -e "${YELLOW}🔍 阶段4: 依赖检查${NC}"
echo "----------------------------------------"
if ! docker compose exec -T stock-tracker test -d /app/node_modules/recharts 2>/dev/null; then
    echo -e "${RED}❌ recharts 未安装${NC}"
    NEED_REBUILD=1
    ISSUE_FOUND=1
else
    echo -e "${GREEN}✅ recharts 已安装${NC}"
fi
echo ""

echo -e "${YELLOW}🔍 阶段5: 构建产物检查${NC}"
echo "----------------------------------------"
if docker compose exec -T stock-tracker test -f /app/.next/BUILD_ID 2>/dev/null; then
    BUILD_ID=$(docker compose exec -T stock-tracker cat /app/.next/BUILD_ID 2>/dev/null | tr -d '\r\n')
    echo "当前 BUILD_ID: $BUILD_ID"

    # 检查构建时间
    BUILD_TIME=$(docker compose exec -T stock-tracker stat -c %Y /app/.next 2>/dev/null)
    CURRENT_TIME=$(date +%s)
    BUILD_AGE=$((CURRENT_TIME - BUILD_TIME))

    echo "构建时间: $(docker compose exec -T stock-tracker stat -c %y /app/.next 2>/dev/null | cut -d. -f1)"
    echo "距今: $((BUILD_AGE / 60)) 分钟"

    if [ $BUILD_AGE -gt 3600 ]; then
        echo -e "${YELLOW}⚠️ 构建较旧 (超过1小时)${NC}"
        NEED_CACHE_CLEAR=1
    fi
else
    echo -e "${RED}❌ 缺少 BUILD_ID${NC}"
    NEED_REBUILD=1
    ISSUE_FOUND=1
fi
echo ""

echo -e "${YELLOW}🔍 阶段6: 运行时检查${NC}"
echo "----------------------------------------"
HTTP_CODE=$(docker compose exec -T stock-tracker curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
echo "HTTP状态码: $HTTP_CODE"

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}❌ HTTP状态异常${NC}"
    NEED_RESTART=1
    ISSUE_FOUND=1
else
    echo -e "${GREEN}✅ HTTP正常${NC}"
fi

# 检查页面内容
if docker compose exec -T stock-tracker curl -s http://localhost:3000 2>/dev/null | grep -q "StockPremiumChart"; then
    echo -e "${GREEN}✅ 页面包含新组件${NC}"
else
    echo -e "${RED}❌ 页面不包含新组件${NC}"
    NEED_REBUILD=1
    ISSUE_FOUND=1
fi

# 检查ETag
CURRENT_ETAG=$(docker compose exec -T stock-tracker curl -I http://localhost:3000 2>/dev/null | grep -i etag | awk '{print $2}' | tr -d '\r\n')
echo "当前 ETag: $CURRENT_ETAG"
echo ""

echo -e "${BLUE}================================"
echo "📊 诊断结果汇总"
echo -e "================================${NC}"
echo ""

if [ $ISSUE_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ 所有检查通过！代码已正确部署。${NC}"
    echo ""
    echo "如果浏览器仍显示旧版本，问题在于浏览器缓存："
    echo "  1. 按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac) 强制刷新"
    echo "  2. 或清除浏览器缓存"
    echo "  3. 或使用无痕模式访问"
    exit 0
fi

echo -e "${RED}⚠️ 发现 $ISSUE_FOUND 个问题${NC}"
echo ""

# 生成修复建议
echo -e "${YELLOW}🔧 推荐修复方案:${NC}"
echo "----------------------------------------"

if [ $FILES_MISSING_CONTAINER -eq 1 ] || [ "$SERVER_MD5" != "$CONTAINER_MD5" ]; then
    echo -e "${BLUE}方案 A: 完全重建 (推荐)${NC}"
    echo "  原因: 容器内文件与服务器不一致"
    echo "  操作: 删除容器、清理缓存、无缓存重建"
    echo "  时间: 3-5分钟"
    echo ""
    RECOMMENDED_FIX="A"
elif [ $NEED_REBUILD -eq 1 ]; then
    echo -e "${BLUE}方案 B: 重建容器${NC}"
    echo "  原因: 依赖或构建产物有问题"
    echo "  操作: 重新构建容器"
    echo "  时间: 2-3分钟"
    echo ""
    RECOMMENDED_FIX="B"
elif [ $NEED_RESTART -eq 1 ]; then
    echo -e "${BLUE}方案 C: 重启容器${NC}"
    echo "  原因: 运行时状态异常"
    echo "  操作: 重启容器"
    echo "  时间: 30秒"
    echo ""
    RECOMMENDED_FIX="C"
fi

echo ""
read -p "是否执行修复方案 $RECOMMENDED_FIX ? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消修复"
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 开始执行修复...${NC}"
echo ""

if [ "$RECOMMENDED_FIX" == "A" ]; then
    echo "执行完全重建..."

    # 停止容器
    echo "1/6 停止容器..."
    docker compose down

    # 清理镜像
    echo "2/6 清理旧镜像..."
    docker images | grep stock-tracker | awk '{print $3}' | xargs -r docker rmi -f || true

    # 清理缓存
    echo "3/6 清理Docker缓存..."
    docker builder prune -f

    # 清理本地构建
    echo "4/6 清理本地构建产物..."
    rm -rf .next node_modules

    # 重新构建
    echo "5/6 无缓存重新构建..."
    docker compose build --no-cache --pull

    # 启动
    echo "6/6 启动容器..."
    docker compose up -d

    echo "等待容器启动..."
    sleep 10

elif [ "$RECOMMENDED_FIX" == "B" ]; then
    echo "执行重建容器..."
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    sleep 5

elif [ "$RECOMMENDED_FIX" == "C" ]; then
    echo "执行重启容器..."
    docker compose restart
    sleep 3
fi

echo ""
echo -e "${GREEN}✅ 修复完成！${NC}"
echo ""

# 验证修复
echo -e "${YELLOW}🔍 验证修复结果...${NC}"
echo "----------------------------------------"
sleep 2

HTTP_CODE=$(docker compose exec -T stock-tracker curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
echo "HTTP状态码: $HTTP_CODE"

if docker compose exec -T stock-tracker curl -s http://localhost:3000 2>/dev/null | grep -q "StockPremiumChart"; then
    echo -e "${GREEN}✅ 页面包含新组件${NC}"
else
    echo -e "${RED}❌ 页面仍不包含新组件${NC}"
fi

NEW_ETAG=$(docker compose exec -T stock-tracker curl -I http://localhost:3000 2>/dev/null | grep -i etag | awk '{print $2}' | tr -d '\r\n')
echo "新 ETag: $NEW_ETAG"
echo "旧 ETag: $CURRENT_ETAG"

if [ "$NEW_ETAG" != "$CURRENT_ETAG" ]; then
    echo -e "${GREEN}✅ ETag已更新${NC}"
else
    echo -e "${YELLOW}⚠️ ETag未变化${NC}"
fi

echo ""
echo -e "${BLUE}================================"
echo "✅ 修复流程完成"
echo -e "================================${NC}"
echo ""
echo "🌐 下一步操作:"
echo "  1. 访问 https://yushuo.click/stock"
echo "  2. 按 Ctrl+Shift+R 强制刷新浏览器"
echo "  3. 验证新功能是否显示"
echo ""
echo "如果问题仍存在，查看日志:"
echo "  docker compose logs -f stock-tracker"
echo ""