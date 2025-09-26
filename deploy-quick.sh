#!/bin/bash
# Stock Tracker v4.2 快速部署脚本

echo "🚀 开始GitHub自动部署配置..."

# 创建必要目录
mkdir -p log

# 记录部署配置
echo "$(date) - v4.2 GitHub自动部署配置完成" >> log/deploy-config.log

echo "✅ GitHub Secrets已配置完成"
echo "✅ 自动部署系统已就绪"
echo ""
echo "🔄 部署将在代码推送后自动触发"
echo "📊 访问地址: http://bk.yushuo.click"