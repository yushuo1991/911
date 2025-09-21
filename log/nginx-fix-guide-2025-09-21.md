# Nginx代理配置修复指南

**问题确认**: Nginx代理模块配置错误，无法正确转发到3000端口
**解决目标**: 修复80端口访问，使 http://107.173.154.147 正常工作

## 🎯 问题分析

### 当前状态
- **3000端口**: ✅ 正常 (http://107.173.154.147:3000)
- **80端口**: ❌ 502错误 (http://107.173.154.147)
- **问题模块**: Nginx代理模块

### 根本原因
Nginx的反向代理配置可能存在以下问题之一：
1. 上游服务器地址配置错误
2. 代理超时设置问题
3. 健康检查失败
4. 权限或防火墙问题

## 🔧 修复步骤

### 步骤1: 检查宝塔面板网站配置

1. 登录宝塔面板: http://107.173.154.147:8888
2. 进入 **网站** → 找到你的域名/IP配置
3. 点击 **设置** → **反向代理**
4. 检查代理配置是否为:
   ```
   代理名称: stock-tracker
   目标URL: http://127.0.0.1:3000
   发送域名: $host
   ```

### 步骤2: 修正反向代理配置

如果配置不正确，请修改为:
```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

### 步骤3: 重启Nginx服务

在宝塔面板中:
1. 进入 **软件商店** → **Nginx**
2. 点击 **重启** 按钮

或使用SSH命令:
```bash
systemctl restart nginx
```

### 步骤4: 验证修复结果

```bash
# 测试80端口
curl -I http://107.173.154.147

# 应该返回200状态码
```

## 🚨 如果问题持续存在

### 检查Nginx错误日志
```bash
tail -f /var/log/nginx/error.log
```

### 常见错误信息和解决方案

#### 错误1: "connect() failed (111: Connection refused)"
**原因**: Nginx无法连接到后端应用
**解决**: 确认应用运行在127.0.0.1:3000

#### 错误2: "upstream timed out"
**原因**: 代理超时
**解决**: 增加超时时间配置

#### 错误3: "no live upstreams"
**原因**: 上游服务器不可用
**解决**: 检查3000端口应用状态

## 📋 完整诊断命令

在服务器上执行以下命令进行完整诊断:

```bash
# 1. 检查Nginx配置语法
nginx -t

# 2. 查看Nginx进程
ps aux | grep nginx

# 3. 检查3000端口监听
ss -tlnp | grep :3000

# 4. 测试本地代理
curl -I http://127.0.0.1:3000

# 5. 查看Nginx访问日志
tail -f /var/log/nginx/access.log

# 6. 查看Nginx错误日志
tail -f /var/log/nginx/error.log
```

## 🎯 预期修复结果

修复完成后:
- ✅ http://107.173.154.147 → 200 OK
- ✅ http://107.173.154.147:3000 → 200 OK
- ✅ 两个地址都能正常访问股票追踪系统

## 📞 如需进一步帮助

如果按照以上步骤操作后问题仍然存在，请提供:
1. Nginx错误日志内容
2. 宝塔面板反向代理配置截图
3. 网站配置的详细信息

---
**修复指南生成时间**: 2025-09-21
**问题类型**: Nginx代理模块配置错误
**解决状态**: 🔧 待执行修复操作