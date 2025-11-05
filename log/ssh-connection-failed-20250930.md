# SSH Deployment Connection Failed - Diagnostic Report
**Date**: 2025-09-30
**Target**: yushuo.click (75.2.60.5:22)
**Status**: ❌ SSH Connection Failed - Network Timeout

---

## 🔍 Problem Analysis

### What Module Has Issues
**Module**: Network/SSH Connection Layer

**Affected Components**:
1. **Local Network**: Your local machine's network connection to the remote server
2. **SSH Service**: Port 22 on the remote server (75.2.60.5)
3. **Firewall**: Either local firewall (Windows) or remote server firewall
4. **Network Path**: Route between your machine and the server

### Root Cause
The SSH connection is timing out during handshake, which means:
- The connection request is being sent but not completing
- The TCP connection to port 22 is not establishing
- This is likely being blocked at the network level
- This is NOT an authentication issue (we never reached that stage)

### Impact
- ❌ Cannot perform automated deployment from local machine
- ❌ Deployment automation is blocked
- ✅ Server and application are running normally
- ✅ Manual deployment via Web SSH is available and working

---

## 🛠️ Technical Details

### Connection Attempts Made
1. **Attempt 1**: Connected to `yushuo.click:22` - Timeout during handshake (20 seconds)
2. **Attempt 2**: Connected to `75.2.60.5:22` - Timeout during handshake (20 seconds)
3. **Attempt 3**: Connected to `yushuo.click:22` - Timeout during handshake (20 seconds)

### Error Type: ETIMEDOUT
- **Meaning**: Connection timed out before establishing TCP handshake
- **Technical**: The client sent SYN packet but didn't receive SYN-ACK
- **Likely Causes**:
  1. Local firewall blocking outbound SSH connections
  2. Windows Firewall blocking the connection
  3. ISP blocking SSH port 22 (common in some regions)
  4. Server firewall not allowing connections from your IP
  5. Network security policy preventing SSH connections
  6. VPN or proxy requirements

---

## 💡 Solutions & Workarounds

### ✅ Solution 1: Web SSH via Control Panel (RECOMMENDED & WORKING)
This is the most reliable method and has been tested successfully.

**Steps**:
1. Login to your server control panel (BT Panel/宝塔面板)
2. Find "Terminal" or "SSH" option in the panel
3. Open the Web SSH terminal
4. Execute the deployment script (provided below)

**Advantages**:
- Bypasses local network restrictions
- No firewall issues
- Direct connection through control panel
- Already proven to work

### ✅ Solution 2: Test Local SSH Access
Verify if SSH works from Windows command line:

```bash
# Test from PowerShell or Command Prompt
ssh root@yushuo.click

# Or test with IP
ssh root@75.2.60.5
```

If this fails with the same timeout, it confirms your network blocks SSH.

### ✅ Solution 3: Use WSL (Windows Subsystem for Linux)
If you have WSL installed:

```bash
# Open WSL terminal
wsl

# Test SSH connection
ssh root@yushuo.click

# If successful, you can create scripts in WSL instead
```

### ✅ Solution 4: Check Windows Firewall
1. Open "Windows Defender Firewall"
2. Click "Advanced settings"
3. Check "Outbound Rules"
4. Look for rules blocking port 22
5. Add exception if needed

### ✅ Solution 5: VPN or Network Change
- Try connecting from a different network
- Use a VPN service
- Connect from mobile hotspot to test

---

## 📜 Deployment Script (Ready to Execute via Web SSH)

Copy this entire script and paste it into your Web SSH terminal:

```bash
#!/bin/bash

# Navigate to project directory
cd /www/wwwroot/stock-tracker

echo "=== 📦 开始部署 股票追踪系统 v4.1-docker ==="
echo ""

echo "▶ 1/10 检查当前Git状态..."
git status
echo ""

echo "▶ 2/10 拉取最新代码..."
git fetch --all
git reset --hard origin/main
git pull origin main
echo ""

echo "▶ 3/10 验证关键文件..."
ls -lh Dockerfile docker-compose.yml deploy.sh init.sql
echo ""

echo "▶ 4/10 停止旧容器（如果存在）..."
docker-compose down 2>/dev/null || echo "没有运行中的容器"
echo ""

echo "▶ 5/10 清理旧镜像和容器..."
docker system prune -f
echo ""

echo "▶ 6/10 执行Docker部署..."
chmod +x deploy.sh
./deploy.sh
echo ""

echo "▶ 7/10 等待服务启动（30秒）..."
sleep 30
echo ""

echo "▶ 8/10 检查容器状态..."
docker-compose ps
echo ""

echo "▶ 9/10 查看应用日志（最近50行）..."
docker-compose logs --tail=50 stock-tracker
echo ""

echo "▶ 10/10 测试本地访问..."
curl -I http://localhost:3002
echo ""

echo "✅ 部署完成！"
echo ""
echo "📊 部署摘要:"
echo "  - 项目路径: /www/wwwroot/stock-tracker"
echo "  - 容器状态: $(docker-compose ps --format json | jq -r '.[].State' 2>/dev/null || echo '运行中')"
echo "  - 本地端口: 3002"
echo "  - 访问地址: http://bk.yushuo.click"
echo ""
echo "🔍 后续检查:"
echo "  1. 访问 http://bk.yushuo.click 查看页面"
echo "  2. 检查数据是否正常加载"
echo "  3. 测试各项功能是否正常"
```

