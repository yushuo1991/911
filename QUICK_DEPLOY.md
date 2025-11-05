# 🚀 快速部署指南 - 5分钟完成

## 方法1: 本地打包上传（推荐）

### Step 1: 本地打包项目

在Windows PowerShell中执行：

```powershell
# 进入项目目录
cd "C:\Users\yushu\Desktop\stock-tracker - 副本"

# 创建部署包（自动排除不必要文件）
tar -czf stock-tracker-v4.1.tar.gz `
  --exclude=node_modules `
  --exclude=.next `
  --exclude=.git `
  --exclude=log `
  --exclude=data `
  .

# 验证打包成功
ls -lh stock-tracker-v4.1.tar.gz
```

### Step 2: 上传到服务器

```powershell
# 使用scp上传
scp stock-tracker-v4.1.tar.gz root@yushuo.click:/opt/

# 或使用WinSCP、FileZilla等工具上传
```

### Step 3: SSH登录服务器部署

```bash
# SSH登录
ssh root@yushuo.click

# 创建项目目录
mkdir -p /opt/stock-tracker
cd /opt/stock-tracker

# 解压
tar -xzf /opt/stock-tracker-v4.1.tar.gz

# 赋予执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh

# 查看部署日志
docker-compose logs -f stock-tracker
```

---

## 方法2: Git拉取（如果服务器有Git仓库）

```bash
# SSH登录服务器
ssh root@yushuo.click

# 克隆或拉取代码
cd /opt
git clone your-repo-url stock-tracker
# 或
cd /opt/stock-tracker && git pull origin main

# 执行部署
cd /opt/stock-tracker
chmod +x deploy.sh
./deploy.sh
```

---

## 方法3: 使用提供的一键部署脚本

复制以下脚本内容，保存为 `remote-deploy.sh`：

```bash
#!/bin/bash

# ===================================
# 远程服务器一键部署脚本
# ===================================

SERVER="root@yushuo.click"
REMOTE_PATH="/opt/stock-tracker"
LOCAL_PATH="C:\Users\yushu\Desktop\stock-tracker - 副本"

echo "🚀 开始远程部署..."

# 1. 打包本地项目
echo "📦 打包项目..."
cd "$LOCAL_PATH"
tar -czf stock-tracker-deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=log \
  --exclude=data \
  .

# 2. 上传到服务器
echo "📤 上传到服务器..."
scp stock-tracker-deploy.tar.gz $SERVER:/tmp/

# 3. 在服务器上部署
echo "🔧 服务器端部署..."
ssh $SERVER << 'ENDSSH'
  # 创建目录
  mkdir -p /opt/stock-tracker
  cd /opt/stock-tracker

  # 解压
  tar -xzf /tmp/stock-tracker-deploy.tar.gz

  # 清理临时文件
  rm /tmp/stock-tracker-deploy.tar.gz

  # 赋予执行权限
  chmod +x deploy.sh

  # 执行部署
  ./deploy.sh
ENDSSH

echo "✅ 部署完成！"
echo "🌐 访问地址: http://yushuo.click:3002"
```

然后在Windows PowerShell执行：

```powershell
# 赋予执行权限
chmod +x remote-deploy.sh

# 运行部署脚本
./remote-deploy.sh
```

---

## 验证部署成功

### 1. 检查容器状态

```bash
ssh root@yushuo.click

docker-compose ps

# 期望输出：
# NAME                      STATUS          PORTS
# stock-tracker-app         Up (healthy)    0.0.0.0:3002->3000/tcp
# stock-tracker-mysql       Up (healthy)    0.0.0.0:3307->3306/tcp
```

### 2. 查看应用日志

```bash
docker-compose logs -f stock-tracker

# 按Ctrl+C退出日志查看
```

### 3. 测试访问

```bash
# 服务器本地测试
curl http://localhost:3002

# 浏览器访问
# http://yushuo.click:3002
```

---

## 常见问题排查

### 问题1: 端口被占用

