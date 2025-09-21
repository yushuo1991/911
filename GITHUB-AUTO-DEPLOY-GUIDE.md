# 🚀 GitHub自动部署完整配置指南

**目标**: 实现代码推送到GitHub后自动部署到生产服务器，实现真正的一键更新

## 📋 **自动部署架构**

### **部署流程图**
```
开发者推送代码 → GitHub → GitHub Actions → 服务器部署 → 应用更新
     ↓              ↓           ↓              ↓           ↓
  git push     触发Webhook   CI/CD构建     SSH执行脚本   用户看到更新
```

### **双重部署机制**

#### **方案A: GitHub Actions (推荐)**
- **优势**: 功能完整，支持构建测试，更安全
- **适用**: 有SSH访问权限的服务器
- **触发**: push到main分支

#### **方案B: Webhook + 本地脚本**
- **优势**: 部署速度快，配置简单
- **适用**: 所有服务器环境
- **触发**: GitHub Webhook

## 🔧 **完整配置步骤**

### **第一步: 服务器端配置**

#### **1.1 在服务器上执行配置脚本**

```bash
# 在服务器上执行
cd /www/wwwroot/stock-tracker
chmod +x scripts/auto-deploy.sh
bash scripts/auto-deploy.sh
```

#### **1.2 验证服务状态**

```bash
# 检查PM2服务状态
pm2 status

# 应该看到两个服务：
# - stock-tracker (主应用)
# - stock-tracker-webhook (Webhook接收器)

# 检查端口监听
netstat -tulpn | grep -E ":(3000|3001)"
```

### **第二步: GitHub仓库配置**

#### **2.1 配置GitHub Actions Secrets**

在GitHub仓库设置中添加以下Secrets：

```
Settings → Secrets and variables → Actions → New repository secret
```

**必需的Secrets**:
```
SERVER_HOST: 107.173.154.147
SERVER_USER: root
SERVER_PORT: 22
SERVER_SSH_KEY: [SSH私钥内容]
```

#### **2.2 生成SSH密钥对（如果没有）**

```bash
# 在本地生成SSH密钥
ssh-keygen -t rsa -b 4096 -C "github-actions@deploy"

# 将公钥添加到服务器
ssh-copy-id root@107.173.154.147

# 将私钥内容复制到GitHub Secrets
cat ~/.ssh/id_rsa
```

#### **2.3 配置GitHub Webhook**

在GitHub仓库设置中配置Webhook：

```
Settings → Webhooks → Add webhook

Payload URL: http://107.173.154.147:3001/webhook
Content type: application/json
Secret: github-webhook-secret-2025
Events: Just the push event
Active: ✓
```

### **第三步: 推送GitHub Actions配置**

将项目中的以下文件推送到GitHub：

```bash
git add .github/workflows/deploy.yml
git add ecosystem.config.js
git add scripts/auto-deploy.sh
git add GITHUB-AUTO-DEPLOY-GUIDE.md
git commit -m "添加GitHub自动部署配置

🚀 新增功能:
- GitHub Actions自动部署工作流
- Webhook自动部署服务
- 完整的CI/CD流程
- 自动备份和回滚机制

📋 配置包含:
- 自动构建和测试
- 健康检查和监控
- 错误处理和日志记录
- 零停机部署

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

## 🧪 **测试自动部署**

### **测试GitHub Actions部署**

1. **修改任意文件**:
```bash
echo "// 测试自动部署 - $(date)" >> README.md
git add README.md
git commit -m "测试GitHub Actions自动部署"
git push origin main
```

2. **观察部署过程**:
```bash
# 在GitHub查看Actions页面
# 在服务器查看部署日志
tail -f /www/wwwroot/stock-tracker/logs/deploy.log
```

### **测试Webhook部署**

1. **测试Webhook接收**:
```bash
curl -X POST http://107.173.154.147:3001/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

2. **检查Webhook日志**:
```bash
tail -f /www/wwwroot/stock-tracker/logs/webhook.log
```

## 📊 **部署监控和日志**

### **日志文件位置**

```bash
# 部署日志
/www/wwwroot/stock-tracker/logs/deploy.log

# Webhook日志
/www/wwwroot/stock-tracker/logs/webhook.log

# 应用日志
/www/wwwroot/stock-tracker/logs/pm2-*.log

# Nginx日志
/var/log/nginx/access.log
/var/log/nginx/error.log
```

### **实时监控命令**

```bash
# 监控所有部署相关日志
tail -f /www/wwwroot/stock-tracker/logs/*.log

# 监控PM2应用状态
pm2 monit

# 监控系统资源
htop

# 检查应用健康状态
curl -I http://bk.yushuo.click
```

