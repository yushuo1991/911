# 🚀 股票追踪系统 - Docker部署指南

## 📋 部署前准备

### 1. 服务器要求
- **操作系统**: Linux (推荐Ubuntu 20.04+/CentOS 7+)
- **CPU**: 2核+
- **内存**: 4GB+
- **硬盘**: 20GB+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### 2. 检查环境

```bash
# 检查Docker版本
docker --version
docker-compose --version  # 或 docker compose version

# 如果未安装，执行以下命令安装
curl -fsSL https://get.docker.com | sh
```

---

## 🎯 快速部署（推荐）

### 方法1: 使用部署脚本

```bash
# 1. 上传项目到服务器
scp -r "stock-tracker - 副本" root@your-server:/opt/stock-tracker

# 2. 登录服务器
ssh root@your-server

# 3. 进入项目目录
cd /opt/stock-tracker

# 4. 赋予执行权限
chmod +x deploy.sh

# 5. 运行部署脚本
./deploy.sh
```

### 方法2: 手动部署

```bash
# 1. 构建镜像
docker-compose build --no-cache

# 2. 启动服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f
```

---

## ⚙️ 环境变量配置

### 必需配置

创建 `.env` 文件（或修改.env.local）：

```bash
# Tushare API Token（必需）
TUSHARE_TOKEN=your_tushare_token_here

# 数据库配置（使用Docker内置MySQL）
DB_HOST=mysql
DB_PORT=3306
DB_USER=stock_user
DB_PASSWORD=stock_password_2025
DB_NAME=stock_tracker

# 应用配置
NODE_ENV=production
NEXTAUTH_URL=http://your-domain.com:3002
```

### 可选配置

```bash
# 缓存配置
ENABLE_DATABASE_CACHE=true
CACHE_TTL=7200

# 调度器Token
SCHEDULER_TOKEN=your-secure-token
```

---

## 🔧 服务器配置示例

### 1. 使用外部MySQL（推荐生产环境）

如果服务器已有MySQL服务，修改`docker-compose.yml`：

```yaml
services:
  stock-tracker:
    environment:
      - DB_HOST=192.168.1.42  # 你的MySQL服务器IP
      - DB_PORT=3306
      - DB_USER=root
      - DB_PASSWORD=your_mysql_password
      - DB_NAME=stock_tracker
      - DB_DISABLE=false
```

然后移除MySQL服务配置：

```yaml
# 注释或删除以下部分
# mysql:
#   image: mysql:8.0
#   ...
```

### 2. 手动初始化数据库

登录MySQL执行：

```sql
CREATE DATABASE IF NOT EXISTS stock_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE stock_tracker;

-- 复制 init.sql 中的表结构创建语句
```

---

## 📊 部署验证

### 1. 检查容器状态

```bash
# 查看所有容器
docker-compose ps

# 应该看到类似输出：
# NAME                      STATUS          PORTS
# stock-tracker-app         Up (healthy)    0.0.0.0:3002->3000/tcp
# stock-tracker-mysql       Up (healthy)    0.0.0.0:3307->3306/tcp
```

### 2. 检查应用访问

```bash
# 测试应用响应
curl http://localhost:3002

# 或浏览器访问
# http://your-server-ip:3002
```

### 3. 查看日志

```bash
# 查看应用日志
docker-compose logs -f stock-tracker

# 查看数据库日志
docker-compose logs -f mysql

# 查看最近50行日志
docker-compose logs --tail=50 stock-tracker
```

---

## 🛠️ 常用运维命令

### 服务管理

```bash
# 启动服务
docker-compose start

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 删除服务（保留数据）
docker-compose down

# 完全删除服务和数据
docker-compose down -v
```

### 更新部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建
docker-compose build --no-cache

# 3. 重启服务
docker-compose up -d

# 4. 查看日志确认
docker-compose logs -f
```

### 数据备份

```bash
# 备份数据库
docker exec stock-tracker-mysql mysqldump \
  -u root -proot_password_2025 stock_tracker \
  > backup_$(date +%Y%m%d).sql

# 备份数据目录
tar -czf data_backup_$(date +%Y%m%d).tar.gz data/
```

### 性能监控

```bash
# 查看容器资源使用
docker stats

# 进入容器内部
docker exec -it stock-tracker-app sh

# 查看Node.js进程
docker exec stock-tracker-app ps aux | grep node
```

---

## 🔥 故障排查

### 问题1: 容器无法启动

```bash
# 查看详细日志
docker-compose logs stock-tracker

# 常见原因：
# 1. 端口被占用 -> 修改docker-compose.yml中的端口映射
# 2. 环境变量缺失 -> 检查.env文件
# 3. 权限问题 -> 检查数据目录权限
```

### 问题2: 数据库连接失败

```bash
# 检查MySQL容器状态
docker-compose ps mysql

# 测试数据库连接
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 -e "SHOW DATABASES;"

# 查看MySQL日志
docker-compose logs mysql
```

### 问题3: 应用500错误

```bash
# 查看应用日志
docker-compose logs -f stock-tracker

# 进入容器调试
docker exec -it stock-tracker-app sh
cat /app/.next/server/app-paths-manifest.json
```

### 问题4: 内存不足

```bash
# 限制容器内存使用（修改docker-compose.yml）
services:
  stock-tracker:
    mem_limit: 2g
    mem_reservation: 1g
```

---

## 🔐 安全建议

### 1. 修改默认密码

```yaml
environment:
  - MYSQL_ROOT_PASSWORD=your_strong_password_here  # 修改此处
  - DB_PASSWORD=your_db_password_here              # 修改此处
```

### 2. 配置防火墙

```bash
# 只开放必要端口
ufw allow 3002/tcp  # 应用端口
ufw enable
```

### 3. 使用Nginx反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. 配置HTTPS（推荐）

```bash
# 使用Let's Encrypt免费SSL证书
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

---

## 📈 性能优化

### 1. 数据库优化

```sql
-- 添加索引
CREATE INDEX idx_composite ON stock_data(trade_date, sector_name, td_type);

-- 定期清理过期缓存
DELETE FROM seven_days_cache WHERE expires_at < NOW();
```

### 2. 应用优化

```yaml
# 增加容器资源
services:
  stock-tracker:
    cpus: '2.0'
    mem_limit: 4g
```

### 3. 日志轮转

```bash
# 配置Docker日志大小限制
# 修改 /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

---

## 📞 技术支持

### 查看系统信息

```bash
# Docker信息
docker info

# 容器详情
docker inspect stock-tracker-app

# 网络信息
docker network inspect stock-network
```

### 常用端口说明

- `3002`: Next.js应用端口（映射到容器3000）
- `3307`: MySQL端口（映射到容器3306）
- `80/443`: Nginx代理端口（可选）

### 相关文档

- Next.js部署: https://nextjs.org/docs/deployment
- Docker文档: https://docs.docker.com
- MySQL优化: https://dev.mysql.com/doc/

---

**部署完成后，访问 `http://your-server-ip:3002` 查看应用！** 🎉