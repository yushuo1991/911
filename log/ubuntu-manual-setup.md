# Ubuntu/Debian服务器手动安装指导

## 当前情况分析

您的服务器是Ubuntu/Debian系统，而原脚本是为RPM系统设计的。现在项目文件已同步到 `/www/wwwroot/stock-tracker`，需要根据Ubuntu系统特性进行环境配置。

---

## 🔍 第一步：环境检测

在服务器上执行以下命令：

```bash
cd /www/wwwroot/stock-tracker
chmod +x ubuntu-env-check.sh
sudo ./ubuntu-env-check.sh
```

这会检测您的系统环境，并给出详细的安装建议。

---

## 🛠️ 第二步：通过宝塔面板手动安装依赖

### 2.1 安装Node.js 18+

**方法一：通过宝塔面板软件管理**
1. 登录宝塔面板
2. 进入"软件商店"
3. 搜索"Node.js"
4. 安装Node.js 18.x版本

**方法二：命令行安装**
```bash
# 添加NodeSource仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 安装Node.js
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2.2 安装PM2进程管理器

**方法一：通过宝塔面板**
1. 在"软件商店"中搜索"PM2"
2. 安装PM2管理器

**方法二：NPM全局安装**
```bash
sudo npm install -g pm2

# 验证安装
pm2 --version
```

### 2.3 确保Nginx已安装

**检查Nginx状态**：
```bash
nginx -v
systemctl status nginx
```

**如未安装，通过宝塔面板安装**：
1. 软件商店 → 搜索"Nginx"
2. 安装最新版本

---

## 🚀 第三步：手动部署应用

### 3.1 安装项目依赖

```bash
cd /www/wwwroot/stock-tracker

# 安装依赖包
npm install

# 检查是否有错误
echo "依赖安装完成状态: $?"
```

### 3.2 构建生产版本

```bash
# 构建项目
npm run build

# 验证构建结果
ls -la .next/
```

### 3.3 配置环境变量

检查并编辑环境配置：
```bash
# 查看当前环境配置
cat .env.local

# 如需修改，编辑环境文件
nano .env.local
```

确保以下关键配置正确：
```bash
NODE_ENV=production
NEXTAUTH_URL=https://bk.yushuo.click
DB_TYPE=sqlite
SQLITE_PATH=./data/stock_tracker.db
PORT=3002
```

### 3.4 启动PM2进程

```bash
# 创建PM2配置文件
cat > ecosystem.config.js << 'EOF'
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

# 启动PM2进程
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

---

## 🌐 第四步：配置Nginx反向代理

### 4.1 通过宝塔面板配置域名

1. **添加站点**：
   - 域名：`bk.yushuo.click`
   - 根目录：`/www/wwwroot/stock-tracker`（实际不使用，因为是代理）

2. **配置反向代理**：
   ```nginx
   location / {
       proxy_pass http://127.0.0.1:3002;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_cache_bypass $http_upgrade;
       proxy_read_timeout 86400;
   }

   location /api/ {
       proxy_pass http://127.0.0.1:3002/api/;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }

   location /_next/ {
       proxy_pass http://127.0.0.1:3002/_next/;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

3. **配置SSL证书**（可选但推荐）：
   - 申请Let's Encrypt免费证书
   - 或上传自有证书

### 4.2 配置DNS解析

确保 `bk.yushuo.click` 解析到您的服务器IP地址。

---

## ✅ 第五步：验证部署

### 5.1 检查服务状态

```bash
# 检查PM2进程
pm2 status

# 检查端口监听
netstat -tlnp | grep :3002

# 检查Nginx状态
systemctl status nginx

# 检查Nginx配置
nginx -t
```

### 5.2 测试应用访问

```bash
# 测试本地访问
curl http://localhost:3002

# 测试域名访问
curl -I https://bk.yushuo.click

# 查看应用日志
pm2 logs stock-tracker-v42
```

---

## 🔧 常见问题排查

### 问题1: Node.js版本过低
**症状**: npm install失败或构建失败
**解决**:
```bash
# 卸载旧版本
sudo apt remove nodejs npm

# 重新安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 问题2: 权限错误
**症状**: EACCES权限错误
**解决**:
```bash
# 修复文件权限
sudo chown -R www-data:www-data /www/wwwroot/stock-tracker

# 或使用nginx用户
sudo chown -R nginx:nginx /www/wwwroot/stock-tracker
```

### 问题3: PM2无法启动
**症状**: PM2进程状态为errored
**解决**:
```bash
# 查看详细错误信息
pm2 logs stock-tracker-v42

# 检查环境变量
pm2 show stock-tracker-v42

# 重启进程
pm2 restart stock-tracker-v42
```

### 问题4: 端口被占用
**症状**: Error: listen EADDRINUSE :::3002
**解决**:
```bash
# 查找占用端口的进程
sudo lsof -i :3002

# 终止占用进程（替换PID）
sudo kill -9 <PID>

# 重启应用
pm2 restart stock-tracker-v42
```

---

## 📊 性能优化建议

### 1. 启用Gzip压缩
在Nginx配置中添加：
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. 配置防火墙
```bash
# 启用UFW防火墙
sudo ufw enable

# 开放必要端口
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
```

### 3. 设置日志轮转
```bash
# 创建日志轮转配置
sudo nano /etc/logrotate.d/stock-tracker

# 添加内容:
/www/wwwroot/stock-tracker/log/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 📞 部署完成检查清单

- [ ] Node.js 18+ 已安装
- [ ] PM2 已安装并运行
- [ ] 项目依赖安装成功
- [ ] 应用构建完成（.next目录存在）
- [ ] PM2进程运行正常
- [ ] 端口3002正常监听
- [ ] Nginx反向代理配置正确
- [ ] 域名DNS解析正确
- [ ] SSL证书配置（如需要）
- [ ] 应用可通过https://bk.yushuo.click访问
- [ ] 股票数据显示正常

---

**完成部署后，请访问 https://bk.yushuo.click 验证系统功能！**