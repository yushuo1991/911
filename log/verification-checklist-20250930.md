# 股票追踪系统 - 部署验证清单

**版本**: v4.1-docker
**生成时间**: 2025-09-30
**验证环境**: 生产环境 (yushuo.click)
**项目路径**: /www/wwwroot/stock-tracker
**域名**: http://bk.yushuo.click

---

## 📋 验证清单总览

本文档提供完整的部署验证清单，确保系统各项功能正常运行。每个检查项都包含：
- 验证命令
- 预期结果
- 故障排查步骤

**验证顺序**: 按照以下顺序逐项验证，确保基础设施正常后再验证应用层。

---

## 1️⃣ 容器健康检查

### 1.1 容器运行状态

**检查命令**:
```bash
cd /www/wwwroot/stock-tracker
docker-compose ps
```

**预期结果**:
```
NAME                    STATUS                  PORTS
stock-tracker-app       Up X hours (healthy)    0.0.0.0:3002->3000/tcp
stock-tracker-mysql     Up X hours (healthy)    0.0.0.0:3307->3306/tcp
```

**验证要点**:
- [ ] 两个容器都在运行 (Up)
- [ ] 健康状态为 "healthy"
- [ ] 端口映射正确（3002, 3307）
- [ ] 运行时间稳定（无频繁重启）

**故障排查**:
```bash
# 如果容器未运行
docker-compose up -d

# 如果状态为 unhealthy
docker-compose logs stock-tracker-app | tail -50
docker-compose logs mysql | tail -50

# 如果频繁重启
docker inspect stock-tracker-app --format='{{json .State}}' | jq
```

---

### 1.2 容器健康检查详情

**检查命令**:
```bash
# 检查应用容器健康
docker inspect stock-tracker-app --format='{{json .State.Health}}' | jq

# 检查MySQL容器健康
docker inspect stock-tracker-mysql --format='{{json .State.Health}}' | jq
```

**预期结果**:
```json
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

**验证要点**:
- [ ] Status 为 "healthy"
- [ ] FailingStreak 为 0
- [ ] ExitCode 为 0
- [ ] 最近5次检查都成功

**故障排查**:
```bash
# 手动执行健康检查命令
docker exec stock-tracker-app curl -f http://localhost:3000/
docker exec stock-tracker-mysql mysqladmin ping -h localhost -u root -proot_password_2025

# 查看完整健康检查日志
docker inspect stock-tracker-app --format='{{range .State.Health.Log}}{{.Output}}{{end}}'
```

---

### 1.3 容器资源使用

**检查命令**:
```bash
docker stats --no-stream stock-tracker-app stock-tracker-mysql
```

**预期结果**:
```
CONTAINER            CPU %     MEM USAGE / LIMIT     MEM %     NET I/O
stock-tracker-app    < 20%     < 500MB              < 25%     正常
stock-tracker-mysql  < 15%     < 800MB              < 40%     正常
```

**验证要点**:
- [ ] CPU使用率正常（< 30%）
- [ ] 内存使用率正常（< 50%）
- [ ] 无异常高负载
- [ ] 网络IO正常

**故障排查**:
```bash
# 如果CPU过高
docker exec stock-tracker-app sh -c "ps aux | sort -rn -k 3"

# 如果内存过高
docker exec stock-tracker-app sh -c "node -e 'console.log(process.memoryUsage())'"

# 重启容器
docker-compose restart stock-tracker-app
```

---

### 1.4 容器日志检查

**检查命令**:
```bash
# 检查最近100行日志，确认无错误
docker-compose logs --tail=100 stock-tracker-app | grep -i error
docker-compose logs --tail=100 mysql | grep -i error
```

**预期结果**:
```
无输出（表示无错误日志）
```

**验证要点**:
- [ ] 无ERROR级别日志
- [ ] 无FATAL级别日志
- [ ] 无异常堆栈信息
- [ ] 无数据库连接错误

**故障排查**:
```bash
# 查看完整日志上下文
docker-compose logs --tail=200 -f

