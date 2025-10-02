# Docker部署诊断和修复指南 - v4.3

## 问题描述

**现象**: Git代码已更新，Docker容器已重建，但浏览器显示的还是旧版本

**关键症状**:
- ✅ Git pull 成功（12个文件，7188行新增）
- ✅ Docker容器重建成功（无缓存构建）
- ✅ 容器运行正常（HTTP 200 OK）
- ❌ 浏览器页面没有变化
- ❌ ETag还是旧的 "y8j7zvpb1v5fd"

---

## 使用工具

### 🔍 方案1: 智能诊断和修复 (推荐)

**特点**: 自动检测问题，提供针对性方案

```bash
# Windows执行
execute-smart-fix.bat
```

**功能**:
- ✅ 自动诊断6大类问题
- ✅ MD5完整性校验
- ✅ 智能推荐修复方案
- ✅ 交互式确认执行
- ✅ 自动验证修复结果

---

### 🚀 方案2: 一键修复 (快速)

**特点**: 直接执行完全重建，不询问

```bash
# Windows执行
execute-fix.bat
```

**操作**:
1. 停止容器
2. 删除镜像和缓存
3. 删除 .next 和 node_modules
4. 无缓存重新构建
5. 启动并验证

**时间**: 3-5分钟

---

### 📋 方案3: 快速诊断 (仅诊断)

**特点**: 只诊断不修复，生成报告

```bash
# Windows执行
quick-diagnose.bat
```

**输出**:
- 生成 `quick-diagnostic-20250930.txt`
- 包含所有检查点的状态
- 不做任何修改

---

## 诊断检查点

### 1. Git代码完整性
- ✅ 最新提交是否包含新文件
- ✅ 工作目录是否干净
- ✅ StockPremiumChart.tsx 是否存在
- ✅ chartHelpers.ts 是否存在
- ✅ page.tsx 是否引用新组件
- ✅ package.json 是否包含 recharts

### 2. 容器内文件同步
- ✅ 容器内新文件是否存在
- ✅ 容器内 page.tsx 是否有引用
- ✅ MD5是否与服务器一致

### 3. 依赖安装
- ✅ node_modules/recharts 是否存在
- ✅ package.json 是否在容器内

### 4. 构建产物
- ✅ .next/BUILD_ID 是否存在
- ✅ .next 修改时间是否最新
- ✅ 构建文件数量是否正常

### 5. 运行时状态
- ✅ HTTP状态码是否为200
- ✅ 页面HTML是否包含新组件
- ✅ ETag是否更新

### 6. Docker配置
- ✅ Dockerfile 配置是否正确
- ✅ docker-compose.yml 挂载是否正确

---

## 常见问题和解决方案

### 问题1: 容器内文件与服务器不一致

**症状**:
- MD5不匹配
- 容器内缺少新文件

**原因**:
- Docker构建时未正确复制文件
- .dockerignore 排除了需要的文件
- 缓存导致使用了旧的层

**解决方案**:
```bash
# 完全重建（无缓存）
docker compose down
docker images | grep stock-tracker | awk '{print $3}' | xargs docker rmi -f
docker compose build --no-cache --pull
docker compose up -d
```

---

### 问题2: 依赖未安装

**症状**:
- node_modules/recharts 不存在
- 构建日志显示缺少依赖

**原因**:
- package.json 更新后未重新安装
- Docker缓存了旧的 node_modules 层

**解决方案**:
```bash
# 清理并重建
docker compose down
rm -rf node_modules
docker compose build --no-cache
docker compose up -d
```

---

### 问题3: Next.js构建未更新

**症状**:
- BUILD_ID 很旧
- 页面内容不包含新组件

**原因**:
- Next.js使用了缓存的构建
- .next 目录被挂载而不是重新构建

**解决方案**:
```bash
# 删除构建产物并重建
docker compose down
rm -rf .next
docker compose build --no-cache
docker compose up -d
```

---

### 问题4: 浏览器缓存

**症状**:
- 容器内一切正常
- ETag已更新
- 但浏览器显示旧版本

**原因**:
- 浏览器缓存了旧的HTML/JS/CSS
- Service Worker缓存了旧资源

**解决方案**:
1. **强制刷新**: `Ctrl+Shift+R` (Windows) 或 `Cmd+Shift+R` (Mac)
2. **清除缓存**: 浏览器设置 → 清除缓存和Cookie
3. **无痕模式**: 使用隐私/无痕窗口访问
4. **禁用缓存**: 开发者工具 → Network → Disable cache

---

### 问题5: Nginx反向代理缓存

**症状**:
- 直接访问容器端口正常
- 通过域名访问显示旧版本
- ETag未更新

**原因**:
- Nginx缓存了响应
- proxy_cache 未清理

**解决方案**:
```bash
# 清理Nginx缓存
rm -rf /path/to/nginx/cache/*
nginx -s reload

# 或在nginx配置中禁用缓存
proxy_cache off;
proxy_no_cache 1;
proxy_cache_bypass 1;
```

---

## 验证步骤

