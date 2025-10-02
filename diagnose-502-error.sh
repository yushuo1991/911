#!/bin/bash
# 502 Bad Gateway Diagnostic Script
# Run this on the server: yushuo.click
# Location: /www/wwwroot/stock-tracker

echo "=================================================="
echo "502 Bad Gateway Diagnostic Report"
echo "Generated: $(date)"
echo "=================================================="
echo ""

cd /www/wwwroot/stock-tracker || exit 1

echo "=== 1. Docker Container Status ==="
docker compose ps
echo ""

echo "=== 2. Application Logs (Last 100 lines) ==="
docker compose logs --tail=100 stock-tracker
echo ""

echo "=== 3. Local Access Test ==="
curl -I http://localhost:3002
echo ""

echo "=== 4. Port Listening Status ==="
netstat -tlnp | grep 3002
echo ""

echo "=== 5. Container IP Address ==="
docker inspect stock-tracker-app | grep -A 5 "IPAddress"
echo ""

echo "=== 6. Container Network Details ==="
docker network inspect stock-tracker_default 2>/dev/null || docker network inspect stock-tracker_stock-network 2>/dev/null || echo "Network not found"
echo ""

echo "=== 7. Nginx Config Files ==="
ls -lh /www/server/panel/vhost/nginx/ 2>/dev/null | grep -i yushuo || echo "Panel vhost not found"
ls -lh /www/server/nginx/vhost/ 2>/dev/null | grep -i yushuo || echo "Nginx vhost not found"
ls -lh /etc/nginx/sites-available/ 2>/dev/null | grep -i yushuo || echo "Sites-available not found"
ls -lh /etc/nginx/conf.d/ 2>/dev/null | grep -i yushuo || echo "Conf.d not found"
echo ""

echo "=== 8. Nginx Configuration for bk.yushuo.click ==="
if [ -f /www/server/panel/vhost/nginx/bk.yushuo.click.conf ]; then
    echo "Found: /www/server/panel/vhost/nginx/bk.yushuo.click.conf"
    cat /www/server/panel/vhost/nginx/bk.yushuo.click.conf
elif [ -f /www/server/nginx/vhost/bk.yushuo.click.conf ]; then
    echo "Found: /www/server/nginx/vhost/bk.yushuo.click.conf"
    cat /www/server/nginx/vhost/bk.yushuo.click.conf
elif [ -f /etc/nginx/sites-available/bk.yushuo.click ]; then
    echo "Found: /etc/nginx/sites-available/bk.yushuo.click"
    cat /etc/nginx/sites-available/bk.yushuo.click
elif [ -f /etc/nginx/conf.d/bk.yushuo.click.conf ]; then
    echo "Found: /etc/nginx/conf.d/bk.yushuo.click.conf"
    cat /etc/nginx/conf.d/bk.yushuo.click.conf
else
    echo "ERROR: Nginx config file not found!"
fi
echo ""

echo "=== 9. Nginx Configuration Test ==="
nginx -t
echo ""

echo "=== 10. Nginx Status ==="
systemctl status nginx --no-pager
echo ""

echo "=== 11. Nginx Error Logs (Last 50 lines) ==="
if [ -f /www/wwwlogs/bk.yushuo.click.error.log ]; then
    echo "From: /www/wwwlogs/bk.yushuo.click.error.log"
    tail -50 /www/wwwlogs/bk.yushuo.click.error.log
elif [ -f /var/log/nginx/error.log ]; then
    echo "From: /var/log/nginx/error.log"
    tail -50 /var/log/nginx/error.log
else
    echo "No error logs found"
fi
echo ""

echo "=== 12. Nginx Access Logs (Last 20 lines) ==="
if [ -f /www/wwwlogs/bk.yushuo.click.access.log ]; then
    echo "From: /www/wwwlogs/bk.yushuo.click.access.log"
    tail -20 /www/wwwlogs/bk.yushuo.click.access.log
elif [ -f /var/log/nginx/access.log ]; then
    echo "From: /var/log/nginx/access.log"
    tail -20 /var/log/nginx/access.log | grep bk.yushuo
else
    echo "No access logs found"
fi
echo ""

echo "=== 13. Full Curl Test to Localhost ==="
curl -v http://localhost:3002 2>&1 | head -50
echo ""

echo "=== 14. Docker Container Health Check ==="
docker inspect stock-tracker-app --format='{{json .State.Health}}' 2>/dev/null || echo "No health check configured"
echo ""

echo "=== 15. Available Ports ==="
netstat -tlnp | grep -E ':(80|443|3002|3306)'
echo ""

echo "=================================================="
echo "Diagnostic Complete"
echo "=================================================="