# 导出日志分析
docker-compose logs > /tmp/debug-logs-$(date +%Y%m%d-%H%M%S).txt
```

---

## 2️⃣ 应用访问测试

### 2.1 主页访问测试

**检查命令**:
```bash
# 测试HTTP响应
curl -I http://bk.yushuo.click

# 测试页面内容
curl -s http://bk.yushuo.click | head -20
```

**预期结果**:
```
HTTP/1.1 200 OK
Content-Type: text/html
X-Powered-By: Next.js
Content-Length: > 1000

<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <title>股票追踪系统</title>
...
```

**验证要点**:
- [ ] 返回状态码 200
- [ ] Content-Type 为 text/html
- [ ] 响应时间 < 2秒
- [ ] 页面包含正确的HTML结构

**故障排查**:
```bash
# 如果返回502
docker ps | grep stock-tracker-app
docker-compose logs stock-tracker-app | tail -50

# 如果返回404
nginx -t
systemctl status nginx

# 如果响应超时
curl -w "@curl-format.txt" -o /dev/null -s http://bk.yushuo.click
```

---

### 2.2 直接端口访问测试

**检查命令**:
```bash
# 绕过Nginx，直接访问容器
curl -I http://bk.yushuo.click:3002
curl -I http://localhost:3002
```

**预期结果**:
```
HTTP/1.1 200 OK
X-Powered-By: Next.js
```

**验证要点**:
- [ ] 直接访问成功
- [ ] 响应头包含 X-Powered-By: Next.js
- [ ] 与域名访问结果一致

**故障排查**:
```bash
# 如果无法访问
docker exec stock-tracker-app netstat -tlnp

# 检查防火墙
iptables -L -n | grep 3002
ufw status

# 检查端口映射
docker port stock-tracker-app
```

---

### 2.3 页面加载性能测试

**检查命令**:
```bash
# 测试页面加载时间
curl -o /dev/null -s -w "时间详情:\n连接时间: %{time_connect}s\n开始传输: %{time_starttransfer}s\n总时间: %{time_total}s\n下载大小: %{size_download} bytes\n" http://bk.yushuo.click
```

**预期结果**:
```
时间详情:
连接时间: 0.05s
开始传输: 1.2s
总时间: 1.5s
下载大小: > 50000 bytes
```

**验证要点**:
- [ ] 总加载时间 < 2秒
- [ ] TTFB (Time To First Byte) < 1秒
- [ ] 页面大小合理 (50KB - 500KB)
- [ ] 无明显性能瓶颈

**故障排查**:
```bash
# 详细性能分析
curl -w "@-" -o /dev/null -s http://bk.yushuo.click <<'EOF'
    time_namelookup:  %{time_namelookup}s\n
       time_connect:  %{time_connect}s\n
    time_appconnect:  %{time_appconnect}s\n
   time_pretransfer:  %{time_pretransfer}s\n
      time_redirect:  %{time_redirect}s\n
 time_starttransfer:  %{time_starttransfer}s\n
                    ----------\n
         time_total:  %{time_total}s\n
EOF

# 如果DNS解析慢，添加hosts
echo "服务器IP bk.yushuo.click" >> /etc/hosts
```

---

## 3️⃣ 数据库连接测试

### 3.1 容器内部连接测试

**检查命令**:
```bash
# 从应用容器测试MySQL连接
docker exec stock-tracker-app sh -c "nc -zv mysql 3306"

# 测试DNS解析
docker exec stock-tracker-app sh -c "nslookup mysql"
```

**预期结果**:
```
mysql (172.18.0.2:3306) open

Server:    127.0.0.11
Address:   127.0.0.11:53
Name:      mysql
Address:   172.18.0.2
```

**验证要点**:
- [ ] 端口3306可达
- [ ] DNS解析正常
- [ ] 容器网络互通
- [ ] 无网络延迟

**故障排查**:
```bash
# 检查网络配置
docker network inspect stock-tracker_stock-network

# 检查MySQL容器网络
docker inspect stock-tracker-mysql --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'

