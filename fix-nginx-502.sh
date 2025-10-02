#!/bin/bash
# Nginx 502 Bad Gateway Fix Script
# Server: yushuo.click (75.2.60.5)
# Domain: bk.yushuo.click
# Generated: 2025-09-30

echo "=================================="
echo "Nginx 502 Bad Gateway Fix Script"
echo "=================================="
echo ""

# Step 1: Check Docker container status
echo "Step 1: Checking Docker container status..."
docker ps | grep stock-tracker
CONTAINER_STATUS=$?

if [ $CONTAINER_STATUS -eq 0 ]; then
    echo "✓ Docker container is running"
else
    echo "✗ Docker container is NOT running"
    echo "  Starting container..."
    cd /www/wwwroot/stock-tracker && docker-compose up -d
fi

# Step 2: Verify local access
echo ""
echo "Step 2: Testing local access to port 3002..."
LOCAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002)
echo "Local access status: $LOCAL_TEST"

if [ "$LOCAL_TEST" = "200" ]; then
    echo "✓ Application is responding locally"
else
    echo "✗ Application is NOT responding locally"
    echo "  Check Docker logs: docker logs stock-tracker-app"
fi

# Step 3: Check existing Nginx configurations
echo ""
echo "Step 3: Checking Nginx configuration directories..."
echo ""

NGINX_DIRS=(
    "/www/server/panel/vhost/nginx"
    "/www/server/nginx/vhost"
    "/etc/nginx/sites-available"
    "/etc/nginx/conf.d"
)

NGINX_DIR=""
for dir in "${NGINX_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "Found: $dir"
        NGINX_DIR="$dir"
        break
    fi
done

if [ -z "$NGINX_DIR" ]; then
    echo "✗ No standard Nginx directory found!"
    echo "  Please check: nginx -V 2>&1 | grep 'conf-path'"
    exit 1
fi

echo "Using Nginx directory: $NGINX_DIR"

# Step 4: Backup existing configuration if it exists
CONFIG_FILE="$NGINX_DIR/bk.yushuo.click.conf"
echo ""
echo "Step 4: Configuration file: $CONFIG_FILE"

if [ -f "$CONFIG_FILE" ]; then
    echo "Backing up existing configuration..."
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✓ Backup created"
fi

# Step 5: Create/Update Nginx configuration
echo ""
echo "Step 5: Creating Nginx configuration..."

cat > "$CONFIG_FILE" << 'NGINX_EOF'
server {
    listen 80;
    server_name bk.yushuo.click;

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

        # Additional timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    access_log /www/wwwlogs/bk.yushuo.click.log;
    error_log /www/wwwlogs/bk.yushuo.click.error.log;
}
NGINX_EOF

echo "✓ Configuration file created/updated"

# Step 6: Test Nginx configuration
echo ""
echo "Step 6: Testing Nginx configuration..."
nginx -t
NGINX_TEST=$?

if [ $NGINX_TEST -eq 0 ]; then
    echo "✓ Nginx configuration is valid"
else
    echo "✗ Nginx configuration has errors!"
    echo "  Please review the errors above"
    exit 1
fi

# Step 7: Check SELinux (if applicable)
echo ""
echo "Step 7: Checking SELinux..."
if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce 2>/dev/null)
    echo "SELinux status: $SELINUX_STATUS"

    if [ "$SELINUX_STATUS" = "Enforcing" ]; then
        echo "Setting SELinux boolean for Nginx proxy..."
        setsebool -P httpd_can_network_connect 1
        echo "✓ SELinux configured"
    fi
else
    echo "SELinux not installed or not applicable"
fi

# Step 8: Reload Nginx
echo ""
echo "Step 8: Reloading Nginx..."
if systemctl reload nginx 2>/dev/null; then
    echo "✓ Nginx reloaded successfully (systemctl)"
elif nginx -s reload 2>/dev/null; then
    echo "✓ Nginx reloaded successfully (nginx -s)"
else
    echo "Attempting to restart Nginx..."
    systemctl restart nginx
fi

# Step 9: Verify Nginx is running
echo ""
echo "Step 9: Verifying Nginx status..."
systemctl status nginx --no-pager -l

# Step 10: Test external access
echo ""
echo "Step 10: Testing external access..."
sleep 2
EXTERNAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://bk.yushuo.click)
echo "External access status: $EXTERNAL_TEST"

if [ "$EXTERNAL_TEST" = "200" ]; then
    echo "✓ External access is working!"
else
    echo "✗ External access returned: $EXTERNAL_TEST"
    echo ""
    echo "Checking error logs..."
    tail -20 /www/wwwlogs/bk.yushuo.click.error.log 2>/dev/null || tail -20 /var/log/nginx/error.log
fi

# Step 11: Additional diagnostics
echo ""
echo "Step 11: Additional diagnostics..."
echo ""
echo "Listening ports:"
netstat -tlnp | grep -E '(:80|:3002)'

echo ""
echo "Docker container details:"
docker inspect stock-tracker-app | grep -A 10 "Ports"

# Summary
echo ""
echo "=================================="
echo "Summary"
echo "=================================="
echo "Configuration file: $CONFIG_FILE"
echo "Docker container: $(docker ps --filter name=stock-tracker-app --format '{{.Status}}')"
echo "Local access (3002): $LOCAL_TEST"
echo "External access (80): $EXTERNAL_TEST"
echo ""

if [ "$EXTERNAL_TEST" = "200" ]; then
    echo "🎉 SUCCESS! The 502 error has been fixed!"
    echo "Visit: http://bk.yushuo.click"
else
    echo "⚠️  Issue persists. Please check the logs above."
    echo ""
    echo "Manual troubleshooting commands:"
    echo "  docker logs stock-tracker-app"
    echo "  tail -50 /www/wwwlogs/bk.yushuo.click.error.log"
    echo "  curl -v http://localhost:3002"
fi

echo ""
echo "=================================="