## 🔄 **部署流程详解**

### **GitHub Actions流程**

1. **代码检出**: 获取最新代码
2. **环境准备**: 设置Node.js 18环境
3. **依赖安装**: npm ci
4. **项目构建**: npm run build
5. **测试执行**: npm test (可选)
6. **服务器部署**: SSH连接执行部署脚本
7. **健康检查**: 验证应用正常运行
8. **标签创建**: 创建部署标签便于回滚

### **自动部署脚本流程**

1. **备份创建**: 自动备份当前版本
2. **应用停止**: 优雅停止当前应用
3. **代码更新**: git pull最新代码
4. **依赖管理**: 智能检测package.json变化
5. **项目构建**: npm run build
6. **数据库检查**: 验证数据库连接
7. **应用启动**: PM2启动新版本
8. **健康检查**: 10次重试验证
9. **自动回滚**: 失败时自动回滚到备份
10. **服务重启**: 重启Nginx确保配置生效

## 🛡️ **安全和稳定性**

### **安全措施**

1. **SSH密钥认证**: 避免密码认证
2. **Webhook签名验证**: 防止恶意请求
3. **IP白名单**: 限制GitHub Webhook IP
4. **秘钥管理**: GitHub Secrets安全存储
5. **最小权限**: 部署用户最小权限原则

### **稳定性保障**

1. **自动备份**: 每次部署前自动备份
2. **健康检查**: 多次重试验证
3. **自动回滚**: 失败时自动回滚
4. **零停机**: PM2平滑重启
5. **日志记录**: 完整的部署日志

### **故障恢复**

```bash
# 手动回滚到最近备份
cd /www/wwwroot/stock-tracker
LATEST_BACKUP=$(ls -dt /www/backups/stock-tracker/backup-* | head -1)
pm2 stop stock-tracker
rm -rf ./*
cp -r "$LATEST_BACKUP/"* .
pm2 start ecosystem.config.js

# 查看备份列表
ls -la /www/backups/stock-tracker/

# 手动执行部署脚本
bash /www/wwwroot/stock-tracker/scripts/deploy.sh
```

## 📈 **性能优化建议**

### **部署性能优化**

1. **并行构建**: 利用GitHub Actions并行能力
2. **缓存优化**: npm缓存加速依赖安装
3. **增量部署**: 只更新变化的文件
4. **资源压缩**: 静态资源压缩和优化

### **监控告警**

1. **部署状态监控**: 部署成功/失败通知
2. **应用性能监控**: 响应时间和错误率
3. **服务器资源监控**: CPU、内存、磁盘使用
4. **自定义告警**: 关键指标阈值告警

## 🎯 **使用场景**

### **日常开发更新**

```bash
# 修复bug
git add .
git commit -m "修复库存数据显示问题"
git push origin main
# → 自动部署到生产环境
```

### **功能发布**

```bash
# 新功能开发
git add .
git commit -m "新增股票对比功能

✨ 新功能:
- 添加股票横向对比
- 优化数据加载性能
- 增强用户界面体验"
git push origin main
# → 自动部署，用户立即可用
```

### **紧急修复**

```bash
# 紧急bug修复
git add .
git commit -m "紧急修复: 解决API调用超时问题"
git push origin main
# → 几分钟内自动部署完成
```

## 📋 **配置检查清单**

### **服务器端检查**

- [ ] SSH密钥配置正确
- [ ] PM2服务运行正常
- [ ] Webhook服务监听3001端口
- [ ] 防火墙开放3001端口
- [ ] 项目目录权限正确
- [ ] 日志目录可写

### **GitHub端检查**

- [ ] Actions Secrets配置完整
- [ ] Webhook配置正确
- [ ] 工作流文件语法正确
- [ ] SSH连接测试成功

### **功能验证**

- [ ] 手动推送代码触发部署
- [ ] 查看GitHub Actions执行日志
- [ ] 验证应用自动更新
- [ ] 检查健康检查通过
- [ ] 确认日志记录正常

---

## 🎉 **部署完成效果**

配置完成后，你将拥有：

✅ **一键部署**: `git push` 即自动更新生产环境
✅ **零停机更新**: 平滑重启，用户无感知
✅ **自动回滚**: 部署失败自动回滚到稳定版本
✅ **完整日志**: 详细的部署和运行日志
✅ **健康监控**: 自动健康检查和异常告警
✅ **安全保障**: 多重安全验证和权限控制

**从此，你的股票追踪系统将拥有企业级的自动化部署能力！** 🚀

---

**配置指南完成时间**: 2025-09-21
**技术栈**: GitHub Actions + PM2 + Nginx + MySQL
**部署效果**: 全自动化、零停机、企业级稳定性