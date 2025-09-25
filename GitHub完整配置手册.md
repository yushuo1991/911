# 🚀 GitHub完整配置手册 - 从零到自动部署

**目标**: 将本地项目同步到GitHub，实现自动部署到服务器

---

## 🎯 整体流程概览

```
本地项目 → GitHub仓库 → GitHub Actions → 服务器自动部署
    ↓           ↓              ↓              ↓
  推送代码    触发Actions    SSH连接服务器   Docker重建
```

**预计时间**: 15-20分钟
**技术要求**: 基本的Git操作知识

---

## 第一阶段：本地Git配置 (5分钟)

### 步骤1: 运行自动配置脚本
双击运行: **`开始同步.bat`**

脚本会自动完成：
- ✅ 检查Git环境
- ✅ 初始化Git仓库
- ✅ 配置用户信息
- ✅ 添加所有文件
- ✅ 创建初始提交
- ✅ 设置main分支

### 步骤2: 创建GitHub仓库
1. 访问 [GitHub.com](https://github.com/new)
2. 填写仓库信息：
   - **仓库名**: `stock-tracker`
   - **描述**: `股票追踪应用 - 自动部署版本`
   - 选择 **Public** 或 **Private**
   - ❌ **不要**勾选任何初始化选项
3. 点击 **Create repository**

### 步骤3: 推送代码到GitHub
双击运行: **`推送到GitHub.bat`**

按提示操作：
1. 输入你的GitHub用户名
2. 确认仓库地址正确
3. 输入GitHub密码或Personal Access Token

**如果需要Token**：
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token → 选择 `repo` 权限
3. 复制Token作为密码使用

---

## 第二阶段：服务器配置 (5分钟)

### 步骤1: 上传配置脚本
**通过宝塔面板**：
1. 登录宝塔面板: `http://107.173.154.147:8888`
2. 文件 → `/www/wwwroot/stock-tracker/`
3. 上传 `一键执行.sh` 文件

### 步骤2: 执行自动配置
**宝塔终端方式**：
1. 宝塔面板 → 终端
2. 执行命令：
```bash
cd /www/wwwroot/stock-tracker
chmod +x 一键执行.sh
./一键执行.sh
```

**SSH工具方式**：
```bash
ssh root@107.173.154.147
cd /www/wwwroot/stock-tracker
chmod +x 一键执行.sh
./一键执行.sh
```

### 步骤3: 复制SSH私钥
脚本执行完成后会显示SSH私钥，**完整复制**：
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAA...
(完整内容)
-----END OPENSSH PRIVATE KEY-----
```

---

## 第三阶段：GitHub Secrets配置 (3分钟)

### 步骤1: 进入Secrets配置页面
1. GitHub仓库页面 → **Settings**
2. 左侧菜单 → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**

### 步骤2: 添加3个Secrets

**Secret #1**: 服务器地址
- Name: `SERVER_HOST`
- Value: `107.173.154.147`

**Secret #2**: SSH用户名
- Name: `SERVER_USER`
- Value: `root`

**Secret #3**: SSH私钥
- Name: `SERVER_SSH_KEY`
- Value: [粘贴前面复制的完整SSH私钥内容]

### 步骤3: 验证Secrets配置
配置完成后应该看到：
```
Repository secrets (3)
🔐 SERVER_HOST        Updated now by you
🔐 SERVER_SSH_KEY     Updated now by you
🔐 SERVER_USER        Updated now by you
```

---

## 第四阶段：测试自动部署 (5分钟)

### 步骤1: 触发首次部署
在项目目录执行：
```bash
# 修改一个文件触发部署
echo "# 测试自动部署功能" >> README.md

# 提交并推送
git add .
git commit -m "🧪 测试: 首次自动部署"
git push origin main
```

### 步骤2: 查看GitHub Actions状态
1. GitHub仓库 → **Actions** 标签
2. 查看 "GitHub自动同步到宝塔服务器" 工作流
3. 点击查看详细执行日志

**状态指示器**：
- 🟡 黄色圆点 = 正在执行
- ✅ 绿色勾号 = 执行成功
- ❌ 红色叉号 = 执行失败

### 步骤3: 验证部署结果
**网站访问测试**：
- 访问: `http://bk.yushuo.click`
- API测试: `http://bk.yushuo.click/api/stocks`

**服务器状态检查**：
```bash
# SSH连接服务器检查
ssh root@107.173.154.147

# 检查容器状态
docker ps | grep stock-tracker

# 检查内部连接
curl -I http://127.0.0.1:3000
```

**宝塔面板检查**：
- Docker → 容器管理
- 找到 `stock-tracker-app`
- 状态应该是 **运行中**

---

## 🔧 故障排查快速指南

### GitHub Actions失败
**常见原因**：
1. SSH连接失败 → 检查SERVER_HOST和防火墙
2. 认证失败 → 重新配置SSH密钥
3. Docker构建失败 → 检查服务器磁盘空间

**快速解决**：
```bash
# 服务器执行诊断
cd /www/wwwroot/stock-tracker
./docker-debug.sh

# 一键修复
./docker-fix.sh
```

### 网站502错误
**快速修复**：
```bash
# 重启容器
docker restart stock-tracker-app

# 重载Nginx
nginx -s reload

# 测试连接
curl -I http://127.0.0.1:3000
```

### SSH连接问题
**检查清单**：
- [ ] SSH服务运行正常: `systemctl status ssh`
- [ ] 防火墙允许22端口: `ufw allow 22`
- [ ] SSH密钥权限正确: `chmod 600 ~/.ssh/id_rsa`
- [ ] authorized_keys配置正确

---

## ✅ 成功验收标准

### 自动部署成功标志
- [ ] GitHub Actions显示绿色✅
- [ ] 3-5分钟内部署完成
- [ ] 网站 `http://bk.yushuo.click` 可访问
- [ ] API `http://bk.yushuo.click/api/stocks` 有响应
- [ ] 宝塔面板Docker显示容器运行

### 日常使用验收
- [ ] 修改代码后推送自动触发部署
- [ ] 部署过程在GitHub Actions可见
- [ ] 部署失败时有清晰的错误信息
- [ ] 服务器日志记录完整

---

## 🎉 配置完成 - 使用指南

### 日常开发流程
```bash
# 1. 修改代码
# 编辑你的项目文件...

# 2. 提交变更
git add .
git commit -m "✨ 新功能: 描述你的修改"

# 3. 推送到GitHub
git push origin main

# 4. 等待自动部署 (3-5分钟)
# 5. 访问 http://bk.yushuo.click 查看结果
```

### 监控和维护
- **查看部署状态**: GitHub仓库 → Actions
- **检查服务器日志**: `/www/wwwroot/stock-tracker/log/`
- **监控容器状态**: 宝塔面板 → Docker管理
- **应急修复**: 执行 `docker-fix.sh`

### 高级功能
- **回滚版本**: `git revert <commit>` 然后推送
- **分支部署**: 修改 `.github/workflows/deploy.yml` 的分支配置
- **环境变量**: 修改容器启动参数
- **扩容部署**: 添加多容器负载均衡

---

## 📞 技术支持

如果遇到问题，按以下顺序排查：

1. **查看详细文档**:
   - `详细操作步骤.md`
   - `GitHub配置截图说明.md`
   - `log/故障排查手册.md`

2. **执行诊断脚本**:
   ```bash
   cd /www/wwwroot/stock-tracker
   ./docker-debug.sh > log/debug-$(date +%Y%m%d-%H%M%S).log
   ```

3. **查看GitHub Actions日志**:
   - 仓库 → Actions → 点击失败的工作流

4. **一键修复尝试**:
   ```bash
   cd /www/wwwroot/stock-tracker
   ./docker-fix.sh
   ```

现在你的Stock Tracker应用已经实现了完整的GitHub自动同步部署！🚀

每次推送代码到main分支，都会自动：
- ✅ 同步最新代码到服务器
- ✅ 重新构建Docker镜像
- ✅ 重启应用容器
- ✅ 验证部署成功
- ✅ 自动更新线上服务

**享受现代化的自动部署体验吧！** 🎉