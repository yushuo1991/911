# 502 Bad Gateway 错误诊断与修复

**时间**: 2025-10-16 09:30
**问题**: 网站访问返回 502 Bad Gateway
**影响模块**: Nginx反向代理 / Docker容器 / Next.js应用

---

## 问题分析

### 502错误含义
- **定义**: 网关错误，上游服务器（Nginx）无法从后端服务器（Docker容器）获取有效响应
- **常见原因**:
  1. Docker容器未启动或已崩溃
  2. Next.js应用构建失败，容器无法正常运行
  3. 应用未监听3000端口
  4. Nginx配置错误（proxy_pass指向错误地址）
  5. 内存不足导致容器被Kill

### 可能的触发因素
- 刚部署了v4.8.24代码更新
- Docker重新构建过程中可能出现编译错误
- Set.map()类型错误修复后重新构建

---

## 🔧 快速修复方案

### 方案1: 服务器端执行（推荐）⭐

在服务器SSH终端中按顺序执行以下命令：

```bash
# 1. 进入项目目录
cd /www/wwwroot/stock-tracker

# 2. 检查容器状态
docker compose ps
# 预期输出: 应该看到容器状态为 "Up"
# 如果状态是 "Exit" 或 "Restarting"，说明容器启动失败

# 3. 查看应用日志（关键步骤）
docker compose logs --tail=100
# 查找以下关键信息:
# - "ready started server on" → 应用正常启动
# - "Error:" 或 "TypeError:" → 代码错误
# - "EADDRINUSE" → 端口被占用
# - "npm ERR!" → 依赖安装失败

# 4. 如果容器未运行，查看完整日志
docker compose logs app

# 5. 停止所有服务
docker compose down

# 6. 拉取最新代码（包含Set.map修复）
git pull origin main

# 7. 清理Docker缓存
docker system prune -f

# 8. 重新构建（无缓存，查看详细输出）
docker compose build --no-cache --progress=plain
# 仔细检查构建输出，确认无TypeScript错误

# 9. 启动服务
docker compose up -d

# 10. 等待10秒后检查状态
sleep 10
docker compose ps

# 11. 再次查看日志
docker compose logs --tail=50

# 12. 测试本地访问
curl -I http://localhost:3000
# 预期输出: HTTP/1.1 200 OK

# 13. 测试外部访问
curl -I http://bk.yushuo.click
# 预期输出: HTTP/1.1 200 OK
```

---

### 方案2: 如果构建失败

如果第8步构建时仍然报错，执行：

```bash
cd /www/wwwroot/stock-tracker

# 检查是否是Set.map错误
grep -n "allSectorNames.map" src/app/page.tsx

# 如果看到545行仍然是 "allSectorNames.map"，说明代码未更新
# 手动修复：
nano src/app/page.tsx
# 跳转到545行，将:
#   const chartData = allSectorNames.map(sectorName => {
# 改为:
#   const chartData = Array.from(allSectorNames).map(sectorName => {
# 保存退出（Ctrl+X, Y, Enter）

# 重新构建
docker compose build --no-cache
docker compose up -d
```

---

### 方案3: 回滚到稳定版本

如果上述方案都失败，回滚到v4.8.23稳定版：

```bash
cd /www/wwwroot/stock-tracker

# 1. 检出稳定标签
git fetch origin --tags
git checkout v4.8.23-custom-orange-20251014

# 2. 重新构建
docker compose down
docker compose build --no-cache
docker compose up -d

# 3. 验证
docker compose ps
curl -I http://localhost:3000
```

---

## 🔍 详细诊断步骤

### 步骤1: 检查Docker容器状态

```bash
docker compose ps
```

**正常输出示例**:
```
NAME                     STATUS              PORTS
stock-tracker-app-1      Up 2 minutes        0.0.0.0:3000->3000/tcp
stock-tracker-mysql-1    Up 2 minutes        3306/tcp
```