# 重建网络
docker-compose down
docker-compose up -d
```

---

### 3.2 MySQL服务可用性测试

**检查命令**:
```bash
# 测试MySQL服务响应
docker exec stock-tracker-mysql mysqladmin ping -h localhost -u root -proot_password_2025

# 测试数据库登录
docker exec -it stock-tracker-mysql mysql -u stock_user -pstock_password_2025 -e "SELECT 1 AS test;"
```

**预期结果**:
```
mysqld is alive

+------+
| test |
+------+
|    1 |
+------+
```

**验证要点**:
- [ ] MySQL服务正常响应
- [ ] 应用用户可以登录
- [ ] 查询执行成功
- [ ] 无权限错误

**故障排查**:
```bash
# 检查MySQL进程
docker exec stock-tracker-mysql ps aux | grep mysqld

# 检查MySQL错误日志
docker exec stock-tracker-mysql tail -50 /var/log/mysql/error.log

# 重置用户权限
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 -e "
  DROP USER IF EXISTS 'stock_user'@'%';
  CREATE USER 'stock_user'@'%' IDENTIFIED BY 'stock_password_2025';
  GRANT ALL PRIVILEGES ON stock_tracker.* TO 'stock_user'@'%';
  FLUSH PRIVILEGES;
"
```

---

### 3.3 数据库表结构验证

**检查命令**:
```bash
# 检查所有表
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "SHOW TABLES;"

# 检查表结构
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "
  SELECT
    table_name,
    table_rows,
    ROUND(data_length/1024/1024, 2) AS 'Data Size (MB)',
    ROUND(index_length/1024/1024, 2) AS 'Index Size (MB)'
  FROM information_schema.tables
  WHERE table_schema='stock_tracker';
"
```

**预期结果**:
```
+---------------------+
| Tables_in_stock_tracker |
+---------------------+
| stock_data          |
| stock_performance   |
| seven_days_cache    |
+---------------------+

table_name         table_rows  Data Size (MB)  Index Size (MB)
stock_data         1234        0.15            0.08
stock_performance  567         0.05            0.03
seven_days_cache   1           0.01            0.00
```

**验证要点**:
- [ ] 3个核心表都存在
- [ ] stock_data 表有数据
- [ ] stock_performance 表有数据
- [ ] 索引正常创建

**故障排查**:
```bash
# 如果表不存在，重新执行初始化
docker exec -i stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker < /www/wwwroot/stock-tracker/init.sql

# 检查索引
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "SHOW INDEX FROM stock_data;"

# 修复表
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "REPAIR TABLE stock_data;"
```

---

### 3.4 数据库性能测试

**检查命令**:
```bash
# 测试简单查询性能
time docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "SELECT COUNT(*) FROM stock_data;"

# 测试复杂查询性能
time docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "
  SELECT sector_name, COUNT(*) AS count
  FROM stock_data
  WHERE trade_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  GROUP BY sector_name
  ORDER BY count DESC
  LIMIT 10;
"
```

**预期结果**:
```
简单查询: < 0.1秒
复杂查询: < 0.5秒
```

**验证要点**:
- [ ] 查询响应时间正常
- [ ] 无慢查询
- [ ] 索引使用正常
- [ ] 无锁等待

**故障排查**:
```bash
# 分析查询计划
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "
  EXPLAIN SELECT * FROM stock_data WHERE trade_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY);
"

# 查看慢查询
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 -e "
  SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 5;
"

# 优化表
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "OPTIMIZE TABLE stock_data;"
```

---

## 4️⃣ API功能测试

### 4.1 股票数据API测试

**检查命令**:
```bash
# 测试API基本功能
curl -s http://bk.yushuo.click/api/stocks | jq '.'

# 测试特定参数
curl -s "http://bk.yushuo.click/api/stocks?days=7" | jq '.success, .data | length'
```

**预期结果**:
```json
{
  "success": true,
  "data": [...],
  "dates": [...],
  "message": "数据获取成功"
}

