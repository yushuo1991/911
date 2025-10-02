# Nginx 502 Bad Gateway 修复完整摘要

**生成时间**: 2025-09-30
**问题**: http://bk.yushuo.click 返回 "502 Bad Gateway nginx"
**状态**: 已准备修复工具和完整文档

---

## 问题诊断

### 当前状态
- ✅ **Docker容器运行正常**: stock-tracker-app (Up, healthy)
- ✅ **本地访问成功**: `curl http://localhost:3002` → HTTP 200 OK
- ❌ **外部访问失败**: http://bk.yushuo.click → 502 Bad Gateway
- ❌ **SSH自动连接失败**: 端口22被阻断（防火墙/ISP限制）

### 问题根源
**Nginx配置缺失或错误**，无法正确代理请求到Docker容器。

---

## 准备好的修复工具

### 1. fix-nginx-502.sh (主修复脚本)
**位置**: `C:\Users\yushu\Desktop\stock-tracker - 副本\fix-nginx-502.sh`

**功能**:
- ✅ 自动检测Nginx配置目录（4个常见位置）
- ✅ 备份现有配置
- ✅ 创建正确的反向代理配置
- ✅ 测试Nginx配置语法
- ✅ 处理SELinux权限（如适用）
- ✅ 重载Nginx服务
- ✅ 完整验证和诊断输出

**使用方法**:
```bash
cd /www/wwwroot/stock-tracker
chmod +x fix-nginx-502.sh
./fix-nginx-502.sh
```

### 2. ssh-connect.ps1 (Windows连接助手)
**位置**: `C:\Users\yushu\Desktop\stock-tracker - 副本\ssh-connect.ps1`

**功能**:
- 测试SSH端口连接状态
- 扫描常见替代SSH端口
- 提供多种备选连接方案
- 显示服务器连接信息

**使用方法**:
```powershell
# 右键点击文件 → "使用PowerShell运行"
# 或在PowerShell中:
.\ssh-connect.ps1
```

### 3. fix-nginx-502.bat (Windows SSH启动器)
**位置**: `C:\Users\yushu\Desktop\stock-tracker - 副本\fix-nginx-502.bat`

**功能**:
- 显示服务器连接信息
- 自动尝试SSH连接
- 提供备选方案说明

### 4. log/nginx-502-fix-guide-20250930.md (完整文档)
**位置**: `C:\Users\yushu\Desktop\stock-tracker - 副本\log\nginx-502-fix-guide-20250930.md`

**内容**:
- 详细问题诊断
- 5种修复方案（宝塔/PuTTY/VS Code/手动/脚本）
- 完整的Nginx配置示例
- 验证清单
- 故障排查命令
- 技术知识点说明

---

## 推荐修复方案（按优先级）

### 方案1: 宝塔面板 Web SSH (最推荐，100%可行)

**步骤**:
1. 访问宝塔面板（通常是 http://yushuo.click:8888）
2. 登录你的宝塔账户
3. 左侧菜单 → **终端**
4. 在终端中执行:

```bash
cd /www/wwwroot/stock-tracker
chmod +x fix-nginx-502.sh
./fix-nginx-502.sh
```

**优点**:
- ✅ 完全绕过本地SSH连接限制
- ✅ Web界面，操作简单
- ✅ 实时查看执行结果
- ✅ 不受本地网络限制

---

### 方案2: 宝塔面板直接编辑配置（最简单）

**步骤**:
1. 访问宝塔面板
2. 左侧菜单 → **网站**
3. 找到 `bk.yushuo.click`
4. 点击 **设置** → **配置文件**
5. 替换为以下配置:

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

6. 点击 **保存**
7. 左侧菜单 → **软件商店** → 找到 **Nginx** → 点击 **重载配置**

**优点**:
- ✅ 最快最简单
- ✅ 可视化界面
- ✅ 一键重载Nginx

---

### 方案3: PuTTY SSH客户端

**步骤**:
1. 下载PuTTY: https://www.putty.org/
2. 打开PuTTY，配置:
   - Host Name: `yushuo.click` (或 `75.2.60.5`)
   - Port: `22`
   - Connection type: `SSH`
3. 点击 **Open**
4. 输入用户名: `root`
5. 输入密码: `gJ75hNHdy90TA4qGo9`
6. 执行修复脚本（参考方案1）

---

### 方案4: VS Code Remote-SSH

**步骤**:
1. 打开 VS Code
2. 安装扩展: `Remote - SSH`
3. 按 `F1`，输入: `Remote-SSH: Connect to Host`
4. 输入: `root@yushuo.click`
5. 输入密码: `gJ75hNHdy90TA4qGo9`
6. 连接成功后，打开终端（Ctrl+`）
7. 执行修复脚本（参考方案1）

---

### 方案5: 手动配置（如果以上都不可用）

**在服务器上手动执行以下命令**:

```bash
# 1. 检查Docker容器状态
docker ps | grep stock-tracker

# 2. 测试本地访问
curl -I http://localhost:3002

# 3. 找到Nginx配置目录（尝试以下路径）
ls -la /www/server/panel/vhost/nginx/  # 宝塔面板
ls -la /www/server/nginx/vhost/
ls -la /etc/nginx/conf.d/
ls -la /etc/nginx/sites-available/

