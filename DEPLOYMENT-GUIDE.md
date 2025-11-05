# 涨停板跟踪系统 - 完整部署方案

## 目录
- [快速部署](#快速部署)
- [详细部署步骤](#详细部署步骤)
- [Docker 部署](#docker-部署)
- [手动部署](#手动部署)
- [部署后验证](#部署后验证)
- [常见问题排查](#常见问题排查)
- [回滚方案](#回滚方案)

---

## 快速部署

### 方式一：使用快速部署脚本（推荐）

```powershell
# Windows PowerShell
.\quick-push-deploy.ps1
```

这个脚本会自动：
1. 提交并推送代码到 GitHub
2. SSH 连接到服务器
3. 拉取最新代码
4. 构建并启动 Docker 容器

### 方式二：使用自动化部署脚本

```bash
# 运行自动化部署
npm run deploy

# 或直接运行
node deploy-v4.8.25-auto.js
```

---

## 详细部署步骤

### 前置条件

#### 1. 本地环境要求
- Node.js 18+
- npm 或 yarn
- Git
- Docker Desktop（用于本地测试）
- SSH 客户端（Windows 10+ 自带）

#### 2. 服务器环境要求
- 操作系统：Linux（推荐 Ubuntu 20.04+）
- Docker Engine 20.10+
- Docker Compose 2.0+
- Nginx（用于反向代理）
- MySQL 8.0+（或使用 Docker 容器）
- 开放端口：80（HTTP）、443（HTTPS）、3000（应用端口）

#### 3. 必需的环境变量

创建 `.env` 文件：

```bash
# Tushare API（必须）
TUSHARE_TOKEN=your_tushare_token_here

# MySQL 数据库配置
MYSQL_HOST=mysql
MYSQL_DATABASE=stock_tracker
MYSQL_USER=stock_user
MYSQL_PASSWORD=StockTracker2024!
MYSQL_ROOT_PASSWORD=RootPassword2024!

# 应用配置
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://bk.yushuo.click
```

---

## Docker 部署（推荐）

### 1. 构建生产镜像

```bash
# 清理旧镜像和容器
docker compose down
docker system prune -f

# 构建新镜像（不使用缓存）
docker compose build --no-cache

# 启动服务
docker compose up -d
```

### 2. Docker Compose 配置说明

项目根目录的 `docker-compose.yml` 包含两个服务：

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - TUSHARE_TOKEN=${TUSHARE_TOKEN}
      - MYSQL_HOST=mysql
    depends_on:
      - mysql
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    volumes:
      - mysql_data:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=${MYSQL_DATABASE}
    restart: unless-stopped
```

### 3. 查看服务状态

```bash
# 查看运行中的容器
docker ps

# 查看应用日志
docker logs stock-tracker -f

# 查看 MySQL 日志
docker logs mysql -f

# 查看资源使用情况
docker stats
```

---

## 手动部署

### 1. 克隆代码

```bash
# 克隆仓库
git clone https://github.com/yushuo1991/911.git stock-tracker
cd stock-tracker

# 或拉取最新代码
git pull origin main
```

### 2. 安装依赖

```bash
# 安装生产依赖
npm ci --production

# 或安装所有依赖（用于开发）
npm install
```

### 3. 构建应用

```bash
# 运行类型检查
npm run type-check

# 运行代码检查
npm run lint

# 构建生产版本
npm run build
```

### 4. 配置 MySQL 数据库

```bash
# 连接到 MySQL
mysql -u root -p

# 创建数据库和用户
CREATE DATABASE IF NOT EXISTS stock_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'stock_user'@'%' IDENTIFIED BY 'StockTracker2024!';
GRANT ALL PRIVILEGES ON stock_tracker.* TO 'stock_user'@'%';
FLUSH PRIVILEGES;

# 导入数据库结构（如果有备份）
mysql -u stock_user -p stock_tracker < backup.sql
```

数据库表会在应用首次运行时自动创建：
- `stock_cache` - 涨停股票列表缓存
- `stock_performance_cache` - 股票日涨跌幅缓存
- `seven_days_cache` - 7日数据完整缓存

### 5. 配置 PM2（推荐用于生产环境）

```bash
# 全局安装 PM2
npm install -g pm2

# 创建 PM2 配置文件
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'stock-tracker',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 进程列表
pm2 save

# 设置开机自启
pm2 startup
```

### 6. 配置 Nginx 反向代理

创建 Nginx 配置文件 `/etc/nginx/sites-available/stock-tracker`：

```nginx
upstream stock_tracker {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name bk.yushuo.click;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bk.yushuo.click;

    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/bk.yushuo.click/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bk.yushuo.click/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 日志配置
    access_log /var/log/nginx/stock-tracker-access.log;
    error_log /var/log/nginx/stock-tracker-error.log;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    location / {
        proxy_pass http://stock_tracker;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态资源缓存
    location /_next/static {
        proxy_pass http://stock_tracker;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }

    location /static {
        proxy_pass http://stock_tracker;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/stock-tracker /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

---

## 部署后验证

### 1. 健康检查

```bash
# 检查应用是否运行
curl http://localhost:3000

# 检查 API 端点
curl http://localhost:3000/api/stocks

# 检查 7 日数据
curl http://localhost:3000/api/stocks?days=7
```

### 2. 日志检查

```bash
# Docker 部署
docker logs stock-tracker --tail 100 -f

# PM2 部署
pm2 logs stock-tracker

# Nginx 日志
tail -f /var/log/nginx/stock-tracker-access.log
tail -f /var/log/nginx/stock-tracker-error.log
```

### 3. 性能测试

```bash
# 安装 Apache Bench
sudo apt-get install apache2-utils

# 并发测试
ab -n 1000 -c 10 https://bk.yushuo.click/

# 或使用 wrk
wrk -t12 -c400 -d30s https://bk.yushuo.click/
```

### 4. 数据库验证

```bash
# 连接到 MySQL
docker exec -it mysql mysql -u stock_user -p stock_tracker

# 检查表结构
SHOW TABLES;

# 检查缓存数据
SELECT COUNT(*) FROM stock_cache;
SELECT COUNT(*) FROM stock_performance_cache;
SELECT * FROM seven_days_cache ORDER BY last_update DESC LIMIT 1;
```

---

## 常见问题排查

### 1. 502 Bad Gateway

**问题原因**：应用未启动或端口不通

**解决方案**：
```bash
# 运行诊断脚本
./fix-502-error.bat  # Windows
bash diagnose-connection-refused.sh  # Linux

# 检查应用是否运行
docker ps  # Docker 部署
pm2 list   # PM2 部署

# 检查端口占用
netstat -tlnp | grep 3000  # Linux
netstat -ano | findstr :3000  # Windows

# 重启应用
docker compose restart  # Docker
pm2 restart stock-tracker  # PM2
```

### 2. 数据库连接失败

**问题表现**：`ECONNREFUSED` 或 `Access denied`

**解决方案**：
```bash
# 检查 MySQL 容器状态
docker ps | grep mysql

# 检查数据库连接
docker exec mysql mysql -u stock_user -p -e "SELECT 1"

# 重置数据库密码
docker exec -it mysql mysql -u root -p
ALTER USER 'stock_user'@'%' IDENTIFIED BY 'StockTracker2024!';
FLUSH PRIVILEGES;

# 检查 .env 配置
cat .env | grep MYSQL
```

### 3. Tushare API 限流

**问题表现**：API 返回 403 或超时

**解决方案**：
```bash
# 检查 Tushare Token 是否配置
echo $TUSHARE_TOKEN

# 查看 API 调用日志
docker logs stock-tracker | grep "Tushare API"

# 降低请求频率（已实现 700/min 限制和指数退避）
# 检查代码：src/lib/utils.ts 中的 getTushareStockDaily 函数
```

### 4. 构建失败

**问题原因**：TypeScript 类型错误或依赖问题

**解决方案**：
```bash
# 清理缓存
rm -rf .next node_modules
npm cache clean --force

# 重新安装依赖
npm install

# 运行类型检查
npm run type-check

# 查看详细构建日志
npm run build 2>&1 | tee build.log
```

### 5. 内存溢出

**问题表现**：`JavaScript heap out of memory`

**解决方案**：
```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 或在 package.json 中修改构建命令
"build": "NODE_OPTIONS='--max-old-space-size=4096' next build"

# Docker 部署时在 Dockerfile 中设置
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

### 6. 日志文件查看

项目根目录的 `log/` 文件夹包含：
- `502-error-diagnosis-20251016.md` - 502 错误诊断记录
- `deployment-network-issue-20251016.md` - 网络问题诊断记录

可通过以下方式查看：
```bash
# 本地查看
cat log/502-error-diagnosis-20251016.md

# 或通过浏览器访问
https://bk.yushuo.click/log/502-error-diagnosis-20251016.md
```

---

## 回滚方案

### 1. Git 版本回滚

```bash
# 查看提交历史
git log --oneline -10

# 回滚到特定版本
git checkout 4d3b107  # 上一个稳定版本

# 或创建回滚分支
git checkout -b rollback-v4.8.24 4d3b107

# 推送到服务器
git push origin rollback-v4.8.24
```

### 2. Docker 镜像回滚

```bash
# 查看镜像历史
docker images | grep stock-tracker

# 使用旧镜像启动
docker run -d --name stock-tracker-old \
  -p 3000:3000 \
  --env-file .env \
  stock-tracker:v4.8.24

# 或在 docker-compose.yml 中指定镜像版本
services:
  app:
    image: stock-tracker:v4.8.24
```

### 3. 数据库备份与恢复

```bash
# 创建备份
docker exec mysql mysqldump -u root -p stock_tracker > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复备份
docker exec -i mysql mysql -u root -p stock_tracker < backup_20251015_120000.sql

# 自动备份脚本（添加到 crontab）
0 2 * * * docker exec mysql mysqldump -u root -pRootPassword2024! stock_tracker > /backup/stock_tracker_$(date +\%Y\%m\%d).sql
```

### 4. 完整系统快照

```bash
# 停止服务
docker compose down

# 备份整个应用目录
tar -czf stock-tracker-backup-$(date +%Y%m%d).tar.gz \
  /www/wwwroot/stock-tracker \
  --exclude=node_modules \
  --exclude=.next

# 备份 Docker 数据卷
docker run --rm \
  -v mysql_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mysql_data_$(date +%Y%m%d).tar.gz /data

# 恢复时解压
tar -xzf stock-tracker-backup-20251015.tar.gz -C /www/wwwroot/
```

---

## 监控和维护

### 1. 设置监控告警

使用 Prometheus + Grafana 监控：

```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### 2. 定期维护任务

创建维护脚本 `maintenance.sh`：

```bash
#!/bin/bash

echo "=== 涨停板系统维护脚本 ==="
echo "开始时间: $(date)"

# 清理 Docker 资源
echo "清理 Docker 资源..."
docker system prune -f

# 清理旧日志
echo "清理旧日志..."
find /var/log/nginx -name "*.log" -mtime +30 -delete

# 优化数据库
echo "优化数据库..."
docker exec mysql mysql -u root -p -e "
  USE stock_tracker;
  OPTIMIZE TABLE stock_cache;
  OPTIMIZE TABLE stock_performance_cache;
  OPTIMIZE TABLE seven_days_cache;
"

# 检查磁盘空间
echo "检查磁盘空间..."
df -h

echo "维护完成: $(date)"
```

添加到 crontab：
```bash
# 每周日凌晨 3 点执行维护
0 3 * * 0 /www/wwwroot/stock-tracker/maintenance.sh >> /var/log/maintenance.log 2>&1
```

---

## 性能优化建议

### 1. 启用 Redis 缓存

```bash
# 添加 Redis 服务到 docker-compose.yml
redis:
  image: redis:7-alpine
  volumes:
    - redis_data:/data
  restart: unless-stopped
```

修改应用代码使用 Redis：
```typescript
// src/lib/redis-cache.ts
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
});

export async function getCachedData(key: string) {
  return await client.get(key);
}

export async function setCachedData(key: string, value: string, ttl: number) {
  await client.setEx(key, ttl, value);
}
```

### 2. CDN 加速

使用 Cloudflare CDN：
1. 注册 Cloudflare 账号
2. 添加域名 `yushuo.click`
3. 配置 DNS CNAME：`bk.yushuo.click` → `yushuo.click`
4. 开启 Cloudflare 代理（橙色云朵）
5. 设置缓存规则：静态资源缓存 1 年

### 3. 数据库优化

```sql
-- 添加索引
CREATE INDEX idx_stock_code ON stock_performance_cache(stock_code);
CREATE INDEX idx_trade_date ON stock_performance_cache(trade_date);
CREATE INDEX idx_date ON stock_cache(date);

-- 分析表
ANALYZE TABLE stock_cache, stock_performance_cache, seven_days_cache;

-- 查看慢查询
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;
```

---

## 相关资源

### 项目文档
- 主文档：`CLAUDE.md`
- 部署说明：`README-DEPLOYMENT.md`
- 部署命令：`DEPLOY-v4.8.25-COMMANDS.txt`

### 部署脚本
- 快速部署：`quick-push-deploy.ps1`
- SSH 部署：`deploy-v4.8.25-ssh.ps1`
- 自动部署：`deploy-v4.8.25-auto.js`

### 诊断工具
- 502 错误修复：`fix-502-error.bat`
- 连接诊断：`diagnose-connection-refused.sh`
- 构建错误指南：`fix-build-error-manual-guide.md`

### 在线访问
- 生产环境：https://bk.yushuo.click
- GitHub 仓库：https://github.com/yushuo1991/911
- 服务器 SSH：`ssh root@107.173.154.147`

---

## 技术支持

遇到问题时：
1. 查看日志文件：`log/` 目录
2. 运行诊断脚本
3. 查阅 `CLAUDE.md` 中的已知问题
4. 检查 GitHub Issues

最后更新：2025-10-18
版本：v4.8.25