true
7
```

**验证要点**:
- [ ] API返回成功 (success: true)
- [ ] 返回数据结构正确
- [ ] dates数组包含日期
- [ ] data数组有数据
- [ ] 响应时间 < 2秒

**故障排查**:
```bash
# 测试API详细信息
curl -v http://bk.yushuo.click/api/stocks 2>&1 | grep -E "< HTTP|< Content-Type"

# 如果返回错误
docker-compose logs stock-tracker-app | grep -A 10 "/api/stocks"

# 测试数据库查询
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "
  SELECT trade_date, COUNT(*) AS count
  FROM stock_data
  GROUP BY trade_date
  ORDER BY trade_date DESC
  LIMIT 7;
"
```

---

### 4.2 健康检查API测试

**检查命令**:
```bash
# 测试健康检查端点
curl -s http://bk.yushuo.click/api/health | jq '.'
```

**预期结果**:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-09-30T10:00:00.000Z"
}
```

**验证要点**:
- [ ] status 为 "ok"
- [ ] database 为 "connected"
- [ ] timestamp 为当前时间
- [ ] 响应时间 < 1秒

**故障排查**:
```bash
# 如果健康检查失败
curl -v http://bk.yushuo.click/api/health

# 检查数据库连接
docker exec stock-tracker-app sh -c "nc -zv mysql 3306"

# 查看应用日志
docker-compose logs stock-tracker-app | grep health
```

---

### 4.3 调度器API测试

**检查命令**:
```bash
# 测试调度器（需要正确的token）
curl -X POST http://bk.yushuo.click/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"token": "default-secure-token"}' | jq '.'
```

**预期结果**:
```json
{
  "success": true,
  "message": "数据更新任务已启动",
  "timestamp": "2025-09-30T10:00:00.000Z"
}
```

**验证要点**:
- [ ] 正确token可以触发任务
- [ ] 返回成功状态
- [ ] 错误token返回401
- [ ] 任务执行正常

**故障排查**:
```bash
# 如果token验证失败
curl -X POST http://bk.yushuo.click/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"token": "wrong-token"}'

# 检查环境变量
docker exec stock-tracker-app sh -c "printenv | grep SCHEDULER_TOKEN"

# 查看任务执行日志
docker-compose logs stock-tracker-app | grep scheduler
```

---

### 4.4 API性能测试

**检查命令**:
```bash
# 并发测试（需要安装ab工具）
ab -n 100 -c 10 http://bk.yushuo.click/api/stocks

# 响应时间测试
for i in {1..10}; do
  curl -o /dev/null -s -w "请求$i: %{time_total}s\n" http://bk.yushuo.click/api/stocks
  sleep 1
done
```

**预期结果**:
```
Requests per second: > 20
Time per request (mean): < 500ms
Failed requests: 0
```

**验证要点**:
- [ ] QPS > 20
- [ ] 平均响应时间 < 500ms
- [ ] 无失败请求
- [ ] 无超时错误

**故障排查**:
```bash
# 如果性能不佳
docker stats stock-tracker-app --no-stream

# 检查数据库连接池
docker-compose logs stock-tracker-app | grep "database connection"

# 检查缓存
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "SELECT COUNT(*) FROM seven_days_cache;"
```

---

## 5️⃣ 性能基准测试

### 5.1 页面加载性能 (Lighthouse)

**检查命令**:
```bash
# 安装lighthouse（如果未安装）
npm install -g lighthouse

# 运行性能测试
lighthouse http://bk.yushuo.click --output=html --output-path=/tmp/lighthouse-report.html --only-categories=performance
```

**预期结果**:
```
Performance Score: > 80
First Contentful Paint: < 1.8s
Largest Contentful Paint: < 2.5s
Time to Interactive: < 3.8s
```

**验证要点**:
- [ ] 性能评分 > 80分
- [ ] LCP < 2.5秒
- [ ] FID < 100ms
- [ ] CLS < 0.1

**故障排查**:
```bash
# 查看详细报告
cat /tmp/lighthouse-report.html

# 优化建议
# 1. 启用浏览器缓存
# 2. 压缩静态资源
# 3. 使用CDN加速
# 4. 延迟加载图片
```

