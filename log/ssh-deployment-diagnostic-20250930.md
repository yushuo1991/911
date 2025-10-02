# SSH自动部署诊断报告

**生成时间**: 2025-09-30
**诊断服务器**: yushuo.click (75.2.60.5)
**项目**: Stock Tracker 自动部署系统

---

## 📋 执行摘要

**问题**: 无法通过SSH连接到服务器 yushuo.click 进行Git自动部署
**影响**: 无法执行远程部署操作，需要手动或使用替代方案
**根本原因**: SSH端口被防火墙阻止或服务未启动

---

## 🔍 诊断详情

### 1. 网络连通性测试

#### Ping测试结果
```
目标: yushuo.click (75.2.60.5)
结果: ✅ 成功
- 发送: 4包
- 接收: 3包
- 丢失: 1包 (25%)
- 平均延迟: 232ms
```

**分析**: 服务器网络可达，基础网络连接正常。

### 2. DNS解析测试

```
域名: yushuo.click
IP地址: 75.2.60.5
状态: ✅ 解析正常
```

**分析**: DNS解析工作正常，域名指向正确的IP地址。

### 3. SSH端口测试

#### 测试的端口:
- ❌ Port 22 (标准SSH): **CLOSED/TIMEOUT**
- ❌ Port 2222 (备用SSH): **CLOSED/TIMEOUT**
- ❌ Port 2022 (备用SSH): **CLOSED/TIMEOUT**
- ❌ Port 8022 (备用SSH): **CLOSED/TIMEOUT**
- ❌ Port 10022 (备用SSH): **CLOSED/TIMEOUT**

**分析**: 所有常见的SSH端口都无法连接，表明：
1. SSH服务可能未启动
2. 防火墙阻止了SSH端口
3. SSH监听在非标准端口上

### 4. HTTP端口测试

```
测试端口 3002 (应用端口): TIMEOUT (超过10秒)
```

**分析**: 应用HTTP端口也无法访问，可能整个服务器的防火墙配置较严格。

---

## 🔧 问题分析

### 涉及模块
1. **SSH服务 (OpenSSH Server)**
   - 功能: 提供安全的远程登录和命令执行
   - 当前状态: 不可访问
   - 影响: 无法远程管理服务器

2. **防火墙 (iptables/firewalld/云服务商安全组)**
   - 功能: 控制网络流量进出
   - 当前状态: 可能阻止了SSH和应用端口
   - 影响: 阻止外部连接

3. **网络配置**
   - 基础网络: ✅ 正常
   - DNS解析: ✅ 正常
   - 端口开放: ❌ 异常

---

## 💡 解决方案

### 方案1: 检查云服务商安全组设置 (推荐)

服务器托管在云平台(IP: 75.2.60.5)，需要在云控制台配置安全组：

1. **登录云服务商控制台**
   - 根据IP段判断可能是AWS/阿里云/腾讯云等

2. **配置安全组规则**
   ```
   入站规则:
   - SSH: TCP 22, 来源: 0.0.0.0/0 (或特定IP)
   - HTTP: TCP 3002, 来源: 0.0.0.0/0
   - HTTPS: TCP 443, 来源: 0.0.0.0/0
   ```

3. **应用安全组到服务器实例**

### 方案2: 使用服务器控制台

如果云平台提供Web控制台或VNC访问：

1. 通过云控制台的Web终端登录
2. 检查SSH服务状态:
   ```bash
   systemctl status sshd
   systemctl start sshd
   systemctl enable sshd
   ```

3. 检查防火墙规则:
   ```bash
   # CentOS/RHEL
   firewall-cmd --list-all
   firewall-cmd --add-service=ssh --permanent
   firewall-cmd --add-port=3002/tcp --permanent
   firewall-cmd --reload

   # Ubuntu/Debian
   ufw status
   ufw allow ssh
   ufw allow 3002/tcp
   ```

### 方案3: 联系服务器管理员

如果您不是服务器的唯一管理员：
1. 联系服务器管理员或托管服务商
2. 请求开放SSH端口(22)和应用端口(3002)
3. 确认SSH服务是否运行

### 方案4: 使用替代部署方式

在SSH修复之前，可以使用：

