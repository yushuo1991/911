# 股票追踪系统 - 运维手册

**版本**: v4.1-docker
**生成时间**: 2025-09-30
**适用环境**: 生产环境 (yushuo.click)
**项目路径**: /www/wwwroot/stock-tracker
**域名**: http://bk.yushuo.click

---

## 📚 目录

1. [日常运维命令](#日常运维命令)
2. [数据备份方案](#数据备份方案)
3. [日志管理策略](#日志管理策略)
4. [性能监控建议](#性能监控建议)
5. [常见问题排查](#常见问题排查)
6. [更新部署流程](#更新部署流程)

---

## 🛠️ 日常运维命令

### 1.1 容器管理

#### 启动所有服务
```bash
# 进入项目目录
cd /www/wwwroot/stock-tracker

# 启动服务（后台运行）
docker-compose up -d

# 预期输出
Creating network "stock-tracker_stock-network" ... done
Creating volume "stock-tracker_mysql-data" ... done
Creating stock-tracker-mysql ... done
Creating stock-tracker-app   ... done
```

**说明**:
- `-d` 参数表示后台运行（detached mode）
- Docker会自动处理依赖顺序（MySQL先启动）
- 首次启动会创建网络和数据卷

---

#### 停止所有服务
```bash
# 停止服务（保留容器）
docker-compose stop

# 预期输出
Stopping stock-tracker-app   ... done
Stopping stock-tracker-mysql ... done
```

**说明**:
- 容器停止但不删除
- 数据保留在数据卷中
- 可快速重新启动

---

#### 重启所有服务
```bash
# 方法1: 使用docker-compose重启
docker-compose restart

# 方法2: 先停止再启动
docker-compose stop && docker-compose up -d

# 方法3: 重建容器（谨慎使用）
docker-compose down && docker-compose up -d
```

**使用场景**:
- `restart`: 配置未更改，快速重启
- `stop + up`: 更新了docker-compose.yml
- `down + up`: 需要重建容器和网络

---

#### 单独重启某个服务
```bash
# 重启Next.js应用
docker-compose restart stock-tracker

# 重启MySQL数据库
docker-compose restart mysql
```

---

### 1.2 查看日志

#### 实时查看所有日志
```bash
# 实时滚动显示所有服务日志
docker-compose logs -f

# 只看最近100行
docker-compose logs --tail=100 -f
```

**快捷键**:
- `Ctrl + C`: 退出日志查看（不会停止容器）

---

#### 查看特定服务日志
```bash
# 查看Next.js应用日志
docker-compose logs -f stock-tracker

# 查看MySQL日志
docker-compose logs -f mysql

# 查看最近50行应用日志
docker-compose logs --tail=50 stock-tracker
```

---

#### 按时间筛选日志
```bash
# 查看过去1小时的日志
docker-compose logs --since 1h stock-tracker

# 查看指定时间之后的日志
docker-compose logs --since "2025-09-30T10:00:00" stock-tracker

# 查看指定时间范围的日志
docker logs --since "2025-09-30T10:00:00" --until "2025-09-30T12:00:00" stock-tracker-app
```

---

#### 导出日志到文件
```bash
# 导出所有日志
docker-compose logs > /tmp/logs-$(date +%Y%m%d-%H%M%S).txt

# 导出应用日志
docker-compose logs stock-tracker > /tmp/app-logs-$(date +%Y%m%d).txt

# 导出MySQL日志
docker-compose logs mysql > /tmp/mysql-logs-$(date +%Y%m%d).txt
```

---

### 1.3 容器状态检查

#### 查看容器运行状态
```bash
# 方法1: docker-compose
docker-compose ps

# 预期输出
NAME                    STATUS                  PORTS
stock-tracker-app       Up 2 hours (healthy)    0.0.0.0:3002->3000/tcp
stock-tracker-mysql     Up 2 hours (healthy)    0.0.0.0:3307->3306/tcp
```

```bash
# 方法2: docker ps（更详细）
docker ps --filter "name=stock-tracker" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Size}}"
```

**状态说明**:
- `Up X hours (healthy)`: 健康运行
- `Up X hours (unhealthy)`: 运行但健康检查失败
- `Restarting`: 正在重启
- `Exited (0)`: 正常退出
- `Exited (1)`: 异常退出

---

#### 查看容器资源使用
```bash
# 实时查看资源使用情况
docker stats stock-tracker-app stock-tracker-mysql

# 预期输出
CONTAINER            CPU %     MEM USAGE / LIMIT     MEM %     NET I/O
stock-tracker-app    2.5%      180MB / 2GB           9%        1.2MB / 850KB
stock-tracker-mysql  1.2%      320MB / 2GB           16%       800KB / 1.1MB
```

**关键指标**:
- **CPU%**: CPU使用率（正常 < 20%）
- **MEM%**: 内存使用率（正常 < 50%）
- **NET I/O**: 网络流量

---

#### 健康检查
```bash
# 查看健康状态详情
docker inspect stock-tracker-app --format='{{json .State.Health}}' | jq

# 预期输出
{
  "Status": "healthy",
  "FailingStreak": 0,
  "Log": [
    {
      "Start": "2025-09-30T10:00:00Z",
      "End": "2025-09-30T10:00:01Z",
      "ExitCode": 0,
      "Output": "OK"
    }
  ]
}
```

---

### 1.4 进入容器内部

#### 进入应用容器
```bash
# 使用sh shell（alpine镜像）
docker exec -it stock-tracker-app sh

# 容器内常用命令
pwd                          # 查看当前目录 (/app)
ls -la                       # 查看文件列表
cat .env                     # 查看环境变量
node -v                      # 查看Node版本
exit                         # 退出容器
```

---

#### 进入MySQL容器
```bash
# 进入MySQL命令行
docker exec -it stock-tracker-mysql mysql -u root -p

# 输入密码: root_password_2025

# MySQL内常用命令
USE stock_tracker;                                    # 切换数据库
SHOW TABLES;                                          # 查看所有表
SELECT COUNT(*) FROM stock_data;                      # 查看数据量
SELECT * FROM stock_data ORDER BY trade_date DESC LIMIT 10;  # 查看最新数据
SHOW PROCESSLIST;                                     # 查看活动连接
EXIT;                                                 # 退出MySQL
```

---

### 1.5 容器清理

#### 停止并删除容器
```bash
# 停止并删除容器（保留数据卷）
docker-compose down

# 预期输出
Stopping stock-tracker-app   ... done
Stopping stock-tracker-mysql ... done
Removing stock-tracker-app   ... done
Removing stock-tracker-mysql ... done
Removing network stock-tracker_stock-network ... done
```

**注意**: 数据卷不会被删除，数据仍然保留！

---

#### 完全清理（包括数据）
```bash
# ⚠️ 危险操作：删除所有容器和数据卷
docker-compose down -v

# 确认后再执行
# 这会删除 mysql-data 卷中的所有数据！
```

---

#### 清理未使用的资源
```bash
# 清理悬空镜像
docker image prune -f

# 清理停止的容器
docker container prune -f

# 清理未使用的网络
docker network prune -f

# 一键清理所有未使用资源
docker system prune -f
```

---

## 💾 数据备份方案

### 2.1 MySQL数据库备份

#### 自动备份脚本
```bash
#!/bin/bash
# 文件: /www/wwwroot/stock-tracker/backup-db.sh

# 配置
BACKUP_DIR="/www/backups/stock-tracker"
CONTAINER="stock-tracker-mysql"
DB_NAME="stock_tracker"
DB_USER="root"
DB_PASS="root_password_2025"
RETENTION_DAYS=30

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/stock_tracker_$TIMESTAMP.sql"

# 执行备份
echo "开始备份数据库..."
docker exec $CONTAINER mysqldump \
  -u $DB_USER \
  -p$DB_PASS \
  --single-transaction \
  --quick \
  --lock-tables=false \
  $DB_NAME > "$BACKUP_FILE"

# 压缩备份文件
echo "压缩备份文件..."
gzip "$BACKUP_FILE"

# 删除旧备份
echo "清理旧备份..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "备份完成: ${BACKUP_FILE}.gz"
echo "文件大小: $(du -h ${BACKUP_FILE}.gz | cut -f1)"
```

**设置定时任务**:
```bash
# 使脚本可执行
chmod +x /www/wwwroot/stock-tracker/backup-db.sh

# 添加crontab（每天凌晨2点备份）
crontab -e

# 添加以下行
0 2 * * * /www/wwwroot/stock-tracker/backup-db.sh >> /var/log/stock-backup.log 2>&1
```

---

#### 手动备份命令
```bash
# 快速备份
docker exec stock-tracker-mysql mysqldump \
  -u root \
  -proot_password_2025 \
  stock_tracker > backup-$(date +%Y%m%d).sql

# 备份并压缩
docker exec stock-tracker-mysql mysqldump \
  -u root \
  -proot_password_2025 \
  stock_tracker | gzip > backup-$(date +%Y%m%d).sql.gz
```

---

#### 备份特定表
```bash
# 只备份stock_data表
docker exec stock-tracker-mysql mysqldump \
  -u root \
  -proot_password_2025 \
  stock_tracker stock_data > stock_data-$(date +%Y%m%d).sql

# 备份多个表
docker exec stock-tracker-mysql mysqldump \
  -u root \
  -proot_password_2025 \
  stock_tracker stock_data stock_performance > critical-tables-$(date +%Y%m%d).sql
```

---

### 2.2 数据恢复

#### 从备份恢复数据库
```bash
# 解压备份文件
gunzip backup-20250930.sql.gz

# 方法1: 恢复到运行中的容器
docker exec -i stock-tracker-mysql mysql \
  -u root \
  -proot_password_2025 \
  stock_tracker < backup-20250930.sql

# 方法2: 通过宿主机端口恢复
mysql -h localhost -P 3307 -u root -proot_password_2025 stock_tracker < backup-20250930.sql
```

---

#### 恢复前的安全措施
```bash
# 1. 先备份当前数据
docker exec stock-tracker-mysql mysqldump \
  -u root -proot_password_2025 \
  stock_tracker > pre-restore-backup-$(date +%Y%m%d-%H%M%S).sql

# 2. 停止应用服务（避免写入）
docker-compose stop stock-tracker

# 3. 执行恢复
docker exec -i stock-tracker-mysql mysql \
  -u root -proot_password_2025 \
  stock_tracker < backup-20250930.sql

# 4. 验证数据
docker exec stock-tracker-mysql mysql \
  -u root -proot_password_2025 \
  -e "SELECT COUNT(*) FROM stock_tracker.stock_data;"

# 5. 重启应用
docker-compose start stock-tracker
```

---

### 2.3 Docker卷备份

#### 备份MySQL数据卷
```bash
# 方法1: 使用tar打包
docker run --rm \
  -v stock-tracker_mysql-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mysql-data-$(date +%Y%m%d).tar.gz -C /data .

# 方法2: 使用rsync同步
docker run --rm \
  -v stock-tracker_mysql-data:/data \
  -v /mnt/backup:/backup \
  alpine sh -c "apk add rsync && rsync -av /data/ /backup/mysql-data/"
```

---

#### 恢复Docker卷
```bash
# 1. 创建新的数据卷
docker volume create stock-tracker_mysql-data-new

# 2. 恢复数据
docker run --rm \
  -v stock-tracker_mysql-data-new:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/mysql-data-20250930.tar.gz -C /data

# 3. 更新docker-compose.yml使用新卷
# 4. 重启服务
docker-compose up -d
```

---

### 2.4 应用数据备份

#### 备份应用文件
```bash
# 备份项目整体
tar czf stock-tracker-full-$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='logs' \
  /www/wwwroot/stock-tracker

# 只备份源代码
tar czf stock-tracker-source-$(date +%Y%m%d).tar.gz \
  /www/wwwroot/stock-tracker/src \
  /www/wwwroot/stock-tracker/public \
  /www/wwwroot/stock-tracker/package.json \
  /www/wwwroot/stock-tracker/Dockerfile \
  /www/wwwroot/stock-tracker/docker-compose.yml
```

---

## 📝 日志管理策略

### 3.1 日志目录结构
```
/www/wwwroot/stock-tracker/
├── logs/                          # 应用日志目录（挂载到容器）
│   ├── app.log                    # 应用主日志
│   ├── error.log                  # 错误日志
│   └── access.log                 # 访问日志
└── docker-logs/                   # Docker容器日志（手动导出）
    ├── stock-tracker-app.log
    └── stock-tracker-mysql.log
```

---

### 3.2 日志轮转配置

#### 创建logrotate配置
```bash
# 文件: /etc/logrotate.d/stock-tracker
/www/wwwroot/stock-tracker/logs/*.log {
    daily                    # 每天轮转
    rotate 30                # 保留30天
    compress                 # 压缩旧日志
    delaycompress            # 延迟压缩（保留最近一天未压缩）
    missingok                # 文件不存在不报错
    notifempty               # 空文件不轮转
    create 0644 root root    # 创建新文件的权限
    sharedscripts            # 多个文件共享脚本
    postrotate
        docker-compose -f /www/wwwroot/stock-tracker/docker-compose.yml restart stock-tracker > /dev/null 2>&1
    endscript
}
```

**测试配置**:
```bash
# 测试logrotate配置
logrotate -d /etc/logrotate.d/stock-tracker

# 强制执行一次轮转
logrotate -f /etc/logrotate.d/stock-tracker
```

---

### 3.3 Docker日志大小限制

#### 修改docker-compose.yml
```yaml
services:
  stock-tracker:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"      # 单个日志文件最大10MB
        max-file: "3"        # 保留最近3个文件

  mysql:
    logging:
      driver: "json-file"
      options:
        max-size: "20m"
        max-file: "5"
```

**应用配置**:
```bash
docker-compose down
docker-compose up -d
```

---

### 3.4 日志查看和分析

#### 实时监控错误日志
```bash
# 方法1: 使用docker logs
docker logs -f stock-tracker-app 2>&1 | grep -i error

# 方法2: 使用tail
tail -f /www/wwwroot/stock-tracker/logs/error.log
```

---

#### 统计错误数量
```bash
# 统计今天的错误数量
docker logs --since $(date +%Y-%m-%d) stock-tracker-app 2>&1 | grep -c "ERROR"

# 按类型统计错误
docker logs stock-tracker-app 2>&1 | grep "ERROR" | awk '{print $5}' | sort | uniq -c | sort -rn
```

---

#### 导出和分析日志
```bash
# 导出最近1小时的日志
docker logs --since 1h stock-tracker-app > /tmp/recent-logs.txt

# 查找特定错误
docker logs stock-tracker-app 2>&1 | grep -A 5 -B 5 "Database connection failed"

# 统计访问量
docker logs stock-tracker-app | grep "GET /api/stocks" | wc -l
```

---

### 3.5 日志清理脚本

#### 自动清理脚本
```bash
#!/bin/bash
# 文件: /www/wwwroot/stock-tracker/cleanup-logs.sh

# 清理30天前的应用日志
find /www/wwwroot/stock-tracker/logs -name "*.log.*" -mtime +30 -delete

# 清理Docker日志（重启容器）
docker-compose -f /www/wwwroot/stock-tracker/docker-compose.yml restart

# 清理系统日志
journalctl --vacuum-time=30d

echo "日志清理完成: $(date)"
```

**定时执行**:
```bash
# 每周日凌晨3点执行
0 3 * * 0 /www/wwwroot/stock-tracker/cleanup-logs.sh >> /var/log/log-cleanup.log 2>&1
```

---

## 📊 性能监控建议

### 4.1 容器资源监控

#### 安装cAdvisor（推荐）
```bash
# 启动cAdvisor容器
docker run -d \
  --name=cadvisor \
  --volume=/:/rootfs:ro \
  --volume=/var/run:/var/run:ro \
  --volume=/sys:/sys:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --publish=8080:8080 \
  --restart=always \
  gcr.io/cadvisor/cadvisor:latest

# 访问监控界面
# http://yushuo.click:8080
```

---

#### 使用docker stats监控
```bash
# 实时监控脚本
#!/bin/bash
# 文件: /www/wwwroot/stock-tracker/monitor-stats.sh

while true; do
    clear
    echo "=== Stock Tracker 资源监控 ==="
    echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" \
      stock-tracker-app stock-tracker-mysql
    echo ""
    sleep 5
done
```

---

### 4.2 应用性能监控

#### API响应时间监控
```bash
# 文件: /www/wwwroot/stock-tracker/monitor-api.sh
#!/bin/bash

URL="http://bk.yushuo.click/api/stocks"
LOG_FILE="/var/log/api-performance.log"

while true; do
    # 测量响应时间
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}\n' $URL)
    STATUS_CODE=$(curl -o /dev/null -s -w '%{http_code}\n' $URL)

    # 记录日志
    echo "$(date '+%Y-%m-%d %H:%M:%S') | Status: $STATUS_CODE | Time: ${RESPONSE_TIME}s" >> $LOG_FILE

    # 告警阈值: 响应时间 > 3秒
    if (( $(echo "$RESPONSE_TIME > 3.0" | bc -l) )); then
        echo "⚠️  告警: API响应缓慢 (${RESPONSE_TIME}s)" | mail -s "Stock Tracker Alert" admin@example.com
    fi

    sleep 60  # 每分钟检查一次
done
```

**后台运行**:
```bash
nohup /www/wwwroot/stock-tracker/monitor-api.sh &
```

---

### 4.3 数据库性能监控

#### 慢查询日志
```bash
# 进入MySQL容器
docker exec -it stock-tracker-mysql mysql -u root -p

# 开启慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- 记录超过1秒的查询
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';

# 查看慢查询统计
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;
```

---

#### 数据库连接数监控
```bash
# 监控脚本
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 -e "
  SELECT
    SUBSTRING_INDEX(host, ':', 1) AS host_ip,
    COUNT(*) AS connection_count,
    state,
    command
  FROM information_schema.processlist
  WHERE user != 'system user'
  GROUP BY host_ip, state, command
  ORDER BY connection_count DESC;
"
```

---

### 4.4 磁盘空间监控

#### 磁盘使用检查
```bash
# 文件: /www/wwwroot/stock-tracker/check-disk.sh
#!/bin/bash

THRESHOLD=80  # 告警阈值: 80%

# 检查根分区
USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ $USAGE -gt $THRESHOLD ]; then
    echo "⚠️  磁盘使用率告警: ${USAGE}%"

    # 显示最大文件
    echo "最大文件:"
    du -h / 2>/dev/null | sort -rh | head -10
fi

# 检查Docker卷
echo "Docker卷使用情况:"
docker system df -v
```

**定时执行**:
```bash
# 每小时检查一次
0 * * * * /www/wwwroot/stock-tracker/check-disk.sh >> /var/log/disk-check.log
```

---

### 4.5 告警通知配置

#### 邮件告警脚本
```bash
#!/bin/bash
# 文件: /www/wwwroot/stock-tracker/alert.sh

ALERT_EMAIL="admin@example.com"

function send_alert() {
    SUBJECT=$1
    MESSAGE=$2

    echo "$MESSAGE" | mail -s "$SUBJECT" $ALERT_EMAIL
}

# 检查容器健康状态
if ! docker ps | grep -q "stock-tracker-app.*healthy"; then
    send_alert "容器异常" "stock-tracker-app容器健康检查失败"
fi

# 检查API可用性
if ! curl -s -f http://bk.yushuo.click/api/stocks > /dev/null; then
    send_alert "API异常" "API接口无法访问"
fi

# 检查数据库连接
if ! docker exec stock-tracker-mysql mysqladmin ping -h localhost -u root -proot_password_2025 -s > /dev/null; then
    send_alert "数据库异常" "MySQL数据库连接失败"
fi
```

---

## 🔍 常见问题排查

### 5.1 容器无法启动

#### 问题1: 端口冲突
**症状**:
```
Error: bind: address already in use
```

**排查步骤**:
```bash
# 1. 检查端口占用
netstat -tulpn | grep 3002
lsof -i :3002

# 2. 查看占用进程
ps aux | grep <PID>

# 3. 停止占用进程或修改端口
# 修改 docker-compose.yml
ports:
  - "3003:3000"  # 改用3003端口
```

---

#### 问题2: 数据卷权限问题
**症状**:
```
Error: EACCES: permission denied
```

**解决方案**:
```bash
# 检查卷权限
ls -la /www/wwwroot/stock-tracker/data
ls -la /www/wwwroot/stock-tracker/logs

# 修改权限
chown -R 1001:1001 /www/wwwroot/stock-tracker/data
chown -R 1001:1001 /www/wwwroot/stock-tracker/logs
chmod -R 755 /www/wwwroot/stock-tracker/data

# 重启容器
docker-compose restart
```

---

### 5.2 数据库连接问题

#### 问题1: 应用无法连接MySQL
**症状**:
```
Error: connect ECONNREFUSED mysql:3306
```

**排查步骤**:
```bash
# 1. 检查MySQL容器状态
docker-compose ps mysql

# 2. 检查MySQL健康状态
docker inspect stock-tracker-mysql --format='{{.State.Health.Status}}'

# 3. 查看MySQL日志
docker-compose logs mysql | tail -50

# 4. 测试容器间网络
docker exec stock-tracker-app ping mysql

# 5. 测试数据库连接
docker exec stock-tracker-app sh -c "nc -zv mysql 3306"
```

**常见原因**:
- MySQL容器未完全启动（等待健康检查）
- 网络配置错误
- 数据库凭证不匹配

---

#### 问题2: 数据库连接数过多
**症状**:
```
Error: Too many connections
```

**解决方案**:
```bash
# 1. 查看当前连接数
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 -e "SHOW STATUS LIKE 'Threads_connected';"

# 2. 查看最大连接数
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 -e "SHOW VARIABLES LIKE 'max_connections';"

# 3. 杀死空闲连接
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 -e "
  SELECT CONCAT('KILL ', id, ';')
  FROM information_schema.processlist
  WHERE user='stock_user' AND time > 300;
" | grep KILL | docker exec -i stock-tracker-mysql mysql -u root -proot_password_2025

# 4. 增加最大连接数（修改docker-compose.yml）
command:
  - --max_connections=500
```

---

### 5.3 应用性能问题

#### 问题1: API响应缓慢
**排查步骤**:
```bash
# 1. 检查数据库慢查询
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 -e "
  SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 5;
"

# 2. 检查数据量
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 -e "
  SELECT
    table_name,
    table_rows,
    ROUND(data_length/1024/1024, 2) AS 'Data Size (MB)',
    ROUND(index_length/1024/1024, 2) AS 'Index Size (MB)'
  FROM information_schema.tables
  WHERE table_schema='stock_tracker';
"

# 3. 分析执行计划
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "
  EXPLAIN SELECT * FROM stock_data WHERE trade_date >= '2025-09-23';
"

# 4. 检查索引使用
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "
  SHOW INDEX FROM stock_data;
"
```

---

#### 问题2: 内存占用过高
**排查步骤**:
```bash
# 1. 查看内存使用详情
docker stats stock-tracker-app --no-stream

# 2. 进入容器查看进程
docker exec stock-tracker-app sh -c "ps aux | sort -rn -k 3 | head -10"

# 3. 检查Node.js堆内存
docker exec stock-tracker-app sh -c "node -e 'console.log(process.memoryUsage())'"

# 4. 重启容器释放内存
docker-compose restart stock-tracker
```

---

### 5.4 数据不一致问题

#### 问题: 数据显示异常
**排查步骤**:
```bash
# 1. 检查缓存数据
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "
  SELECT cache_key, created_at, expires_at
  FROM seven_days_cache
  ORDER BY created_at DESC LIMIT 5;
"

# 2. 清理过期缓存
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "
  DELETE FROM seven_days_cache WHERE expires_at < NOW();
"

# 3. 检查数据完整性
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "
  SELECT trade_date, COUNT(*) AS count
  FROM stock_data
  WHERE trade_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  GROUP BY trade_date
  ORDER BY trade_date DESC;
"

# 4. 重新拉取数据（访问调度API）
curl -X POST "http://bk.yushuo.click/api/scheduler" \
  -H "Content-Type: application/json" \
  -d '{"token": "default-secure-token"}'
```

---

### 5.5 Nginx反向代理问题

#### 问题: 502 Bad Gateway
**排查步骤**:
```bash
# 1. 检查容器是否运行
docker ps | grep stock-tracker-app

# 2. 检查Nginx配置
nginx -t

# 3. 查看Nginx错误日志
tail -f /var/log/nginx/error.log

# 4. 测试后端直连
curl http://localhost:3002

# 5. 检查防火墙
iptables -L -n | grep 3002
```

**Nginx配置参考**:
```nginx
# /etc/nginx/sites-available/bk.yushuo.click
server {
    listen 80;
    server_name bk.yushuo.click;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

---

## 🚀 更新部署流程

### 6.1 代码更新流程

#### 标准更新流程
```bash
# 1. 进入项目目录
cd /www/wwwroot/stock-tracker

# 2. 备份当前代码
tar czf backup-before-update-$(date +%Y%m%d-%H%M%S).tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='logs' \
  .

# 3. 拉取最新代码
git fetch origin
git log HEAD..origin/main --oneline  # 查看更新内容
git pull origin main

# 4. 检查配置文件
diff .env.example .env  # 查看是否有新配置项

# 5. 重新构建镜像
docker-compose build --no-cache

# 6. 停止旧容器
docker-compose down

# 7. 启动新容器
docker-compose up -d

# 8. 查看启动日志
docker-compose logs -f

# 9. 验证功能
curl -I http://bk.yushuo.click
curl http://bk.yushuo.click/api/stocks | jq '.success'

# 10. 清理旧镜像
docker image prune -f
```

---

#### 快速更新脚本
```bash
#!/bin/bash
# 文件: /www/wwwroot/stock-tracker/update.sh

set -e  # 遇到错误立即退出

PROJECT_DIR="/www/wwwroot/stock-tracker"
BACKUP_DIR="/www/backups/stock-tracker"

cd $PROJECT_DIR

echo "========================================="
echo "股票追踪系统更新脚本"
echo "========================================="

# 1. 备份
echo "[1/8] 备份当前版本..."
mkdir -p $BACKUP_DIR
tar czf $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='logs' \
  .

# 2. 拉取代码
echo "[2/8] 拉取最新代码..."
git pull origin main

# 3. 备份数据库
echo "[3/8] 备份数据库..."
docker exec stock-tracker-mysql mysqldump \
  -u root -proot_password_2025 \
  stock_tracker | gzip > $BACKUP_DIR/db-before-update-$(date +%Y%m%d-%H%M%S).sql.gz

# 4. 停止服务
echo "[4/8] 停止服务..."
docker-compose down

# 5. 构建镜像
echo "[5/8] 构建新镜像..."
docker-compose build

# 6. 启动服务
echo "[6/8] 启动服务..."
docker-compose up -d

# 7. 等待健康检查
echo "[7/8] 等待服务启动..."
sleep 30

# 8. 验证
echo "[8/8] 验证服务..."
if curl -s -f http://localhost:3002 > /dev/null; then
    echo "✅ 更新成功！"
else
    echo "❌ 更新失败，正在回滚..."
    docker-compose down
    git reset --hard HEAD~1
    docker-compose up -d
    exit 1
fi

echo "========================================="
echo "更新完成！"
echo "访问地址: http://bk.yushuo.click"
echo "========================================="
```

**使用方法**:
```bash
chmod +x /www/wwwroot/stock-tracker/update.sh
/www/wwwroot/stock-tracker/update.sh
```

---

### 6.2 回滚流程

#### 回滚到上一个版本
```bash
# 1. 查看提交历史
cd /www/wwwroot/stock-tracker
git log --oneline -10

# 2. 回滚代码
git reset --hard <commit-hash>

# 3. 恢复数据库（如果需要）
gunzip < /www/backups/stock-tracker/db-before-update-20250930.sql.gz | \
  docker exec -i stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker

# 4. 重新构建和启动
docker-compose down
docker-compose up -d --build

# 5. 验证
curl -I http://bk.yushuo.click
```

---

### 6.3 零停机更新（进阶）

#### 使用Docker Swarm实现
```bash
# 1. 初始化Swarm
docker swarm init

# 2. 创建Overlay网络
docker network create --driver overlay stock-network

# 3. 部署Stack
docker stack deploy -c docker-compose.yml stock-tracker

# 4. 更新服务（滚动更新）
docker service update \
  --image stock-tracker:latest \
  --update-parallelism 1 \
  --update-delay 10s \
  stock-tracker_stock-tracker

# 5. 查看更新状态
docker service ps stock-tracker_stock-tracker
```

---

## 📞 紧急联系

**服务器**: yushuo.click
**项目路径**: /www/wwwroot/stock-tracker
**域名**: http://bk.yushuo.click
**负责人**: 宇硕

**紧急操作**:
```bash
# 快速重启
docker-compose restart

# 查看错误日志
docker-compose logs --tail=100 -f

# 数据库紧急备份
docker exec stock-tracker-mysql mysqldump -u root -proot_password_2025 stock_tracker > emergency-backup.sql
```

---

**文档结束** | Generated by Claude Code on 2025-09-30