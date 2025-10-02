# 502 Bad Gateway 问题排查总结

## 执行时间
2025-09-30 16:00

## 问题概述

### 问题现象
- **症状**: 访问 http://bk.yushuo.click 返回 "502 Bad Gateway nginx"
- **已确认正常**:
  - Docker 容器运行健康 ✅
  - 本地访问 `curl http://localhost:3002` 返回 HTTP 200 OK ✅
- **故障点**: Nginx 反向代理层无法正确转发请求到后端应用

### 问题模块分析

#### 1. Docker 容器层 (应用层) - ✅ 正常
**功能**: 运行 Next.js 应用
**状态**:
- stock-tracker-app: Up (healthy)
- stock-tracker-mysql: Up (healthy)
- 端口: 3002 → 3000 (容器内部)
**验证**: `curl http://localhost:3002` → HTTP 200 OK

#### 2. Nginx 层 (反向代理层) - ❌ 问题所在
**功能**:
- 接收外部 HTTP/HTTPS 请求 (80/443端口)
- 将请求代理到后端应用 (localhost:3002)
- 处理域名路由 (bk.yushuo.click)

**问题**: 返回 502 Bad Gateway

**可能原因**:
1. **Nginx 配置文件不存在** (70%可能性)
2. **proxy_pass 配置错误** (20%可能性)
3. **SELinux 权限阻止** (5%可能性)
4. **端口映射问题** (5%可能性)

**影响**:
- 本地访问正常，外部访问失败
- 用户无法通过域名访问应用
- 数据和功能正常，仅网络层受影响

#### 3. 网络层 - 待检查
**功能**:
- 容器网络配置
- 端口映射和转发
- 防火墙规则

**状态**: 待诊断脚本确认

## 技术学习要点

### 什么是 502 Bad Gateway？

**定义**: HTTP 状态码，表示作为网关或代理的服务器，从上游服务器收到无效响应。

**本案例中**:
- **网关**: Nginx (反向代理服务器)
- **上游服务器**: Next.js 应用 (运行在 localhost:3002)
- **502 含义**: Nginx 无法连接到 Next.js 应用，或收到错误响应

### Nginx 反向代理原理

```
客户端浏览器
    ↓ (HTTP请求到 bk.yushuo.click:80)
Nginx 反向代理 (监听 80 端口)
    ↓ (proxy_pass 转发到 localhost:3002)
Next.js 应用 (Docker容器内部)
    ↓ (处理请求)
返回响应 (200 OK, HTML内容)
    ↓
Nginx 转发给客户端
    ↓
客户端浏览器显示页面
```

**正常流程**: 客户端 → Nginx → 应用 → Nginx → 客户端

**当前问题**: 客户端 → Nginx ❌ (无法连接到应用) → 返回 502

### 正确的 Nginx 配置

```nginx
server {
    listen 80;                      # 监听 80 端口
    server_name bk.yushuo.click;    # 域名

    location / {
        proxy_pass http://localhost:3002;  # 代理到后端应用
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 常见 Nginx 错误日志含义

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `connect() failed (111: Connection refused)` | 应用未运行或端口错误 | 检查 Docker 容器状态，确认端口 3002 |
| `connect() failed (113: No route to host)` | 网络配置问题 | 检查防火墙规则 |
| `no live upstreams` | upstream 配置错误 | 改用简单的 proxy_pass |
| `Permission denied` | SELinux 阻止 | `setsebool -P httpd_can_network_connect 1` |
| `upstream timed out` | 应用响应超时 | 增加 proxy_read_timeout |

### SELinux 是什么？

**Security-Enhanced Linux (安全增强 Linux)**:
- Linux 内核安全模块
- 提供强制访问控制 (MAC)
- 可能阻止 Nginx 连接到应用端口

**检查和修复**:
```bash
# 查看 SELinux 状态
getenforce

