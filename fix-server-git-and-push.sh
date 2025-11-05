#!/bin/bash
# 修复服务器Git权限并接收推送的脚本
# 在服务器上执行

echo "=========================================="
echo "修复服务器Git仓库权限"
echo "=========================================="
echo ""

cd /www/wwwroot/stock-tracker || exit 1

# 修复Git权限问题
echo "[步骤1] 修复Git权限..."
git config --global --add safe.directory /www/wwwroot/stock-tracker/.git
git config --global --add safe.directory /www/wwwroot/stock-tracker

# 设置接收推送
echo "[步骤2] 配置Git接收推送..."
git config receive.denyCurrentBranch updateInstead

# 检查当前状态
echo "[步骤3] 检查当前Git状态..."
git status
echo ""

echo "=========================================="
echo "✅ 服务器Git配置完成"
echo "=========================================="
echo ""
echo "现在可以从本地推送："
echo "  git push server main"
echo ""