```bash
# 检查端口占用
netstat -tuln | grep 3002

# 杀死占用进程
lsof -ti:3002 | xargs kill -9

# 或修改docker-compose.yml中的端口
```

### 问题2: Docker未安装

```bash
# 安装Docker
curl -fsSL https://get.docker.com | sh

# 启动Docker服务
systemctl start docker
systemctl enable docker
```

### 问题3: 容器无法启动

```bash
# 查看详细日志
docker-compose logs stock-tracker

# 检查环境变量
docker exec stock-tracker-app env | grep TUSHARE_TOKEN

# 重新构建
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 问题4: 数据库连接失败

```bash
# 检查MySQL容器
docker-compose ps mysql

# 测试数据库连接
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 -e "SHOW DATABASES;"

# 查看MySQL日志
docker-compose logs mysql
```

---

## 手动部署步骤（详细版）

### Step 1: 准备服务器环境

```bash
# 1. SSH登录
ssh root@yushuo.click

# 2. 检查Docker
docker --version
docker-compose --version

# 3. 创建项目目录
mkdir -p /opt/stock-tracker
cd /opt/stock-tracker
```

### Step 2: 上传文件

**必需文件**：
- Dockerfile
- docker-compose.yml
- init.sql
- deploy.sh
- package.json
- package-lock.json
- next.config.js
- tsconfig.json
- tailwind.config.js
- postcss.config.js
- .env.local（包含TUSHARE_TOKEN）
- src/（整个目录）
- public/（整个目录）

**可选文件**：
- DEPLOY_GUIDE.md
- README.md

### Step 3: 执行部署

```bash
# 进入目录
cd /opt/stock-tracker

# 检查文件
ls -la

# 赋予执行权限
chmod +x deploy.sh

# 运行部署
./deploy.sh
```

### Step 4: 验证部署

```bash
# 等待30秒让服务完全启动
sleep 30

# 检查容器状态
docker-compose ps

# 查看应用日志
docker-compose logs --tail=50 stock-tracker

# 测试访问
curl http://localhost:3002
```

---

## 环境变量配置

确保 `.env.local` 或 `.env` 文件包含：

```bash
# Tushare API Token
TUSHARE_TOKEN=2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211

# 数据库配置（使用Docker内置MySQL）
DB_HOST=mysql
DB_PORT=3306
DB_USER=stock_user
DB_PASSWORD=stock_password_2025
DB_NAME=stock_tracker
DB_DISABLE=false

# 应用配置
NODE_ENV=production
NEXT_PUBLIC_APP_VERSION=4.1-docker
NEXTAUTH_URL=http://yushuo.click:3002

# 缓存配置
ENABLE_DATABASE_CACHE=true
CACHE_TTL=7200

# 调度器Token
SCHEDULER_TOKEN=default-secure-token
```

---

## 部署后配置

### 配置防火墙

```bash
# 开放3002端口
ufw allow 3002/tcp

# 检查防火墙状态
ufw status
```

### 配置自动启动

```bash
# Docker服务自动启动（通常已启用）
systemctl enable docker

# 容器自动重启（已在docker-compose.yml配置）
# restart: unless-stopped
```

### 配置日志轮转

```bash
# 编辑 /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# 重启Docker
systemctl restart docker
```

---

## 更新部署

```bash
# SSH登录服务器
ssh root@yushuo.click

# 进入项目目录
cd /opt/stock-tracker

# 拉取最新代码（如果用Git）
git pull origin main

# 或上传新的tar.gz并解压

# 重新部署
./deploy.sh

# 查看日志确认
docker-compose logs -f stock-tracker
```

---

## 完全清理重装

```bash
# 停止并删除所有容器和数据
docker-compose down -v

# 删除镜像
docker rmi stock-tracker-stock-tracker

# 重新部署
./deploy.sh
```

---

## 联系支持

如遇到问题：

1. 查看日志: `docker-compose logs -f`
2. 检查状态: `docker-compose ps`
3. 查看报告: `log/deployment-report-20250930.md`

---

**部署准备就绪！选择最适合您的方法开始部署。** 🚀