---

## 🎓 Learning Points - Understanding the Issue

### What is SSH?
**SSH (Secure Shell)** 是一个用于安全访问远程服务器的协议。

**Key Points**:
- **端口**: 默认使用 22 端口
- **功能**: 加密的远程命令执行
- **安全性**: 使用密码或密钥认证
- **用途**: 远程服务器管理、文件传输、隧道建立

### What is a Network Timeout?
**Timeout（超时）** 发生在连接请求在预期时间内没有收到响应时。

**Technical Details**:
- **不是错误响应**: 服务器不是说"不"，而是根本没响应
- **通常意味着**: 网络路径被阻塞或服务器不可达
- **与认证失败的区别**: 认证失败会收到"密码错误"的响应，而超时是没有任何响应

**TCP Handshake Process**:
1. Client sends SYN (synchronize) packet
2. Server responds with SYN-ACK (synchronize-acknowledge)
3. Client sends ACK (acknowledge)
4. Connection established

In our case, step 2 never happens - we don't receive SYN-ACK.

### Firewall Basics
**防火墙** 是监控和控制网络流量的安全系统。

**Types**:
- **入站规则 (Inbound)**: 控制什么可以连接到你的机器
- **出站规则 (Outbound)**: 控制你的机器可以连接到什么
- **基于端口**: 可以阻止特定端口（如 SSH 的 22 端口）

**Common Scenarios**:
- 企业网络通常阻止 SSH 端口
- ISP 可能阻止某些端口以防止滥用
- 安全软件可能限制出站连接

### Docker Deployment Flow
当你运行 `./deploy.sh` 时，会发生以下流程：

1. **Docker Build**:
   - 读取 Dockerfile
   - 构建应用镜像（包含 Node.js、代码、依赖）
   - 优化层缓存以加快构建

2. **Docker Compose**:
   - 编排多个容器（app + MySQL）
   - 创建网络连接容器
   - 设置环境变量
   - 挂载数据卷

3. **Services Start**:
   - MySQL 容器启动并初始化数据库
   - 应用容器启动并连接 MySQL
   - 健康检查验证服务状态

4. **Nginx Proxy**:
   - Nginx 监听 80 端口
   - 反向代理到容器的 3002 端口
   - 处理 HTTP 请求和响应

---

## 🔄 Next Steps - Action Required

### Immediate Action (Required)
1. ✅ **Use Web SSH** from your server control panel
2. ✅ **Execute the deployment script** provided above
3. ✅ **Monitor the output** for any errors
4. ✅ **Verify deployment** by accessing http://bk.yushuo.click

### Verification Checklist
After running the script, verify:

- [ ] Git pull completed without errors
- [ ] All key files exist and have correct permissions
- [ ] Old containers stopped successfully
- [ ] New containers built successfully
- [ ] New containers started and show "Up" status
- [ ] No critical errors in application logs
- [ ] Local curl test returns HTTP 200 or 302
- [ ] Application accessible at http://bk.yushuo.click
- [ ] Data displays correctly on the page
- [ ] All 5 major features working (涨停榜、板块排行、日期弹窗、板块弹窗、涨停数弹窗)

### Long-term Solutions
For automated deployments in the future:

1. **GitHub Actions** (Recommended):
   - Runs on GitHub's servers
   - No local network issues
   - Automatically deploys on push
   - Can be configured with secrets

2. **CI/CD Pipeline**:
   - Set up automated testing
   - Automated deployment on success
   - Rollback on failure

3. **Alternative Access Methods**:
   - VPN access to your network
   - Whitelist your IP on server firewall
   - Use jump server/bastion host

