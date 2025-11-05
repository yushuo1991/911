# 手动部署指南

由于Windows环境限制，请按以下步骤手动部署：

## 步骤1: 下载部署工具

推荐使用 **WinSCP** 或 **MobaXterm**（二选一）：

- WinSCP: https://winscp.net/eng/download.php
- MobaXterm: https://mobaxterm.mobatek.net/download.html

## 步骤2: 本地打包

在项目目录打开 PowerShell，执行：

```powershell
cd "C:\Users\yushu\Desktop\stock-tracker - 副本"

tar -czf stock-tracker-deploy.tar.gz `
    --exclude=node_modules `
    --exclude=.next `
    --exclude=.git `
    --exclude=log `
    --exclude=data `
    .
```

## 步骤3: 上传文件

### 方法A: 使用WinSCP

1. 打开WinSCP
2. 新建站点：
   - 主机名: `yushuo.click`
   - 用户名: `root`
   - 密码: `gJ75hNHdy90TA4qGo9`
3. 连接后，将 `stock-tracker-deploy.tar.gz` 上传到 `/tmp/` 目录

### 方法B: 使用命令行（如果安装了OpenSSH）

```powershell
scp stock-tracker-deploy.tar.gz root@yushuo.click:/tmp/
# 输入密码: gJ75hNHdy90TA4qGo9
```

## 步骤4: SSH登录服务器

### 方法A: 使用MobaXterm/PuTTY

- 主机: `yushuo.click`
- 用户: `root`
- 密码: `gJ75hNHdy90TA4qGo9`

### 方法B: 使用PowerShell SSH

```powershell
ssh root@yushuo.click
# 输入密码: gJ75hNHdy90TA4qGo9
```

## 步骤5: 服务器端部署

登录服务器后，执行以下命令：

```bash
# 1. 创建并进入项目目录
mkdir -p /www/wwwroot/stock-tracker
cd /www/wwwroot/stock-tracker

# 2. 备份旧版本（如果存在）
if [ -f "docker-compose.yml" ]; then
  tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz \
    --exclude=node_modules --exclude=.next . 2>/dev/null || true
fi

# 3. 解压新版本
tar -xzf /tmp/stock-tracker-deploy.tar.gz

# 4. 清理临时文件
rm /tmp/stock-tracker-deploy.tar.gz

# 5. 赋予执行权限
chmod +x deploy.sh

# 6. 检查文件
ls -lh Dockerfile docker-compose.yml init.sql

# 7. 执行部署
./deploy.sh
```

## 步骤6: 验证部署

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f stock-tracker

# 测试访问
curl http://localhost:3002
```

## 步骤7: 浏览器访问

打开浏览器访问：**http://yushuo.click:3002**

---

## 快捷部署（一键复制）

登录服务器后，复制粘贴以下整段命令：

```bash
mkdir -p /www/wwwroot/stock-tracker && \
cd /www/wwwroot/stock-tracker && \
[ -f "docker-compose.yml" ] && tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz --exclude=node_modules --exclude=.next . 2>/dev/null || true && \
tar -xzf /tmp/stock-tracker-deploy.tar.gz && \
rm /tmp/stock-tracker-deploy.tar.gz && \
chmod +x deploy.sh && \
./deploy.sh
```

---

## 常见问题

### Q1: Docker未安装

```bash
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker
```

### Q2: 端口被占用

```bash
# 查看占用情况
netstat -tuln | grep 3002

# 修改端口（编辑docker-compose.yml）
vi docker-compose.yml
# 将 "3002:3000" 改为其他端口如 "3003:3000"
```

### Q3: 容器无法启动

```bash
# 查看详细日志
docker-compose logs stock-tracker

# 检查环境变量
docker exec stock-tracker-app env
```

---

## 服务器连接信息（备份）

- **服务器**: yushuo.click
- **用户名**: root
- **密码**: gJ75hNHdy90TA4qGo9
- **项目目录**: /www/wwwroot/stock-tracker
- **访问端口**: 3002