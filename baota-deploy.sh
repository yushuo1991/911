#!/bin/bash

# 股票追踪系统v4.2 - 宝塔面板自动部署脚本
# 创建时间: 2025-09-26
# 版本: 4.2

set -e  # 遇到错误立即退出

echo "=========================================="
echo "股票追踪系统v4.2 - 宝塔面板部署脚本"
echo "=========================================="
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 错误: 请使用root用户运行此脚本"
    echo "   运行命令: sudo ./baota-deploy.sh"
    exit 1
fi

# 定义变量
PROJECT_NAME="stock-tracker"
DOMAIN="yushuo.click"
PROJECT_PATH="/www/wwwroot/stock-tracker"
BACKUP_PATH="/www/backup/$(date +%Y%m%d_%H%M%S)_${PROJECT_NAME}"
NODE_VERSION="18"
PM2_APP_NAME="${PROJECT_NAME}-v42"

echo "[1/8] 环境检查..."

# 检查宝塔面板是否安装
if [ ! -d "/www/server/panel" ]; then
    echo "❌ 错误: 未检测到宝塔面板"
    echo "   请先安装宝塔面板: curl -sSO https://download.bt.cn/install/install_panel.sh && bash install_panel.sh"
    exit 1
fi

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "🔧 安装Node.js ${NODE_VERSION}..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
else
    echo "✅ Node.js 已安装: $(node --version)"
fi

# 检查PM2
if ! command -v pm2 &> /dev/null; then
    echo "🔧 安装PM2..."
    npm install -g pm2
else
    echo "✅ PM2 已安装: $(pm2 --version)"
fi

echo ""
echo "[2/8] 创建项目目录结构..."

# 创建必要目录
mkdir -p "${PROJECT_PATH}"
mkdir -p "${PROJECT_PATH}/data"
mkdir -p "${PROJECT_PATH}/log"
mkdir -p "${BACKUP_PATH}"

echo "📁 项目目录: ${PROJECT_PATH}"
echo "📁 备份目录: ${BACKUP_PATH}"

echo ""
echo "[3/8] 备份现有项目（如存在）..."

if [ -d "${PROJECT_PATH}/.next" ]; then
    echo "🗃️  发现现有项目，进行备份..."
    cp -r "${PROJECT_PATH}" "${BACKUP_PATH}/"
    echo "✅ 备份完成: ${BACKUP_PATH}"
fi

echo ""
echo "[4/8] 下载项目源码..."

# 从GitHub克隆最新代码
if [ -d "${PROJECT_PATH}/.git" ]; then
    echo "🔄 更新现有仓库..."
    cd "${PROJECT_PATH}"
    git fetch origin
    git reset --hard origin/main
else
    echo "📥 克隆新仓库..."
    rm -rf "${PROJECT_PATH}"/*
    git clone https://github.com/shishen168/stock-tracker.git "${PROJECT_PATH}"
    cd "${PROJECT_PATH}"
fi

# 切换到v4.2版本
echo "🔖 切换到v4.2版本..."
git checkout main
git reset --hard 49bdc42

echo ""
echo "[5/8] 配置环境变量..."

# 创建生产环境配置文件
cat > "${PROJECT_PATH}/.env.local" << EOF
# 股票追踪系统v4.2生产环境配置
# Tushare API Token
TUSHARE_TOKEN=2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211

# 应用配置
NODE_ENV=production
NEXT_PUBLIC_APP_VERSION=4.2
NEXTAUTH_URL=https://stock-tracker.${DOMAIN}

# SQLite 数据库配置
DB_TYPE=sqlite
SQLITE_PATH=./data/stock_tracker.db

# 定时任务安全Token
SCHEDULER_TOKEN=$(openssl rand -hex 32)

# 启用高级缓存系统
ENABLE_DATABASE_CACHE=true
CACHE_TTL=3600

# 服务端口
PORT=3002
EOF

echo "✅ 环境配置文件已创建"

echo ""
echo "[6/8] 安装依赖并构建项目..."

# 安装依赖
echo "📦 安装依赖包..."
npm install --production=false

# 构建项目
echo "🔨 构建生产版本..."
npm run build

echo ""
echo "[7/8] 配置PM2进程管理..."

# 创建PM2配置文件
cat > "${PROJECT_PATH}/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: '${PM2_APP_NAME}',
    script: 'npm',
    args: 'start',
    cwd: '${PROJECT_PATH}',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    log_file: '${PROJECT_PATH}/log/app.log',
    error_file: '${PROJECT_PATH}/log/error.log',
    out_file: '${PROJECT_PATH}/log/out.log',
    time: true,
    max_restarts: 10,
    restart_delay: 5000
  }]
}
EOF

# 停止可能存在的旧进程
pm2 stop "${PM2_APP_NAME}" 2>/dev/null || true
pm2 delete "${PM2_APP_NAME}" 2>/dev/null || true

# 启动新进程
echo "🚀 启动PM2进程..."
cd "${PROJECT_PATH}"
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "[8/8] 配置Nginx反向代理..."

# 创建Nginx配置
NGINX_CONFIG="/www/server/panel/vhost/nginx/stock-tracker.${DOMAIN}.conf"

if [ -f "${NGINX_CONFIG}" ]; then
    cp "${NGINX_CONFIG}" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
fi

cat > "${NGINX_CONFIG}" << EOF
server {
    listen 80;
    listen 443 ssl http2;
    server_name stock-tracker.${DOMAIN};

    # SSL配置（如果已配置SSL证书）
    ssl_certificate /www/server/panel/vhost/cert/stock-tracker.${DOMAIN}/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/stock-tracker.${DOMAIN}/privkey.pem;

    # 股票追踪系统根路径
    location / {
        proxy_pass http://127.0.0.1:3002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        proxy_redirect off;
    }

    # API接口代理
    location /api/ {
        proxy_pass http://127.0.0.1:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }

    # 静态资源代理
    location /_next/ {
        proxy_pass http://127.0.0.1:3002/_next/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    access_log /www/wwwroot/stock-tracker/log/nginx_access.log;
    error_log /www/wwwroot/stock-tracker/log/nginx_error.log;
}
EOF

# 测试Nginx配置
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx配置测试通过"
    systemctl reload nginx
    echo "✅ Nginx已重新加载"
else
    echo "❌ Nginx配置测试失败，请检查配置"
    exit 1
fi

echo ""
echo "=========================================="
echo "🎉 部署完成！"
echo "=========================================="
echo ""
echo "📊 部署信息:"
echo "   • 项目名称: ${PROJECT_NAME} v4.2"
echo "   • 项目路径: ${PROJECT_PATH}"
echo "   • 访问地址: https://stock-tracker.${DOMAIN}"
echo "   • PM2进程: ${PM2_APP_NAME}"
echo "   • 端口: 3002"
echo ""
echo "🔧 管理命令:"
echo "   • 查看进程: pm2 status"
echo "   • 查看日志: pm2 logs ${PM2_APP_NAME}"
echo "   • 重启应用: pm2 restart ${PM2_APP_NAME}"
echo "   • 停止应用: pm2 stop ${PM2_APP_NAME}"
echo ""
echo "📁 重要文件:"
echo "   • 配置文件: ${PROJECT_PATH}/.env.local"
echo "   • 数据库: ${PROJECT_PATH}/data/stock_tracker.db"
echo "   • 应用日志: ${PROJECT_PATH}/log/"
echo "   • 备份目录: ${BACKUP_PATH}"
echo ""
echo "🌐 请在浏览器中访问 https://stock-tracker.${DOMAIN} 验证部署结果"
echo "=========================================="