#!/bin/bash

# =================================================================
# 股票追踪系统 - 宝塔面板自动化部署脚本
# 版本: 2.0
# 适用: CentOS 7/8, Ubuntu 18.04+
# 前置条件: 已安装宝塔面板, Node.js 18+, MySQL 5.7+
# =================================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 项目配置
PROJECT_NAME="stock-tracker"
DOMAIN="yushuo.click"
PROJECT_PATH="/www/wwwroot/stock-tracker"
GITHUB_REPO="https://github.com/yushuo1991/911.git"
NODE_VERSION="18"
PM2_APP_NAME="${PROJECT_NAME}"

# 数据库配置
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="stock_db"
DB_USER="stock_user"
DB_PASSWORD="StockPass123!"

# 检查宝塔面板状态
check_baota_panel() {
    log_info "检查宝塔面板状态..."

    if ! command -v bt &> /dev/null; then
        log_error "未检测到宝塔面板，请先安装宝塔面板"
        exit 1
    fi

    # 检查面板状态
    panel_status=$(bt default 2>/dev/null | grep -i "status" || echo "unknown")
    log_info "宝塔面板状态: $panel_status"

    log_success "宝塔面板检查完成"
}

# 检查并安装Node.js
check_nodejs() {
    log_info "检查Node.js环境..."

    if ! command -v node &> /dev/null; then
        log_warning "未检测到Node.js，开始安装..."

        # 通过宝塔面板安装Node.js
        log_info "通过宝塔面板安装Node.js ${NODE_VERSION}..."

        # 安装nvm (如果宝塔面板未预装)
        if ! command -v nvm &> /dev/null; then
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
            source ~/.bashrc
        fi

        # 安装指定版本Node.js
        nvm install ${NODE_VERSION}
        nvm use ${NODE_VERSION}
        nvm alias default ${NODE_VERSION}

    else
        node_version=$(node --version)
        log_info "已检测到Node.js: $node_version"
    fi

    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm未安装"
        exit 1
    fi

    # 安装PM2
    if ! command -v pm2 &> /dev/null; then
        log_info "安装PM2..."
        npm install -g pm2
    fi

    log_success "Node.js环境检查完成"
}

# 检查MySQL服务
check_mysql() {
    log_info "检查MySQL服务..."

    # 检查MySQL服务状态
    if ! systemctl is-active --quiet mysql && ! systemctl is-active --quiet mysqld; then
        log_error "MySQL服务未运行，请启动MySQL服务"
        log_info "可以尝试: systemctl start mysql 或 systemctl start mysqld"
        exit 1
    fi

    log_success "MySQL服务运行正常"
}

# 创建数据库和用户
setup_database() {
    log_info "设置数据库..."

    # 检查数据库是否存在
    db_exists=$(mysql -u root -e "SHOW DATABASES LIKE '${DB_NAME}';" | grep ${DB_NAME} || echo "")

    if [ -z "$db_exists" ]; then
        log_info "创建数据库 ${DB_NAME}..."
        mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
        log_success "数据库创建完成"
    else
        log_info "数据库 ${DB_NAME} 已存在"
    fi

    # 初始化数据库表结构
    if [ -f "./database-init.sql" ]; then
        log_info "执行数据库初始化脚本..."
        mysql -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < ./database-init.sql
        log_success "数据库初始化完成"
    else
        log_warning "未找到数据库初始化脚本"
    fi
}

# 备份现有项目
backup_existing_project() {
    if [ -d "$PROJECT_PATH" ]; then
        log_info "备份现有项目..."
        backup_dir="/www/backup/${PROJECT_NAME}_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        cp -r "$PROJECT_PATH" "$backup_dir/"
        log_success "项目备份至: $backup_dir"
    fi
}

# 检查现有项目
check_existing_project() {
    log_info "检查现有项目..."
    if [ -d "$PROJECT_PATH" ]; then
        log_success "发现现有项目目录: $PROJECT_PATH"
        cd "$PROJECT_PATH" || exit 1

        # 检查是否为git仓库
        if [ -d ".git" ]; then
            log_info "检测到Git仓库，将更新代码"
        else
            log_info "初始化Git仓库"
            git init
            git remote add origin "$GITHUB_REPO" 2>/dev/null || git remote set-url origin "$GITHUB_REPO"
        fi
    else
        log_error "项目目录不存在: $PROJECT_PATH"
        log_info "请确认文件已正确上传到该目录"
        exit 1
    fi
}

# 克隆/更新项目代码
deploy_project() {
    log_info "部署项目代码..."
    cd "$PROJECT_PATH" || exit 1

    # 如果是git仓库，则拉取最新代码
    if [ -d ".git" ]; then
        log_info "更新现有代码..."
        git fetch origin 2>/dev/null || log_warning "无法连接到远程仓库，将使用现有文件"
        git reset --hard origin/main 2>/dev/null || log_warning "无法重置到远程分支，将使用现有文件"
        git clean -fd 2>/dev/null || true
    else
        log_info "文件已存在，跳过代码下载"
    fi

    log_success "项目代码检查完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    cd "$PROJECT_PATH" || exit 1

    # 清理现有依赖
    if [ -d "node_modules" ]; then
        rm -rf node_modules
    fi

    if [ -f "package-lock.json" ]; then
        rm -f package-lock.json
    fi

    # 安装依赖
    npm install --production

    log_success "依赖安装完成"
}

