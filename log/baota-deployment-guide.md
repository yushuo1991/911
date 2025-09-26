# 股票追踪系统v4.2 - 宝塔面板部署指南

## 部署概览

**项目类型**: Next.js全栈应用
**数据库**: SQLite (轻量级本地数据库)
**进程管理**: PM2
**反向代理**: Nginx
**部署时间**: 2025-09-26

---

## 📋 部署前准备

### 1. 服务器要求
- **操作系统**: CentOS 7+/Ubuntu 18+
- **内存**: 至少1GB可用内存
- **存储**: 至少10GB可用空间
- **网络**: 能够访问GitHub和NPM源

### 2. 宝塔面板要求
- 宝塔面板版本: 7.0+
- 已安装软件管理中的Nginx
- 建议安装PM2管理器插件

### 3. 域名配置
- 确保域名 `yushuo.click` 已指向服务器IP
- 如有SSL证书，建议提前配置

---

## 🚀 自动化部署步骤

### 步骤1: 上传部署脚本
```bash
# 在服务器上创建临时目录
mkdir -p /tmp/stock-tracker-deploy
cd /tmp/stock-tracker-deploy

# 上传 baota-deploy.sh 脚本到此目录
# 或者直接下载
wget https://raw.githubusercontent.com/shishen168/stock-tracker/main/baota-deploy.sh
```

### 步骤2: 设置执行权限
```bash
chmod +x baota-deploy.sh
```

### 步骤3: 执行部署脚本
```bash
# 使用root用户执行
sudo ./baota-deploy.sh
```

### 步骤4: 验证部署结果
部署完成后，访问: `https://stock-tracker.yushuo.click`

---

## 📖 手动部署步骤（备选方案）

### 1. 环境准备

#### 安装Node.js 18
```bash
# 通过宝塔面板软件管理安装Node.js
# 或者命令行安装
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs
```

#### 安装PM2
```bash
npm install -g pm2
```

### 2. 项目部署

#### 创建项目目录
```bash
mkdir -p /www/wwwroot/stock-tracker
cd /www/wwwroot/stock-tracker
```

#### 克隆项目代码
```bash
git clone https://github.com/shishen168/stock-tracker.git .
git checkout main
git reset --hard 49bdc42
```

#### 配置环境变量
```bash
cat > .env.local << EOF
TUSHARE_TOKEN=2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211
NODE_ENV=production
NEXT_PUBLIC_APP_VERSION=4.2
NEXTAUTH_URL=https://stock-tracker.yushuo.click
DB_TYPE=sqlite
SQLITE_PATH=./data/stock_tracker.db
SCHEDULER_TOKEN=$(openssl rand -hex 32)
ENABLE_DATABASE_CACHE=true
CACHE_TTL=3600
PORT=3002
EOF
```

#### 安装依赖并构建
```bash
npm install
npm run build
```

### 3. PM2进程管理配置

#### 创建PM2配置文件
```bash
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'stock-tracker-v42',
    script: 'npm',
    args: 'start',
    cwd: '/www/wwwroot/stock-tracker',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    log_file: './log/app.log',
    error_file: './log/error.log',
    out_file: './log/out.log',
    time: true,
    max_restarts: 10,
    restart_delay: 5000
  }]
}
EOF
```

#### 启动PM2进程
```bash
pm2 start ecosystem.config.js
pm2 save
```

### 4. Nginx配置

