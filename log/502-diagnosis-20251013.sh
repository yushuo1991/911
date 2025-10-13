#!/bin/bash

# 502 Bad Gateway 诊断脚本
# 生成时间: 2025-10-13
# 用途: 全面诊断服务器502错误原因

echo "=========================================="
echo "502 Bad Gateway 诊断脚本"
echo "开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

# 诊断日志文件
LOG_DIR="/www/wwwroot/stock-tracker/log"
LOG_FILE="$LOG_DIR/502-diagnosis-$(date +%Y%m%d-%H%M%S).log"

# 确保log目录存在
mkdir -p "$LOG_DIR"

# 函数: 写入日志
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "1. Docker容器状态检查"
log "=========================================="
log ""

# 检查Docker服务
log "1.1 检查Docker服务状态:"
if systemctl is-active --quiet docker; then
    log "✅ Docker服务运行正常"
else
    log "❌ Docker服务未运行!"
    log "修复命令: systemctl start docker"
fi
log ""

# 检查容器状态
log "1.2 检查stock-tracker容器状态:"
CONTAINER_STATUS=$(docker ps -a --filter "name=stock-tracker" --format "{{.Names}}\t{{.Status}}\t{{.Ports}}")
if [ -z "$CONTAINER_STATUS" ]; then
    log "❌ 未找到stock-tracker容器!"
    log "可能原因: docker compose up -d 未执行"
else
    log "$CONTAINER_STATUS"

    # 检查容器是否运行
    if docker ps --filter "name=stock-tracker-app" | grep -q "stock-tracker-app"; then
        log "✅ stock-tracker-app容器运行中"
    else
        log "❌ stock-tracker-app容器未运行!"
        log "修复命令: docker compose up -d"
    fi

    if docker ps --filter "name=stock-tracker-mysql" | grep -q "stock-tracker-mysql"; then
        log "✅ stock-tracker-mysql容器运行中"
    else
        log "❌ stock-tracker-mysql容器未运行!"
        log "修复命令: docker compose up -d"
    fi
fi
log ""

# 检查容器日志
log "1.3 检查应用容器最近日志(最近30行):"
if docker ps --filter "name=stock-tracker-app" | grep -q "stock-tracker-app"; then
    docker logs --tail 30 stock-tracker-app 2>&1 | tee -a "$LOG_FILE"
else
    log "容器未运行,无法获取日志"
fi
log ""

log "=========================================="
log "2. 端口监听检查"
log "=========================================="
log ""

# 检查端口
log "2.1 检查3002端口(应用端口):"
if netstat -tuln | grep -q ":3002 "; then
    log "✅ 端口3002正在监听"
    netstat -tuln | grep ":3002 " | tee -a "$LOG_FILE"
else
    log "❌ 端口3002未监听!"
    log "可能原因: 应用容器未启动或内部端口映射失败"
fi
log ""

log "2.2 检查3306端口(MySQL端口):"
if netstat -tuln | grep -q ":3306 "; then
    log "✅ 端口3306正在监听"
    netstat -tuln | grep ":3306 " | tee -a "$LOG_FILE"
else
    log "❌ 端口3306未监听!"
    log "可能原因: MySQL容器未启动"
fi
log ""

log "=========================================="
log "3. Nginx配置检查"
log "=========================================="
log ""

# 检查Nginx配置
log "3.1 检查Nginx服务状态:"
if systemctl is-active --quiet nginx; then
    log "✅ Nginx服务运行正常"
else
    log "❌ Nginx服务未运行!"
    log "修复命令: systemctl start nginx"
fi
log ""

log "3.2 检查Nginx配置文件:"
NGINX_CONF="/www/server/nginx/conf/nginx.conf"
if [ -f "$NGINX_CONF" ]; then
    log "✅ Nginx主配置文件存在"

    # 检查配置语法
    nginx -t 2>&1 | tee -a "$LOG_FILE"
else
    log "❌ Nginx配置文件不存在!"
fi
log ""

log "3.3 检查bk.yushuo.click反向代理配置:"
VHOST_CONF="/www/server/nginx/conf/vhost/bk.yushuo.click.conf"
if [ -f "$VHOST_CONF" ]; then
    log "✅ 虚拟主机配置文件存在"
    log ""
    log "配置内容:"
    cat "$VHOST_CONF" | tee -a "$LOG_FILE"
    log ""

    # 检查proxy_pass配置
    if grep -q "proxy_pass.*3002" "$VHOST_CONF"; then
        log "✅ 反向代理配置指向3002端口"
    else
        log "❌ 反向代理配置可能有误!"
    fi
else
    log "❌ 虚拟主机配置文件不存在!"
    log "路径: $VHOST_CONF"
fi
log ""

log "=========================================="
log "4. 应用健康检查"
log "=========================================="
log ""

# 测试本地API
log "4.1 测试本地API响应(localhost:3002):"
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3002/api/stocks?date=$(date +%Y-%m-%d)&mode=7days" 2>&1)
if [ "$API_RESPONSE" = "200" ]; then
    log "✅ API响应正常 (HTTP 200)"
