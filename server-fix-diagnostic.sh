#!/bin/bash

# 服务器端修复诊断脚本
# 用于解决cron API 404问题

echo "==========================================="
echo "服务器端API路由诊断和修复"
echo "时间: $(date)"
echo "目标: 修复 /api/cron 404错误"
echo "==========================================="

PROJECT_DIR="/www/wwwroot/stock-tracker"
cd $PROJECT_DIR

echo "1. 检查项目文件状态..."
echo "项目目录: $(pwd)"
echo "Git分支: $(git branch --show-current)"
echo "最新提交: $(git log --oneline -1)"

echo ""
echo "2. 检查API路由文件..."
if [ -f "src/app/api/cron/route.ts" ]; then
    echo "✅ cron路由文件存在"
    echo "文件大小: $(wc -l < src/app/api/cron/route.ts) 行"
    echo "最后修改: $(stat -c %y src/app/api/cron/route.ts)"
else
    echo "❌ cron路由文件不存在"
fi

if [ -f "src/app/api/stocks/route.ts" ]; then
    echo "✅ stocks路由文件存在"
else
    echo "❌ stocks路由文件不存在"
fi

echo ""
echo "3. 检查应用运行状态..."
if pgrep -f "next start" > /dev/null; then
    echo "✅ Next.js应用正在运行"
    echo "进程: $(pgrep -f 'next start')"
else
    echo "❌ Next.js应用未运行"
fi

if pgrep -f "pm2" > /dev/null; then
    echo "✅ PM2正在运行"
    pm2 status || echo "PM2状态获取失败"
else
    echo "❌ PM2未运行"
fi

echo ""
echo "4. 检查端口监听状态..."
echo "3000端口状态:"
netstat -tulpn | grep ":3000" || echo "3000端口未监听"

echo ""
echo "5. 测试本地API..."
echo "测试 /api/stocks:"
curl -s http://localhost:3000/api/stocks | head -100 || echo "stocks API测试失败"

echo ""
echo "测试 /api/cron:"
curl -s http://localhost:3000/api/cron | head -100 || echo "cron API测试失败"

echo ""
echo "6. 检查构建输出..."
if [ -f ".next/server/app/api/cron/route.js" ]; then
    echo "✅ cron路由已构建到 .next/server"
else
    echo "❌ cron路由未构建到 .next/server"
    echo "构建文件列表:"
    find .next/server/app -name "*.js" | grep api || echo "未找到API路由构建文件"
fi

echo ""
echo "7. 检查nginx配置..."
if command -v nginx >/dev/null 2>&1; then
    echo "Nginx配置测试:"
    nginx -t || echo "Nginx配置有误"
else
    echo "Nginx未安装或不可用"
fi

echo ""
echo "==========================================="
echo "修复建议:"
echo "1. 如果cron路由文件存在但未构建，执行重新构建"
echo "2. 如果应用未运行，重启应用"
echo "3. 如果端口未监听，检查应用启动状态"
echo "==========================================="

echo ""
echo "执行自动修复? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "开始自动修复..."

    echo "停止当前应用..."
    pm2 stop all || killall node || echo "停止应用失败"

    echo "重新构建项目..."
    npm run build || echo "构建失败"

    echo "重新启动应用..."
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js || echo "PM2启动失败"
    else
        npm start &
        echo "使用npm start启动应用"
    fi

    echo "等待应用启动..."
    sleep 10

    echo "重新测试API..."
    curl -s "http://localhost:3000/api/cron?date=2025-09-21" || echo "修复后测试失败"

    echo "修复完成！"
else
    echo "跳过自动修复"
fi

echo ""
echo "诊断完成！"