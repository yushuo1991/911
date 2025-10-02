# SSH自动化部署指南
**生成时间**: 2025-09-30 02:01:00
**服务器**: yushuo.click (75.2.60.5)
**项目**: 股票追踪系统
**目标提交**: f619042

---

## 🚨 网络连接问题

### 问题诊断
- ✅ 服务器网络可达 (Ping成功，延迟237ms)
- ❌ SSH端口22连接超时 (ETIMEDOUT)

### 可能原因
1. **防火墙阻止**: 本地或服务器防火墙阻止了SSH连接
2. **网络限制**: 当前网络环境可能限制SSH端口访问
3. **GFW干扰**: 国际SSH连接可能被限制
4. **SSH服务配置**: 服务器SSH服务可能限制了IP访问

---

## 📋 部署方案

### 方案1: 使用Web SSH工具 (推荐)

如果你的服务器托管商提供Web SSH控制台（如宝塔面板、cPanel等），可以直接在浏览器中执行以下命令：

```bash
# 一键部署脚本
cd /www/wwwroot/stock-tracker && \
docker-compose down && \
git fetch --all && \
git reset --hard origin/main && \
git pull origin main && \
git log -1 && \
chmod +x deploy.sh && \
./deploy.sh && \
sleep 30 && \
docker-compose ps && \
docker-compose logs --tail=50 stock-tracker && \
curl -I http://localhost:3002
```

### 方案2: 使用SSH客户端工具

推荐使用以下SSH客户端之一：
- **PuTTY** (Windows): https://www.putty.org/
- **MobaXterm** (Windows): https://mobaxterm.mobatek.net/
- **Termius** (跨平台): https://termius.com/
- **宝塔远程桌面** (如果已安装宝塔)

**连接信息**:
```
主机: yushuo.click
端口: 22
用户名: root
密码: gJ75hNHdy90TA4qGo9
```

连接成功后，执行以下命令：

### 方案3: 使用VPN后重试

如果当前网络限制SSH访问，可以：
1. 连接VPN
2. 重新运行部署脚本

```bash
# Windows
deploy-via-ssh.bat

# 或使用Node.js脚本
node ssh-deploy.js
```

---

## 🔧 分步部署命令

### 步骤1: 连接服务器
```bash
ssh root@yushuo.click
# 输入密码: gJ75hNHdy90TA4qGo9
```

### 步骤2: 导航到项目目录
```bash
cd /www/wwwroot/stock-tracker
pwd  # 确认当前目录
```

### 步骤3: 停止现有容器
```bash
docker-compose down
```

### 步骤4: 拉取最新代码
```bash
git fetch --all
git reset --hard origin/main
git pull origin main
```

### 步骤5: 验证最新提交
```bash
git log -1
# 应该看到提交 f619042 或更新的提交
```

### 步骤6: 检查关键文件
```bash
ls -lh Dockerfile docker-compose.yml init.sql deploy.sh
```

### 步骤7: 设置执行权限
```bash
chmod +x deploy.sh
```

### 步骤8: 执行部署
```bash
./deploy.sh
```

### 步骤9: 等待容器启动
```bash
# 等待30秒
sleep 30
```

### 步骤10: 验证部署
```bash
# 查看容器状态
docker-compose ps

# 查看应用日志
docker-compose logs --tail=50 stock-tracker

# 查看MySQL日志
docker-compose logs --tail=30 mysql

# 测试本地访问
curl -I http://localhost:3002
```

### 步骤11: 检查容器健康状态
```bash
docker ps --filter "name=stock-tracker"
```

---

## ✅ 预期结果

### 容器状态
```
NAME                    STATUS
stock-tracker-app       Up (healthy)
stock-tracker-mysql     Up (healthy)
```

### HTTP响应
```
HTTP/1.1 200 OK
Content-Type: text/html
```

### 访问URL
- **生产环境**: http://bk.yushuo.click
- **本地端口**: http://yushuo.click:3002

---

## 🔍 问题排查