### 1. 本地验证
```bash
# 检查服务器文件
ssh root@yushuo.click
cd /www/wwwroot/stock-tracker
ls -lh src/components/StockPremiumChart.tsx
grep "StockPremiumChart" src/app/page.tsx
```

### 2. 容器验证
```bash
# 检查容器内文件
docker compose exec stock-tracker ls -lh /app/src/components/StockPremiumChart.tsx
docker compose exec stock-tracker grep "StockPremiumChart" /app/src/app/page.tsx

# 检查依赖
docker compose exec stock-tracker ls /app/node_modules/recharts

# 检查构建
docker compose exec stock-tracker cat /app/.next/BUILD_ID
```

### 3. 运行时验证
```bash
# 检查HTTP响应
docker compose exec stock-tracker curl -I http://localhost:3000

# 检查页面内容
docker compose exec stock-tracker curl -s http://localhost:3000 | grep "StockPremiumChart"
```

### 4. 浏览器验证
1. 打开开发者工具 (F12)
2. 切换到 Network 选项卡
3. 勾选 "Disable cache"
4. 刷新页面 (F5)
5. 查看 HTML 响应是否包含新组件
6. 查看 Response Headers 中的 ETag

---

## 一键修复命令序列

### 完整修复（推荐）
```bash
cd /www/wwwroot/stock-tracker && \
docker compose down && \
docker images | grep stock-tracker | awk '{print $3}' | xargs -r docker rmi -f && \
docker builder prune -f && \
rm -rf .next node_modules && \
docker compose build --no-cache --pull && \
docker compose up -d && \
sleep 5 && \
docker compose ps && \
docker compose exec stock-tracker curl -I http://localhost:3000
```

### 快速重建
```bash
cd /www/wwwroot/stock-tracker && \
docker compose down && \
docker compose build --no-cache && \
docker compose up -d
```

### 仅重启
```bash
cd /www/wwwroot/stock-tracker && \
docker compose restart
```

---

## 预防措施

### 1. 禁用Docker缓存
在 `docker-compose.yml` 中添加:
```yaml
services:
  stock-tracker:
    build:
      context: .
      dockerfile: Dockerfile
      no_cache: true
```

### 2. 使用构建参数
添加时间戳确保每次构建都是新的:
```dockerfile
ARG BUILD_DATE
ENV BUILD_DATE=${BUILD_DATE}
RUN echo "Build date: ${BUILD_DATE}"
```

构建时传入:
```bash
docker compose build --build-arg BUILD_DATE=$(date +%s)
```

### 3. 健康检查
确保 docker-compose.yml 有健康检查:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 4. 版本标记
为每次部署创建Git tag:
```bash
git tag -a v4.3 -m "添加StockPremiumChart组件"
git push origin v4.3
```

---

## 诊断流程图

```
Git代码更新
    ↓
检查服务器文件 ────→ 不存在 ────→ git pull 重新拉取
    ↓ 存在
检查容器内文件 ────→ 不存在 ────→ 完全重建（无缓存）
    ↓ 存在
MD5对比 ────────→ 不匹配 ────→ 完全重建（无缓存）
    ↓ 匹配
检查依赖安装 ────→ 缺失 ──────→ 重建并重装依赖
    ↓ 正常
检查构建产物 ────→ 异常 ──────→ 删除.next重新构建
    ↓ 正常
检查运行时 ──────→ 异常 ──────→ 重启容器
    ↓ 正常
检查浏览器 ──────→ 缓存 ──────→ 强制刷新/清除缓存
    ↓ 正常
✅ 部署成功
```

---

## 联系和支持

如果以上方案都无法解决问题，请：

1. **收集诊断信息**:
   ```bash
   ./quick-diagnose.bat
   ```

2. **查看完整日志**:
   ```bash
   docker compose logs --tail=100 stock-tracker > container-logs.txt
   ```

3. **检查Nginx日志** (如果使用):
   ```bash
   tail -n 100 /var/log/nginx/error.log
   tail -n 100 /var/log/nginx/access.log
   ```

4. **提供环境信息**:
   - 操作系统版本
   - Docker版本
   - Node.js版本
   - 浏览器版本

---

## 版本记录

- **v1.0** (2025-09-30): 初始版本，针对v4.3部署问题
- 包含智能诊断、一键修复、快速诊断三个工具
- 支持自动化问题检测和修复

---

## 文件说明

| 文件 | 用途 | 执行方式 |
|------|------|----------|
| `smart-fix.sh` | 智能诊断和修复 | `execute-smart-fix.bat` |
| `one-click-fix.sh` | 一键完全修复 | `execute-fix.bat` |
| `diagnose-deployment.sh` | 详细诊断脚本 | `run-remote-diagnose.bat` |
| `quick-diagnose.bat` | 快速诊断 | 直接运行 |
| `execute-smart-fix.bat` | Windows执行器 | 双击运行 |
| `execute-fix.bat` | Windows执行器 | 双击运行 |

---

**最后更新**: 2025-09-30
**适用版本**: v4.3
**状态**: 已测试