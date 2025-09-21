# 宝塔面板 + GitHub 部署指南

**服务器IP**: 107.173.154.147
**GitHub仓库**: https://github.com/yushuo1991/911
**项目域名**: yushuo.click

---

## 🎯 **第一步：宝塔面板环境检查**

### 1.1 登录宝塔面板
```
访问地址: http://107.173.154.147:8888
用户名: [您的宝塔用户名]
密码: [您的宝塔密码]
```

### 1.2 检查已安装的软件
在宝塔面板中检查以下软件是否已安装：

**必须软件**：
- ✅ **Nginx** (版本 1.20+)
- ✅ **MySQL** (版本 5.7+ 或 8.0+)
- ✅ **Node.js** (版本 18+)

**安装方法**：
1. 点击 **软件商店**
2. 搜索并安装缺失的软件
3. 启动所有服务

---

## 🎯 **第二步：通过GitHub拉取项目代码**

### 2.1 进入服务器终端
在宝塔面板中：
1. 点击 **终端**
2. 或者点击 **文件** → **终端**

### 2.2 拉取GitHub代码
```bash
# 进入网站根目录
cd /www/wwwroot

# 从GitHub克隆项目 (如果还没有)
git clone https://github.com/yushuo1991/911.git stock-tracker

# 进入项目目录
cd stock-tracker

# 确保拉取最新代码
git pull origin main

# 查看项目文件
ls -la
```

**预期输出**：
```
stock-tracker/
├── src/                    # Next.js应用源码
├── package.json           # 项目配置
├── baota-auto-deploy.sh   # 自动部署脚本
├── database-init.sql      # 数据库初始化
└── ...
```

### 2.3 设置文件权限
```bash
# 设置项目文件权限
chmod -R 755 /www/wwwroot/stock-tracker

# 设置脚本执行权限
chmod +x /www/wwwroot/stock-tracker/baota-auto-deploy.sh
chmod +x /www/wwwroot/stock-tracker/github-sync-setup.sh
```

---

## 🎯 **第三步：配置Node.js环境**

### 3.1 检查Node.js版本
```bash
node --version  # 应该显示 v18+
npm --version   # 应该显示 9.0+
```

### 3.2 安装PM2 (如果未安装)
```bash
npm install -g pm2
```

### 3.3 安装项目依赖
```bash
cd /www/wwwroot/stock-tracker

# 清理缓存 (如果需要)
npm cache clean --force

# 安装生产依赖
npm install --production

# 检查安装结果
ls -la node_modules/
```

### 3.4 构建项目
```bash
# 构建Next.js项目
npm run build

# 检查构建结果
ls -la .next/
```

---

## 🎯 **第四步：配置MySQL数据库**

### 4.1 在宝塔面板中创建数据库
1. 点击 **数据库**
2. 点击 **添加数据库**
3. 填写信息：
   ```
   数据库名: stock_db
   用户名: stock_user
   密码: StockPass123!
   访问权限: 本地服务器
   ```
4. 点击 **提交**

### 4.2 初始化数据库表
在终端中执行：
```bash
cd /www/wwwroot/stock-tracker

# 使用phpMyAdmin或命令行导入SQL
mysql -u stock_user -p stock_db < database-init.sql
# 输入密码: StockPass123!
```

**或者通过宝塔面板**：
1. 点击数据库名称旁的 **管理**
2. 进入 **phpMyAdmin**
3. 选择 `stock_db` 数据库
4. 点击 **导入**
5. 选择 `database-init.sql` 文件
6. 点击 **执行**

### 4.3 验证数据库
```sql
-- 在phpMyAdmin中执行
SHOW TABLES;
SELECT COUNT(*) FROM stocks;
```

---

## 🎯 **第五步：配置环境变量**

### 5.1 创建环境配置
```bash
cd /www/wwwroot/stock-tracker

# 创建生产环境配置
cat > .env.production <<EOF
# Tushare API配置
TUSHARE_TOKEN=2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211

# 数据库配置
DATABASE_URL=mysql://stock_user:StockPass123!@localhost:3306/stock_db

# API配置
NEXT_PUBLIC_API_URL=https://yushuo.click

# 生产环境
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
EOF
```

---

## 🎯 **第六步：使用PM2启动应用**

### 6.1 配置PM2
```bash
cd /www/wwwroot/stock-tracker

# 检查PM2配置文件
cat ecosystem.config.js

# 启动应用
pm2 start ecosystem.config.js

# 查看应用状态
pm2 status

# 查看日志
pm2 logs stock-tracker
```

### 6.2 设置PM2开机自启
```bash
# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup

# 按照提示执行输出的命令 (通常是sudo开头的命令)
```

---

## 🎯 **第七步：在宝塔面板中配置网站**

### 7.1 添加网站
1. 点击 **网站**
2. 点击 **添加站点**
3. 填写信息：
   ```
   域名: yushuo.click
   根目录: /www/wwwroot/stock-tracker
   FTP: 不创建
   数据库: 不创建 (已创建)
   PHP版本: 不选择 (Node.js项目)
   ```