---

### 5.2 API响应时间基准

**检查命令**:
```bash
# 创建测试脚本
cat > /tmp/api-benchmark.sh << 'EOF'
#!/bin/bash
echo "API性能基准测试"
echo "========================"

# 测试10次取平均值
total=0
for i in {1..10}; do
  time=$(curl -o /dev/null -s -w '%{time_total}' http://bk.yushuo.click/api/stocks)
  echo "请求$i: ${time}s"
  total=$(echo "$total + $time" | bc)
done

avg=$(echo "scale=3; $total / 10" | bc)
echo "========================"
echo "平均响应时间: ${avg}s"
EOF

chmod +x /tmp/api-benchmark.sh
/tmp/api-benchmark.sh
```

**预期结果**:
```
平均响应时间: < 1.0s
```

**验证要点**:
- [ ] 平均响应 < 1秒
- [ ] 最大响应 < 2秒
- [ ] 响应时间稳定
- [ ] 无异常峰值

---

### 5.3 数据库查询性能基准

**检查命令**:
```bash
# 测试常用查询性能
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "
  SET profiling = 1;

  -- 查询1: 7天数据统计
  SELECT COUNT(*) FROM stock_data
  WHERE trade_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY);

  -- 查询2: 板块分组
  SELECT sector_name, COUNT(*) FROM stock_data
  WHERE trade_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  GROUP BY sector_name;

  -- 查询3: 复杂JOIN
  SELECT sd.*, sp.pct_change
  FROM stock_data sd
  LEFT JOIN stock_performance sp ON sd.stock_code = sp.stock_code
  WHERE sd.trade_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  LIMIT 100;

  SHOW PROFILES;
"
```

**预期结果**:
```
Query 1: < 0.1s
Query 2: < 0.3s
Query 3: < 0.5s
```

**验证要点**:
- [ ] 所有查询 < 1秒
- [ ] 使用了索引
- [ ] 无全表扫描
- [ ] 无临时表

---

### 5.4 并发负载测试

**检查命令**:
```bash
# 使用wrk进行压测（需安装wrk）
wrk -t4 -c100 -d30s http://bk.yushuo.click/api/stocks

# 或使用ab
ab -n 1000 -c 50 -g /tmp/plot.tsv http://bk.yushuo.click/api/stocks
```

**预期结果**:
```
Requests/sec: > 50
Avg Latency: < 500ms
99th Percentile: < 2s
Errors: 0
```

**验证要点**:
- [ ] 吞吐量 > 50 RPS
- [ ] 平均延迟 < 500ms
- [ ] P99延迟 < 2秒
- [ ] 无连接错误
- [ ] CPU/内存在正常范围

---

## 6️⃣ 安全检查清单

### 6.1 环境变量检查

**检查命令**:
```bash
# 检查.env文件不在Git中
git status | grep -E "\.env$"

# 检查环境变量是否正确注入
docker exec stock-tracker-app sh -c "printenv | grep -E 'TUSHARE|DB_|SCHEDULER'"
```

**预期结果**:
```
（.env文件不应出现在git status中）

TUSHARE_TOKEN=***（已设置）
DB_HOST=mysql
DB_USER=stock_user
DB_PASSWORD=***
SCHEDULER_TOKEN=***
```

**验证要点**:
- [ ] .env文件不提交到Git
- [ ] 敏感信息使用环境变量
- [ ] 生产环境密码强度足够
- [ ] Token配置正确

**故障排查**:
```bash
# 如果环境变量缺失
cat /www/wwwroot/stock-tracker/.env
docker-compose config | grep environment

# 重新设置环境变量
docker-compose down
docker-compose up -d
```

---

### 6.2 容器安全检查

**检查命令**:
```bash
# 检查容器运行用户
docker exec stock-tracker-app id

# 检查文件权限
docker exec stock-tracker-app ls -la /app

# 检查只读挂载
docker inspect stock-tracker-mysql --format='{{json .Mounts}}' | jq
```

