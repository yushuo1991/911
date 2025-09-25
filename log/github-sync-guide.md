# 🚀 GitHub自动同步部署完整指南

**服务器**: 107.173.154.147
**域名**: bk.yushuo.click
**项目**: Stock Tracker v4.2
**部署方式**: GitHub Actions + 宝塔面板Docker

---

## 📋 部署架构说明

### 🔄 自动同步流程
1. **代码提交** → GitHub仓库 (main分支)
2. **触发Actions** → GitHub Actions自动执行
3. **SSH连接** → 连接到宝塔服务器
4. **同步代码** → 从GitHub拉取最新代码
5. **构建镜像** → Docker构建新的应用镜像
6. **部署容器** → 启动新的Docker容器
7. **健康检查** → 验证应用是否正常运行

### 🛠 技术模块
- **GitHub Actions**: 自动化CI/CD流程
- **SSH连接**: 远程服务器操作
- **Docker**: 容器化部署
- **Nginx**: 反向代理和负载均衡
- **宝塔面板**: 服务器管理界面

---

## 🔧 配置步骤

### 第一步：服务器SSH配置

1. **上传SSH配置脚本到服务器**
   ```bash
   # 通过宝塔面板文件管理上传 ssh-setup.sh
   # 或使用SCP命令上传
   ```

2. **在服务器上执行SSH配置**
   ```bash
   # SSH登录到服务器
   ssh root@107.173.154.147

   # 执行SSH配置脚本
   chmod +x /www/wwwroot/stock-tracker/ssh-setup.sh
   cd /www/wwwroot/stock-tracker
   ./ssh-setup.sh auto
   ```

3. **获取SSH私钥内容**
   ```bash
   # 脚本会显示私钥内容，复制保存
   cat ~/.ssh/id_rsa
   ```

### 第二步：GitHub仓库配置

1. **创建GitHub仓库**
   - 仓库名称: `stock-tracker`
   - 设置为Public或Private
   - 推送本地代码到仓库

2. **配置GitHub Secrets**
   - 进入: `GitHub仓库 → Settings → Secrets and variables → Actions`
   - 添加以下Secrets:

   **SERVER_HOST**
   ```
   107.173.154.147
   ```

   **SERVER_USER**
   ```
   root
   ```

   **SERVER_SSH_KEY**
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   (复制ssh-setup.sh显示的私钥内容)
   -----END OPENSSH PRIVATE KEY-----
   ```

### 第三步：推送代码触发部署

1. **推送代码到main分支**
   ```bash
   git add .
   git commit -m "🚀 初始部署: 配置GitHub自动同步"
   git push origin main
   ```

2. **查看Actions执行状态**
   - 访问: `GitHub仓库 → Actions`
   - 查看部署日志和状态

---

## 📁 文件结构

```
stock-tracker/
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions工作流
├── log/
│   ├── deploy.log              # 部署日志
│   ├── build-*.log             # 构建日志
│   └── api-test-*.log          # API测试日志
├── docker-debug.sh             # Docker诊断脚本
├── docker-fix.sh               # Docker修复脚本
├── github-deploy.sh            # 一键部署脚本
├── server-sync.sh              # 服务器同步脚本
├── ssh-setup.sh                # SSH配置脚本
├── Dockerfile                  # Docker镜像构建
├── .env.production             # 生产环境配置
└── 宝塔Docker部署指南.md        # 手动部署指南
```

---

## 🔍 故障排查

### GitHub Actions失败
1. **检查Secrets配置**
   - 确认SERVER_HOST、SERVER_USER、SERVER_SSH_KEY正确

2. **查看Actions日志**
   ```
   GitHub仓库 → Actions → 点击失败的工作流 → 查看详细日志
   ```

3. **测试SSH连接**
   ```bash
   # 在本地测试SSH连接
   ssh -i private_key root@107.173.154.147
   ```

### 容器启动失败
1. **查看容器日志**
   ```bash
   # 在服务器执行
   docker logs stock-tracker-app
   ```

2. **手动运行诊断脚本**
   ```bash
   cd /www/wwwroot/stock-tracker
   ./docker-debug.sh > log/debug-$(date +%Y%m%d-%H%M%S).log
   ```

### 502错误问题
1. **检查端口监听**
   ```bash
   netstat -tlnp | grep :3000
   ```

2. **测试内部连接**
   ```bash
   curl -I http://127.0.0.1:3000
   ```

3. **检查Nginx配置**
   ```bash
   nginx -t
   nginx -s reload
   ```

---

## 🎯 使用方法

### 自动部署（推荐）
```bash
# 本地开发完成后
git add .
git commit -m "✨ 新功能: 添加XXX功能"
git push origin main

# GitHub Actions自动执行部署
# 等待3-5分钟后访问 http://bk.yushuo.click
```

### 手动同步部署
```bash
# 在服务器上执行
cd /www/wwwroot/stock-tracker
./server-sync.sh

# 或执行特定操作
./server-sync.sh sync    # 仅同步代码
./server-sync.sh deploy  # 仅部署应用
./server-sync.sh status  # 查看状态
```

### 紧急修复部署
```bash
# 在服务器上执行
cd /www/wwwroot/stock-tracker
./docker-fix.sh
```

---

## 📊 监控和日志

### 部署日志
- **GitHub Actions日志**: GitHub仓库 → Actions
- **服务器部署日志**: `/www/wwwroot/stock-tracker/log/deploy.log`
- **Docker构建日志**: `/www/wwwroot/stock-tracker/log/build-*.log`

### 应用监控
- **容器状态**: `docker ps | grep stock-tracker-app`
- **应用日志**: `docker logs stock-tracker-app`
- **访问测试**: `curl -I http://bk.yushuo.click`

### 宝塔面板监控
- **Docker管理**: 宝塔面板 → Docker → 容器管理
- **网站监控**: 宝塔面板 → 网站 → 监控
- **系统监控**: 宝塔面板 → 监控 → 系统状态

---

## ✅ 部署验证

### 成功标志
- ✅ GitHub Actions显示绿色✓
- ✅ 容器状态为"Running"
- ✅ 访问 http://bk.yushuo.click 正常
- ✅ API接口 http://bk.yushuo.click/api/stocks 有响应

### 完成检查清单
- [ ] GitHub Secrets配置正确
- [ ] SSH密钥配置完成
- [ ] 代码成功推送到main分支
- [ ] GitHub Actions执行成功
- [ ] Docker容器正常运行
- [ ] 网站访问正常
- [ ] API接口响应正常
- [ ] 宝塔面板Docker状态正常

---

## 🎉 部署完成

**🌍 应用访问地址**: http://bk.yushuo.click
**🔗 API测试地址**: http://bk.yushuo.click/api/stocks
**📊 管理面板**: 宝塔面板 Docker管理
**📝 日志查看**: `/www/wwwroot/stock-tracker/log/`

现在每次向main分支推送代码，都会自动触发部署！🚀