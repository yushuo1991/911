# 502 Bad Gateway 诊断计划和解决方案

## 问题概述
- **现象**: 访问 http://bk.yushuo.click 返回 "502 Bad Gateway nginx"
- **已知信息**:
  - Docker 容器正在运行且健康
  - `curl http://localhost:3002` 返回 HTTP 200 OK
  - Nginx 对外部请求返回 502

## 模块分析

### 涉及的模块
1. **Docker 容器** (应用层)
   - 运行 Next.js 应用
   - 监听端口: 3002
   - 状态: 已确认运行正常

2. **Nginx** (反向代理层)
   - 接收外部 HTTP/HTTPS 请求
   - 应该将请求代理到 http://localhost:3002
   - 状态: **这是问题所在**

3. **网络层**
   - 容器网络配置
   - 端口映射
   - 防火墙规则

## 常见 502 错误原因

### 1. Nginx 配置问题 (最可能)
**原因**:
- Nginx 配置文件不存在或配置错误
- proxy_pass 指向错误的地址
- upstream 配置错误

**影响**: Nginx 无法将请求正确转发到应用

**诊断命令**:
```bash
# 查找配置文件
find /www/server -name "*yushuo*.conf" 2>/dev/null
find /etc/nginx -name "*yushuo*.conf" 2>/dev/null

# 检查配置
cat /www/server/panel/vhost/nginx/bk.yushuo.click.conf
nginx -t
```

**正确的配置应该包含**:
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
    }
}
```

### 2. 应用未启动或崩溃
**原因**:
- 应用启动失败
- 应用监听错误的端口
- 应用崩溃

**影响**: Nginx 无法连接到后端应用

**诊断命令**:
```bash
docker compose ps
docker compose logs --tail=100 stock-tracker
curl -I http://localhost:3002
netstat -tlnp | grep 3002
```

### 3. 端口映射问题
**原因**:
- Docker 端口未正确映射到宿主机
- 防火墙阻止端口访问

**影响**: Nginx 无法访问容器端口

**诊断命令**:
```bash
docker port stock-tracker-app
iptables -L -n | grep 3002
```

### 4. SELinux 或权限问题
**原因**:
- SELinux 阻止 Nginx 连接到应用端口

**影响**: Nginx 被系统安全策略阻止

**诊断命令**:
```bash
getenforce
ausearch -m avc -ts recent | grep nginx
```

## 诊断步骤

### 步骤 1: 运行诊断脚本
```bash
cd /www/wwwroot/stock-tracker
chmod +x diagnose-502-error.sh
./diagnose-502-error.sh > diagnostic-output.txt 2>&1
```

### 步骤 2: 检查 Nginx 错误日志
```bash
tail -f /www/wwwlogs/bk.yushuo.click.error.log
```

常见错误信息:
- `connect() failed (111: Connection refused)` - 应用未运行或端口错误
- `connect() failed (113: No route to host)` - 网络配置问题
- `no live upstreams` - upstream 配置错误
- `Permission denied` - SELinux 或权限问题

### 步骤 3: 测试连接
```bash
# 从服务器本地测试
curl -v http://localhost:3002

# 检查 Nginx 能否访问
sudo -u nginx curl -v http://localhost:3002
```

## 解决方案

### 解决方案 1: 修复 Nginx 配置 (最可能需要)

```bash
# 1. 创建或更新 Nginx 配置
cat > /www/server/panel/vhost/nginx/bk.yushuo.click.conf << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name bk.yushuo.click;

    access_log /www/wwwlogs/bk.yushuo.click.access.log;
    error_log /www/wwwlogs/bk.yushuo.click.error.log;

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
}
EOF

# 2. 测试配置
nginx -t

# 3. 重启 Nginx
systemctl reload nginx

# 4. 测试访问
curl -I http://bk.yushuo.click
```

### 解决方案 2: 修复 SELinux (如果适用)

```bash
# 检查 SELinux 状态
getenforce

# 如果是 Enforcing，允许 Nginx 连接
setsebool -P httpd_can_network_connect 1

# 或者临时关闭 SELinux 测试
setenforce 0
```

### 解决方案 3: 检查并修复容器

```bash
# 重启容器
cd /www/wwwroot/stock-tracker
docker compose restart

# 查看启动日志
docker compose logs -f stock-tracker

# 检查端口映射
docker compose ps
netstat -tlnp | grep 3002
```

### 解决方案 4: 使用容器 IP 直接代理

```bash
# 1. 获取容器 IP
CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' stock-tracker-app)
echo "Container IP: $CONTAINER_IP"

# 2. 更新 Nginx 配置使用容器 IP
sed -i "s|proxy_pass http://localhost:3002;|proxy_pass http://${CONTAINER_IP}:3002;|g" /www/server/panel/vhost/nginx/bk.yushuo.click.conf

# 3. 重启 Nginx
nginx -t && systemctl reload nginx
```

## 一键修复脚本

创建了 `fix-502-error.sh` 脚本，包含所有可能的修复步骤。

## 预期结果

修复后应该看到:
1. `nginx -t` 返回 "syntax is ok" 和 "test is successful"
2. `curl -I http://bk.yushuo.click` 返回 HTTP 200 OK
3. 浏览器访问 http://bk.yushuo.click 显示应用页面
4. Nginx 错误日志中没有新的 502 错误

## 下一步

1. 先运行 `diagnose-502-error.sh` 收集完整诊断信息
2. 根据诊断结果确定具体问题
3. 运行相应的修复命令
4. 验证修复效果

---
生成时间: 2025-09-30
项目: stock-tracker 板块监控系统