**预期结果**:
```
uid=1001(nextjs) gid=1001(nodejs)

drwxr-xr-x  nextjs  nodejs  /app
-rw-r--r--  nextjs  nodejs  /app/package.json

init.sql挂载为只读 (ro)
```

**验证要点**:
- [ ] 非root用户运行
- [ ] 文件权限正确
- [ ] 敏感配置只读挂载
- [ ] 无不必要的权限

---

### 6.3 网络安全检查

**检查命令**:
```bash
# 检查容器网络隔离
docker network inspect stock-tracker_stock-network

# 检查端口暴露
docker ps --format "table {{.Names}}\t{{.Ports}}"

# 检查防火墙规则
iptables -L -n | grep -E "3002|3307"
```

**预期结果**:
```
网络类型: bridge（隔离网络）
端口: 3002（对外）, 3307（管理用）
MySQL容器内部端口不直接暴露
```

**验证要点**:
- [ ] 容器使用独立网络
- [ ] 数据库端口不对外
- [ ] 只暴露必要端口
- [ ] 防火墙规则合理

---

### 6.4 数据安全检查

**检查命令**:
```bash
# 检查数据备份
ls -lh /www/backups/stock-tracker/ | tail -5

# 检查数据卷
docker volume ls | grep stock-tracker

# 检查数据库权限
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 -e "
  SELECT User, Host, Select_priv, Insert_priv, Update_priv, Delete_priv
  FROM mysql.user
  WHERE User IN ('root', 'stock_user');
"
```

**预期结果**:
```
定期备份文件存在
数据卷正常挂载
应用用户权限最小化
```

**验证要点**:
- [ ] 有定期备份
- [ ] 备份可恢复
- [ ] 数据持久化正常
- [ ] 用户权限最小化

---

## 7️⃣ 功能完整性测试

### 7.1 数据更新功能

**检查命令**:
```bash
# 触发数据更新
curl -X POST http://bk.yushuo.click/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"token": "default-secure-token"}'

# 等待10秒后检查数据
sleep 10

# 查看最新数据
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "
  SELECT trade_date, COUNT(*) AS count
  FROM stock_data
  GROUP BY trade_date
  ORDER BY trade_date DESC
  LIMIT 5;
"
```

**验证要点**:
- [ ] 调度器可以触发
- [ ] 数据成功写入数据库
- [ ] 最新交易日数据存在
- [ ] 无重复数据

---

### 7.2 缓存功能测试

**检查命令**:
```bash
# 第一次请求（无缓存）
time curl -s http://bk.yushuo.click/api/stocks > /dev/null

# 第二次请求（有缓存）
time curl -s http://bk.yushuo.click/api/stocks > /dev/null

# 查看缓存数据
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "
  SELECT cache_key, created_at, expires_at
  FROM seven_days_cache;
"
```

**验证要点**:
- [ ] 第二次请求明显更快
- [ ] 缓存表有数据
- [ ] 缓存未过期
- [ ] 缓存键正确

---

### 7.3 错误处理测试

**检查命令**:
```bash
# 测试无效参数
curl -s "http://bk.yushuo.click/api/stocks?days=abc" | jq '.'

# 测试无效token
curl -X POST http://bk.yushuo.click/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"token": "wrong-token"}'

# 测试不存在的路由
curl -I http://bk.yushuo.click/api/nonexistent
```

**预期结果**:
```
返回友好的错误消息
正确的HTTP状态码（400, 401, 404）
不泄露敏感信息
```

**验证要点**:
- [ ] 错误消息友好
- [ ] 状态码正确
- [ ] 无敏感信息泄露
- [ ] 日志记录错误

---

## 8️⃣ 验证总结

### 完成验证检查表

使用以下命令生成验证报告：