# 如果是 Enforcing，允许 HTTP 网络连接
setsebool -P httpd_can_network_connect 1
```

## 已创建的诊断和修复工具

### 1. diagnose-502-error.sh (完整诊断脚本)

**功能**: 收集所有相关信息以定位问题

**诊断步骤** (15步):
1. Docker 容器状态
2. 应用日志（最近100行）
3. 本地访问测试
4. 端口监听状态
5. 容器 IP 地址
6. 容器网络详情
7. Nginx 配置文件列表
8. Nginx 配置内容
9. Nginx 配置语法测试
10. Nginx 服务状态
11. Nginx 错误日志
12. Nginx 访问日志
13. 完整 curl 测试
14. Docker 健康检查
15. 可用端口列表

**使用方法**:
```bash
cd /www/wwwroot/stock-tracker
chmod +x diagnose-502-error.sh
./diagnose-502-error.sh > diagnostic-output.txt 2>&1
cat diagnostic-output.txt
```

**输出**: 完整的诊断报告，包含所有技术细节

### 2. fix-502-error.sh (自动修复脚本)

**功能**: 自动检测问题并应用修复方案

**修复步骤** (9步):
1. 检查 Docker 容器状态（如未运行则启动）
2. 测试应用本地访问（验证应用正常）
3. 查找 Nginx 配置文件（支持多种路径）
4. 备份现有配置（防止数据丢失）
5. 写入正确的 Nginx 配置
6. 测试 Nginx 配置语法
7. 处理 SELinux 权限（如适用）
8. 重启 Nginx 服务
9. 验证外部访问

**特点**:
- 彩色输出（INFO/WARN/ERROR）
- 自动检测配置路径
- 安全备份机制
- 详细的成功/失败提示
- 最终状态总结

**使用方法**:
```bash
cd /www/wwwroot/stock-tracker
chmod +x fix-502-error.sh
./fix-502-error.sh
```

### 3. quick-502-fix.sh (快速一键修复)

**功能**: 单命令快速修复，适合紧急情况

**特点**:
- 最简化的步骤
- 快速执行（30秒内完成）
- 自动化程度高
- 清晰的成功/失败提示

**使用方法**:
```bash
cd /www/wwwroot/stock-tracker
chmod +x quick-502-fix.sh
./quick-502-fix.sh
```

**输出示例**:
```
开始修复 502 错误...
检查容器状态...
✓ Docker 容器正在运行
测试应用...
✓ 应用在 localhost:3002 正常响应
更新 Nginx 配置...
重启 Nginx...
==========================================
✓ 修复成功! 网站已恢复正常
  状态码: 200
  访问: http://bk.yushuo.click
==========================================
```

### 4. log/502-diagnostic-plan-20250930.md

**内容**:
- 问题分析
- 模块说明
- 常见原因详解
- 诊断步骤
- 4个解决方案
- 一键修复脚本说明
- 预期结果

**适用场景**: 需要深入理解问题时阅读

### 5. log/502-manual-instructions-20250930.md

**内容**:
- 手动修复完整指南
- 分步操作说明
- 常见错误及解决方案
- 测试清单
- 紧急回滚方案
- Nginx 配置文件完整版

**适用场景**: 自动脚本无法解决时，按步骤手动执行

## 推荐修复流程

### 方案 A: 快速修复（推荐）

**适用**: 大多数情况

```bash
# 1. SSH 登录
ssh root@yushuo.click
# 密码: gJ75hNHdy90TA4qGo9

# 2. 进入项目目录
cd /www/wwwroot/stock-tracker

# 3. 上传脚本（如果还没有）
# 从本地上传或直接在服务器创建

# 4. 运行快速修复
chmod +x quick-502-fix.sh
./quick-502-fix.sh

# 5. 验证
curl -I http://bk.yushuo.click
# 应该看到: HTTP/1.1 200 OK
```

**预计时间**: 2分钟

### 方案 B: 详细诊断和修复

**适用**: 问题复杂或需要详细报告

```bash
# 1. 运行完整诊断
cd /www/wwwroot/stock-tracker
chmod +x diagnose-502-error.sh
./diagnose-502-error.sh > diagnostic-output.txt 2>&1

