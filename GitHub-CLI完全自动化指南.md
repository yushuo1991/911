# 🚀 GitHub CLI 完全自动化部署指南

## 📋 方案说明

使用 GitHub CLI 实现**真正的完全自动化**部署，一键完成所有配置。

### 工作流程

```
运行脚本 → 自动配置一切 → 完成！
之后：git push → 自动部署 ✅
```

---

## ⚡ 快速开始（推荐）

### 方法 1：双击运行（最简单）

```
双击运行：GitHub-CLI自动化.bat
```

### 方法 2：PowerShell 运行

```powershell
.\github-cli-auto-deploy.ps1
```

---

## 🔧 脚本会自动完成

### 1. 检查并安装 GitHub CLI
- ✅ 自动检测是否已安装
- ✅ 如未安装则自动安装
- ✅ 检查登录状态

### 2. 初始化 Git 仓库
- ✅ 自动 git init
- ✅ 添加所有文件
- ✅ 创建初始提交

### 3. 创建 GitHub 仓库
- ✅ 使用 gh CLI 创建仓库
- ✅ 自动设置为私有仓库
- ✅ 自动添加 remote

### 4. 配置 GitHub Secrets
- ✅ 自动设置 SERVER_HOST
- ✅ 自动设置 SERVER_USER
- ✅ 自动设置 SERVER_PORT
- ✅ 引导设置 SERVER_SSH_KEY

### 5. 初始化服务器（可选）
- ✅ 自动上传初始化脚本
- ✅ 自动执行服务器配置

### 6. 推送代码
- ✅ 自动推送到 GitHub
- ✅ 自动设置 upstream

### 7. 触发首次部署
- ✅ 自动触发 GitHub Actions
- ✅ 实时监控部署进度

### 8. 完成配置
- ✅ 显示访问地址
- ✅ 显示常用命令

---

## 📊 配置过程

```
┌─────────────────────────────────────┐
│ 运行 github-cli-auto-deploy.ps1    │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ 检查 GitHub CLI                     │
│ - 未安装 → 自动安装                 │
│ - 未登录 → 引导登录                 │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ 初始化 Git 仓库                     │
│ - git init                          │
│ - git add .                         │
│ - git commit                        │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ 创建 GitHub 仓库                    │
│ - gh repo create (自动)             │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ 配置 GitHub Secrets                 │
│ - gh secret set (自动)              │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ 推送代码到 GitHub                   │
│ - git push (自动)                   │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ 触发 GitHub Actions                 │
│ - gh workflow run (自动)            │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ ✅ 完成！                            │
└─────────────────────────────────────┘
```

---

## 🎯 配置完成后的使用

**日常工作流程（完全自动化）：**

```bash
# 1. 修改代码
# （编辑文件...）

# 2. 提交并推送
git add .
git commit -m "Update features"
git push

# 3. 完成！
# GitHub Actions 自动部署（3-5分钟）
```

---

## 📝 常用命令

### 查看部署状态

```bash
# 列出所有运行
gh run list

# 列出部署工作流运行
gh run list --workflow=deploy.yml

# 查看最近一次运行
gh run list --workflow=deploy.yml --limit=1
```

### 实时监控部署

```bash
# 监控最新运行
gh run watch

# 监控特定运行
gh run watch <run-id>
```

### 查看部署日志

```bash
# 查看最新运行的日志
gh run view --log

# 查看特定运行的日志
gh run view <run-id> --log
```

### 手动触发部署

```bash
# 触发部署工作流
gh workflow run deploy.yml

# 监控刚触发的部署
gh run watch
```

### 管理 Secrets

```bash
# 列出所有 secrets
gh secret list

# 设置新的 secret
gh secret set SECRET_NAME --body "secret value"

# 从文件设置 secret
cat file.txt | gh secret set SECRET_NAME

# 删除 secret
gh secret delete SECRET_NAME
```

---

## 🔑 SSH 密钥配置

### 方法 1：使用现有密钥

脚本运行时选择选项 1，提供密钥文件路径：

```
C:\Users\你的用户名\.ssh\id_rsa
```

### 方法 2：生成新密钥

在服务器上执行：

```bash
# SSH 登录
ssh root@107.173.154.147

# 生成密钥
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""

# 添加公钥到授权文件
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 显示私钥
cat ~/.ssh/github_deploy
```

然后设置 secret：

```bash
# 在本地
cat path/to/private_key | gh secret set SERVER_SSH_KEY
```

---

## 🌐 访问应用

部署完成后访问：

```
http://107.173.154.147:3000
```

---

## 🔍 故障排查

### GitHub CLI 未安装

脚本会自动安装，如失败则手动安装：

```bash
winget install --id GitHub.cli
```

### 未登录 GitHub

脚本会引导登录，或手动登录：

```bash
gh auth login
```

### Secrets 未正确配置

查看已配置的 secrets：

```bash
gh secret list
```

重新设置：

```bash
gh secret set SERVER_HOST --body "107.173.154.147"
gh secret set SERVER_USER --body "root"
gh secret set SERVER_PORT --body "22"
cat ~/.ssh/id_rsa | gh secret set SERVER_SSH_KEY
```

### 部署失败

查看详细日志：

```bash
gh run view --log
```

---

## 🎉 优势

### vs 手动配置

| 操作 | 手动配置 | GitHub CLI 自动化 |
|------|---------|------------------|
| 创建仓库 | 网页操作 | ✅ 自动 |
| 配置 Secrets | 逐个输入 | ✅ 自动 |
| 推送代码 | 手动命令 | ✅ 自动 |
| 触发部署 | 等待或手动 | ✅ 自动 |
| **总耗时** | **15-20分钟** | **3-5分钟** |

### vs 服务器定时检查

| 特性 | 服务器定时 | GitHub CLI |
|------|-----------|-----------|
| 部署延迟 | 0-5分钟 | 立即触发 |
| 部署日志 | 服务器查看 | GitHub 网页 |
| 配置难度 | 中等 | ✅ 简单 |
| 监控 | 需 SSH | ✅ gh CLI |

---

## 📚 更多资源

- [GitHub CLI 文档](https://cli.github.com/manual/)
- [GitHub Actions 文档](https://docs.github.com/actions)
- [项目完整文档](GITHUB-CLI-SETUP.md)

---

## 🚀 开始使用

### 立即开始

```
双击运行：GitHub-CLI自动化.bat
```

或

```powershell
.\github-cli-auto-deploy.ps1
```

---

**🎉 享受完全自动化的部署体验！**

配置一次，永久受益。之后只需 `git push`！