# 配置环境变量
setup_environment() {
    log_info "配置环境变量..."
    cd "$PROJECT_PATH" || exit 1

    # 创建.env.local文件
    cat > .env.local <<EOF
# Tushare API配置
TUSHARE_TOKEN=2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211

# 数据库配置
DATABASE_URL=mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# API配置
NEXT_PUBLIC_API_URL=https://${DOMAIN}

# 生产环境
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
EOF

    log_success "环境变量配置完成"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    cd "$PROJECT_PATH" || exit 1

    # 构建Next.js项目
    npm run build

    if [ $? -eq 0 ]; then
        log_success "项目构建成功"
    else
        log_error "项目构建失败"
        exit 1
    fi
}

# 配置PM2
setup_pm2() {
    log_info "配置PM2进程管理..."
    cd "$PROJECT_PATH" || exit 1

    # 创建PM2配置文件
    cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '${PM2_APP_NAME}',
    script: 'npm',
    args: 'start',
    cwd: '${PROJECT_PATH}',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/www/wwwroot/stock-tracker/logs/err.log',
    out_file: '/www/wwwroot/stock-tracker/logs/out.log',
    log_file: '/www/wwwroot/stock-tracker/logs/combined.log',
    time: true
  }]
};
EOF

    # 创建日志目录
    mkdir -p logs

    # 停止现有进程
    pm2 stop ${PM2_APP_NAME} 2>/dev/null || true
    pm2 delete ${PM2_APP_NAME} 2>/dev/null || true

    # 启动新进程
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup

    log_success "PM2配置完成"
}

# 配置Nginx
setup_nginx() {
    log_info "配置Nginx..."

    nginx_conf="/www/server/panel/vhost/nginx/${DOMAIN}.conf"

    cat > "$nginx_conf" <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    # SSL配置 (需要在宝塔面板中配置SSL证书)
    ssl_certificate /www/server/panel/vhost/cert/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
    ssl_prefer_server_ciphers on;

    # 日志配置
    access_log /www/wwwroot/stock-tracker/logs/access.log;
    error_log /www/wwwroot/stock-tracker/logs/error.log;

    # 根目录
    root ${PROJECT_PATH};
    index index.html index.htm index.js;

    # 静态文件缓存
    location /_next/static/ {
        alias ${PROJECT_PATH}/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 默认代理到Next.js应用
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # 错误页面
        error_page 502 503 504 /maintenance.html;
    }

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
EOF

    # 测试Nginx配置
    nginx -t

    if [ $? -eq 0 ]; then
        # 重启Nginx
        systemctl reload nginx
        log_success "Nginx配置完成"
    else
        log_error "Nginx配置有误"
        exit 1
    fi
}

# 设置定时任务
setup_crontab() {
    log_info "设置定时任务..."

    # 创建定时更新脚本
    cat > /www/server/cron/update_stock_tracker.sh <<EOF
#!/bin/bash
cd ${PROJECT_PATH}
git pull origin main
npm install --production
npm run build
pm2 restart ${PM2_APP_NAME}
echo "\$(date): Stock tracker updated" >> /www/server/cron/update.log
EOF

    chmod +x /www/server/cron/update_stock_tracker.sh

    # 添加到crontab (每天凌晨2点更新)
    (crontab -l 2>/dev/null; echo "0 2 * * * /www/server/cron/update_stock_tracker.sh") | crontab -

    log_success "定时任务设置完成"
}

# 设置防火墙
setup_firewall() {
    log_info "配置防火墙..."

    # 开放必要端口
    firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
    firewall-cmd --permanent --add-port=443/tcp 2>/dev/null || true
    firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true

    log_success "防火墙配置完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."

    # 等待服务启动
    sleep 10

    # 检查PM2进程
    pm2_status=$(pm2 list | grep ${PM2_APP_NAME} | grep online || echo "")
    if [ -n "$pm2_status" ]; then
        log_success "PM2进程运行正常"
    else
        log_error "PM2进程启动失败"
        pm2 logs ${PM2_APP_NAME} --lines 20
    fi

    # 检查端口监听
    if netstat -tlnp | grep :3000 > /dev/null; then
        log_success "端口3000监听正常"
    else
        log_error "端口3000未监听"
    fi

    # 检查HTTP响应
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
        log_success "HTTP服务响应正常"
    else
        log_warning "HTTP服务响应异常，请检查日志"
    fi
}

