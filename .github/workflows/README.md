# GitHub Actions 自动部署配置说明

## 📋 配置步骤

### 1. 设置 GitHub Secrets

在你的 GitHub 仓库中设置以下 Secrets：

1. 进入仓库 → **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**
3. 添加以下三个 secrets：

| Name | Value | 说明 |
|------|-------|------|
| `SERVER_HOST` | `107.173.154.147` | 服务器IP地址 |
| `SERVER_USERNAME` | `root` | SSH用户名 |
| `SERVER_PASSWORD` | `gJ75hNHdy90TA4qGo9` | SSH密码 |

### 2. 验证配置

配置完成后，GitHub Actions 会在以下情况自动触发部署：

- ✅ 每次 `push` 代码到 `main` 分支
- ✅ 手动触发（Actions → Deploy to Server → Run workflow）

### 3. 查看部署日志

1. 进入仓库 → **Actions** 标签
2. 点击最新的 workflow 运行
3. 查看详细的部署日志

---

## 🚀 使用方式

### 自动部署（推荐）

只需正常提交代码即可：

```bash
git add .
git commit -m "你的提交信息"
git push origin main
```

GitHub Actions 会自动：
1. SSH连接到服务器
2. Git拉取最新代码
3. 安装依赖和构建项目
4. 重启PM2应用
5. 验证部署结果

### 手动触发部署

如果需要手动触发部署（不修改代码）：

1. 进入 GitHub 仓库
2. 点击 **Actions** 标签
3. 选择 **Deploy to Server (PM2)**
4. 点击 **Run workflow** → **Run workflow**

---

## 📊 部署流程

```
┌─────────────────┐
│  Push to main   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │
│   自动触发      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SSH连接服务器   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Git Pull 代码   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ npm install     │
│ npm run build   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PM2 重启应用    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ✅ 部署完成     │
│ http://bk.yushuo.click
└─────────────────┘
```

---

## 🔍 故障排除

### 问题1：部署失败 - SSH连接超时

**原因**：服务器防火墙阻止GitHub Actions的IP

**解决方法**：
1. 登录服务器
2. 检查防火墙规则：`iptables -L`
3. 或者使用宝塔面板 → 安全 → 添加放行规则

### 问题2：PM2命令未找到

**原因**：PM2未全局安装或PATH未配置

**解决方法**：
```bash
# 在服务器上执行
npm install -g pm2
pm2 startup
pm2 save
```

### 问题3：npm install 很慢

**解决方法**：在服务器上配置淘宝镜像
```bash
npm config set registry https://registry.npmmirror.com
```

---

## 🎯 优势

相比手动部署，GitHub Actions 的优势：

| 功能 | 手动部署 | GitHub Actions |
|------|----------|----------------|
| 自动化 | ❌ 需要运行命令 | ✅ 自动触发 |
| 部署历史 | ❌ 无记录 | ✅ 完整日志 |
| 失败通知 | ❌ 无 | ✅ 邮件/通知 |
| 回滚 | ❌ 手动操作 | ✅ 重新运行旧版本 |
| 权限管理 | ❌ 本地密码 | ✅ GitHub管理 |
| 多人协作 | ❌ 需共享密码 | ✅ 统一配置 |

---

## 📝 高级配置

### 仅在特定文件修改时部署

修改 `.github/workflows/deploy.yml`：

```yaml
on:
  push:
    branches: [ main ]
    paths:
      - 'src/**'
      - 'package.json'
      - 'next.config.js'
```

### 添加部署通知

可以集成企业微信、钉钉等通知：

```yaml
- name: 发送通知
  run: |
    curl 'https://your-webhook-url' \
      -H 'Content-Type: application/json' \
      -d '{"text":"✅ 部署成功！访问 http://bk.yushuo.click"}'
```

### 添加环境变量

在 workflow 中设置环境变量：

```yaml
env:
  NODE_ENV: production
  PORT: 3000
```

---

## 📚 相关文档

- [GitHub Actions 官方文档](https://docs.github.com/cn/actions)
- [appleboy/ssh-action](https://github.com/appleboy/ssh-action)
- [PM2 文档](https://pm2.keymetrics.io/docs/usage/quick-start/)

---

**配置完成后，每次 push 代码即可自动部署！🎉**

