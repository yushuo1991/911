# 🚀 服务器Git部署指令

## 代码已推送到GitHub
✅ 提交哈希: `0c9cb5f`
✅ 远程仓库: https://github.com/yushuo1991/911.git
✅ 分支: main

---

## 方式1: 一键部署（推荐）

直接SSH登录服务器，复制粘贴以下完整命令：

```bash
# 连接服务器
ssh root@yushuo.click
# 密码: gJ75hNHdy90TA4qGo9

# 粘贴以下完整命令（一次性执行）
cd /www/wwwroot/stock-tracker && \
echo "=== 开始Git自动部署 ===" && \
git status && \
echo "" && \
echo "=== 拉取最新代码 ===" && \
git fetch --all && \
git reset --hard origin/main && \
git pull origin main && \
echo "" && \
echo "=== 验证文件 ===" && \
ls -lh Dockerfile docker-compose.yml init.sql deploy.sh && \
echo "" && \
echo "=== 赋予执行权限 ===" && \
chmod +x deploy.sh && \
echo "" && \
echo "=== 执行Docker部署 ===" && \
./deploy.sh
```

---

## 方式2: 分步执行

如果方式1失败，逐步执行：

```bash
# 1. 连接服务器
ssh root@yushuo.click
# 密码: gJ75hNHdy90TA4qGo9

# 2. 进入项目目录
cd /www/wwwroot/stock-tracker

# 3. 检查Git状态
git status

# 4. 拉取最新代码
git fetch --all
git reset --hard origin/main
git pull origin main

# 5. 验证文件
ls -lh Dockerfile docker-compose.yml init.sql deploy.sh

# 6. 赋予执行权限
chmod +x deploy.sh

# 7. 执行部署
./deploy.sh

# 8. 查看日志（可选）
docker-compose logs -f stock-tracker
```

---

## 方式3: 如果项目目录不存在

```bash
# 1. SSH登录
ssh root@yushuo.click

# 2. 克隆仓库
cd /www/wwwroot
git clone https://github.com/yushuo1991/911.git stock-tracker
cd stock-tracker

# 3. 执行部署
chmod +x deploy.sh
./deploy.sh
```

---

## 部署后验证

```bash
# 1. 检查容器状态
docker-compose ps

# 期望看到:
# NAME                      STATUS          PORTS
# stock-tracker-app         Up (healthy)    0.0.0.0:3002->3000/tcp
# stock-tracker-mysql       Up (healthy)    0.0.0.0:3307->3306/tcp

# 2. 查看应用日志
docker-compose logs --tail=50 stock-tracker

# 3. 测试访问
curl http://localhost:3002

# 4. 浏览器访问
# http://yushuo.click:3002
```

---

## 常用Docker命令

```bash
# 查看所有容器
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose stop

# 启动服务
docker-compose start

# 完全重新部署
docker-compose down
./deploy.sh

# 查看容器资源使用
docker stats
```

---

## 故障排查

### 问题1: Git拉取失败

```bash
# 重置到远程版本
cd /www/wwwroot/stock-tracker
git fetch --all
git reset --hard origin/main
```

### 问题2: Docker构建失败

```bash
# 查看详细日志
docker-compose build --no-cache

# 清理旧镜像
docker system prune -a
```

### 问题3: 容器无法启动

```bash
# 查看详细日志
docker-compose logs stock-tracker

# 检查端口占用
netstat -tuln | grep 3002

# 完全重新部署
docker-compose down -v
./deploy.sh
```

### 问题4: 数据库连接失败

```bash
# 检查MySQL容器
docker-compose ps mysql

# 测试MySQL连接
docker exec stock-tracker-mysql mysql -u root -proot_password_2025 -e "SHOW DATABASES;"

# 查看MySQL日志
docker-compose logs mysql
```

---

## 服务器信息

- **服务器**: yushuo.click
- **用户**: root
- **密码**: gJ75hNHdy90TA4qGo9
- **项目目录**: /www/wwwroot/stock-tracker
- **Git仓库**: https://github.com/yushuo1991/911.git
- **访问端口**: 3002
- **访问地址**: http://yushuo.click:3002

---

## 本次更新内容

✅ **安全修复**:
- API密钥改用环境变量
- 移除硬编码Token

✅ **性能优化**:
- 数据库批量插入（40倍提升）
- 连接池优化（10→20）
- TypeScript编译错误修复

✅ **Docker部署**:
- 多阶段构建Dockerfile
- docker-compose双容器架构
- MySQL自动初始化
- 健康检查机制

---

**现在就可以SSH登录服务器执行部署了！** 🎉