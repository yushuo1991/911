# 📸 GitHub配置截图说明

## 🎯 GitHub Secrets配置步骤（图文详解）

### 第一步：进入仓库Settings
```
📍 位置: GitHub仓库首页右上角
🖱️ 操作: 点击 "Settings" 标签
```

**你会看到：**
```
Code    Issues    Pull requests    Actions    Projects    Wiki    Security    Insights    Settings
                                                                                              👆点这里
```

### 第二步：找到Secrets配置
```
📍 位置: 左侧菜单栏
🖱️ 操作: 点击 "Secrets and variables" → "Actions"
```

**左侧菜单结构：**
```
Settings
├── General
├── Access
├── Code and automation
│   ├── Branches
│   ├── Tags
│   ├── Actions
│   └── Webhooks
├── Security
│   ├── Code security
│   └── Secrets and variables  👈 点这里
│       ├── Actions  👈 再点这里
│       ├── Codespaces
│       └── Dependabot
└── Integrations
```

### 第三步：添加Repository Secret
```
📍 位置: Secrets页面右上角
🖱️ 操作: 点击 "New repository secret" 绿色按钮
```

**页面会显示：**
```
Actions secrets and variables

Repository secrets    Environment secrets
     👆选这个

[New repository secret]  👈 点这个绿色按钮
```

### 第四步：配置三个Secrets

#### Secret 1: SERVER_HOST
```
📋 填写表单:
┌─────────────────────────────┐
│ Name *                      │
│ SERVER_HOST                 │  👈 严格按照这个名称
├─────────────────────────────┤
│ Secret *                    │
│ 107.173.154.147            │  👈 你的服务器IP
└─────────────────────────────┘
           [Add secret]  👈 点击保存
```

#### Secret 2: SERVER_USER
```
📋 填写表单:
┌─────────────────────────────┐
│ Name *                      │
│ SERVER_USER                 │  👈 严格按照这个名称
├─────────────────────────────┤
│ Secret *                    │
│ root                        │  👈 SSH用户名
└─────────────────────────────┘
           [Add secret]  👈 点击保存
```

#### Secret 3: SERVER_SSH_KEY
```
📋 填写表单:
┌─────────────────────────────┐
│ Name *                      │
│ SERVER_SSH_KEY              │  👈 严格按照这个名称
├─────────────────────────────┤
│ Secret *                    │
│ -----BEGIN OPENSSH PRIV...  │  👈 完整的SSH私钥
│ b3BlbnNzaC1rZXktdjEAA...    │     (很长的内容)
│ ...                         │
│ -----END OPENSSH PRIV...    │
└─────────────────────────────┘
           [Add secret]  👈 点击保存
```

**⚠️ SSH私钥获取方法：**
```bash
# 在服务器执行一键脚本后，复制显示的私钥内容
cd /www/wwwroot/stock-tracker
./一键执行.sh

# 或者手动查看
cat ~/.ssh/id_rsa
```

### 第五步：验证Secrets配置
```
配置完成后，你会看到：

Repository secrets (3)
┌──────────────────────────────────┐
│ 🔐 SERVER_HOST                   │  Updated now by you
├──────────────────────────────────┤
│ 🔐 SERVER_SSH_KEY                │  Updated now by you
├──────────────────────────────────┤
│ 🔐 SERVER_USER                   │  Updated now by you
└──────────────────────────────────┘
```

**✅ 成功标志：**
- 显示3个绿色锁头图标
- 每个Secret都显示 "Updated now by you"
- 没有任何错误提示

---

## 🔍 GitHub Actions查看方法

### 查看Actions执行状态
```
📍 位置: 仓库首页顶部标签栏
🖱️ 操作: 点击 "Actions" 标签
```

**你会看到：**
```
Code    Issues    Pull requests    Actions    Projects    Wiki
                                     👆点这里
```