#### A. GitHub Actions自动部署
创建 `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: yushuo.click
          username: root
          password: ${{ secrets.SSH_PASSWORD }}
          script: |
            cd /www/wwwroot/stock-tracker
            git pull origin main
            chmod +x deploy.sh
            ./deploy.sh
```

#### B. Webhook部署
在服务器上配置webhook接收器，从GitHub推送触发部署。

#### C. 本地构建+FTP部署
```bash
# 本地构建
npm run build

# 使用SFTP/FTP上传构建产物
# (如果FTP端口开放的话)
```

---

## 📝 下一步行动

### 立即执行:
1. ✅ **检查云服务商安全组** - 最可能的问题
2. ✅ **尝试使用云控制台的Web终端** - 绕过SSH限制
3. ✅ **确认SSH服务状态** - 通过控制台访问

### 中期执行:
4. 配置GitHub Actions自动部署 - 作为长期解决方案
5. 设置监控告警 - 防止类似问题再次发生
6. 文档化部署流程 - 便于团队其他成员操作

---

## 🔐 安全建议

1. **SSH密钥认证**: 使用SSH密钥替代密码认证
   ```bash
   ssh-keygen -t rsa -b 4096
   ssh-copy-id root@yushuo.click
   ```

2. **更改SSH默认端口**: 减少暴力破解风险
   ```bash
   # /etc/ssh/sshd_config
   Port 2222
   ```

3. **限制SSH访问IP**: 仅允许特定IP访问
   ```bash
   # 在安全组或防火墙中配置
   AllowUsers root@your-ip-address
   ```

4. **使用堡垒机**: 增加一层安全防护

---

## 📊 技术知识点

### SSH (Secure Shell)
- **作用**: 加密的网络协议，用于安全的远程登录和命令执行
- **默认端口**: 22
- **配置文件**: `/etc/ssh/sshd_config`
- **服务管理**: `systemctl [start|stop|restart|status] sshd`

### 防火墙
Linux系统常见的防火墙工具:
1. **iptables**: 底层防火墙工具
2. **firewalld**: CentOS/RHEL默认防火墙管理工具
3. **ufw**: Ubuntu/Debian简化的防火墙管理工具

### 云安全组
- **定义**: 虚拟防火墙，控制云服务器的入站和出站流量
- **优先级**: 通常优先于服务器内部防火墙
- **配置**: 在云服务商控制台配置

### Docker部署
项目使用Docker进行容器化部署:
- **docker-compose**: 多容器应用编排工具
- **健康检查**: 确保容器正常运行
- **日志管理**: `docker-compose logs`查看应用日志

---

## 🎯 预期结果 (修复后)

修复SSH连接后，部署流程应该如下:

```bash
# 1. SSH连接成功
ssh root@yushuo.click
# 提示: Welcome to ...

# 2. 进入项目目录
cd /www/wwwroot/stock-tracker
# 当前目录: /www/wwwroot/stock-tracker

# 3. 拉取最新代码
git pull origin main
# 提示: Already up to date. 或显示更新的文件

# 4. 执行部署
chmod +x deploy.sh && ./deploy.sh
# 显示: 构建镜像 -> 启动容器 -> 健康检查

# 5. 验证部署
docker-compose ps
# 显示:
# stock-tracker-app: Up (healthy)
# stock-tracker-mysql: Up (healthy)

# 6. 访问应用
# http://yushuo.click:3002 - 显示Stock Tracker界面
```

---

## 📞 支持信息

- **服务器**: yushuo.click (75.2.60.5)
- **项目仓库**: https://github.com/yushuo1991/911.git
- **应用端口**: 3002
- **数据库**: MySQL (Docker容器)

---

## ✅ 检查清单

- [x] 网络连通性测试
- [x] DNS解析验证
- [x] SSH端口扫描
- [x] HTTP端口测试
- [ ] 云安全组配置检查
- [ ] SSH服务状态确认
- [ ] 防火墙规则审查
- [ ] 部署脚本测试
- [ ] 应用访问验证

---

**报告生成**: 2025-09-30
**诊断工具**: Windows 10 + PowerShell + SSH Client
**下次更新**: 修复SSH连接后