# 2. 查看诊断结果
cat diagnostic-output.txt
# 或
less diagnostic-output.txt

# 3. 运行详细修复
chmod +x fix-502-error.sh
./fix-502-error.sh

# 4. 如果问题仍存在，查看实时错误日志
tail -f /www/wwwlogs/bk.yushuo.click.error.log
```

**预计时间**: 5分钟

### 方案 C: 手动修复

**适用**: 自动脚本无法执行或需要自定义配置

**按照 `log/502-manual-instructions-20250930.md` 中的步骤执行**

**关键命令**:
```bash
# 1. 创建/更新 Nginx 配置
cat > /www/server/panel/vhost/nginx/bk.yushuo.click.conf << 'EOF'
server {
    listen 80;
    server_name bk.yushuo.click;
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 2. 测试配置
nginx -t

# 3. 重启 Nginx
systemctl reload nginx

# 4. 验证
curl -I http://bk.yushuo.click
```

**预计时间**: 3分钟

## 验证清单

修复完成后，确认以下所有项目：

- [ ] **Docker 容器运行正常**
  ```bash
  docker compose ps
  # 应该看到: stock-tracker-app Up (healthy)
  ```

- [ ] **应用本地访问正常**
  ```bash
  curl -I http://localhost:3002
  # 应该看到: HTTP/1.1 200 OK
  ```

- [ ] **Nginx 配置语法正确**
  ```bash
  nginx -t
  # 应该看到: syntax is ok, test is successful
  ```

- [ ] **Nginx 服务运行中**
  ```bash
  systemctl status nginx
  # 应该看到: active (running)
  ```

- [ ] **外部访问正常**
  ```bash
  curl -I http://bk.yushuo.click
  # 应该看到: HTTP/1.1 200 OK
  ```

- [ ] **浏览器访问正常**
  - 打开浏览器访问: http://bk.yushuo.click
  - 应该看到应用页面，而不是 502 错误

- [ ] **Nginx 错误日志干净**
  ```bash
  tail -20 /www/wwwlogs/bk.yushuo.click.error.log
  # 应该没有新的 502 错误
  ```

## 如果问题仍然存在

### 查看详细错误信息

```bash
# 实时监控 Nginx 错误日志
tail -f /www/wwwlogs/bk.yushuo.click.error.log

# 在另一个终端测试访问
curl -I http://bk.yushuo.click

# 查看容器日志
docker compose logs -f stock-tracker
```

### 常见错误排查

#### 错误 1: `connect() failed (111: Connection refused)`
**解决**:
```bash
# 重启容器
docker compose restart
# 检查端口
netstat -tlnp | grep 3002
```

#### 错误 2: `Permission denied`
**解决**:
```bash
# 设置 SELinux 权限
setsebool -P httpd_can_network_connect 1
```

#### 错误 3: 配置文件路径不对
**解决**:
```bash
# 查找配置文件
find /www/server -name "*yushuo*.conf"
find /etc/nginx -name "*yushuo*.conf"
```

#### 错误 4: Nginx 无法启动
**解决**:
```bash
# 查看详细错误
nginx -t
systemctl status nginx -l
# 检查配置文件语法
```

## 紧急回滚方案

如果修复导致新问题：

```bash
# 1. 恢复备份的配置文件
cp /www/server/panel/vhost/nginx/bk.yushuo.click.conf.backup.* \
   /www/server/panel/vhost/nginx/bk.yushuo.click.conf

# 2. 重启 Nginx
nginx -t && systemctl reload nginx

# 3. 验证
curl -I http://bk.yushuo.click
```

## 文件清单

### 脚本文件 (3个)
1. `diagnose-502-error.sh` - 完整诊断脚本（15步）
2. `fix-502-error.sh` - 自动修复脚本（9步）
3. `quick-502-fix.sh` - 快速一键修复

### 文档文件 (3个)
1. `log/502-diagnostic-plan-20250930.md` - 诊断计划和解决方案
2. `log/502-manual-instructions-20250930.md` - 手动修复完整指南
3. `log/502-troubleshooting-summary-20250930.md` - 本文档（总结报告）

### 更新文件 (1个)
1. `readme.txt` - 已添加提示词11的详细记录

## SSH 连接说明

### 为什么 SSH 自动连接失败？

**原因**: 本地 Windows 环境无法建立 SSH 连接到服务器
- **错误**: ETIMEDOUT (连接超时)
- **原因**: 防火墙/网络限制/ISP 策略
- **影响**: 无法自动远程执行命令

### 解决方案

**推荐**: 手动 SSH 登录

```bash
# 方法 1: Git Bash
右键点击桌面 → Git Bash Here
ssh root@yushuo.click

# 方法 2: Windows PowerShell
ssh root@yushuo.click

# 方法 3: PuTTY / MobaXterm / Termius
使用图形界面 SSH 客户端连接
```

**登录信息**:
- Host: yushuo.click
- Port: 22
- Username: root
- Password: gJ75hNHdy90TA4qGo9

## 技术总结

### 涉及的技术栈

| 技术 | 作用 | 本案例状态 |
|------|------|-----------|
| **Docker** | 容器化应用运行环境 | ✅ 正常 |
| **Next.js** | 前端应用框架 | ✅ 正常 |
| **Nginx** | 反向代理和负载均衡 | ❌ 配置问题 |
| **MySQL** | 数据库 | ✅ 正常 |
| **Linux** | 服务器操作系统 | ✅ 正常 |

### 问题定位流程

```
1. 用户报告: 访问域名返回 502
   ↓
2. 检查 Docker: ✅ 容器运行正常
   ↓
3. 测试本地: ✅ localhost:3002 返回 200
   ↓
4. 测试外部: ❌ bk.yushuo.click 返回 502
   ↓
5. 定位问题: Nginx 反向代理层
   ↓
6. 诊断方向:
   - Nginx 配置文件
   - proxy_pass 设置
   - SELinux 权限
   - 端口映射
   ↓
7. 解决方案:
   - 创建诊断脚本
   - 创建修复脚本
   - 提供手动指南
```

### 学习收获

1. **502 错误含义**: 网关/代理无法从上游服务器获取有效响应
2. **Nginx 反向代理**: 接收客户端请求，转发到后端应用
3. **Docker 网络**: 容器内部端口映射到宿主机端口
4. **SELinux**: Linux 安全模块，可能限制 Nginx 网络连接
5. **诊断方法**: 分层检查，从内到外（容器→本地→外部）

## 下一步行动

### 立即执行

1. **SSH 登录服务器**
   ```bash
   ssh root@yushuo.click
   ```

2. **进入项目目录**
   ```bash
   cd /www/wwwroot/stock-tracker
   ```

3. **选择修复方案并执行** (三选一)
   - 方案 A: `./quick-502-fix.sh` (推荐)
   - 方案 B: `./fix-502-error.sh` (详细)
   - 方案 C: 手动执行命令 (自定义)

4. **验证修复效果**
   ```bash
   curl -I http://bk.yushuo.click
   ```

5. **浏览器测试**
   - 访问: http://bk.yushuo.click
   - 确认应用正常显示

### 后续优化

1. **配置 HTTPS**: 使用 SSL 证书（Let's Encrypt）
2. **性能优化**: 启用 Nginx 缓存和 Gzip 压缩
3. **监控告警**: 配置 Nginx 状态监控
4. **日志分析**: 定期检查错误日志

## 联系和支持

如果修复过程遇到问题：

1. **运行诊断脚本**并保存输出
   ```bash
   ./diagnose-502-error.sh > diagnostic-output.txt
   ```

2. **提供诊断报告**以便进一步分析

3. **查看详细文档**
   - `log/502-diagnostic-plan-20250930.md`
   - `log/502-manual-instructions-20250930.md`

---

**报告生成时间**: 2025-09-30 16:00
**项目**: stock-tracker 板块监控系统
**问题**: 502 Bad Gateway
**状态**: 诊断工具已创建，等待执行修复
**预计修复时间**: 2-5分钟