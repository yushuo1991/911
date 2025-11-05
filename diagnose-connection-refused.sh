#!/bin/bash
# ========================================
# 连接拒绝问题诊断脚本
# ERR_CONNECTION_REFUSED 故障排查
# ========================================

echo "========================================"
echo "🔍 股票追踪系统 - 连接诊断"
echo "========================================"
echo ""

# 项目目录
PROJECT_DIR="/www/wwwroot/stock-tracker"

# 检查项目目录是否存在
echo "1️⃣ 检查项目目录"
echo "----------------------------"
if [ -d "$PROJECT_DIR" ]; then
  echo "✅ 项目目录存在: $PROJECT_DIR"
  cd $PROJECT_DIR
else
  echo "❌ 项目目录不存在: $PROJECT_DIR"
  echo "   需要先克隆项目: git clone https://github.com/yushuo1991/911.git /www/wwwroot/stock-tracker"
  exit 1
fi
echo ""

# 检查Docker服务
echo "2️⃣ 检查Docker服务状态"
echo "----------------------------"
if systemctl is-active --quiet docker; then
  echo "✅ Docker服务运行中"
else
  echo "❌ Docker服务未运行"
  echo "   启动Docker: systemctl start docker"
  exit 1
fi
echo ""

# 检查Docker容器状态
echo "3️⃣ 检查Docker容器状态"
echo "----------------------------"
CONTAINER_STATUS=$(docker ps -a | grep stock-tracker-app)
if [ -z "$CONTAINER_STATUS" ]; then
  echo "❌ 容器不存在，需要启动"
else
  echo "$CONTAINER_STATUS"
  CONTAINER_RUNNING=$(docker ps | grep stock-tracker-app | grep "Up")
  if [ -z "$CONTAINER_RUNNING" ]; then
    echo "❌ 容器已停止"
  else
    echo "✅ 容器运行中"
  fi
fi
echo ""

# 检查端口监听
echo "4️⃣ 检查端口监听"
echo "----------------------------"
echo "检查3002端口 (映射到容器的3000端口):"
PORT_3002=$(netstat -tuln 2>/dev/null | grep ":3002" || ss -tuln 2>/dev/null | grep ":3002")
if [ -z "$PORT_3002" ]; then
  echo "❌ 3002端口未监听"
else
  echo "✅ 3002端口正在监听"
  echo "$PORT_3002"
fi
echo ""

# 检查防火墙
echo "5️⃣ 检查防火墙规则"
echo "----------------------------"
# 检查firewalld
if systemctl is-active --quiet firewalld; then
  echo "Firewalld状态: 运行中"
  FIREWALL_RULES=$(firewall-cmd --list-ports 2>/dev/null)
  echo "开放端口: $FIREWALL_RULES"
  if echo "$FIREWALL_RULES" | grep -q "3002"; then
    echo "✅ 防火墙已开放3002端口"
  else
    echo "❌ 防火墙未开放3002端口"
    echo "   开放端口: firewall-cmd --add-port=3002/tcp --permanent && firewall-cmd --reload"
  fi
# 检查iptables
elif which iptables >/dev/null 2>&1; then
  echo "IPTables规则:"
  iptables -L -n | grep 3002
else
  echo "⚠️  未检测到防火墙服务"
fi
echo ""

# 检查Nginx配置
echo "6️⃣ 检查Nginx反向代理"
echo "----------------------------"
if systemctl is-active --quiet nginx; then
  echo "✅ Nginx运行中"
  NGINX_CONFIG=$(find /www/server/panel/vhost/nginx /etc/nginx -name "*yushuo*" -o -name "*bk.yushuo*" 2>/dev/null | head -1)
  if [ -n "$NGINX_CONFIG" ]; then
    echo "找到配置文件: $NGINX_CONFIG"
    echo "---"
    grep -E "server_name|listen|proxy_pass" "$NGINX_CONFIG" | head -10
    echo "---"
  else
    echo "⚠️  未找到bk.yushuo.click的Nginx配置文件"
  fi
else
  echo "⚠️  Nginx未运行"
