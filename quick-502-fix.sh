#!/bin/bash
# 502 错误快速修复 - 单命令版本
# 在服务器上运行: curl -sSL https://raw.githubusercontent.com/yourusername/stock-tracker/main/quick-502-fix.sh | bash
# 或直接复制粘贴此脚本内容到服务器终端

echo "开始修复 502 错误..."

# 1. 进入项目目录
cd /www/wwwroot/stock-tracker || { echo "错误: 项目目录不存在"; exit 1; }

# 2. 检查容器
echo "检查容器状态..."
docker compose ps | grep -q "Up" || { echo "启动容器..."; docker compose up -d; sleep 5; }

# 3. 测试应用
echo "测试应用..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 | grep -q "200" || { echo "错误: 应用无响应"; docker compose logs --tail=20; exit 1; }

# 4. 更新 Nginx 配置
echo "更新 Nginx 配置..."
cat > /www/server/panel/vhost/nginx/bk.yushuo.click.conf << 'NGINX_EOF'
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX_EOF

# 5. 测试并重启 Nginx
echo "重启 Nginx..."
nginx -t && systemctl reload nginx || { echo "错误: Nginx 配置有误"; exit 1; }

# 6. 验证
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://bk.yushuo.click)
echo ""
echo "=========================================="
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ 修复成功! 网站已恢复正常"
    echo "  状态码: $HTTP_CODE"
    echo "  访问: http://bk.yushuo.click"
else
    echo "✗ 网站返回状态码: $HTTP_CODE"
    echo "  查看错误日志:"
    echo "  tail -20 /www/wwwlogs/bk.yushuo.click.error.log"
fi
echo "=========================================="