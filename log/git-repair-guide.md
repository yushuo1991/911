# Git仓库损坏修复指南

## 问题诊断

您遇到的错误表明Git仓库存在对象损坏问题：

```
error: Could not read 29a5a7fa4ad3c1f626b4fbb5344585a7664d7ad2
fatal: unresolved deltas left after unpacking
fatal: unpack-objects failed
```

## 问题原因分析

### 技术模块影响

1. **Git对象存储模块**
   - 功能: 存储Git历史和文件对象
   - 问题: 特定对象文件损坏或缺失
   - 影响: 无法完成fetch/pull操作

2. **网络传输模块**
   - 功能: 从远程仓库获取数据
   - 问题: 传输中断导致delta对象不完整
   - 影响: unpack-objects失败

3. **文件系统模块**
   - 功能: 磁盘文件读写
   - 问题: 磁盘空间不足或文件系统错误
   - 影响: 对象文件无法正确写入

## 解决方案

### 方案一：使用专用修复脚本（推荐）

```bash
# 下载修复脚本
wget https://raw.githubusercontent.com/yushuo1991/911/main/git-repair.sh
chmod +x git-repair.sh

# 执行修复
sudo ./git-repair.sh
```

**修复脚本特性**：
- 自动诊断Git仓库完整性
- 智能备份重要文件
- 强制重新克隆损坏的仓库
- 浅克隆优化网络传输
- 自动权限修复

### 方案二：手动修复步骤

#### 1. 检查系统状态
```bash
# 检查磁盘空间
df -h /www/wwwroot/stock-tracker

# 检查内存使用
free -h

# 检查Git版本
git --version
```

#### 2. 备份重要文件
```bash
cd /www/wwwroot/stock-tracker
mkdir -p /www/backup/manual_backup_$(date +%Y%m%d)
cp -r *.sh *.json *.md src log data /www/backup/manual_backup_$(date +%Y%m%d)/ 2>/dev/null || true
```

#### 3. 清理损坏的Git仓库
```bash
cd /www/wwwroot/stock-tracker
rm -rf .git
rm -rf .git* 2>/dev/null || true
```

#### 4. 重新克隆仓库
```bash
# 初始化新仓库
git init
git remote add origin https://github.com/yushuo1991/911.git

# 浅克隆最新代码
git fetch --depth=1 origin main
git checkout -b main origin/main

# 获取特定版本
git fetch --depth=50 origin +refs/tags/v4.3:refs/tags/v4.3
git checkout v4.3
```

#### 5. 验证修复结果
```bash
git status
git log -1 --oneline
ls -la
```

### 方案三：完全重新部署

如果修复失败，可以完全重新部署：

```bash
# 删除整个项目目录
rm -rf /www/wwwroot/stock-tracker

# 重新创建并克隆
mkdir -p /www/wwwroot/stock-tracker
cd /www/wwwroot/stock-tracker
git clone https://github.com/yushuo1991/911.git .
git checkout v4.3

# 重新部署应用
./baota-deploy.sh
```

## 预防措施

### 1. 定期备份
```bash
# 创建定时备份脚本
cat > /usr/local/bin/backup-stock-tracker.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/www/backup/$(date +%Y%m%d_%H%M%S)_auto_backup"
mkdir -p "$BACKUP_DIR"
cp -r /www/wwwroot/stock-tracker "$BACKUP_DIR/"
find /www/backup -name "*auto_backup" -mtime +7 -exec rm -rf {} \;
EOF

chmod +x /usr/local/bin/backup-stock-tracker.sh

# 设置每日备份
echo "0 2 * * * /usr/local/bin/backup-stock-tracker.sh" | crontab -
```

### 2. 磁盘空间监控
```bash
# 添加磁盘空间检查到同步脚本
df -h | grep -E "9[0-9]%|100%" && echo "警告：磁盘空间不足"
```

### 3. Git配置优化
```bash
# 配置Git以减少损坏风险
git config --global core.preloadindex true
git config --global core.fscache true
git config --global gc.auto 256
```

## 故障排除

### 问题1：修复脚本无法下载
**解决方案**：
```bash
# 手动创建修复脚本
cat > git-repair.sh << 'EOF'
# [脚本内容见git-repair.sh文件]
EOF
chmod +x git-repair.sh
```

### 问题2：网络连接问题
**解决方案**：
```bash
# 测试GitHub连接
curl -I https://github.com

# 使用国内镜像（如果需要）
git config --global url."https://gitee.com/".insteadOf "https://github.com/"
```

### 问题3：权限问题
**解决方案**：
```bash
# 确保使用root权限
sudo su -

# 修复文件权限
chown -R www:www /www/wwwroot/stock-tracker
find /www/wwwroot/stock-tracker -name "*.sh" -exec chmod +x {} \;
```

### 问题4：磁盘空间不足
**解决方案**：
```bash
# 清理临时文件
rm -rf /tmp/*
find /var/log -name "*.log" -mtime +7 -delete

# 清理Git缓存
cd /www/wwwroot/stock-tracker
git gc --aggressive --prune=now
```

## 技术原理

### Git对象损坏的原因
1. **磁盘I/O错误**：硬盘坏道或文件系统错误
2. **网络中断**：下载过程中断导致文件不完整
3. **内存不足**：系统内存不足导致写入失败
4. **并发操作**：多个Git操作同时进行造成冲突

### 修复策略
1. **完整性检查**：使用`git fsck`检测损坏
2. **增量修复**：尝试修复而非重建
3. **浅克隆**：减少网络传输，提高成功率
4. **备份策略**：确保数据安全

## 监控和维护

### 定期健康检查
```bash
# 检查Git仓库健康状态
git fsck --full

# 检查磁盘使用情况
df -h /www/wwwroot/stock-tracker

# 检查应用运行状态
pm2 status stock-tracker-v42
```

### 日志监控
```bash
# 查看修复日志
tail -f /tmp/git_repair_*.log

# 查看应用日志
tail -f /www/wwwroot/stock-tracker/log/app.log
```

---

**推荐执行步骤**：
1. 先尝试自动修复脚本：`./git-repair.sh`
2. 如果失败，使用手动修复步骤
3. 最后选择完全重新部署

修复完成后记得测试应用功能：`curl https://bk.yushuo.click`