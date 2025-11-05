# 502 错误手动修复指南

## SSH 连接失败说明

由于从本地 Windows 环境无法建立 SSH 连接（连接超时），我已经创建了完整的诊断和修复脚本供您在服务器上手动执行。

## 快速修复步骤

### 1. 登录服务器
```bash
ssh root@yushuo.click
# 密码: gJ75hNHdy90TA4qGo9
```

### 2. 进入项目目录
```bash
cd /www/wwwroot/stock-tracker
```

### 3. 下载修复脚本（如果本地已有）

如果脚本已在本地创建，使用 SCP 上传：
```bash
# 在本地 Windows PowerShell 中执行
scp "C:\Users\yushu\Desktop\stock-tracker - 副本\diagnose-502-error.sh" root@yushuo.click:/www/wwwroot/stock-tracker/
scp "C:\Users\yushu\Desktop\stock-tracker - 副本\fix-502-error.sh" root@yushuo.click:/www/wwwroot/stock-tracker/
```

或者在服务器上直接创建脚本（见下方）。

### 4. 运行自动修复
```bash
chmod +x fix-502-error.sh
./fix-502-error.sh
```

## 如果无法上传脚本，手动执行命令

### 快速修复命令（一行解决）

```bash
cd /www/wwwroot/stock-tracker && cat > /www/server/panel/vhost/nginx/bk.yushuo.click.conf << 'EOF'
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

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        proxy_buffer_size 4k;
        proxy_buffers 4 32k;
        proxy_busy_buffers_size 64k;
        proxy_temp_file_write_size 64k;
    }

    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3002;
        proxy_cache_valid 200 7d;
        proxy_cache_valid 404 1m;
        add_header Cache-Control "public, max-age=604800";
    }
}
EOF
nginx -t && systemctl reload nginx
```

### 验证修复
```bash
# 1. 测试本地访问
curl -I http://localhost:3002

# 2. 测试外部访问
curl -I http://bk.yushuo.click

# 3. 检查容器状态
docker compose ps

# 4. 查看错误日志（如果仍有问题）
tail -20 /www/wwwlogs/bk.yushuo.click.error.log
```

## 分步修复说明

### 步骤 1: 检查容器状态
```bash
cd /www/wwwroot/stock-tracker
docker compose ps
```

**预期输出**: 应该看到 `stock-tracker-app` 状态为 `Up`

### 步骤 2: 测试应用
```bash
curl -I http://localhost:3002
```

**预期输出**: 应该看到 `HTTP/1.1 200 OK`

如果失败，重启容器:
```bash
docker compose restart
docker compose logs --tail=50 stock-tracker
```

### 步骤 3: 查找 Nginx 配置文件
```bash
find /www/server -name "*yushuo*.conf" 2>/dev/null
find /etc/nginx -name "*yushuo*.conf" 2>/dev/null
```

常见位置:
- `/www/server/panel/vhost/nginx/bk.yushuo.click.conf`
- `/www/server/nginx/vhost/bk.yushuo.click.conf`
- `/etc/nginx/conf.d/bk.yushuo.click.conf`

### 步骤 4: 检查当前配置
```bash
cat /www/server/panel/vhost/nginx/bk.yushuo.click.conf
```

**查找问题**:
- `proxy_pass` 是否指向 `http://localhost:3002`？
- 是否有 `server_name bk.yushuo.click;`？
- 配置文件是否存在？

### 步骤 5: 备份并更新配置
```bash
# 备份
cp /www/server/panel/vhost/nginx/bk.yushuo.click.conf /www/server/panel/vhost/nginx/bk.yushuo.click.conf.backup

# 使用上面的快速修复命令创建新配置
```

### 步骤 6: 测试并重启 Nginx
```bash
# 测试配置
nginx -t

# 如果测试通过，重启 Nginx
systemctl reload nginx

# 查看 Nginx 状态
systemctl status nginx
```

### 步骤 7: 验证修复
```bash
# 本地测试
curl -I http://localhost:3002

# 外部测试
curl -I http://bk.yushuo.click

# 应该都返回 200 OK
```

### 步骤 8: 在浏览器中测试
打开浏览器访问: http://bk.yushuo.click

应该能看到应用页面，而不是 502 错误。

## 如果问题仍然存在

### 查看详细错误日志
```bash
# Nginx 错误日志
tail -f /www/wwwlogs/bk.yushuo.click.error.log

# 容器日志
docker compose logs -f stock-tracker
```

### 常见错误信息及解决方案

#### 错误 1: `connect() failed (111: Connection refused)`
**原因**: 应用未运行或端口错误

**解决**:
```bash
docker compose restart
netstat -tlnp | grep 3002
```

#### 错误 2: `Permission denied`
**原因**: SELinux 阻止连接

**解决**:
```bash
setsebool -P httpd_can_network_connect 1
```

#### 错误 3: `no live upstreams`
**原因**: upstream 配置错误

**解决**: 使用简单的 `proxy_pass http://localhost:3002` 而不是 upstream 块

#### 错误 4: 配置文件不存在
**原因**: Nginx 配置文件被删除或未创建

**解决**: 使用快速修复命令创建新配置

## 使用诊断脚本（推荐）

如果问题复杂，运行完整诊断:

```bash
cd /www/wwwroot/stock-tracker

# 创建诊断脚本
cat > diagnose-502-error.sh << 'EOF'
[此处粘贴 diagnose-502-error.sh 的完整内容]
EOF

# 运行诊断
chmod +x diagnose-502-error.sh
./diagnose-502-error.sh > diagnostic-output.txt 2>&1

# 查看结果
cat diagnostic-output.txt
```

## Nginx 配置文件完整版

如果需要完整的配置文件，保存以下内容到 `/www/server/panel/vhost/nginx/bk.yushuo.click.conf`:

```nginx
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

        # 缓冲区设置
        proxy_buffer_size 4k;
        proxy_buffers 4 32k;
        proxy_busy_buffers_size 64k;
        proxy_temp_file_write_size 64k;
    }

    # API 路由特殊处理（更长超时）
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3002;
        proxy_cache_valid 200 7d;
        proxy_cache_valid 404 1m;
        add_header Cache-Control "public, max-age=604800";
    }
}
```

## 测试清单

完成修复后，验证以下项目:

- [ ] `docker compose ps` 显示容器正在运行
- [ ] `curl -I http://localhost:3002` 返回 200 OK
- [ ] `nginx -t` 配置测试通过
- [ ] `systemctl status nginx` 显示 Nginx 正在运行
- [ ] `curl -I http://bk.yushuo.click` 返回 200 OK
- [ ] 浏览器访问 http://bk.yushuo.click 显示应用
- [ ] Nginx 错误日志中没有新的 502 错误

## 紧急回滚

如果修复导致问题，回滚到备份:

```bash
# 恢复备份的配置
cp /www/server/panel/vhost/nginx/bk.yushuo.click.conf.backup /www/server/panel/vhost/nginx/bk.yushuo.click.conf

# 重启 Nginx
nginx -t && systemctl reload nginx
```

---

**创建时间**: 2025-09-30
**项目**: stock-tracker 板块监控系统
**问题**: 502 Bad Gateway
**状态**: 等待执行修复