# 生成部署报告
generate_report() {
    report_file="/www/wwwroot/${DOMAIN}/logs/deploy_report_$(date +%Y%m%d_%H%M%S).md"

    cat > "$report_file" <<EOF
# 股票追踪系统部署报告

## 部署信息
- **部署时间**: $(date '+%Y-%m-%d %H:%M:%S')
- **项目路径**: ${PROJECT_PATH}
- **域名**: ${DOMAIN}
- **Node.js版本**: $(node --version)
- **PM2版本**: $(pm2 --version)

## 服务状态
- **MySQL**: $(systemctl is-active mysql mysqld 2>/dev/null || echo "未知")
- **Nginx**: $(systemctl is-active nginx)
- **PM2进程**: $(pm2 list | grep ${PM2_APP_NAME} | awk '{print $10}' || echo "未启动")

## 配置文件
- **环境变量**: ${PROJECT_PATH}/.env.local
- **PM2配置**: ${PROJECT_PATH}/ecosystem.config.js
- **Nginx配置**: /www/server/panel/vhost/nginx/${DOMAIN}.conf

## 日志文件
- **PM2日志**: ${PROJECT_PATH}/logs/
- **Nginx访问日志**: ${PROJECT_PATH}/logs/access.log
- **Nginx错误日志**: ${PROJECT_PATH}/logs/error.log

## 访问地址
- **主站**: https://${DOMAIN}
- **API**: https://${DOMAIN}/api/stocks?date=\$(date +%Y-%m-%d)

## 管理命令
\`\`\`bash
# 查看PM2状态
pm2 status

# 重启应用
pm2 restart ${PM2_APP_NAME}

# 查看日志
pm2 logs ${PM2_APP_NAME}

# 更新代码
cd ${PROJECT_PATH} && git pull && npm install && npm run build && pm2 restart ${PM2_APP_NAME}
\`\`\`

## 故障排除
1. **服务无法启动**: 检查PM2日志和环境变量配置
2. **数据库连接失败**: 检查MySQL服务状态和数据库配置
3. **API无响应**: 检查Tushare Token是否有效
4. **域名无法访问**: 检查Nginx配置和SSL证书

---
*报告生成时间: $(date '+%Y-%m-%d %H:%M:%S')*
EOF

    log_success "部署报告已生成: $report_file"
}

# GitHub同步配置
setup_github_sync() {
    log_info "配置GitHub同步..."
    cd "$PROJECT_PATH" || exit 1

    # 配置Git用户信息（如果未配置）
    if [ -z "$(git config --global user.name)" ]; then
        git config --global user.name "Stock Tracker Bot"
        git config --global user.email "bot@${DOMAIN}"
    fi

    # 设置远程仓库
    git remote set-url origin "$GITHUB_REPO"

    # 创建同步脚本
    cat > sync_from_github.sh <<EOF
#!/bin/bash

# GitHub到服务器同步脚本
log_info() {
    echo "[INFO] \$(date '+%Y-%m-%d %H:%M:%S') - \$1"
}

log_error() {
    echo "[ERROR] \$(date '+%Y-%m-%d %H:%M:%S') - \$1"
}

cd ${PROJECT_PATH}

log_info "开始从GitHub同步代码..."

# 备份本地修改
if [ -n "\$(git status --porcelain)" ]; then
    log_info "备份本地修改..."
    git stash push -m "auto-backup-\$(date '+%Y%m%d_%H%M%S')"
fi

# 拉取最新代码
log_info "拉取GitHub最新代码..."
git fetch origin
git reset --hard origin/main

# 安装依赖
log_info "安装/更新依赖..."
npm install --production

# 构建项目
log_info "构建项目..."
npm run build

if [ \$? -eq 0 ]; then
    # 重启服务
    log_info "重启PM2服务..."
    pm2 restart ${PM2_APP_NAME}
    log_info "同步完成!"
else
    log_error "构建失败，请检查代码"
    exit 1
fi
EOF

    chmod +x sync_from_github.sh

    log_success "GitHub同步配置完成"
    log_info "手动同步命令: cd ${PROJECT_PATH} && ./sync_from_github.sh"
}

# 主函数
main() {
    log_info "开始部署股票追踪系统..."
    log_info "目标域名: $DOMAIN"
    log_info "项目路径: $PROJECT_PATH"

    # 检查运行权限
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用root权限运行此脚本"
        exit 1
    fi

    # 执行部署步骤
    check_baota_panel
    check_nodejs
    check_mysql
    check_existing_project
    backup_existing_project
    deploy_project
    install_dependencies
    setup_environment
    build_project
    setup_database
    setup_pm2
    setup_nginx
    setup_crontab
    setup_firewall
    setup_github_sync
    health_check
    generate_report

    log_success "========================================="
    log_success "股票追踪系统部署完成!"
    log_success "========================================="
    log_info "访问地址: https://${DOMAIN}"
    log_info "管理面板: https://${DOMAIN}:8888"
    log_info "PM2监控: pm2 monit"
    log_info "部署报告: ${PROJECT_PATH}/logs/deploy_report_*.md"
    log_success "========================================="
}

# 脚本入口
main "$@"