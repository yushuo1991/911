#!/bin/bash

# =================================================================
# 现有项目部署脚本 - 适配 /www/wwwroot/stock-tracker
# 股票追踪系统快速部署指令
# 服务器IP: 107.173.154.147
# =================================================================

echo "========================================="
echo "🚀 现有项目快速部署 - stock-tracker"
echo "项目路径: /www/wwwroot/stock-tracker"
echo "服务器IP: 107.173.154.147"
echo "========================================="

echo ""
echo "📋 当前情况："
echo "✅ 项目文件已在 /www/wwwroot/stock-tracker"
echo "✅ 服务器IP: 107.173.154.147"
echo "✅ 宝塔面板已安装"
echo ""

echo "🎯 快速部署步骤："
echo "----------------------------------------"

echo ""
echo "第一步：SSH连接到服务器"
echo "ssh root@107.173.154.147"
echo ""

echo "第二步：进入项目目录"
echo "cd /www/wwwroot/stock-tracker"
echo ""

echo "第三步：赋予脚本执行权限"
echo "chmod +x baota-auto-deploy.sh"
echo "chmod +x github-sync-setup.sh"
echo ""

echo "第四步：执行部署脚本"
echo "./baota-auto-deploy.sh"
echo ""

echo "🔄 可选：配置GitHub自动同步"
echo "----------------------------------------"
echo "./github-sync-setup.sh"
echo ""

echo "📝 宝塔面板配置："
echo "----------------------------------------"
echo "1. 访问宝塔面板: http://107.173.154.147:8888"
echo "2. 网站 → 添加站点"
echo "   - 域名: yushuo.click"
echo "   - 根目录: /www/wwwroot/stock-tracker"
echo "   - PHP版本: 不选择"
echo "3. SSL → Let's Encrypt (申请证书)"
echo "4. 重定向 → 强制HTTPS"
echo ""

echo "🔍 部署验证："
echo "----------------------------------------"
echo "# 检查PM2服务状态"
echo "pm2 status"
echo ""
echo "# 查看应用日志"
echo "pm2 logs stock-tracker"
echo ""
echo "# 测试API接口"
echo "curl http://localhost:3000/api/stocks?date=\$(date +%Y-%m-%d)"
echo ""
echo "# 测试网站访问"
echo "curl http://107.173.154.147:3000"
echo ""

echo "🌐 访问地址："
echo "----------------------------------------"
echo "临时访问: http://107.173.154.147:3000"
echo "API测试: http://107.173.154.147:3000/api/stocks?date=2024-09-21"
echo "域名访问: https://yushuo.click (配置域名后)"
echo ""

echo "🛠️ 常用管理命令："
echo "----------------------------------------"
echo "# 重启应用"
echo "pm2 restart stock-tracker"
echo ""
echo "# 查看实时日志"
echo "pm2 logs stock-tracker --lines 100"
echo ""
echo "# 系统监控"
echo "pm2 monit"
echo ""
echo "# 查看端口占用"
echo "netstat -tlnp | grep 3000"
echo ""
echo "# 查看Node.js进程"
echo "ps aux | grep node"
echo ""

echo "🆘 故障排除："
echo "----------------------------------------"
echo "如果PM2无法启动："
echo "cd /www/wwwroot/stock-tracker"
echo "npm install --production"
echo "npm run build"
echo "pm2 kill"
echo "pm2 start ecosystem.config.js"
echo ""
echo "如果端口冲突："
echo "# 查找占用端口3000的进程"
echo "lsof -ti:3000"
echo "# 杀死进程"
echo "kill -9 \$(lsof -ti:3000)"
echo ""
echo "如果数据库连接失败："
echo "systemctl status mysql"
echo "systemctl restart mysql"
echo "mysql -u root -p"
echo ""

echo "📞 GitHub Webhook配置："
echo "----------------------------------------"
echo "如果需要自动同步，在GitHub仓库设置中："
echo "1. 访问: https://github.com/yushuo1991/911/settings/hooks"
echo "2. Add webhook:"
echo "   - Payload URL: http://107.173.154.147:9999/webhook"
echo "   - Content type: application/json"
echo "   - Secret: stock_tracker_webhook_2024"
echo "   - Events: Just the push event"
echo ""

echo "🎯 一键执行命令："
echo "----------------------------------------"
cat << 'EOF'
# 完整部署命令（复制粘贴执行）
ssh root@107.173.154.147 << 'DEPLOY_SCRIPT'
cd /www/wwwroot/stock-tracker
chmod +x baota-auto-deploy.sh
./baota-auto-deploy.sh
echo "部署完成！"
echo "访问地址: http://107.173.154.147:3000"
pm2 status
DEPLOY_SCRIPT
EOF

echo ""
echo "========================================="
echo "✅ 部署完成后您将拥有:"
echo "• 运行在端口3000的Next.js应用"
echo "• PM2进程管理和自动重启"
echo "• MySQL数据库存储"
echo "• Nginx反向代理(可选)"
echo "• 完善的日志监控"
echo "• GitHub自动同步功能(可选)"
echo "========================================="