在宝塔面板中配置网站 `yushuo.click`，或直接编辑配置文件：

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name yushuo.click;

    # SSL配置
    ssl_certificate /www/server/panel/vhost/cert/yushuo.click/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/yushuo.click/privkey.pem;

    # 根目录
    location / {
        root /www/wwwroot/yushuo.click;
        index index.html index.htm;
        try_files $uri $uri/ =404;
    }

    # 股票追踪系统
    location /cc/ {
        proxy_pass http://127.0.0.1:3002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_redirect off;
    }

    # API接口
    location /cc/api/ {
        proxy_pass http://127.0.0.1:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # 静态资源
    location /cc/_next/ {
        proxy_pass http://127.0.0.1:3002/_next/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    access_log /www/wwwroot/yushuo.click/log/nginx_access.log;
    error_log /www/wwwroot/yushuo.click/log/nginx_error.log;
}
```

---

## 🔧 系统架构说明

### 技术栈模块分析

#### 1. 前端模块 (React/Next.js)
- **功能**: 用户界面展示和交互
- **影响**: 负责股票数据可视化、图表展示、用户操作界面
- **依赖**: React 18, Next.js 14, TailwindCSS

#### 2. 后端API模块 (Next.js API Routes)
- **功能**: 数据接口和业务逻辑处理
- **影响**: 处理股票数据获取、定时任务、数据缓存
- **关键接口**:
  - `/api/stocks` - 股票数据接口
  - `/api/cron` - 定时任务触发
  - `/api/scheduler` - 任务调度管理

#### 3. 数据库模块 (SQLite)
- **功能**: 数据持久化存储
- **影响**: 存储股票历史数据、缓存API响应、提高查询性能
- **优势**: 轻量级、无需额外数据库服务

#### 4. 数据源模块 (Tushare API)
- **功能**: 外部股票数据获取
- **影响**: 提供实时和历史股票数据
- **配置**: 需要有效的Tushare API Token

#### 5. 进程管理模块 (PM2)
- **功能**: 应用进程管理和监控
- **影响**: 确保应用稳定运行、自动重启、日志管理
- **特性**: 支持集群模式、内存监控、性能统计

#### 6. 反向代理模块 (Nginx)
- **功能**: 请求代理和负载均衡
- **影响**: 处理静态资源、SSL终止、请求转发
- **配置**: 支持子路径部署 (`/cc`)

---

## 📊 监控与维护

### 1. 应用监控
```bash
# 查看PM2进程状态
pm2 status

# 查看实时日志
pm2 logs stock-tracker-v42

# 查看进程详情
pm2 show stock-tracker-v42
```

### 2. 系统资源监控
```bash
# 查看系统资源使用
pm2 monit

# 查看端口占用
netstat -tlnp | grep :3002

# 查看磁盘使用
df -h /www/wwwroot/stock-tracker
```

### 3. 日志管理
```bash
# 应用日志位置
tail -f /www/wwwroot/stock-tracker/log/app.log

# Nginx日志
tail -f /www/wwwroot/yushuo.click/log/nginx_access.log
tail -f /www/wwwroot/yushuo.click/log/nginx_error.log
```

### 4. 数据库维护
```bash
# 检查数据库文件
ls -la /www/wwwroot/stock-tracker/data/stock_tracker.db

# 数据库大小监控
du -h /www/wwwroot/stock-tracker/data/
```

---

## 🚨 故障排除

### 常见问题1: 应用无法启动
**症状**: PM2显示应用状态为stopped或errored
**排查步骤**:
```bash
pm2 logs stock-tracker-v42 --err
cd /www/wwwroot/stock-tracker
npm run build
```

### 常见问题2: 页面无法访问
**症状**: 访问stock-tracker.yushuo.click返回502或404
**排查步骤**:
1. 检查PM2进程: `pm2 status`
2. 检查端口监听: `netstat -tlnp | grep :3002`
3. 检查Nginx配置: `nginx -t`
4. 重启Nginx: `systemctl restart nginx`

### 常见问题3: 数据获取失败
**症状**: 页面显示但无股票数据
**排查步骤**:
1. 检查API Token有效性
2. 查看应用错误日志: `pm2 logs stock-tracker-v42 --err`
3. 测试API接口: `curl https://stock-tracker.yushuo.click/api/stocks`

---

## 🔄 更新部署

### 更新到新版本
```bash
cd /www/wwwroot/stock-tracker
git pull origin main
npm install
npm run build
pm2 restart stock-tracker-v42
```

### 回滚操作
```bash
# 回滚到上一个commit
git reset --hard HEAD~1
npm run build
pm2 restart stock-tracker-v42
```

---

## 📞 技术支持

- **项目仓库**: https://github.com/shishen168/stock-tracker
- **问题反馈**: 通过GitHub Issues
- **部署日志**: 保存在 `/www/wwwroot/stock-tracker/log/` 目录下

---

**部署完成后，请访问 https://stock-tracker.yushuo.click 验证系统正常运行**