### 如果容器未启动
```bash
# 查看详细日志
docker-compose logs stock-tracker

# 检查Docker资源
docker system df

# 重启容器
docker-compose restart
```

### 如果应用返回502
```bash
# 检查应用日志
docker-compose logs -f stock-tracker

# 检查端口监听
docker exec stock-tracker-app netstat -tulpn | grep 3002
```

### 如果数据库连接失败
```bash
# 检查MySQL日志
docker-compose logs mysql

# 进入MySQL容器
docker exec -it stock-tracker-mysql mysql -uroot -p
# 密码: root123456

# 验证数据库
SHOW DATABASES;
USE stock_tracker;
SHOW TABLES;
```

### 如果域名无法访问

检查Nginx配置：
```bash
# 查看Nginx配置
cat /www/server/panel/vhost/nginx/bk.yushuo.click.conf

# 应该包含类似配置：
# location / {
#     proxy_pass http://localhost:3002;
#     proxy_http_version 1.1;
#     proxy_set_header Upgrade $http_upgrade;
#     proxy_set_header Connection 'upgrade';
#     proxy_set_header Host $host;
#     proxy_cache_bypass $http_upgrade;
# }

# 测试Nginx配置
nginx -t

# 重载Nginx
nginx -s reload
```

---

## 📊 部署验证清单

- [ ] SSH连接成功
- [ ] 项目目录存在
- [ ] Docker环境正常
- [ ] Git代码已更新
- [ ] deploy.sh已执行
- [ ] stock-tracker-app容器状态为Up
- [ ] stock-tracker-mysql容器状态为Up
- [ ] localhost:3002返回200响应
- [ ] bk.yushuo.click可访问
- [ ] 应用数据正常加载

---

## 🛠️ 备用工具

### 创建快捷部署脚本

在服务器上创建快捷脚本：
```bash
cat > /root/quick-deploy.sh << 'EOF'
#!/bin/bash
cd /www/wwwroot/stock-tracker
echo "正在停止容器..."
docker-compose down
echo "正在拉取最新代码..."
git fetch --all
git reset --hard origin/main
git pull origin main
echo "当前提交:"
git log -1 --oneline
echo "正在部署..."
chmod +x deploy.sh
./deploy.sh
echo "等待容器启动..."
sleep 30
echo "容器状态:"
docker-compose ps
echo "应用日志:"
docker-compose logs --tail=30 stock-tracker
echo "测试访问:"
curl -I http://localhost:3002
echo "部署完成！"
EOF

chmod +x /root/quick-deploy.sh
```

以后可以直接运行：
```bash
/root/quick-deploy.sh
```

---

## 📞 技术支持

### 模块说明

**涉及模块**:
1. **SSH服务**: 负责远程连接，如果连接失败，影响所有远程操作
2. **Git**: 版本控制系统，负责代码更新
3. **Docker**: 容器运行时，负责应用和数据库的隔离运行
4. **Nginx**: Web服务器，负责域名到容器端口的反向代理
5. **MySQL**: 数据库服务，存储股票数据

**影响分析**:
- SSH无法连接 → 无法远程管理服务器
- Docker未运行 → 应用无法启动
- Nginx配置错误 → 域名无法访问
- MySQL初始化失败 → 应用无法获取数据

**解决方案**:
- 使用Web SSH替代直接SSH连接
- 确保Docker服务运行: `systemctl status docker`
- 检查Nginx配置: `nginx -t`
- 验证MySQL连接: `docker-compose logs mysql`

---

## 📝 部署日志

### 网络测试结果
```
Ping yushuo.click [75.2.60.5]
最小 = 226ms，最大 = 243ms，平均 = 237ms
```

### SSH连接测试
```
状态: ETIMEDOUT (连接超时)
原因: 无法建立到75.2.60.5:22的TCP连接
建议: 使用替代方案（Web SSH、VPN等）
```

---

**报告生成时间**: 2025-09-30 02:01:00
**下一步行动**: 使用Web SSH或SSH客户端工具手动执行部署命令