#!/bin/bash
# 502 Bad Gateway 自动修复脚本
# Run this on the server: yushuo.click
# Location: /www/wwwroot/stock-tracker

set -e

echo "=================================================="
echo "502 Bad Gateway 自动修复脚本"
echo "开始时间: $(date)"
echo "=================================================="
echo ""

# 切换到项目目录
cd /www/wwwroot/stock-tracker || exit 1

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 步骤 1: 检查 Docker 容器状态
log_info "步骤 1: 检查 Docker 容器状态..."
if docker compose ps | grep -q "stock-tracker.*Up"; then
    log_info "✓ Docker 容器正在运行"
else
    log_warn "Docker 容器未运行，尝试启动..."
    docker compose up -d
    sleep 5
fi

# 步骤 2: 测试应用本地访问
log_info "步骤 2: 测试应用本地访问..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 | grep -q "200"; then
    log_info "✓ 应用在 localhost:3002 正常响应"
else
    log_error "✗ 应用无法访问，检查容器日志:"
    docker compose logs --tail=50 stock-tracker
    exit 1
fi

# 步骤 3: 检查 Nginx 配置文件
log_info "步骤 3: 检查 Nginx 配置文件..."

NGINX_CONFIG=""
if [ -f /www/server/panel/vhost/nginx/bk.yushuo.click.conf ]; then
    NGINX_CONFIG="/www/server/panel/vhost/nginx/bk.yushuo.click.conf"
elif [ -f /www/server/nginx/vhost/bk.yushuo.click.conf ]; then
    NGINX_CONFIG="/www/server/nginx/vhost/bk.yushuo.click.conf"
elif [ -f /etc/nginx/sites-available/bk.yushuo.click ]; then
    NGINX_CONFIG="/etc/nginx/sites-available/bk.yushuo.click"
elif [ -f /etc/nginx/conf.d/bk.yushuo.click.conf ]; then
    NGINX_CONFIG="/etc/nginx/conf.d/bk.yushuo.click.conf"
fi

if [ -z "$NGINX_CONFIG" ]; then
    log_warn "未找到 Nginx 配置文件，创建新配置..."

    # 确定配置文件位置
    if [ -d /www/server/panel/vhost/nginx ]; then
        NGINX_CONFIG="/www/server/panel/vhost/nginx/bk.yushuo.click.conf"
    elif [ -d /www/server/nginx/vhost ]; then
        NGINX_CONFIG="/www/server/nginx/vhost/bk.yushuo.click.conf"
    elif [ -d /etc/nginx/conf.d ]; then
        NGINX_CONFIG="/etc/nginx/conf.d/bk.yushuo.click.conf"
    else
        log_error "无法确定 Nginx 配置目录"
        exit 1
    fi

    log_info "创建配置文件: $NGINX_CONFIG"
else
    log_info "找到配置文件: $NGINX_CONFIG"
    log_info "备份现有配置..."
    cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 步骤 4: 创建正确的 Nginx 配置
log_info "步骤 4: 写入正确的 Nginx 配置..."

cat > "$NGINX_CONFIG" << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name bk.yushuo.click;

    access_log /www/wwwlogs/bk.yushuo.click.access.log;
    error_log /www/wwwlogs/bk.yushuo.click.error.log;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 缓冲区设置
        proxy_buffer_size 4k;
        proxy_buffers 4 32k;
        proxy_busy_buffers_size 64k;
        proxy_temp_file_write_size 64k;
    }

    # API 路由特殊处理
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # API 超时设置（更长）
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3002;
        proxy_cache_valid 200 7d;
        proxy_cache_valid 404 1m;
        add_header Cache-Control "public, max-age=604800";
    }
}
EOF

log_info "✓ Nginx 配置已更新"

# 步骤 5: 测试 Nginx 配置
log_info "步骤 5: 测试 Nginx 配置..."
if nginx -t 2>&1; then
    log_info "✓ Nginx 配置语法正确"
else
    log_error "✗ Nginx 配置语法错误"
    nginx -t
    exit 1
fi

# 步骤 6: 检查 SELinux
log_info "步骤 6: 检查 SELinux..."
if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce)
    if [ "$SELINUX_STATUS" = "Enforcing" ]; then
        log_warn "SELinux 处于 Enforcing 模式，设置允许 Nginx 网络连接..."
        setsebool -P httpd_can_network_connect 1 2>/dev/null || log_warn "无法设置 SELinux 布尔值（可能需要 root 权限）"
    fi
else
    log_info "系统未安装 SELinux"
fi

# 步骤 7: 重启 Nginx
log_info "步骤 7: 重启 Nginx..."
if systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null; then
    log_info "✓ Nginx 已重启"
else
    log_error "✗ Nginx 重启失败"
    systemctl status nginx --no-pager
    exit 1
fi

# 等待 Nginx 完全启动
sleep 2

# 步骤 8: 测试外部访问
log_info "步骤 8: 测试外部访问..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://bk.yushuo.click)
if [ "$HTTP_CODE" = "200" ]; then
    log_info "✓ 网站访问正常！HTTP 状态码: $HTTP_CODE"
else
    log_warn "网站返回状态码: $HTTP_CODE"
    log_info "检查 Nginx 错误日志:"
    tail -20 /www/wwwlogs/bk.yushuo.click.error.log 2>/dev/null || tail -20 /var/log/nginx/error.log
fi

# 步骤 9: 显示状态总结
echo ""
echo "=================================================="
echo "修复完成 - 状态总结"
echo "=================================================="
echo "1. Docker 容器状态:"
docker compose ps | grep stock-tracker
echo ""
echo "2. 应用本地访问:"
curl -I http://localhost:3002 2>&1 | head -1
echo ""
echo "3. Nginx 配置文件: $NGINX_CONFIG"
echo ""
echo "4. Nginx 状态:"
systemctl status nginx --no-pager | head -3
echo ""
echo "5. 网站外部访问 (http://bk.yushuo.click):"
curl -I http://bk.yushuo.click 2>&1 | head -1
echo ""
echo "=================================================="
echo "完成时间: $(date)"
echo "=================================================="
echo ""
echo "如果问题仍然存在，请运行诊断脚本:"
echo "  ./diagnose-502-error.sh > diagnostic-output.txt"
echo ""
echo "查看实时错误日志:"
echo "  tail -f /www/wwwlogs/bk.yushuo.click.error.log"
echo ""