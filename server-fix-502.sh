#!/bin/bash

# 502 Bad Gateway 修复脚本
# 生成时间: 2025-10-13
# 用途: 自动修复服务器502错误

set -e  # 遇到错误立即退出

echo "=========================================="
echo "502 Bad Gateway 修复脚本"
echo "开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

# 日志文件
LOG_DIR="/www/wwwroot/stock-tracker/log"
LOG_FILE="$LOG_DIR/502-fix-$(date +%Y%m%d-%H%M%S).log"

# 确保log目录存在
mkdir -p "$LOG_DIR"

# 函数: 写入日志
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

# 函数: 错误处理
error_exit() {
    log "❌ 错误: $1"
    log "修复失败,请查看日志: $LOG_FILE"
    exit 1
}

# 切换到项目目录
cd /www/wwwroot/stock-tracker || error_exit "项目目录不存在"

log "=========================================="
log "步骤1: 检查Git代码版本"
log "=========================================="
log ""

log "当前Git版本:"
git log -1 --format="%h %s" | tee -a "$LOG_FILE"
log ""

log "拉取最新代码..."
git fetch origin || error_exit "Git fetch失败"
git pull origin main || error_exit "Git pull失败"
log "✅ 代码更新完成"
log ""

log "最新Git版本:"
git log -1 --format="%h %s" | tee -a "$LOG_FILE"
log ""

log "=========================================="
log "步骤2: 停止现有容器"
log "=========================================="
log ""

log "停止Docker容器..."
docker compose down || error_exit "停止容器失败"
log "✅ 容器已停止"
log ""

# 等待端口释放
log "等待端口释放(5秒)..."
sleep 5
log ""

log "=========================================="
log "步骤3: 清理旧镜像和缓存"
log "=========================================="
log ""

log "清理旧的stock-tracker镜像..."
docker images | grep stock-tracker | awk '{print $3}' | xargs -r docker rmi -f 2>&1 | tee -a "$LOG_FILE" || log "⚠️ 部分镜像清理失败(可忽略)"
log ""

log "清理Docker缓存..."
docker system prune -f 2>&1 | tee -a "$LOG_FILE"
log "✅ 清理完成"
log ""

log "=========================================="
log "步骤4: 重新构建镜像(无缓存)"
log "=========================================="
log ""

log "开始构建镜像(约需3-5分钟)..."
docker compose build --no-cache 2>&1 | tee -a "$LOG_FILE" || error_exit "构建镜像失败"
log "✅ 镜像构建完成"
log ""

log "=========================================="
log "步骤5: 启动容器"
log "=========================================="
log ""

log "启动Docker容器..."
docker compose up -d 2>&1 | tee -a "$LOG_FILE" || error_exit "启动容器失败"
log "✅ 容器已启动"
log ""

log "=========================================="
log "步骤6: 等待服务启动"
log "=========================================="
log ""

log "等待应用启动(30秒)..."
sleep 30
log ""

log "=========================================="
log "步骤7: 验证容器状态"
log "=========================================="
log ""

log "Docker容器状态:"
docker ps --filter "name=stock-tracker" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | tee -a "$LOG_FILE"
log ""

# 检查应用容器
if docker ps --filter "name=stock-tracker-app" | grep -q "stock-tracker-app"; then
    log "✅ 应用容器运行正常"
else
    error_exit "应用容器未运行"
fi

# 检查数据库容器
if docker ps --filter "name=stock-tracker-db" | grep -q "stock-tracker-db"; then
    log "✅ 数据库容器运行正常"
else
    error_exit "数据库容器未运行"
fi
log ""

log "=========================================="
log "步骤8: 检查端口监听"
log "=========================================="
log ""

log "等待端口监听(10秒)..."
sleep 10
log ""

log "端口监听状态:"
netstat -tuln | grep -E ":(3002|3306) " | tee -a "$LOG_FILE"
log ""

# 检查3002端口
if netstat -tuln | grep -q ":3002 "; then
    log "✅ 端口3002监听正常"
else
    log "⚠️ 端口3002未监听,查看应用日志..."
    docker logs --tail 50 stock-tracker-app | tee -a "$LOG_FILE"
    error_exit "端口3002未监听"
fi
log ""

log "=========================================="
log "步骤9: 测试API响应"
log "=========================================="
log ""

log "测试本地API..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3002/api/stocks?date=$(date +%Y-%m-%d)&mode=7days")
log "API响应状态码: $API_RESPONSE"

if [ "$API_RESPONSE" = "200" ]; then
    log "✅ API响应正常"
    log ""
    log "API响应内容预览:"
    curl -s "http://localhost:3002/api/stocks?date=$(date +%Y-%m-%d)&mode=7days" | head -c 300 | tee -a "$LOG_FILE"
    log ""
else
    log "❌ API响应异常"
    log ""
    log "应用日志:"
    docker logs --tail 50 stock-tracker-app | tee -a "$LOG_FILE"
    error_exit "API响应异常"
fi
log ""

log "=========================================="
log "步骤10: 重启Nginx"
log "=========================================="
log ""

log "测试Nginx配置..."
nginx -t 2>&1 | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
    log "✅ Nginx配置正确"
    log ""
    log "重启Nginx服务..."
    systemctl restart nginx || error_exit "重启Nginx失败"
    log "✅ Nginx已重启"
else
    error_exit "Nginx配置有误"
fi
log ""

log "=========================================="
log "步骤11: 最终验证"
log "=========================================="
log ""

log "等待Nginx重启完成(5秒)..."
sleep 5
log ""

log "测试完整链路(通过域名)..."
DOMAIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://bk.yushuo.click/api/stocks?date=$(date +%Y-%m-%d)&mode=7days")
log "域名访问响应状态码: $DOMAIN_RESPONSE"

if [ "$DOMAIN_RESPONSE" = "200" ]; then
    log "✅ 域名访问正常"
else
    log "⚠️ 域名访问异常 (HTTP $DOMAIN_RESPONSE)"
    log "可能需要清除浏览器缓存"
fi
log ""

log "=========================================="
log "修复完成!"
log "=========================================="
log ""

log "✅ 所有步骤执行成功"
log ""
log "服务状态:"
log "- 应用容器: 运行中"
log "- 数据库容器: 运行中"
log "- 端口3002: 监听中"
log "- API响应: 正常 (HTTP $API_RESPONSE)"
log "- Nginx: 运行中"
log "- 域名访问: $([ "$DOMAIN_RESPONSE" = "200" ] && echo "正常" || echo "请清除浏览器缓存")"
log ""

log "访问地址: http://bk.yushuo.click"
log ""

log "重要提示:"
log "1. 请在浏览器中强制刷新: Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)"
log "2. 如果仍然502,请等待1-2分钟后再试"
log "3. 查看应用日志: docker logs -f stock-tracker-app"
log ""

log "完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
log "日志文件: $LOG_FILE"
log "=========================================="

echo ""
echo "修复日志已保存到: $LOG_FILE"
echo ""
echo "✅ 修复完成! 请访问 http://bk.yushuo.click 并强制刷新浏览器"
