# GitHub CLI 自动部署完整指南

这个指南将帮助你使用 GitHub CLI 实现代码推送到 GitHub 并自动部署到服务器。

## 📋 目录

1. [环境准备](#环境准备)
2. [GitHub CLI 安装](#github-cli-安装)
3. [配置 GitHub 仓库](#配置-github-仓库)
4. [配置服务器密钥](#配置服务器密钥)
5. [使用方法](#使用方法)
6. [故障排查](#故障排查)

---

## 🔧 环境准备

### 需要的工具

- ✅ Git
- ✅ GitHub CLI (`gh`)
- ✅ Node.js 18+
- ✅ SSH 访问权限到你的服务器

---

## 📦 GitHub CLI 安装

### Windows

**方法 1: 使用 winget（推荐）**
```powershell
winget install --id GitHub.cli
```

**方法 2: 使用 Scoop**
```powershell
scoop install gh
```

**方法 3: 手动下载**
1. 访问 https://cli.github.com/
2. 下载 Windows 安装程序
3. 运行安装程序

### macOS

```bash
brew install gh
```

### Linux

**Ubuntu/Debian:**
```bash
type -p curl >/dev/null || sudo apt install curl -y
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
&& sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
&& echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
&& sudo apt update \
&& sudo apt install gh -y
```

**Fedora/CentOS:**
```bash
sudo dnf install gh
```

### 验证安装

```bash
gh --version
```

---

## 🔐 登录 GitHub

安装完成后，需要登录你的 GitHub 账户：

```bash
gh auth login
```

按照提示选择：
1. **What account do you want to log into?** → `GitHub.com`
2. **What is your preferred protocol for Git operations?** → `HTTPS` 或 `SSH`
3. **Authenticate Git with your GitHub credentials?** → `Yes`
4. **How would you like to authenticate GitHub CLI?** → `Login with a web browser` 或 `Paste an authentication token`

完成后验证登录状态：
```bash
gh auth status
```

---

## 📝 配置 GitHub 仓库

### 1. 创建或连接 GitHub 仓库

**如果已有仓库：**
```bash
cd 911-86887ec382a82d9038e8df20f97a4d0e5ef02a56
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

**如果需要创建新仓库：**
```bash
cd 911-86887ec382a82d9038e8df20f97a4d0e5ef02a56

# 使用 GitHub CLI 创建仓库
gh repo create stock-tracker --public --source=. --remote=origin

# 或者创建私有仓库
gh repo create stock-tracker --private --source=. --remote=origin
```

### 2. 初始化 Git（如果还没有）

```bash
cd 911-86887ec382a82d9038e8df20f97a4d0e5ef02a56
git init
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

---

## 🔑 配置服务器密钥

GitHub Actions 需要访问你的服务器来部署代码。需要在 GitHub 仓库中配置以下密钥：

### 1. 生成 SSH 密钥（如果还没有）

在本地运行：
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key
```

这会生成两个文件：
- `~/.ssh/github_deploy_key` (私钥)
- `~/.ssh/github_deploy_key.pub` (公钥)

### 2. 将公钥添加到服务器

复制公钥内容：
```bash
cat ~/.ssh/github_deploy_key.pub
```

然后在服务器上：
```bash
# SSH 到你的服务器
ssh your-server-user@your-server-ip

# 添加公钥到授权文件
echo "复制的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. 在 GitHub 仓库中添加 Secrets

使用 GitHub CLI 添加密钥：

```bash
# 进入项目目录
cd 911-86887ec382a82d9038e8df20f97a4d0e5ef02a56

# 添加服务器主机地址
gh secret set SERVER_HOST -b "your-server-ip-or-domain"

# 添加服务器用户名
gh secret set SERVER_USER -b "your-server-username"

# 添加服务器 SSH 端口（默认 22）
gh secret set SERVER_PORT -b "22"

# 添加 SSH 私钥
gh secret set SERVER_SSH_KEY < ~/.ssh/github_deploy_key
```

或者通过网页界面添加：
1. 访问你的仓库
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加以下 secrets：
   - `SERVER_HOST`: 服务器 IP 或域名
   - `SERVER_USER`: 服务器用户名
   - `SERVER_PORT`: SSH 端口（通常是 22）
   - `SERVER_SSH_KEY`: SSH 私钥内容（`~/.ssh/github_deploy_key` 的完整内容）

### 4. 验证密钥配置

```bash
# 查看已配置的 secrets（只显示名称，不显示值）
gh secret list
```

---

## 🚀 使用方法

### 方法 1: 使用自动化脚本（推荐）

**Windows:**
```powershell
cd 911-86887ec382a82d9038e8df20f97a4d0e5ef02a56
.\github-push-deploy.ps1 "你的提交信息"
```

**Linux/Mac:**
```bash
cd 911-86887ec382a82d9038e8df20f97a4d0e5ef02a56
chmod +x github-push-deploy.sh
./github-push-deploy.sh "你的提交信息"
```

脚本会自动：
- ✅ 检查 GitHub CLI 安装状态
- ✅ 检查登录状态
- ✅ 添加并提交代码更改
- ✅ 推送到 GitHub
- ✅ 触发自动部署
- ✅ 显示部署进度

### 方法 2: 手动执行

```bash
# 1. 提交代码
git add .
git commit -m "Update: 你的提交信息"

# 2. 推送到 GitHub（自动触发部署）
git push

# 3. 查看部署状态
gh run list --workflow=deploy.yml

# 4. 实时监控部署进度
gh run watch
```

### 方法 3: 手动触发部署（不推送代码）

```bash
# 触发工作流
gh workflow run deploy.yml

# 查看运行状态
gh run list --workflow=deploy.yml

# 查看详细日志
gh run view --log
```

---

## 📊 常用 GitHub CLI 命令

### 查看工作流

```bash
# 列出所有工作流
gh workflow list

# 查看特定工作流的运行记录
gh run list --workflow=deploy.yml

# 查看最新一次运行的状态
gh run list --workflow=deploy.yml --limit=1
```

### 监控部署

```bash
# 实时查看最新运行的日志
gh run watch

# 查看特定运行的日志
gh run view RUN_ID --log

# 查看失败的运行
gh run list --workflow=deploy.yml --status=failure
```

### 手动触发

```bash
# 触发部署工作流
gh workflow run deploy.yml

# 触发并指定分支
gh workflow run deploy.yml --ref main
```

### 管理 Secrets

```bash
# 列出所有 secrets
gh secret list

# 添加新的 secret
gh secret set SECRET_NAME -b "secret-value"

# 从文件添加 secret
gh secret set SECRET_NAME < file.txt

# 删除 secret
gh secret delete SECRET_NAME
```

---

## 🔍 故障排查

### 问题 1: GitHub CLI 未安装

**错误信息：**
```
gh: command not found
```

**解决方法：**
参考 [GitHub CLI 安装](#github-cli-安装) 部分重新安装

### 问题 2: 未登录 GitHub

**错误信息：**
```
gh: Not logged in to github.com
```

**解决方法：**
```bash
gh auth login
```

### 问题 3: 推送失败

**错误信息：**
```
fatal: unable to access 'https://github.com/...': Failed to connect
```

**解决方法：**
1. 检查网络连接
2. 检查远程仓库配置：`git remote -v`
3. 确认有推送权限
4. 尝试切换到 SSH：
   ```bash
   git remote set-url origin git@github.com:USERNAME/REPO.git
   ```

### 问题 4: 部署失败

**可能原因：**
- ❌ Secrets 配置不正确
- ❌ SSH 密钥权限问题
- ❌ 服务器路径不存在
- ❌ 服务器端口被占用

**排查步骤：**

1. **检查 Secrets 配置**
   ```bash
   gh secret list
   ```
   确保有：`SERVER_HOST`, `SERVER_USER`, `SERVER_PORT`, `SERVER_SSH_KEY`

2. **查看详细日志**
   ```bash
   gh run view --log
   ```

3. **测试 SSH 连接**
   ```bash
   ssh -i ~/.ssh/github_deploy_key -p PORT USER@HOST
   ```

4. **检查服务器目录**
   确保部署路径存在：
   ```bash
   # 在服务器上
   ls -la /www/wwwroot/stock-tracker
   ```

5. **检查服务器日志**
   ```bash
   # PM2 日志
   pm2 logs stock-tracker
   
   # Docker 日志
   docker-compose logs -f
   ```

### 问题 5: 工作流未触发

**可能原因：**
- 推送的不是 main/master 分支
- `.github/workflows/deploy.yml` 文件不存在或有语法错误

**解决方法：**
```bash
# 检查当前分支
git branch --show-current

# 切换到 main 分支
git checkout main

# 检查工作流文件
cat .github/workflows/deploy.yml

# 手动触发
gh workflow run deploy.yml
```

---

## 📝 部署流程说明

1. **本地修改代码**
2. **运行推送脚本** → `.\github-push-deploy.ps1 "commit message"`
3. **GitHub Actions 触发** → 自动检测到 push 事件
4. **构建项目** → `npm install && npm run build`
5. **部署到服务器** → 通过 SSH 连接服务器
6. **备份当前版本** → 创建备份目录
7. **拉取最新代码** → `git pull`
8. **安装依赖并构建** → `npm install && npm run build`
9. **重启服务** → PM2/Docker/Systemd
10. **部署完成** ✅

---

## 🎯 最佳实践

### 1. 使用分支保护

```bash
# 设置 main 分支保护（需要 pull request）
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=continuous-integration
```

### 2. 添加部署通知

在 `.github/workflows/deploy.yml` 中添加通知步骤：

```yaml
- name: Send notification
  if: always()
  run: |
    # 可以集成钉钉、企业微信等通知
    curl -X POST "YOUR_WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d '{"text":"部署状态: ${{ job.status }}"}'
```

### 3. 使用环境变量

```bash
# 添加环境变量
gh secret set NODE_ENV -b "production"
gh secret set DATABASE_URL -b "mysql://..."
```

### 4. 定期备份

在服务器上设置定时任务：
```bash
# 每天凌晨 2 点备份
0 2 * * * cd /www/wwwroot/stock-tracker && ./backup-current-version.sh
```

---

## 📞 需要帮助？

如果遇到问题，可以：

1. **查看 GitHub Actions 日志**
   ```bash
   gh run view --log
   ```

2. **查看服务器日志**
   ```bash
   ssh user@server "pm2 logs stock-tracker --lines 100"
   ```

3. **测试连接**
   ```bash
   # 测试 GitHub 连接
   gh auth status
   
   # 测试服务器连接
   ssh user@server "echo 'Connected!'"
   ```

---

## 🎉 完成！

现在你已经配置好了 GitHub CLI 自动部署系统！

**一键部署命令：**
```powershell
.\github-push-deploy.ps1 "Update features"
```

就这么简单！🚀

