# 🔒 完整备份操作指南

## 🎯 快速开始 - 一键备份

请在SSH终端执行以下命令：

```bash
# 1. 进入项目目录
cd /www/wwwroot/stock-tracker

# 2. 创建备份脚本（复制backup-current-version.sh的内容）
# 或者从本地上传已创建的脚本

# 3. 赋予执行权限
chmod +x backup-current-version.sh

# 4. 执行备份
./backup-current-version.sh
```

## 📦 备份内容

自动备份脚本会创建以下完整备份：

| 类别 | 内容 | 说明 |
|------|------|------|
| **Git代码** | 完整源代码 + 版本标签 | tar.gz格式，含所有文件 |
| **Docker镜像** | 应用镜像 + MySQL镜像 | 约1-2GB，包含所有依赖 |
| **数据库** | 完整数据 + 结构 | gzip压缩SQL，含触发器 |
| **Nginx配置** | 反向代理配置 + 日志 | 可直接恢复使用 |
| **应用日志** | 最近1000行日志 | 用于问题排查 |
| **环境信息** | 系统配置 + 容器状态 | 记录运行环境 |
| **恢复脚本** | 自动恢复脚本 | 一键恢复功能 |

## 📍 备份位置

备份文件保存在：
```
/www/backup/stock-tracker/
├── backup_20250930_120230/          # 备份目录
│   ├── code/                        # 代码备份
│   ├── docker/                      # Docker备份
│   ├── database/                    # 数据库备份
│   ├── nginx/                       # Nginx配置
│   ├── logs/                        # 日志备份
│   ├── restore.sh                   # 恢复脚本
│   └── BACKUP-REPORT.txt           # 备份报告
└── stock-tracker-backup-20250930_120230.tar.gz  # 压缩包
```

## 💾 下载备份到本地

### 方法1: SCP命令（推荐）

在你的Windows本地执行：

```bash
# 下载完整备份包
scp root@yushuo.click:/www/backup/stock-tracker/stock-tracker-backup-*.tar.gz D:\Backups\

# 查看服务器备份文件列表
ssh root@yushuo.click "ls -lh /www/backup/stock-tracker/*.tar.gz"
```

### 方法2: WinSCP工具

1. 下载WinSCP: https://winscp.net/
2. 连接服务器：
   - 主机: yushuo.click
   - 端口: 22
   - 用户: root
   - 密码: gJ75hNHdy90TA4qGo9
3. 导航到 `/www/backup/stock-tracker/`
4. 拖拽下载压缩包

## 🔄 恢复备份

### 快速恢复

```bash
# 1. 解压备份
tar -xzf stock-tracker-backup-20250930_120230.tar.gz

# 2. 进入备份目录
cd backup_20250930_120230

# 3. 运行恢复脚本
chmod +x restore.sh
./restore.sh

# 4. 输入 YES 确认恢复
```

### 验证恢复

```bash
# 检查容器状态
docker compose ps

# 测试API
curl -I http://bk.yushuo.click/api/stocks?date=20250929&days=1

# 浏览器访问
# http://bk.yushuo.click
```

## ⏰ 设置自动备份

### 每日自动备份

```bash
# 编辑定时任务
crontab -e

# 添加以下内容（每天凌晨2点备份）
0 2 * * * /www/wwwroot/stock-tracker/backup-current-version.sh >> /var/log/backup.log 2>&1

# 保存退出（按ESC，输入:wq，回车）

# 查看定时任务
crontab -l
```

### 自动清理旧备份

```bash
# 添加清理任务（每周日凌晨3点，删除30天前的备份）
crontab -e

# 添加：
0 3 * * 0 find /www/backup/stock-tracker -name "*.tar.gz" -mtime +30 -delete
```

## 🏷️ Git版本管理

备份会自动创建Git标签：

```bash
# 查看所有版本标签
git tag -l

# 查看标签详情
git show v4.2-stable-20250930

# 回滚到特定版本
git checkout v4.2-stable-20250930

# 返回最新版本
git checkout main
```

## 📊 备份大小参考

| 项目 | 大小 | 说明 |
|------|------|------|
| 代码 | ~50MB | 压缩后 |
| 应用镜像 | ~500MB | 压缩后 |
| MySQL镜像 | ~200MB | 压缩后 |
| 数据库 | 10-100MB | 取决于数据量 |
| 配置+日志 | ~10MB | |
| **总计** | **~800MB-1GB** | 压缩包大小 |

## ✅ 备份检查清单

完成备份后验证：

```bash
# 1. 检查备份目录
ls -lh /www/backup/stock-tracker/

# 2. 查看备份报告
cat /www/backup/stock-tracker/backup_*/BACKUP-REPORT.txt

# 3. 验证压缩包完整性
tar -tzf /www/backup/stock-tracker/stock-tracker-backup-*.tar.gz | head -20

# 4. 检查Git标签
git tag -l | grep v4.2

# 5. 测试数据库备份
gunzip -t /www/backup/stock-tracker/backup_*/database/*.sql.gz
```

## 🆘 常见问题

### Q: 备份失败"空间不足"
```bash
# 检查磁盘空间
df -h

# 清理Docker缓存
docker system prune -a

# 删除旧备份
rm -f /www/backup/stock-tracker/stock-tracker-backup-2024*.tar.gz
```

### Q: Git标签冲突
```bash
# 删除旧标签
git tag -d v4.2-stable-20250930
git push origin :refs/tags/v4.2-stable-20250930

# 重新创建
git tag -a v4.2-stable-20250930 -m "Backup"
git push origin v4.2-stable-20250930
```

### Q: 数据库备份很大
```bash
# 正常情况：
# - 新系统: 1-10MB
# - 运行1月: 10-100MB
# - 运行1年: 100MB-1GB

# 压缩率通常: 70-90%
```

## 🔐 安全建议

1. **定期下载到本地**
   - 每周下载一次完整备份
   - 保存在外部硬盘或云存储

2. **加密敏感备份**
   ```bash
   # 使用密码加密
   zip -e -r backup-encrypted.zip backup_20250930_120230/
   ```

3. **限制访问权限**
   ```bash
   chmod 700 /www/backup/stock-tracker
   ```

4. **定期测试恢复**
   - 每月在测试环境测试恢复

---

## 📞 需要帮助？

- 备份脚本位置: `backup-current-version.sh`
- 备份存储位置: `/www/backup/stock-tracker/`
- 查看备份日志: `tail -f /var/log/backup.log`

---

**记住**: 数据无价，定期备份！ 🔒