4. 点击 **提交**

### 7.2 配置反向代理
1. 点击域名右侧的 **设置**
2. 点击 **反向代理**
3. 点击 **添加反向代理**
4. 填写配置：
   ```
   代理名称: stock-tracker
   目标URL: http://127.0.0.1:3000
   发送域名: $host
   ```
5. 高级配置：
   ```
   proxy_set_header Host $host;
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;
   ```
6. 点击 **保存**

### 7.3 配置SSL证书 (推荐)
1. 在网站设置中点击 **SSL**
2. 选择 **Let's Encrypt**
3. 填写域名: `yushuo.click`
4. 点击 **申请**
5. 开启 **强制HTTPS**

---

## 🎯 **第八步：验证部署**

### 8.1 检查服务状态
```bash
# 检查PM2应用状态
pm2 status

# 检查端口监听
netstat -tlnp | grep 3000

# 检查应用日志
pm2 logs stock-tracker --lines 50
```

### 8.2 测试访问
```bash
# 测试本地访问
curl http://localhost:3000

# 测试API接口
curl http://localhost:3000/api/stocks?date=$(date +%Y-%m-%d)
```

### 8.3 浏览器访问
- **HTTP访问**: http://107.173.154.147 (如果配置了代理)
- **域名访问**: https://yushuo.click (如果配置了域名和SSL)

---

## 🎯 **第九步：配置GitHub自动同步 (可选)**

### 9.1 配置Webhook服务
```bash
cd /www/wwwroot/stock-tracker

# 启动GitHub同步服务
./github-sync-setup.sh
```

### 9.2 在GitHub中配置Webhook
1. 访问: https://github.com/yushuo1991/911/settings/hooks
2. 点击 **Add webhook**
3. 填写配置：
   ```
   Payload URL: http://107.173.154.147:9999/webhook
   Content type: application/json
   Secret: stock_tracker_webhook_2024
   Events: Just the push event
   ```
4. 点击 **Add webhook**

---

## 🎯 **第十步：监控和维护**

### 10.1 宝塔面板监控
- **系统监控**: 查看CPU、内存、磁盘使用情况
- **网站监控**: 查看访问日志和错误日志
- **数据库监控**: 查看数据库连接和查询

### 10.2 PM2监控
```bash
# 实时监控
pm2 monit

# 查看日志
pm2 logs stock-tracker

# 重启应用
pm2 restart stock-tracker

# 查看进程详情
pm2 show stock-tracker
```

### 10.3 更新代码
```bash
cd /www/wwwroot/stock-tracker

# 拉取最新代码
git pull origin main

# 安装新依赖 (如果有)
npm install --production

# 重新构建
npm run build

# 重启应用
pm2 restart stock-tracker
```

---

## 🆘 **常见问题排除**

### ❌ Node.js版本过低
```bash
# 卸载旧版本Node.js (在宝塔面板软件商店)
# 安装Node.js 18+

# 或者使用nvm管理版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### ❌ PM2应用启动失败
```bash
# 查看详细错误
pm2 logs stock-tracker

# 检查配置文件
cat ecosystem.config.js

# 手动启动调试
cd /www/wwwroot/stock-tracker
npm start
```

### ❌ 数据库连接失败
```bash
# 检查MySQL服务
systemctl status mysql

# 测试数据库连接
mysql -u stock_user -p stock_db
```

### ❌ 端口冲突
```bash
# 查看端口占用
lsof -ti:3000

# 杀死占用进程
kill -9 $(lsof -ti:3000)

# 重启PM2应用
pm2 restart stock-tracker
```

### ❌ Git拉取失败
```bash
# 重新设置Git仓库
cd /www/wwwroot/stock-tracker
git remote set-url origin https://github.com/yushuo1991/911.git
git pull origin main
```

---

## ✅ **部署完成检查清单**

- [ ] ✅ 宝塔面板访问正常
- [ ] ✅ Node.js 18+ 已安装
- [ ] ✅ MySQL数据库已创建并初始化
- [ ] ✅ 项目代码从GitHub拉取成功
- [ ] ✅ 依赖安装完成，项目构建成功
- [ ] ✅ PM2应用启动正常
- [ ] ✅ 网站配置完成，反向代理设置正确
- [ ] ✅ SSL证书配置 (可选)
- [ ] ✅ 浏览器可以正常访问
- [ ] ✅ API接口响应正常
- [ ] ✅ GitHub Webhook配置 (可选)

---

## 🎉 **部署成功！**

**访问地址**:
- 🌐 **主站**: https://yushuo.click
- 🔧 **API**: https://yushuo.click/api/stocks?date=2024-09-21
- 📊 **宝塔面板**: http://107.173.154.147:8888

**管理命令**:
```bash
pm2 status          # 查看应用状态
pm2 restart stock-tracker  # 重启应用
pm2 logs stock-tracker     # 查看日志
git pull origin main       # 更新代码
```

恭喜！您的股票追踪系统已成功部署！🎊