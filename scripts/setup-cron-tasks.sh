#!/bin/bash

# 股票数据定时预加载任务配置脚本
# 适用于宝塔面板Linux服务器

echo "=========================================="
echo "股票追踪系统定时任务配置"
echo "服务器: 107.173.154.147"
echo "时间: $(date)"
echo "=========================================="

# 配置变量
SERVER_URL="http://127.0.0.1:3000"
AUTH_TOKEN="Bearer cron-token-2025"
LOG_DIR="/www/wwwroot/stock-tracker/logs/cron"
SCRIPT_DIR="/www/wwwroot/stock-tracker/scripts"

# 创建日志目录
echo "1. 创建日志目录..."
mkdir -p $LOG_DIR
mkdir -p $SCRIPT_DIR

# 创建数据预加载脚本
echo "2. 创建数据预加载脚本..."
cat > $SCRIPT_DIR/preload-stock-data.sh << 'EOF'
#!/bin/bash

# 股票数据预加载脚本
SERVER_URL="http://127.0.0.1:3000"
AUTH_TOKEN="Bearer cron-token-2025"
LOG_DIR="/www/wwwroot/stock-tracker/logs/cron"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] 开始执行股票数据预加载任务" >> $LOG_DIR/preload.log

# 检查Node.js应用是否运行
if ! curl -s http://127.0.0.1:3000 > /dev/null; then
    echo "[$TIMESTAMP] 错误: Node.js应用未运行" >> $LOG_DIR/preload.log
    exit 1
fi

# 执行预加载任务
RESPONSE=$(curl -s -X POST \
    -H "Authorization: $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    "$SERVER_URL/api/cron?action=preload&date=$DATE" \
    --connect-timeout 60 \
    --max-time 300)

# 检查响应
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "[$TIMESTAMP] 成功: $RESPONSE" >> $LOG_DIR/preload.log
else
    echo "[$TIMESTAMP] 失败: $RESPONSE" >> $LOG_DIR/preload.log
    exit 1
fi

echo "[$TIMESTAMP] 股票数据预加载任务完成" >> $LOG_DIR/preload.log
EOF

# 创建批量预加载脚本（预加载最近6天数据）
echo "3. 创建批量预加载脚本..."
cat > $SCRIPT_DIR/preload-recent-data.sh << 'EOF'
#!/bin/bash

# 股票数据批量预加载脚本（最近6天）
SERVER_URL="http://127.0.0.1:3000"
AUTH_TOKEN="Bearer cron-token-2025"
LOG_DIR="/www/wwwroot/stock-tracker/logs/cron"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] 开始执行批量股票数据预加载任务" >> $LOG_DIR/batch_preload.log

# 检查Node.js应用是否运行
if ! curl -s http://127.0.0.1:3000 > /dev/null; then
    echo "[$TIMESTAMP] 错误: Node.js应用未运行" >> $LOG_DIR/batch_preload.log
    exit 1
fi

# 执行批量预加载任务
RESPONSE=$(curl -s -X POST \
    -H "Authorization: $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    "$SERVER_URL/api/cron?action=preload_recent" \
    --connect-timeout 120 \
    --max-time 600)

# 检查响应
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "[$TIMESTAMP] 成功: $RESPONSE" >> $LOG_DIR/batch_preload.log
else
    echo "[$TIMESTAMP] 失败: $RESPONSE" >> $LOG_DIR/batch_preload.log
    exit 1
fi

echo "[$TIMESTAMP] 批量股票数据预加载任务完成" >> $LOG_DIR/batch_preload.log
EOF

# 创建日志清理脚本
echo "4. 创建日志清理脚本..."
cat > $SCRIPT_DIR/cleanup-logs.sh << 'EOF'
#!/bin/bash

# 定时任务日志清理脚本
LOG_DIR="/www/wwwroot/stock-tracker/logs/cron"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] 开始清理定时任务日志" >> $LOG_DIR/cleanup.log

# 删除7天前的日志
find $LOG_DIR -name "*.log" -mtime +7 -exec rm {} \;

# 限制日志文件大小（超过10MB的截断）
for logfile in $LOG_DIR/*.log; do
    if [ -f "$logfile" ]; then
        size=$(stat -f%z "$logfile" 2>/dev/null || stat -c%s "$logfile" 2>/dev/null)
        if [ "$size" -gt 10485760 ]; then  # 10MB
            tail -n 1000 "$logfile" > "$logfile.tmp"
            mv "$logfile.tmp" "$logfile"
            echo "[$TIMESTAMP] 截断日志文件: $logfile" >> $LOG_DIR/cleanup.log
        fi
    fi
done

echo "[$TIMESTAMP] 日志清理完成" >> $LOG_DIR/cleanup.log
EOF

# 设置脚本执行权限
echo "5. 设置脚本执行权限..."
chmod +x $SCRIPT_DIR/preload-stock-data.sh
chmod +x $SCRIPT_DIR/preload-recent-data.sh
chmod +x $SCRIPT_DIR/cleanup-logs.sh

# 显示建议的crontab配置
echo "6. 建议的宝塔面板定时任务配置:"
echo "=========================================="
echo ""
echo "任务1: 每日数据预加载"
echo "执行周期: 每天 18:00"
echo "脚本路径: $SCRIPT_DIR/preload-stock-data.sh"
echo "说明: 每天下午6点预加载当日股票数据"
echo ""
echo "任务2: 每周批量预加载"
echo "执行周期: 每周日 19:00"
echo "脚本路径: $SCRIPT_DIR/preload-recent-data.sh"
echo "说明: 每周预加载最近6天的股票数据（补充遗漏数据）"
echo ""
echo "任务3: 日志清理"
echo "执行周期: 每天 02:00"
echo "脚本路径: $SCRIPT_DIR/cleanup-logs.sh"
echo "说明: 清理过期的定时任务日志"
echo ""
echo "=========================================="

# 测试预加载功能
echo "7. 测试预加载功能..."
echo "执行测试请求..."

# 等待5秒确保脚本权限生效
sleep 5

# 执行测试
if bash $SCRIPT_DIR/preload-stock-data.sh; then
    echo "✅ 预加载功能测试成功！"
else
    echo "❌ 预加载功能测试失败，请检查Node.js应用状态"
fi

echo ""
echo "=========================================="
echo "定时任务配置完成！"
echo ""
echo "下一步操作:"
echo "1. 登录宝塔面板: http://107.173.154.147:8888"
echo "2. 进入'计划任务'菜单"
echo "3. 按照上述建议配置定时任务"
echo "4. 监控日志目录: $LOG_DIR"
echo ""
echo "日志文件说明:"
echo "- preload.log: 每日预加载日志"
echo "- batch_preload.log: 批量预加载日志"
echo "- cleanup.log: 日志清理日志"
echo "=========================================="