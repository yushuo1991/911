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