else
    log "❌ API响应异常 (HTTP $API_RESPONSE)"
    log "可能原因: 应用内部错误"
fi
log ""

log "4.2 测试API详细响应:"
curl -s "http://localhost:3002/api/stocks?date=$(date +%Y-%m-%d)&mode=7days" 2>&1 | head -c 500 | tee -a "$LOG_FILE"
log ""
log ""

log "=========================================="
log "5. 数据库连接检查"
log "=========================================="
log ""

# 检查MySQL连接
log "5.1 检查MySQL容器状态:"
if docker ps --filter "name=stock-tracker-mysql" | grep -q "stock-tracker-mysql"; then
    log "✅ MySQL容器运行中"

    # 测试数据库连接
    log ""
    log "5.2 测试数据库连接:"
    docker exec stock-tracker-mysql mysql -uroot -proot123 -e "SELECT 1" 2>&1 | tee -a "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log "✅ 数据库连接正常"
    else
        log "❌ 数据库连接失败!"
    fi
else
    log "❌ MySQL容器未运行!"
fi
log ""

log "=========================================="
log "6. 磁盘空间检查"
log "=========================================="
log ""

# 检查磁盘空间
log "6.1 检查磁盘使用情况:"
df -h | tee -a "$LOG_FILE"
log ""

# 检查是否磁盘满
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    log "⚠️ 警告: 磁盘使用率超过90% ($DISK_USAGE%)"
    log "建议: 清理Docker镜像和日志"
    log "命令: docker system prune -a"
else
    log "✅ 磁盘空间充足 ($DISK_USAGE%)"
fi
log ""

log "=========================================="
log "7. 系统资源检查"
log "=========================================="
log ""

# 检查内存
log "7.1 检查内存使用:"
free -h | tee -a "$LOG_FILE"
log ""

# 检查CPU
log "7.2 检查CPU使用:"
top -bn1 | head -n 5 | tee -a "$LOG_FILE"
log ""

log "=========================================="
log "8. 网络连接检查"
log "=========================================="
log ""

# 检查容器间网络
log "8.1 检查Docker网络:"
docker network ls | tee -a "$LOG_FILE"
log ""

log "8.2 检查stock-tracker网络:"
if docker network inspect stock-tracker_default > /dev/null 2>&1; then
    log "✅ stock-tracker网络存在"
    docker network inspect stock-tracker_default --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}' | tee -a "$LOG_FILE"
else
    log "❌ stock-tracker网络不存在!"
fi
log ""

log "=========================================="
log "9. 最近系统日志"
log "=========================================="
log ""

# 检查系统日志
log "9.1 最近系统错误日志(最近20行):"
journalctl -xe --no-pager | tail -n 20 | tee -a "$LOG_FILE"
log ""

log "=========================================="
log "10. 诊断总结"
log "=========================================="
log ""

# 总结问题
log "问题总结:"
log ""

# 检查各模块状态
ISSUES_FOUND=0

# Docker检查
if ! systemctl is-active --quiet docker; then
    log "❌ [关键] Docker服务未运行"
    log "   修复: systemctl start docker"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# 容器检查
if ! docker ps --filter "name=stock-tracker-app" | grep -q "stock-tracker-app"; then
    log "❌ [关键] 应用容器未运行"
    log "   修复: docker compose up -d"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if ! docker ps --filter "name=stock-tracker-mysql" | grep -q "stock-tracker-mysql"; then
    log "❌ [关键] 数据库容器未运行"
    log "   修复: docker compose up -d"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# 端口检查
if ! netstat -tuln | grep -q ":3002 "; then
    log "❌ [关键] 端口3002未监听"
    log "   可能原因: 应用容器内部启动失败"
    log "   排查: docker logs stock-tracker-app"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Nginx检查
if ! systemctl is-active --quiet nginx; then
    log "❌ [关键] Nginx服务未运行"
    log "   修复: systemctl start nginx"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# API检查
if [ "$API_RESPONSE" != "200" ]; then
    log "❌ [关键] API响应异常 (HTTP $API_RESPONSE)"
    log "   排查: docker logs stock-tracker-app"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ $ISSUES_FOUND -eq 0 ]; then
    log "✅ 未发现明显问题,502错误可能是暂时性的"
    log ""
    log "建议操作:"
    log "1. 重启Nginx: systemctl restart nginx"
    log "2. 重启容器: docker compose restart"
    log "3. 清除浏览器缓存并强制刷新"
else
    log ""
    log "发现 $ISSUES_FOUND 个问题,请按照上述修复建议操作"
fi

log ""
log "=========================================="
log "诊断完成"
log "完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
log "日志文件: $LOG_FILE"
log "=========================================="

echo ""
echo "诊断报告已保存到: $LOG_FILE"
echo ""
echo "建议: 执行修复脚本 ./server-fix-502.sh"