**异常输出示例**:
```
NAME                     STATUS              PORTS
stock-tracker-app-1      Exit 1              -
stock-tracker-mysql-1    Up 2 minutes        3306/tcp
```

### 步骤2: 分析应用日志

```bash
docker compose logs app --tail=100
```

**关键日志内容对照表**:

| 日志内容 | 含义 | 处理方式 |
|---------|------|---------|
| `ready started server on` | ✅ 应用正常启动 | 检查Nginx配置 |
| `Type error: Property 'map'` | ❌ TypeScript编译错误 | 执行方案2修复 |
| `EADDRINUSE ::3000` | ❌ 端口被占用 | `docker compose down && docker compose up -d` |
| `npm ERR!` | ❌ 依赖安装失败 | `docker compose build --no-cache` |
| `Error: Cannot find module` | ❌ 模块缺失 | 检查package.json |

### 步骤3: 检查Nginx配置

```bash
# 查看Nginx配置
cat /etc/nginx/sites-available/stock-tracker

# 应该包含:
# location / {
#   proxy_pass http://localhost:3000;
#   ...
# }

# 测试Nginx配置
nginx -t

# 如果有错误，修复后重启Nginx
systemctl restart nginx
```

### 步骤4: 检查端口监听

```bash
# 检查3000端口是否被监听
netstat -tuln | grep 3000

# 预期输出:
# tcp6       0      0 :::3000                 :::*                    LISTEN

# 如果没有输出，说明应用未启动
```

---

## 📊 诊断决策树

```
502错误
  ├─> docker compose ps 显示容器Exit
  │     └─> 查看logs → 发现TypeScript错误
  │           └─> 执行方案2（手动修复Set.map）
  │
  ├─> docker compose ps 显示容器Up
  │     ├─> curl localhost:3000 成功
  │     │     └─> Nginx配置问题 → 检查proxy_pass
  │     │
  │     └─> curl localhost:3000 失败
  │           └─> 应用未正常启动 → 检查logs
  │
  └─> docker compose ps 无容器
        └─> Docker服务未启动 → docker compose up -d
```

---

## ✅ 验证修复成功

执行以下命令确认问题已解决：

```bash
# 1. 容器状态检查
docker compose ps
# 期望: 所有容器状态为 "Up"

# 2. 应用日志检查
docker compose logs app --tail=20
# 期望: 看到 "ready started server on 0.0.0.0:3000"

# 3. 本地访问测试
curl -I http://localhost:3000
# 期望: HTTP/1.1 200 OK

# 4. 外网访问测试
curl -I http://bk.yushuo.click
# 期望: HTTP/1.1 200 OK

# 5. 浏览器访问测试
# 打开 http://bk.yushuo.click
# 期望: 页面正常加载，看到"📈 宇硕板块节奏"
```

---

## 🚨 紧急回滚流程

如果所有修复方案都失败，执行紧急回滚：

```bash
cd /www/wwwroot/stock-tracker

# 1. 停止服务
docker compose down

# 2. 回滚到最后稳定版本
git fetch origin --tags
git checkout v4.8.23-custom-orange-20251014

# 3. 重新构建
docker compose build --no-cache
docker compose up -d

# 4. 验证
sleep 10
curl -I http://bk.yushuo.click
```

---

## 📝 问题记录模板

请在服务器上执行诊断命令后，记录以下信息：

```
【容器状态】
$ docker compose ps
<粘贴输出>

【应用日志】
$ docker compose logs app --tail=100
<粘贴输出>

【端口监听】
$ netstat -tuln | grep 3000
<粘贴输出>

【Nginx状态】
$ systemctl status nginx
<粘贴输出>

【本地测试】
$ curl -I http://localhost:3000
<粘贴输出>
```

---

**优先级**: 🔴 高（影响线上服务）
**预计修复时间**: 5-15分钟
**备用方案**: 回滚到v4.8.23稳定版

**生成时间**: 2025-10-16 09:30
