# Nginx 502 Bad Gateway 修复指南
**生成时间**: 2025-09-30
**服务器**: yushuo.click (75.2.60.5)
**域名**: bk.yushuo.click
**问题**: 502 Bad Gateway Error

## 问题诊断

### 当前状态
✅ **Docker容器运行正常** (stock-tracker-app on port 3002)
✅ **本地访问正常** `curl http://localhost:3002` 返回 HTTP 200 OK
❌ **外部访问失败** http://bk.yushuo.click 返回 "502 Bad Gateway"

### 问题根源
**Nginx配置文件缺失或配置错误**，导致无法正确代理到Docker容器

## SSH连接问题

### 尝试的连接方法
1. ❌ `sshpass` - 命令未找到
2. ❌ `ssh root@yushuo.click` - 连接超时
3. ❌ `ssh root@75.2.60.5` - 连接超时
4. ❌ Port 22测试 - 端口被过滤或关闭

### 可能的原因
1. **防火墙阻止**: 本地网络或Windows防火墙阻止SSH连接
2. **SSH端口非标准**: 服务器SSH可能不在22端口
3. **网络限制**: 中国大陆访问国外服务器可能存在限制
4. **Windows SSH客户端限制**: Git Bash的SSH可能有限制

## 解决方案

### 方案一: 使用宝塔面板(推荐)

如果你的服务器安装了宝塔面板,这是最简单的方法:

1. **访问宝塔面板**
   - URL: http://yushuo.click:8888 (或其他端口)
   - 登录你的宝塔账户

2. **进入网站管理**
   - 左侧菜单 → 网站
   - 找到 bk.yushuo.click

3. **编辑配置文件**
   - 点击网站 → 设置 → 配置文件
   - 替换为以下配置:

```nginx
server {
    listen 80;
    server_name bk.yushuo.click;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    access_log /www/wwwlogs/bk.yushuo.click.log;
    error_log /www/wwwlogs/bk.yushuo.click.error.log;
}
```

4. **保存并重载Nginx**
   - 点击"保存"
   - 左侧菜单 → 软件商店 → Nginx → 重载配置

### 方案二: 使用其他SSH客户端

#### 1. PuTTY (推荐Windows用户)
```
下载: https://www.putty.org/
配置:
  - Host Name: yushuo.click 或 75.2.60.5
  - Port: 22 (如果不行试试 2222, 2200, 22000)
  - Connection type: SSH
  - Username: root
  - Password: gJ75hNHdy90TA4qGo9
```

#### 2. VS Code Remote-SSH
```
1. 安装扩展: "Remote - SSH"
2. F1 → "Remote-SSH: Connect to Host"
3. 输入: root@yushuo.click
4. 输入密码: gJ75hNHdy90TA4qGo9
```

#### 3. Windows Terminal + OpenSSH
```powershell
# 打开PowerShell或Windows Terminal
ssh root@yushuo.click
# 或者
ssh -p 22 root@yushuo.click
# 输入密码: gJ75hNHdy90TA4qGo9
```

### 方案三: 运行修复脚本

一旦SSH连接成功,运行以下命令:

```bash
# 1. 上传修复脚本到服务器
# (在本地Windows) 使用WinSCP或其他SFTP工具上传 fix-nginx-502.sh

# 2. 在服务器上执行
cd /www/wwwroot/stock-tracker
chmod +x fix-nginx-502.sh
./fix-nginx-502.sh
```

### 方案四: 手动修复步骤

如果SSH连接成功,按以下步骤手动修复:

```bash
# 1. 检查Docker容器状态
docker ps | grep stock-tracker

# 2. 测试本地访问
curl -I http://localhost:3002

# 3. 查找Nginx配置目录
ls -la /www/server/panel/vhost/nginx/
# 或
ls -la /www/server/nginx/vhost/
# 或
ls -la /etc/nginx/conf.d/

# 4. 创建/编辑配置文件 (使用实际找到的目录)
vi /www/server/panel/vhost/nginx/bk.yushuo.click.conf

# 5. 粘贴配置 (按 i 进入插入模式,粘贴下面的配置,按 ESC 然后 :wq 保存)
server {
    listen 80;
    server_name bk.yushuo.click;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    access_log /www/wwwlogs/bk.yushuo.click.log;
    error_log /www/wwwlogs/bk.yushuo.click.error.log;
}

# 6. 测试Nginx配置
nginx -t

# 7. 如果是CentOS/RHEL,配置SELinux
setsebool -P httpd_can_network_connect 1

# 8. 重载Nginx
systemctl reload nginx
# 或
nginx -s reload

# 9. 验证修复
curl -I http://bk.yushuo.click
```

## 验证成功标准

修复成功后,你应该看到:

1. ✅ `nginx -t` 显示: "syntax is ok" 和 "test is successful"
2. ✅ `systemctl status nginx` 显示: "active (running)"
3. ✅ `curl -I http://bk.yushuo.click` 返回: "HTTP/1.1 200 OK"
4. ✅ 浏览器访问 http://bk.yushuo.click 显示应用程序

## 技术说明

### 问题模块: Nginx反向代理
**影响**: 无法将外部HTTP请求正确转发到Docker容器

### 原因分析:
1. **配置文件缺失**: bk.yushuo.click.conf 文件不存在
2. **配置错误**: upstream配置错误或proxy_pass指向错误
3. **权限问题**: SELinux阻止Nginx访问本地端口

### 解决方案技术细节:
1. **proxy_pass http://localhost:3002**: 将请求转发到Docker容器端口
2. **proxy_set_header**: 确保正确传递HTTP头信息
3. **proxy_http_version 1.1**: 支持WebSocket和长连接
4. **SELinux配置**: 允许Nginx进行网络连接

### 学习要点:
- **Nginx作为反向代理**: 接收外部请求并转发到后端应用
- **Docker网络**: 容器通过端口映射暴露服务
- **502错误含义**: Nginx无法从上游服务器获取有效响应
- **配置文件位置**: 不同的服务器面板有不同的配置路径

## 故障排查清单

如果修复后仍有问题:

```bash
# 1. 检查Docker日志
docker logs stock-tracker-app --tail 50

# 2. 检查Nginx错误日志
tail -50 /www/wwwlogs/bk.yushuo.click.error.log

# 3. 检查端口监听
netstat -tlnp | grep -E '(:80|:3002)'

# 4. 测试内部连接
curl -v http://localhost:3002

# 5. 检查防火墙
firewall-cmd --list-all
# 或
iptables -L -n

# 6. 检查SELinux日志
tail -50 /var/log/audit/audit.log | grep nginx
```

## 文件清单

生成的文件:
1. ✅ `fix-nginx-502.sh` - Linux修复脚本
2. ✅ `fix-nginx-502.bat` - Windows SSH连接助手
3. ✅ `log/nginx-502-fix-guide-20250930.md` - 本修复指南

## 下一步

1. **尝试SSH连接**: 使用上述任一方案连接到服务器
2. **执行修复**: 通过宝塔面板或命令行修复配置
3. **验证结果**: 确认 http://bk.yushuo.click 可以正常访问
4. **报告状态**: 告诉我修复结果,如果还有问题,我会继续协助

---

**注意**: 如果你的服务器SSH端口不是22,可能需要联系服务器提供商确认正确的SSH端口号。