fi
echo ""

# 测试本地连接
echo "7️⃣ 测试本地连接"
echo "----------------------------"
echo "测试 http://localhost:3002"
CURL_RESULT=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 --connect-timeout 5)
if [ "$CURL_RESULT" = "200" ]; then
  echo "✅ 本地访问成功 (HTTP 200)"
elif [ "$CURL_RESULT" = "000" ]; then
  echo "❌ 连接失败 (无响应)"
else
  echo "⚠️  HTTP状态码: $CURL_RESULT"
fi
echo ""

# 检查容器日志
echo "8️⃣ 容器日志 (最近20行)"
echo "----------------------------"
if docker ps | grep -q stock-tracker-app; then
  docker logs --tail 20 stock-tracker-app 2>&1
else
  echo "⚠️  容器未运行，无法获取日志"
fi
echo ""

# 诊断总结
echo "========================================"
echo "📊 诊断总结与建议"
echo "========================================"
echo ""

# 容器状态判断
if docker ps | grep -q stock-tracker-app; then
  echo "✅ Docker容器运行正常"
else
  echo "❌ 问题: Docker容器未运行"
  echo ""
  echo "🔧 解决方案:"
  echo "  1. 启动容器:"
  echo "     cd /www/wwwroot/stock-tracker"
  echo "     docker-compose up -d"
  echo ""
  echo "  2. 如果启动失败，重新部署:"
  echo "     docker-compose down"
  echo "     docker-compose build --no-cache"
  echo "     docker-compose up -d"
  echo ""
fi

# 端口监听判断
if [ -z "$PORT_3002" ]; then
  echo "❌ 问题: 3002端口未监听"
  echo ""
  echo "🔧 解决方案:"
  echo "  检查docker-compose.yml中的端口映射"
  echo "  应该是: ports: - '3002:3000'"
  echo ""
fi

# Nginx配置判断
if systemctl is-active --quiet nginx; then
  if [ -z "$NGINX_CONFIG" ]; then
    echo "❌ 问题: 未配置Nginx反向代理"
    echo ""
    echo "🔧 解决方案 (宝塔面板):"
    echo "  1. 登录宝塔面板"
    echo "  2. 网站 → 添加站点"
    echo "     - 域名: bk.yushuo.click"
    echo "     - 根目录: /www/wwwroot/stock-tracker"
    echo "  3. 设置 → 反向代理 → 添加反向代理"
    echo "     - 代理名称: stock-tracker"
    echo "     - 目标URL: http://127.0.0.1:3002"
    echo "     - 发送域名: \$host"
    echo "  4. 保存并重启Nginx"
    echo ""
  fi
fi

# 防火墙判断
if systemctl is-active --quiet firewalld; then
  if ! echo "$FIREWALL_RULES" | grep -q "80" && ! echo "$FIREWALL_RULES" | grep -q "443"; then
    echo "⚠️  警告: 防火墙可能未开放HTTP/HTTPS端口"
    echo ""
    echo "🔧 解决方案:"
    echo "  firewall-cmd --add-service=http --permanent"
    echo "  firewall-cmd --add-service=https --permanent"
    echo "  firewall-cmd --reload"
    echo ""
  fi
fi

echo "========================================"
echo "💡 快速修复命令"
echo "========================================"
echo ""
echo "如果容器未运行，执行:"
echo "----------------------------"
echo "cd /www/wwwroot/stock-tracker && docker-compose up -d"
echo ""
echo "如果需要重新部署，执行:"
echo "----------------------------"
echo "cd /www/wwwroot/stock-tracker && git pull origin main && docker-compose down && docker-compose build --no-cache && docker-compose up -d"
echo ""
echo "如果防火墙阻止访问，执行:"
echo "----------------------------"
echo "firewall-cmd --add-service=http --permanent"
echo "firewall-cmd --add-service=https --permanent"
echo "firewall-cmd --add-port=3002/tcp --permanent"
echo "firewall-cmd --reload"
echo ""

echo "========================================"
echo "✅ 诊断完成"
echo "========================================"

