#!/bin/bash

# 每日股票数据缓存脚本
# 建议在 crontab 中设置每天18:00执行
# 0 18 * * * /path/to/your/project/scripts/daily-cache.sh

# 脚本配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/log"
LOG_FILE="$LOG_DIR/daily-cache-$(date +%Y%m%d).log"

# 确保日志目录存在
mkdir -p "$LOG_DIR"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🚀 开始每日数据缓存任务"

# 读取环境变量
if [ -f "$PROJECT_DIR/.env.local" ]; then
    export $(cat "$PROJECT_DIR/.env.local" | xargs)
fi

# 设置默认值
API_URL="${NEXTAUTH_URL:-http://localhost:3000}"
SCHEDULER_TOKEN="${SCHEDULER_TOKEN:-default-token}"

log "📡 API地址: $API_URL"

# 执行缓存任务
response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SCHEDULER_TOKEN" \
  "$API_URL/api/scheduler" \
  --max-time 600)

# 检查响应
if [ $? -eq 0 ]; then
    log "✅ 缓存任务完成"
    log "📊 响应结果: $response"

    # 解析成功状态
    success=$(echo "$response" | grep -o '"success":true')

    if [ -n "$success" ]; then
        log "🎉 缓存任务执行成功"
    else
        log "⚠️  缓存任务可能有问题，请检查响应"
    fi
else
    log "❌ 缓存任务请求失败"
    log "🔍 请检查服务是否正常运行"
fi

log "📝 详细日志已保存到: $LOG_FILE"
log "✨ 每日缓存任务结束"

# 清理7天前的日志文件
find "$LOG_DIR" -name "daily-cache-*.log" -mtime +7 -delete 2>/dev/null

echo "完成时间: $(date)" >> "$LOG_FILE"