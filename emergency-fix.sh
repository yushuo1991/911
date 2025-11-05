#!/bin/bash
# 紧急修复脚本
# 用途: 当系统出现故障时的紧急恢复
# 使用: ./emergency-fix.sh

LOG_DIR="log"
LOG_FILE="$LOG_DIR/emergency-fix-$(date +%Y%m%d-%H%M%S).log"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 记录日志函数
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

echo "🚨 启动紧急修复程序"
echo "📝 日志文件: $LOG_FILE"
echo "========================================"

# 1. 系统状态检查
log "开始系统状态检查"
echo "1. 检查当前系统状态..."

# 检查Docker服务
if ! systemctl is-active --quiet docker; then
    log "❌ Docker服务未运行，尝试启动"
    systemctl start docker
    sleep 5
    if systemctl is-active --quiet docker; then
        log "✅ Docker服务启动成功"
    else
        log "❌ Docker服务启动失败，需要人工干预"
        exit 1
    fi
else
    log "✅ Docker服务正常运行"
fi

# 检查容器状态
if docker ps | grep -q stock-tracker-app; then
    CONTAINER_STATUS="running"
    log "📍 发现stock-tracker-app容器正在运行"
else
    CONTAINER_STATUS="stopped"
    log "📍 stock-tracker-app容器未运行"
fi

# 检查服务响应
LOCAL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://127.0.0.1:3000 2>/dev/null)
if [ "$LOCAL_RESPONSE" = "200" ]; then
    log "✅ 本地服务响应正常 (HTTP 200)"
    echo "系统可能正常运行，建议先诊断具体问题"
    echo "运行诊断: ./diagnose.sh"
    exit 0
else
    log "❌ 本地服务响应异常 (HTTP $LOCAL_RESPONSE)"
fi

echo ""
echo "2. 执行紧急修复操作..."

# 2. 尝试重启容器
if [ "$CONTAINER_STATUS" = "running" ]; then
    log "尝试重启当前容器"
    docker restart stock-tracker-app
    sleep 15

    # 检查重启后状态
    RESTART_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://127.0.0.1:3000 2>/dev/null)
    if [ "$RESTART_RESPONSE" = "200" ]; then
        log "✅ 容器重启成功，服务恢复正常"
        echo "✅ 紧急修复完成 - 容器重启解决问题"
        exit 0
    else
        log "❌ 容器重启后服务仍异常"
    fi
else
    log "尝试启动容器"
    docker start stock-tracker-app 2>/dev/null
    sleep 15

    START_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://127.0.0.1:3000 2>/dev/null)
    if [ "$START_RESPONSE" = "200" ]; then
        log "✅ 容器启动成功，服务恢复正常"
        echo "✅ 紧急修复完成 - 容器启动解决问题"
        exit 0
    else
        log "❌ 容器启动后服务仍异常"
    fi
fi

echo ""
echo "3. 尝试版本回滚..."

# 3. 查找最新稳定版本
if [ -d "backups" ]; then
    LATEST_VERSION=$(ls -t backups/ 2>/dev/null | grep "^v" | head -1 | cut -d'-' -f1)
    if [ -n "$LATEST_VERSION" ]; then
        log "发现最新备份版本: $LATEST_VERSION"
        echo "回滚到版本: $LATEST_VERSION"

        # 停止当前容器
        log "停止当前容器"
        docker stop stock-tracker-app 2>/dev/null
        docker rm stock-tracker-app 2>/dev/null

        # 执行回滚
        log "开始回滚到版本 $LATEST_VERSION"
        if [ -f "./version-manager.sh" ]; then
            ./version-manager.sh restore "$LATEST_VERSION"
            if [ $? -eq 0 ]; then
                log "版本回滚命令执行完成"
                sleep 20

                # 验证回滚结果
                ROLLBACK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 15 http://127.0.0.1:3000 2>/dev/null)
                if [ "$ROLLBACK_RESPONSE" = "200" ]; then
                    log "✅ 回滚成功，服务恢复正常"
                    echo "✅ 紧急修复完成 - 版本回滚解决问题"
                    echo "当前版本: $(cat VERSION 2>/dev/null || echo '未知')"
                    exit 0
                else
                    log "❌ 回滚后服务仍异常 (HTTP $ROLLBACK_RESPONSE)"
                fi
            else
                log "❌ 版本回滚命令执行失败"
            fi
        else
            log "❌ 未找到version-manager.sh脚本"
        fi
    else
        log "❌ 未找到可用的备份版本"
    fi
else
    log "❌ 备份目录不存在"
fi

echo ""
echo "4. 尝试使用Docker镜像恢复..."

# 4. 尝试使用Docker镜像
DOCKER_IMAGES=$(docker images stock-tracker --format '{{.Tag}}' | head -1)
if [ -n "$DOCKER_IMAGES" ] && [ "$DOCKER_IMAGES" != "<none>" ]; then
    log "发现Docker镜像: stock-tracker:$DOCKER_IMAGES"
    echo "使用Docker镜像恢复: $DOCKER_IMAGES"

    # 停止并删除当前容器
    docker stop stock-tracker-app 2>/dev/null
    docker rm stock-tracker-app 2>/dev/null

    # 启动新容器
    log "使用镜像 stock-tracker:$DOCKER_IMAGES 启动容器"
    docker run -d --name stock-tracker-app -p 3000:3000 stock-tracker:$DOCKER_IMAGES

    if [ $? -eq 0 ]; then
        sleep 20
        DOCKER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 15 http://127.0.0.1:3000 2>/dev/null)
        if [ "$DOCKER_RESPONSE" = "200" ]; then
            log "✅ Docker镜像恢复成功"
            echo "✅ 紧急修复完成 - Docker镜像恢复解决问题"
            exit 0
        else
            log "❌ Docker镜像恢复后服务仍异常"
        fi
    else
        log "❌ Docker容器启动失败"
    fi
else
    log "❌ 未找到可用的Docker镜像"
fi

echo ""
echo "❌ 所有自动修复尝试均失败"
echo "========================================"
log "所有自动修复尝试均失败，需要人工干预"

# 5. 生成详细错误报告
echo "📊 生成错误诊断报告..."
echo "" >> "$LOG_FILE"
echo "=== 详细诊断信息 ===" >> "$LOG_FILE"
echo "时间: $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 系统状态
echo "Docker服务状态:" >> "$LOG_FILE"
systemctl status docker --no-pager >> "$LOG_FILE" 2>&1
echo "" >> "$LOG_FILE"

# 容器状态
echo "Docker容器状态:" >> "$LOG_FILE"
docker ps -a >> "$LOG_FILE" 2>&1
echo "" >> "$LOG_FILE"

# 镜像状态
echo "Docker镜像:" >> "$LOG_FILE"
docker images >> "$LOG_FILE" 2>&1
echo "" >> "$LOG_FILE"

# 应用日志
echo "应用日志 (最后50行):" >> "$LOG_FILE"
docker logs stock-tracker-app --tail 50 >> "$LOG_FILE" 2>&1

echo ""
echo "🆘 需要人工干预，建议操作:"
echo "   1. 查看详细日志: cat $LOG_FILE"
echo "   2. 运行系统诊断: ./diagnose.sh"
echo "   3. 检查宝塔面板: http://107.173.154.147:8888"
echo "   4. 如果问题严重，考虑完全重新部署:"
echo "      git pull origin main"
echo "      ./deploy.sh"
echo ""
echo "📞 技术支持:"
echo "   - GitHub: https://github.com/yushuo1991/911/issues"
echo "   - 服务器: root@107.173.154.147"

log "紧急修复程序结束，需要人工干预"
exit 1