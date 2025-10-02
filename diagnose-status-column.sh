#!/bin/bash

# ============================================
# 涨停数弹窗状态列诊断脚本
# 用途：快速诊断服务器上的代码版本和状态列实现
# ============================================

echo "=========================================="
echo "🔍 涨停数弹窗状态列诊断脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. 检查当前Git版本
echo -e "${BLUE}[1/6] 检查Git版本...${NC}"
CURRENT_COMMIT=$(git log --oneline -1)
echo "   当前版本: $CURRENT_COMMIT"
echo ""

# 2. 确认v4.9-v4.11提交存在
echo -e "${BLUE}[2/6] 确认关键版本提交...${NC}"
V49_EXISTS=$(git log --all --oneline | grep -c "v4.9")
V410_EXISTS=$(git log --all --oneline | grep -c "v4.10")
V411_EXISTS=$(git log --all --oneline | grep -c "v4.11")

if [ $V49_EXISTS -gt 0 ]; then
    echo -e "   ${GREEN}✓${NC} v4.9 提交存在 (首次添加状态列)"
else
    echo -e "   ${RED}✗${NC} v4.9 提交不存在"
fi

if [ $V410_EXISTS -gt 0 ]; then
    echo -e "   ${GREEN}✓${NC} v4.10 提交存在"
else
    echo -e "   ${YELLOW}!${NC} v4.10 提交不存在"
fi

if [ $V411_EXISTS -gt 0 ]; then
    echo -e "   ${GREEN}✓${NC} v4.11 提交存在"
else
    echo -e "   ${YELLOW}!${NC} v4.11 提交不存在"
fi
echo ""

# 3. 检查page.tsx中的状态列实现
echo -e "${BLUE}[3/6] 检查page.tsx状态列代码...${NC}"
STATUS_COL_HEADER=$(grep -n "状态" src/app/page.tsx | grep "<th" | head -1)
if [ -n "$STATUS_COL_HEADER" ]; then
    LINE_NUM=$(echo "$STATUS_COL_HEADER" | cut -d: -f1)
    echo -e "   ${GREEN}✓${NC} 找到状态列表头 (行号: $LINE_NUM)"

    # 检查状态列实现
    TD_TYPE_IMPL=$(grep -A 5 "status.*td_type" src/app/page.tsx | grep -c "td_type.replace")
    if [ $TD_TYPE_IMPL -gt 0 ]; then
        echo -e "   ${GREEN}✓${NC} 状态列使用 td_type.replace('连板', '板') 实现"
        echo "   代码片段："
        grep -A 3 "td_type.replace" src/app/page.tsx | head -5 | sed 's/^/      /'
    else
        echo -e "   ${RED}✗${NC} 状态列未找到 td_type.replace 实现"
        echo "   可能使用了错误的字段！"
    fi
else
    echo -e "   ${RED}✗${NC} 未找到状态列表头"
fi
echo ""

# 4. 检查API路由中的td_type字段
echo -e "${BLUE}[4/6] 检查API返回td_type字段...${NC}"
API_TD_TYPE=$(grep -n "td_type:" src/app/api/stocks/route.ts | head -2)
if [ -n "$API_TD_TYPE" ]; then
    echo -e "   ${GREEN}✓${NC} API正确返回td_type字段"
    echo "$API_TD_TYPE" | sed 's/^/      /'
else
    echo -e "   ${RED}✗${NC} API未找到td_type字段"
fi
echo ""

# 5. 检查handleStockCountClick数据传递
echo -e "${BLUE}[5/6] 检查handleStockCountClick数据传递...${NC}"
HANDLE_CLICK=$(grep -A 15 "const handleStockCountClick" src/app/page.tsx)
if echo "$HANDLE_CLICK" | grep -q "...stock"; then
    echo -e "   ${GREEN}✓${NC} 使用 {...stock} 展开传递所有字段"
    echo -e "   ${GREEN}✓${NC} td_type字段应该被正确传递"
else
    echo -e "   ${YELLOW}!${NC} 数据传递方式可能有问题"
fi
echo ""

# 6. 生成诊断总结
echo -e "${BLUE}[6/6] 诊断总结${NC}"
echo "=========================================="

# 检查本地代码是否正确
LOCAL_CODE_OK=true
if [ $V49_EXISTS -eq 0 ] || [ -z "$STATUS_COL_HEADER" ] || [ $TD_TYPE_IMPL -eq 0 ]; then
    LOCAL_CODE_OK=false
fi

if [ "$LOCAL_CODE_OK" = true ]; then
    echo -e "${GREEN}✓ 本地代码实现正确${NC}"
    echo "  - 包含v4.9及以上版本"
    echo "  - 状态列使用td_type字段"
    echo "  - API返回td_type数据"
    echo ""
    echo -e "${YELLOW}⚠️  如果用户截图显示错误，则是服务器部署问题${NC}"
    echo ""
    echo "下一步操作："
    echo "1. SSH登录服务器: ssh root@yushuo.click"
    echo "2. 检查服务器代码版本: cd /www/wwwroot/stock-tracker && git log -1"
    echo "3. 如版本低于v4.9，重新部署: git pull && docker-compose build --no-cache && docker-compose up -d"
else
    echo -e "${RED}✗ 本地代码存在问题${NC}"
    echo "  请检查上述失败的检查项"
fi
echo "=========================================="
echo ""

# 7. 创建服务器检查脚本
echo -e "${BLUE}[额外] 生成服务器检查脚本...${NC}"
cat > check-server-status-column.sh << 'EOF'
#!/bin/bash
# 服务器端诊断脚本 - 在服务器上运行

echo "=========================================="
echo "🖥️  服务器端状态列诊断"
echo "=========================================="

cd /www/wwwroot/stock-tracker

# 检查Git版本
echo "1. Git版本:"
git log --oneline -1

# 检查是否包含v4.9+版本
echo ""
echo "2. 关键版本检查:"
git log --all --oneline | grep -E "v4\.(9|10|11)" || echo "未找到v4.9-v4.11版本"

# 检查page.tsx中的状态列
echo ""
echo "3. 状态列代码检查:"
grep -A 5 "td_type.replace" src/app/page.tsx | head -8 || echo "未找到td_type.replace代码"

# 检查Docker容器状态
echo ""
echo "4. Docker容器状态:"
docker ps | grep stock-tracker

# 检查构建时间
echo ""
echo "5. Docker镜像构建时间:"
docker images | grep stock-tracker

echo ""
echo "=========================================="
echo "诊断完成！"
echo "=========================================="
EOF

chmod +x check-server-status-column.sh
echo -e "${GREEN}✓${NC} 已生成 check-server-status-column.sh"
echo "   将此脚本上传到服务器运行: scp check-server-status-column.sh root@yushuo.click:/tmp/"
echo ""

# 8. 生成快速修复脚本
cat > fix-status-column-deploy.sh << 'EOF'
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
EOF

chmod +x fix-status-column-deploy.sh
echo -e "${GREEN}✓${NC} 已生成 fix-status-column-deploy.sh"
echo "   将此脚本上传到服务器运行: scp fix-status-column-deploy.sh root@yushuo.click:/tmp/"
echo ""

echo "=========================================="
echo "🎉 诊断脚本执行完成！"
echo "=========================================="
echo ""
echo "📋 诊断报告已保存到:"
echo "   log/stock-count-modal-status-column-diagnosis-20251002.md"
echo ""
echo "📦 生成的辅助脚本:"
echo "   1. check-server-status-column.sh - 服务器端检查脚本"
echo "   2. fix-status-column-deploy.sh - 快速部署修复脚本"
echo ""
