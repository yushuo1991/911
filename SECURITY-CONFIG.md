# 🔒 安全配置指南

## ⚠️ 重要安全提醒

**永远不要将以下信息写入代码或文档：**
- ❌ GitHub Personal Access Token
- ❌ 服务器密码
- ❌ SSH 私钥
- ❌ API 密钥

---

## ✅ GitHub Token 的正确使用方式

### 方法 1：使用 GitHub CLI（推荐，已配置）

```bash
# Token 已通过 gh auth login 安全存储
# 位置：~/.config/gh/hosts.yml (加密存储)
# 脚本会自动使用已认证的凭据
```

### 方法 2：使用环境变量（备用）

```powershell
# 临时设置（仅当前会话）
$env:GITHUB_TOKEN = "your-token-here"

# 永久设置（不推荐，因为会明文存储）
# [Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "your-token", "User")
```

---

## 🔐 服务器配置的正确方式

### GitHub Secrets（用于 GitHub Actions）

你的服务器信息应该存储在 GitHub Secrets 中，而不是代码里：

1. 访问：`https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`
2. 添加以下 Secrets：
   - `SERVER_HOST`: 107.173.154.147
   - `SERVER_USER`: root
   - `SERVER_PASSWORD`: gJ75hNHdy90TA4qGo9
   - `SERVER_PORT`: 22

---

## 📋 当前配置状态

✅ **已完成：**
- GitHub CLI 认证（token 安全存储）
- 自动化部署脚本（`auto-deploy-github.ps1`）
- GitHub Actions 工作流（`.github/workflows/deploy.yml`）

🔄 **待配置（运行脚本时会自动完成）：**
- 创建 GitHub 仓库
- 配置 GitHub Secrets
- 首次推送代码

---

## 🚀 下一步操作

**直接运行自动化脚本即可：**

```powershell
.\auto-deploy-github.ps1
```

或双击：`GitHub-CLI自动化.bat`

脚本会自动：
1. 使用已认证的 GitHub CLI
2. 创建仓库
3. 配置 Secrets（会提示你输入服务器信息）
4. 推送代码并触发部署

---

## 🛡️ 安全最佳实践

1. ✅ Token 存储在 GitHub CLI 加密配置中
2. ✅ 敏感信息使用 GitHub Secrets
3. ✅ `.gitignore` 忽略所有配置文件
4. ✅ 定期更换 Token 和密码
5. ✅ 使用 SSH 密钥代替密码（推荐升级）

---

## 📞 遇到问题？

如果脚本需要 token，它会自动从 GitHub CLI 读取。
你无需手动配置任何 token 文件！