# 4. 创建配置文件（使用实际存在的目录）
vi /www/server/panel/vhost/nginx/bk.yushuo.click.conf

# 5. 按 i 进入插入模式，粘贴配置（见上面方案2的配置）
# 6. 按 ESC，输入 :wq 保存退出

# 7. 测试Nginx配置
nginx -t

# 8. 如果是CentOS/RHEL，配置SELinux
setsebool -P httpd_can_network_connect 1

# 9. 重载Nginx
systemctl reload nginx

# 10. 验证修复
curl -I http://bk.yushuo.click
```

---

## 验证成功标准

修复成功后，你应该看到:

1. ✅ `nginx -t` 输出:
   ```
   nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
   nginx: configuration file /etc/nginx/nginx.conf test is successful
   ```

2. ✅ `systemctl status nginx` 显示:
   ```
   Active: active (running)
   ```

3. ✅ `curl -I http://bk.yushuo.click` 返回:
   ```
   HTTP/1.1 200 OK
   ```

4. ✅ 浏览器访问 http://bk.yushuo.click 显示股票追踪应用

---

## 故障排查

### 如果修复后仍返回502

```bash
# 1. 检查Docker日志
docker logs stock-tracker-app --tail 50

# 2. 检查Nginx错误日志
tail -50 /www/wwwlogs/bk.yushuo.click.error.log

# 3. 检查端口监听
netstat -tlnp | grep -E '(:80|:3002)'

# 4. 测试容器内部连接
curl -v http://localhost:3002

# 5. 检查SELinux（如果是CentOS）
getenforce
tail -50 /var/log/audit/audit.log | grep nginx

# 6. 重启Docker容器
cd /www/wwwroot/stock-tracker
docker-compose restart
```

### 常见问题和解决方案

**问题1: 端口3002未监听**
```bash
# 检查容器是否在运行
docker ps | grep stock-tracker
# 如果没有运行，启动容器
cd /www/wwwroot/stock-tracker
docker-compose up -d
```

**问题2: SELinux阻止连接（CentOS/RHEL）**
```bash
# 配置SELinux
setsebool -P httpd_can_network_connect 1
# 或临时关闭SELinux进行测试
setenforce 0
```

**问题3: Nginx配置语法错误**
```bash
# 测试配置
nginx -t
# 查看详细错误
nginx -T | grep -A 10 error
```

**问题4: 端口冲突**
```bash
# 查看3002端口占用
lsof -i :3002
# 或
netstat -tlnp | grep 3002
```

---

## 技术说明

### 问题模块: Nginx反向代理层

**影响**: 外部HTTP请求无法正确转发到Docker容器

**请求流程**:
```
浏览器 → DNS → yushuo.click:80 → Nginx → localhost:3002 → Docker容器
                                  ↑ 502错误发生在这里
```

**原因分析**:
1. **配置文件缺失**: `bk.yushuo.click.conf` 不存在
2. **proxy_pass错误**: 指向错误的地址或端口
3. **SELinux阻止**: 安全策略阻止Nginx访问本地端口
4. **upstream不可用**: Docker容器未运行或端口未暴露

**解决方案技术细节**:
- `proxy_pass http://localhost:3002`: 将请求转发到Docker容器
- `proxy_http_version 1.1`: 支持WebSocket和长连接
- `proxy_set_header`: 正确传递HTTP头信息
- SELinux配置: 允许httpd进行网络连接

---

## 服务器信息

```
Host: yushuo.click (75.2.60.5)
SSH Port: 22
Username: root
Password: gJ75hNHdy90TA4qGo9
Project Directory: /www/wwwroot/stock-tracker
Application Port: 3002
Domain: bk.yushuo.click
Database Port: 3307
```

---

## 文件清单

已创建的文件:
1. ✅ `fix-nginx-502.sh` (7.4KB) - 主修复脚本
2. ✅ `fix-nginx-502.bat` (1.2KB) - Windows启动器
3. ✅ `ssh-connect.ps1` (3.8KB) - PowerShell连接工具
4. ✅ `log/nginx-502-fix-guide-20250930.md` (14.5KB) - 完整指南
5. ✅ `NGINX_FIX_SUMMARY.md` (本文件) - 快速摘要

---

## 下一步行动

1. **选择一个方案** (推荐方案1或2 - 宝塔面板)
2. **执行修复操作**
3. **验证修复成功** (检查5项成功标准)
4. **如果仍有问题**:
   - 查看Nginx错误日志
   - 检查Docker容器状态
   - 执行故障排查命令
   - 反馈具体错误信息

---

## 联系信息

如果需要进一步协助:
- 提供Nginx错误日志内容
- 提供`nginx -t`的输出
- 提供`docker ps`的输出
- 提供`curl -I http://bk.yushuo.click`的完整响应

---

**注意**: 本文档包含完整的修复方案和详细说明。如果你在执行过程中遇到任何问题，请查看`log/nginx-502-fix-guide-20250930.md`获取更详细的技术信息和故障排查步骤。