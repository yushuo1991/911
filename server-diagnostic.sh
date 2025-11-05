#!/bin/bash
# 服务器部署诊断脚本 v4.8.25
# 用于排查弹窗趋势图功能未生效的原因

echo "========================================="
echo "股票追踪系统 v4.8.25 部署诊断"
echo "========================================="
echo ""

# 1. 检查Git状态
echo "📋 [1/8] 检查Git仓库状态..."
cd /www/wwwroot/stock-tracker
echo "当前分支: $(git branch --show-current)"
echo "最新提交: $(git log -1 --oneline)"
echo "工作区状态:"
git status --short
echo ""

# 2. 检查关键文件是否包含新功能代码
echo "📋 [2/8] 检查关键功能代码..."
if grep -q "板块7天涨停趋势图" src/app/page.tsx; then
    echo "✅ 找到'板块7天涨停趋势图'代码"
else
    echo "❌ 未找到'板块7天涨停趋势图'代码"
fi

if grep -q "板块后续5天溢价趋势图" src/app/page.tsx; then
    echo "✅ 找到'板块后续5天溢价趋势图'代码"
else
    echo "❌ 未找到'板块后续5天溢价趋势图'代码"
fi

if grep -q "w-\[98vw\] max-w-\[98vw\] max-h-\[95vh\]" src/app/page.tsx; then
    echo "✅ 找到弹窗尺寸扩大代码"
else
    echo "❌ 未找到弹窗尺寸扩大代码"
fi
echo ""

# 3. 检查Docker容器状态
echo "📋 [3/8] 检查Docker容器状态..."
docker ps --filter "name=stock" --format "table {{.Names}}\t{{.Status}}\t{{.CreatedAt}}"
echo ""

# 4. 检查容器内的代码版本
echo "📋 [4/8] 检查Docker容器内的代码..."
if docker exec stock-tracker-app test -f /app/src/app/page.tsx; then
    echo "✅ 容器内page.tsx存在"
    echo "容器内文件修改时间:"
    docker exec stock-tracker-app stat -c '%y' /app/src/app/page.tsx
    echo ""
    echo "检查容器内是否有新功能代码:"
    if docker exec stock-tracker-app grep -q "板块7天涨停趋势图" /app/src/app/page.tsx; then
        echo "✅ 容器内包含'板块7天涨停趋势图'代码"
    else
        echo "❌ 容器内不包含'板块7天涨停趋势图'代码 [需要重新构建]"
    fi
else
    echo "❌ 容器内page.tsx不存在"
fi
echo ""

# 5. 检查构建产物
echo "📋 [5/8] 检查Next.js构建产物..."
if docker exec stock-tracker-app test -d /app/.next; then
    echo "✅ .next目录存在"
    docker exec stock-tracker-app ls -lh /app/.next/ | head -5
else
    echo "❌ .next目录不存在"
fi
echo ""

# 6. 检查容器日志（最后50行）
echo "📋 [6/8] 检查容器日志（最后20行）..."
docker logs --tail 20 stock-tracker-app
echo ""

# 7. 检查Nginx配置
echo "📋 [7/8] 检查Nginx配置..."
if [ -f /www/server/panel/vhost/nginx/bk.yushuo.click.conf ]; then
    echo "✅ Nginx配置文件存在"
    grep -E "server_name|proxy_pass|location" /www/server/panel/vhost/nginx/bk.yushuo.click.conf
else
    echo "❌ Nginx配置文件不存在"
fi
echo ""

# 8. 检查API响应
echo "📋 [8/8] 检查API响应..."
API_RESPONSE=$(curl -s "http://localhost:3002/api/stocks?date=$(date +%Y-%m-%d)&mode=7days" | head -c 200)
if [ -n "$API_RESPONSE" ]; then
    echo "✅ API响应正常"
    echo "响应示例: ${API_RESPONSE}..."
else
    echo "❌ API无响应"
fi
echo ""

# 诊断结果总结
echo "========================================="
echo "🔍 诊断结果总结"
echo "========================================="
echo ""
echo "🔧 建议操作（按优先级）："
echo ""
echo "1️⃣ 如果容器内代码不是最新："
echo "   cd /www/wwwroot/stock-tracker"
echo "   git pull origin main"
echo "   docker compose down"
echo "   docker compose build --no-cache"
echo "   docker compose up -d"
echo ""
echo "2️⃣ 如果构建有问题："
echo "   docker compose logs web"
echo "   # 查看完整日志排查构建错误"
echo ""
echo "3️⃣ 如果浏览器缓存问题："
echo "   - Windows/Linux: Ctrl + Shift + R"
echo "   - Mac: Command + Shift + R"
echo "   - 或清空浏览器缓存后刷新"
echo ""
echo "4️⃣ 如果API数据结构不对："
echo "   curl 'http://bk.yushuo.click/api/stocks?date=$(date +%Y-%m-%d)&mode=7days'"
echo "   # 检查API是否返回完整的7天数据"
echo ""
echo "========================================="