### Actions页面结构
```
All workflows    GitHub自动同步到宝塔服务器

Recent workflow runs
┌────────────────────────────────────────────┐
│ ✅ 🧪 测试: 首次自动部署                    │  workflow succeeded
│    GitHub自动同步到宝塔服务器               │  #1 • main
│    📅 1 minute ago                         │
├────────────────────────────────────────────┤
│ 🟡 🚀 初始提交: 配置GitHub自动部署           │  workflow in progress
│    GitHub自动同步到宝塔服务器               │  #2 • main
│    📅 3 minutes ago                        │
└────────────────────────────────────────────┘
```

### 状态图标说明
```
✅ 绿色勾号 = 部署成功
🟡 黄色圆点 = 正在执行
❌ 红色叉号 = 部署失败
⚫ 灰色圆点 = 等待执行
```

### 查看详细日志
```
🖱️ 操作: 点击任意一个工作流
👀 查看: 每个步骤的详细执行日志
```

**日志结构：**
```
GitHub自动同步到宝塔服务器 #1

Jobs
┌─────────────────────────────┐
│ deploy                      │  ✅ 3m 24s
├─────────────────────────────┤
│ ✅ 检出代码                  │  1s
│ ✅ 部署到宝塔服务器           │  3m 23s
└─────────────────────────────┘
```

**点击"部署到宝塔服务器"查看详细日志：**
```
=== GitHub自动同步部署开始 ===
时间: 2025-09-26 10:30:45
提交: a1b2c3d4e5f6...
仓库: your-username/stock-tracker

步骤1: 停止旧容器...
步骤2: 同步GitHub代码...
当前版本: a1b2c3d 🧪 测试: 首次自动部署
步骤3: 构建Docker镜像...
✅ Docker镜像构建成功
步骤4: 设置数据目录...
步骤5: 启动新Docker容器...
✅ 容器启动成功
...
```

---

## 🔧 常见错误截图说明

### 错误1：SSH连接失败
```
❌ 错误日志:
ssh: connect to host 107.173.154.147 port 22: Connection refused

💡 解决方案:
1. 检查SERVER_HOST是否正确
2. 确认服务器SSH端口是22
3. 检查服务器防火墙设置
```

### 错误2：SSH密钥格式错误
```
❌ 错误日志:
Load key "/tmp/ssh_key": invalid format

💡 解决方案:
1. 确保私钥包含BEGIN和END行
2. 私钥内容完整复制，不能有额外空格
3. 重新生成SSH密钥
```

### 错误3：权限被拒绝
```
❌ 错误日志:
Permission denied (publickey,password)

💡 解决方案:
1. 检查SERVER_USER是否为root
2. 确认SSH密钥已添加到服务器
3. 检查authorized_keys权限
```

### 错误4：Docker构建失败
```
❌ 错误日志:
Step 5/10 : RUN npm install
E: Package 'nodejs' has no installation candidate

💡 解决方案:
1. 检查Dockerfile语法
2. 确认base image可用
3. 查看服务器磁盘空间
```

---

## ✅ 成功部署截图标志

### GitHub Actions成功页面
```
✅ GitHub自动同步到宝塔服务器 #1

=== 部署完成 ===
🌍 访问地址: http://bk.yushuo.click
🔗 API测试: http://bk.yushuo.click/api/stocks
📊 容器状态:
CONTAINER ID   IMAGE                    STATUS
abc123def456   stock-tracker:latest     Up 2 minutes

This job took 3 minutes and 24 seconds to complete.
```

### 网站访问成功
```
浏览器地址栏: http://bk.yushuo.click
页面显示: Stock Tracker 股票追踪系统界面
状态码: 200 OK
```

### 宝塔面板Docker状态
```
容器管理 > stock-tracker-app
状态: 运行中 🟢
端口: 3000:3000
启动时间: 2分钟前
CPU: 0.5%    内存: 128MB
```

---

## 📞 技术支持

如果按照截图说明操作仍有问题：

1. **检查日志文件**：`/www/wwwroot/stock-tracker/log/`
2. **运行诊断脚本**：`./docker-debug.sh`
3. **查看GitHub Actions详细日志**
4. **执行一键修复**：`./docker-fix.sh`