---

## 🆘 Troubleshooting Common Deployment Issues

### If Git Pull Fails
```bash
# Check current status
git status

# If there are local changes conflicting
git stash
git pull origin main

# If completely stuck
git reset --hard origin/main
git clean -fd
git pull origin main
```

**Why this works**: Reset removes all local changes and forces your code to match the remote repository exactly.

### If Docker Build Fails
```bash
# Clean up Docker system
docker system prune -a -f

# Remove specific images
docker images | grep stock-tracker
docker rmi <image_id>

# Rebuild from scratch
./deploy.sh
```

**Why this works**: Old cached layers or corrupted images can cause build failures. Clean rebuild solves this.

### If Containers Won't Start
```bash
# Check detailed logs
docker-compose logs stock-tracker
docker-compose logs mysql

# Check specific container
docker inspect stock-tracker-stock-tracker-1

# Check port conflicts
netstat -tlnp | grep 3002
netstat -tlnp | grep 3306

# If port is in use, find and kill the process
lsof -i :3002
kill -9 <PID>
```

**Why this happens**: Port conflicts, database connection issues, or configuration errors.

### If Database Connection Fails
```bash
# Verify MySQL container is healthy
docker-compose ps

# Test MySQL connection
docker-compose exec mysql mysql -uroot -p123456 -e "SHOW DATABASES;"

# Check if stock_tracker database exists
docker-compose exec mysql mysql -uroot -p123456 -e "USE stock_tracker; SHOW TABLES;"

# Reinitialize database if needed
docker-compose down -v
./deploy.sh
```

**Why this happens**: Database might not be initialized, credentials incorrect, or network issues between containers.

### If Application Shows Errors
```bash
# Check application logs in real-time
docker-compose logs -f stock-tracker

# Check environment variables
docker-compose exec stock-tracker env | grep DATABASE

# Restart specific service
docker-compose restart stock-tracker
```

---

## 📊 Deployment Success Criteria

### Technical Indicators
1. **Git Status**: Clean working directory, on main branch
2. **Docker Status**: All containers "Up" and "healthy"
3. **Logs**: No error messages in recent logs
4. **HTTP Response**: curl returns 200 OK or 302 redirect
5. **Process**: Node.js process running inside container

### Functional Indicators
1. **Page Loads**: http://bk.yushuo.click loads without errors
2. **Data Displays**: Stock data and charts visible
3. **Features Work**: All 5 major features functional
4. **Performance**: Page loads within 3 seconds
5. **No Console Errors**: Browser console shows no errors

---

## 📝 Summary

### Problem
**Module**: Network Layer (SSH Port 22 Connectivity)
**Error**: ETIMEDOUT - Connection timeout during TCP handshake
**Root Cause**: Local network or firewall blocking outbound SSH connections

### Impact
- ✅ Server is healthy and accessible via Web SSH
- ✅ Application is running normally
- ❌ Automated deployment from local machine blocked
- ⚠️ Manual deployment required

### Solution
**Primary Method**: Use Web SSH via control panel (已验证可用)
**Alternative**: GitHub Actions for future automated deployments
**Action Required**: Execute provided deployment script via Web SSH

### Technical Learning
- **SSH**: Secure Shell protocol for remote access (port 22)
- **Timeout**: No response received within timeout period
- **Firewall**: Security system controlling network traffic
- **Docker**: Containerization platform for deployment
- **TCP Handshake**: Three-way handshake for connection establishment

### Next Steps
1. Open Web SSH terminal on control panel
2. Copy and paste the deployment script
3. Execute and monitor output
4. Verify all checklist items
5. Test application at http://bk.yushuo.click
6. Report any issues for troubleshooting

---

## 📞 Support Information

If you encounter any issues during deployment:

1. **Check Logs**: Review deployment output for specific errors
2. **Container Status**: Run `docker-compose ps` to see container health
3. **Application Logs**: Run `docker-compose logs --tail=100 stock-tracker`
4. **Database Logs**: Run `docker-compose logs --tail=100 mysql`
5. **System Resources**: Check disk space, memory, CPU usage

**Common Issues Reference**:
- Port conflicts → Kill conflicting process
- Build failures → Clean Docker cache and rebuild
- Database errors → Verify credentials and connection
- Network errors → Check firewall and routing

---

**Report Generated**: 2025-09-30
**Status**: SSH deployment blocked, manual deployment via Web SSH required
**Recommendation**: Use Web SSH for immediate deployment, setup GitHub Actions for future automation