# 服务器代码同步指导文档

## 📋 同步操作概览

已将v4.3版本成功推送到GitHub，现在您可以通过同步脚本将代码更新到服务器。

### GitHub推送状态
- ✅ 代码已推送: `main` 分支 (commit: 3031ff7)
- ✅ 标签已推送: `v4.3` 标签
- 📍 仓库地址: https://github.com/yushuo1991/911.git

---

## 🚀 服务器同步步骤

### 方法一：使用同步脚本（推荐）

#### 1. 下载同步脚本
```bash
# 连接到您的服务器
ssh root@your-server-ip

# 下载同步脚本
wget https://raw.githubusercontent.com/yushuo1991/911/main/server-sync.sh
chmod +x server-sync.sh
```

#### 2. 执行同步
```bash
# 运行同步脚本
sudo ./server-sync.sh
```

### 方法二：手动同步

#### 1. 进入项目目录
```bash
cd /www/wwwroot/stock-tracker
```

#### 2. 拉取最新代码
```bash
# 如果是第一次部署
git clone https://github.com/yushuo1991/911.git .

# 如果已存在项目
git fetch origin
git checkout v4.3
git reset --hard v4.3
```

#### 3. 更新应用
```bash
# 如果需要重新部署
npm install
npm run build
pm2 restart stock-tracker-v42
```

---

## 🔧 技术模块说明

### 1. Git同步模块
- **功能**: 从GitHub仓库同步最新代码
- **影响**: 确保服务器代码与仓库版本一致
- **处理**: 自动备份现有代码，支持版本回滚

### 2. 版本管理模块
- **功能**: 切换到指定版本标签 (v4.3)
- **影响**: 确保部署特定版本，避免不稳定代码
- **特性**: 支持标签优先，降级到main分支

### 3. 文件权限模块
- **功能**: 自动设置正确的文件权限
- **影响**: 确保web服务器能够访问文件
- **配置**:
  - 项目文件: www:www 或 nginx:nginx
  - 脚本文件: 可执行权限

### 4. 备份恢复模块
- **功能**: 同步前自动备份现有项目
- **影响**: 提供快速回滚能力，降低同步风险
- **位置**: `/www/backup/日期时间_sync_backup/`

---

## 📊 同步后验证

### 1. 检查文件同步状态
```bash
# 进入项目目录
cd /www/wwwroot/stock-tracker

# 查看当前版本
git log -1 --oneline

# 验证关键文件
ls -la baota-deploy.sh server-env-check.sh
ls -la src/components/StockTracker.tsx
```

### 2. 验证部署脚本
```bash
# 检查部署脚本权限
ls -la *.sh

# 测试环境检测脚本
./server-env-check.sh
```

### 3. 检查应用状态
```bash
# 查看PM2进程
pm2 status

# 检查应用访问
curl -I https://stock-tracker.yushuo.click
```

---

## 🐛 常见问题排查

### 问题1: Git权限错误
**症状**: `Permission denied (publickey)`
**解决**:
```bash
# 使用HTTPS而非SSH
git remote set-url origin https://github.com/yushuo1991/911.git
```

### 问题2: 文件权限问题
**症状**: 应用无法访问文件
**解决**:
```bash
# 重新设置权限
chown -R www:www /www/wwwroot/stock-tracker
find /www/wwwroot/stock-tracker -name "*.sh" -exec chmod +x {} \;
```

### 问题3: 版本冲突
**症状**: Git无法切换版本
**解决**:
```bash
# 强制重置到目标版本
git fetch --tags
git reset --hard v4.3
```

### 问题4: 依赖问题
**症状**: 应用启动失败，依赖缺失
**解决**:
```bash
# 重新安装依赖
npm install
npm run build
pm2 restart stock-tracker-v42
```

---

## 🔄 回滚方案

### 快速回滚到同步前状态
```bash
# 查找备份目录
ls -la /www/backup/ | grep sync_backup

# 恢复备份（替换为实际备份目录名）
BACKUP_DIR="/www/backup/20250926_123456_sync_backup"
cd /www/wwwroot/yushuo.click/
rm -rf cc
cp -r $BACKUP_DIR/cc ./

# 重启应用
pm2 restart stock-tracker-v42
```

### 回滚到特定版本
```bash
cd /www/wwwroot/stock-tracker
git checkout v4.2
git reset --hard v4.2
npm run build
pm2 restart stock-tracker-v42
```

---

## 📈 部署流程优化建议

### 1. 自动化改进
- 考虑配置SSH密钥免密码访问
- 设置定时同步任务 (crontab)
- 集成宝塔面板webhook功能

### 2. 监控告警
- 配置应用监控告警
- 设置磁盘空间监控
- 日志自动轮转配置

### 3. 性能优化
- 启用Nginx静态文件缓存
- 配置CDN加速静态资源
- 数据库定期清理优化

---

## 📞 同步完成检查清单

同步完成后，请确认以下项目：

- [ ] Git版本已切换到v4.3
- [ ] 关键文件存在且完整
- [ ] 部署脚本具有执行权限
- [ ] PM2进程运行正常
- [ ] 网站https://stock-tracker.yushuo.click可正常访问
- [ ] 应用功能测试通过
- [ ] 日志记录正常

---

**🎉 同步完成后，您的服务器将运行v4.3版本的完整部署方案！**