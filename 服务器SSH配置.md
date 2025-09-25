# 🔐 服务器SSH配置详细指南

**目标**: 在服务器配置SSH密钥，实现GitHub Actions自动部署

---

## 方法一：宝塔面板终端配置 ⭐ (推荐)

### 1. 登录宝塔面板
```
访问: http://107.173.154.147:8888
输入宝塔面板用户名和密码
```

### 2. 上传一键配置脚本
```
步骤：宝塔面板 → 文件 → /www/wwwroot/stock-tracker/
操作：上传 "一键执行.sh" 文件
```

### 3. 打开宝塔终端
```
位置：宝塔面板 → 终端
或者：左侧菜单 → 终端管理 → 终端
```

### 4. 执行一键配置
```bash
# 在宝塔终端中执行
cd /www/wwwroot/stock-tracker
chmod +x 一键执行.sh
./一键执行.sh
```

### 5. 复制SSH私钥
脚本执行完成后会显示：
```
======================================
Secrets名称: SERVER_SSH_KEY
Secrets内容:
======================================
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAA...
(很长的密钥内容)
...
-----END OPENSSH PRIVATE KEY-----
======================================
```
**完整复制**这段内容（包括BEGIN和END行）

---

## 方法二：SSH工具直连配置

### 1. 使用SSH工具连接
```bash
# Windows用户可使用：
# - PuTTY
# - Windows Terminal
# - Git Bash
# - MobaXterm

ssh root@107.173.154.147
```

### 2. 进入项目目录
```bash
cd /www/wwwroot/stock-tracker
```

### 3. 检查文件是否存在
```bash
ls -la *.sh
# 应该看到一键执行.sh文件
```

### 4. 执行配置脚本
```bash
chmod +x 一键执行.sh
./一键执行.sh
```

### 5. 获取SSH私钥
```bash
# 如果脚本执行完没显示私钥，手动查看
cat ~/.ssh/id_rsa
```

---

## 方法三：手动配置SSH密钥

如果自动脚本不工作，可以手动配置：

### 1. 生成SSH密钥
```bash
# 生成新密钥
ssh-keygen -t rsa -b 4096 -C "github-actions@stock-tracker" -f ~/.ssh/id_rsa -N ""

# 设置权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
```

### 2. 配置authorized_keys
```bash
# 添加公钥到authorized_keys
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. 查看私钥内容
```bash
cat ~/.ssh/id_rsa
```

### 4. 测试SSH连接
```bash
# 测试SSH密钥是否工作
ssh -i ~/.ssh/id_rsa root@107.173.154.147 "echo 'SSH配置成功'"
```

---

## SSH配置验证清单

配置完成后，确认以下项目：

### 服务器端检查
```bash
# 1. 检查SSH密钥文件
ls -la ~/.ssh/
# 应该看到：id_rsa, id_rsa.pub, authorized_keys

# 2. 检查文件权限
ls -la ~/.ssh/
# id_rsa: -rw------- (600)
# id_rsa.pub: -rw-r--r-- (644)
# authorized_keys: -rw------- (600)

# 3. 检查SSH服务
systemctl status ssh
# 应该显示 active (running)

# 4. 检查项目目录
ls -la /www/wwwroot/stock-tracker/
# 确认所有项目文件存在
```

### GitHub配置检查
需要在GitHub仓库配置3个Secrets：

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
(完整的私钥内容)
-----END OPENSSH PRIVATE KEY-----
```

---

## 🔧 常见问题解决

### 问题1: 权限被拒绝
```bash
# 错误信息
Permission denied (publickey)

# 解决方案
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_rsa
chmod 600 ~/.ssh/authorized_keys

# 确保authorized_keys包含公钥
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
```

### 问题2: 连接超时
```bash
# 检查SSH服务状态
systemctl status ssh

# 启动SSH服务
systemctl start ssh

# 检查防火墙
ufw status
ufw allow 22
```

### 问题3: 文件不存在
```bash
# 确保在正确目录
cd /www/wwwroot/stock-tracker

# 检查是否上传了脚本文件
ls -la *.sh

# 如果没有，通过宝塔面板上传
```

### 问题4: 脚本执行失败
```bash
# 给脚本执行权限
chmod +x 一键执行.sh

# 检查脚本内容
head -n 20 一键执行.sh

# 手动执行每个命令
bash -x 一键执行.sh
```

---

## 📞 配置成功标志

当看到以下输出时，表示配置成功：

```
========================================
🎉 一键配置完成！
========================================

📋 GitHub Secrets 配置信息:
   SERVER_HOST: 107.173.154.147
   SERVER_USER: root
   SERVER_SSH_KEY: (上面显示的私钥内容)

🌍 访问地址:
   网站地址: http://bk.yushuo.click
   API接口: http://bk.yushuo.click/api/stocks

📊 容器状态:
CONTAINER ID   IMAGE                  STATUS
abc123def456   stock-tracker:latest   Up 2 minutes

✨ 所有配置已完成，请按照提示配置GitHub Secrets！
```

---

## 🎯 下一步操作

SSH配置完成后：

1. **复制SSH私钥内容**
2. **前往GitHub仓库配置Secrets**
3. **测试自动部署功能**
4. **验证网站访问正常**

现在SSH配置已经完成，可以进行GitHub Secrets配置了！