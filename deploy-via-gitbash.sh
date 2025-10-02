#!/bin/bash
# Git Bash SSH部署脚本
# 使用方法: 右键点击此文件 -> Git Bash Here -> 运行 ./deploy-via-gitbash.sh

echo "========================================"
echo "🚀 股票追踪系统 Docker部署脚本"
echo "========================================"
echo ""

# 服务器配置
SERVER_HOST="yushuo.click"
SERVER_USER="root"
SERVER_PASS="gJ75hNHdy90TA4qGo9"
PROJECT_DIR="/www/wwwroot/stock-tracker"

echo "📡 服务器信息:"
echo "   主机: $SERVER_HOST"
echo "   用户: $SERVER_USER"
echo "   目录: $PROJECT_DIR"
echo ""

# 测试网络连接
echo "🔍 步骤1: 测试网络连接..."
if ping -n 4 $SERVER_HOST > /dev/null 2>&1; then
    echo "   ✅ Ping测试成功"
else
    echo "   ⚠️  Ping测试失败，但继续尝试SSH"
fi
echo ""

# 尝试SSH连接
echo "🔐 步骤2: 尝试SSH连接..."
echo "   提示: 如果要求输入密码，请输入: $SERVER_PASS"
echo ""
echo "   正在连接..."

# 使用sshpass如果可用，否则需要手动输入密码
if command -v sshpass &> /dev/null; then
    echo "   使用sshpass自动认证..."
    sshpass -p "$SERVER_PASS" ssh -o ConnectTimeout=30 -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "echo '✅ SSH连接成功！'"
else
    # 手动SSH连接
    ssh -o ConnectTimeout=30 -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST << 'ENDSSH'
echo ""
echo "✅ SSH连接成功！"
echo ""
echo "========================================"
echo "🚀 开始执行部署..."
echo "========================================"
echo ""

# 进入项目目录
cd /www/wwwroot/stock-tracker

echo "▶ 步骤3: 检查Git状态..."
git status
echo ""

echo "▶ 步骤4: 拉取最新代码..."
git fetch --all
git reset --hard origin/main
git pull origin main
echo ""

echo "▶ 步骤5: 验证关键文件..."
ls -lh Dockerfile docker-compose.yml deploy.sh init.sql
echo ""

echo "▶ 步骤6: 停止旧容器..."
docker-compose down 2>/dev/null || echo "没有运行中的容器"
echo ""

echo "▶ 步骤7: 清理Docker资源..."
docker system prune -f
echo ""

echo "▶ 步骤8: 执行Docker部署..."
chmod +x deploy.sh
./deploy.sh
echo ""

echo "▶ 步骤9: 等待服务启动（30秒）..."
sleep 30
echo ""

echo "▶ 步骤10: 检查容器状态..."
docker-compose ps
echo ""

echo "▶ 步骤11: 查看应用日志..."
docker-compose logs --tail=50 stock-tracker
echo ""

echo "▶ 步骤12: 测试本地访问..."
curl -I http://localhost:3002
echo ""

echo "========================================"
echo "✅ 部署完成！"
echo "========================================"
echo ""
echo "🌐 访问地址: http://bk.yushuo.click"
echo ""
echo "📊 验证清单:"
echo "   [ ] 浏览器访问 http://bk.yushuo.click"
echo "   [ ] 页面正常显示"
echo "   [ ] 数据正常加载"
echo "   [ ] 涨停榜功能正常"
echo "   [ ] 板块排行功能正常"
echo ""
ENDSSH
fi

# 检查SSH连接结果
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 部署脚本执行完毕！"
    echo "🌐 现在可以访问: http://bk.yushuo.click"
else
    echo ""
    echo "❌ SSH连接失败！"
    echo ""
    echo "可能的原因:"
    echo "  1. 网络防火墙阻止SSH端口22"
    echo "  2. 服务器防火墙未开放端口"
    echo "  3. 密码错误"
    echo "  4. 网络不稳定"
    echo ""
    echo "解决方案:"
    echo "  ✅ 方案1: 使用宝塔面板Web SSH"
    echo "     - 打开浏览器访问宝塔面板"
    echo "     - 点击'终端'菜单"
    echo "     - 复制web-ssh-deployment.sh中的命令执行"
    echo ""
    echo "  ✅ 方案2: 手动SSH连接"
    echo "     - 打开Git Bash"
    echo "     - 执行: ssh root@yushuo.click"
    echo "     - 输入密码: $SERVER_PASS"
    echo "     - 然后执行部署命令"
    echo ""
    echo "  ✅ 方案3: 使用VPN或更换网络"
    echo "     - 连接VPN后再次尝试"
    echo "     - 或使用手机热点等其他网络"
    echo ""
fi