```bash
#!/bin/bash
# 文件: /www/wwwroot/stock-tracker/run-verification.sh

cat > /tmp/verification-report-$(date +%Y%m%d-%H%M%S).txt << 'EOF'
股票追踪系统验证报告
=====================
验证时间: $(date)

1. 容器健康状态
EOF

echo "- 容器运行状态:" >> /tmp/verification-report-*.txt
docker-compose ps >> /tmp/verification-report-*.txt

echo -e "\n2. 应用访问测试" >> /tmp/verification-report-*.txt
curl -I http://bk.yushuo.click 2>&1 | head -5 >> /tmp/verification-report-*.txt

echo -e "\n3. API功能测试" >> /tmp/verification-report-*.txt
curl -s http://bk.yushuo.click/api/stocks | jq '.success' >> /tmp/verification-report-*.txt

echo -e "\n4. 数据库状态" >> /tmp/verification-report-*.txt
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -e "SHOW TABLES;" >> /tmp/verification-report-*.txt

echo -e "\n验证完成!" >> /tmp/verification-report-*.txt
cat /tmp/verification-report-*.txt
```

---

### 快速验证脚本

```bash
#!/bin/bash
# 快速验证所有关键功能

echo "========================================="
echo "快速验证开始"
echo "========================================="

# 1. 容器状态
echo "[1/8] 检查容器状态..."
if docker ps | grep -q "stock-tracker-app.*healthy"; then
    echo "✅ 应用容器健康"
else
    echo "❌ 应用容器异常"
fi

# 2. 主页访问
echo "[2/8] 检查主页访问..."
if curl -s -f http://bk.yushuo.click > /dev/null; then
    echo "✅ 主页访问正常"
else
    echo "❌ 主页无法访问"
fi

# 3. API功能
echo "[3/8] 检查API功能..."
if curl -s http://bk.yushuo.click/api/stocks | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ API功能正常"
else
    echo "❌ API返回异常"
fi

# 4. 数据库连接
echo "[4/8] 检查数据库连接..."
if docker exec stock-tracker-mysql mysqladmin ping -h localhost -u root -proot_password_2025 -s > /dev/null 2>&1; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败"
fi

# 5. 数据表检查
echo "[5/8] 检查数据表..."
TABLE_COUNT=$(docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -sNe "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='stock_tracker';")
if [ "$TABLE_COUNT" -eq 3 ]; then
    echo "✅ 数据表完整 ($TABLE_COUNT/3)"
else
    echo "❌ 数据表缺失 ($TABLE_COUNT/3)"
fi

# 6. 数据检查
echo "[6/8] 检查数据..."
DATA_COUNT=$(docker exec stock-tracker-mysql mysql -u root -proot_password_2025 stock_tracker -sNe "SELECT COUNT(*) FROM stock_data;")
if [ "$DATA_COUNT" -gt 0 ]; then
    echo "✅ 有数据 ($DATA_COUNT 条)"
else
    echo "❌ 无数据"
fi

# 7. 性能检查
echo "[7/8] 检查响应性能..."
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://bk.yushuo.click/api/stocks)
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
    echo "✅ 响应时间正常 (${RESPONSE_TIME}s)"
else
    echo "⚠️  响应时间较慢 (${RESPONSE_TIME}s)"
fi

# 8. 日志检查
echo "[8/8] 检查错误日志..."
ERROR_COUNT=$(docker-compose logs --tail=100 | grep -ci error || echo 0)
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo "✅ 无错误日志"
else
    echo "⚠️  发现 $ERROR_COUNT 条错误日志"
fi

echo "========================================="
echo "快速验证完成"
echo "========================================="
```

**使用方法**:
```bash
chmod +x /www/wwwroot/stock-tracker/run-verification.sh
/www/wwwroot/stock-tracker/run-verification.sh
```

---

## 📞 问题反馈

如果在验证过程中发现问题：

1. **保存日志**:
   ```bash
   docker-compose logs > /tmp/debug-$(date +%Y%m%d-%H%M%S).log
   ```

2. **收集系统信息**:
   ```bash
   docker version
   docker-compose version
   uname -a
   df -h
   free -h
   ```

3. **导出配置**:
   ```bash
   docker-compose config > /tmp/compose-config.yml
   ```

---

**文档结束** | Generated by Claude Code on 2025-09-30