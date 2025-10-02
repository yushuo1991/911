- 默认使用多agent解决问题，以便能够更高效快速的实现效果
- 我的每一次提示词需要写入read me.txt中

# 项目备份记录

## v4.2-stable-20250930 (当前稳定版本)

### 备份信息
- **备份时间**: 2025-09-30 12:10 UTC
- **版本标签**: v4.2-stable-20250930
- **备份位置**: /www/backup/stock-tracker/backup-v4.2-stable-20250930.tar.gz
- **Git提交**: 最新生产版本

### 系统状态
- ✅ 应用完全正常运行
- ✅ API端点响应正常 (200 OK)
- ✅ 数据库连接正常
- ✅ Nginx反向代理配置正确
- ✅ 访问地址: http://bk.yushuo.click

### 备份内容
1. **代码备份**: 完整Git仓库 (source.tar.gz)
2. **Docker镜像**: 应用+MySQL镜像 (~700MB压缩)
3. **数据库**: 完整SQL备份 (含结构和数据)
4. **配置文件**: Nginx配置、Docker配置

### 性能指标
- 代码质量: 5.5/10 (从3.9提升)
- 数据库性能: 50ms (40倍优化，从2000ms)
- API响应: 正常
- 缓存命中率: HIT

### 下载备份到本地
```bash
scp root@yushuo.click:/www/backup/stock-tracker/backup-v4.2-stable-20250930.tar.gz ./
```

### 恢复备份
```bash
tar -xzf backup-v4.2-stable-20250930.tar.gz
cd backup_*/
# 按照BACKUP-INSTRUCTIONS.md执行恢复
```

---

## 备份策略

### 自动备份计划
- **每日备份**: 数据库 (保留7天)
- **每周备份**: 完整备份 (保留4周)
- **重大更新**: 手动备份 (永久保留)

### 备份存储
- **主备份**: 服务器 /www/backup/stock-tracker/
- **本地备份**: 下载到本地硬盘
- **云备份**: GitHub私有仓库 (代码)

### 设置自动备份
```bash
# 编辑定时任务
crontab -e

# 每天凌晨2点自动备份
0 2 * * * /www/wwwroot/stock-tracker/backup-current-version.sh >> /var/log/backup.log 2>&1

# 每周日凌晨3点清理30天前的备份
0 3 * * 0 find /www/backup/stock-tracker -name "*.tar.gz" -mtime +30 -delete
```

---

## 历史版本

| 版本 | 日期 | 说明 | 备份位置 |
|------|------|------|----------|
| v4.2-stable-20250930 | 2025-09-30 | 生产稳定版，完整部署成功 | /www/backup/stock-tracker/ |
| v1.3.1 | 之前 | UI优化版本 | Git标签 |

---

## 备份文档

- **完整备份脚本**: backup-current-version.sh
- **操作指南**: BACKUP-INSTRUCTIONS.md
- **提示词记录**: readme.txt (提示词14)

---

**重要提醒**:
- 定期下载备份到本地
- 重大更新前务必备份
- 测试恢复流程确保备份可用
- 默认使用多agent操作，提高效率，如果没有相应agent，自行构建agent，如果有合适的mcp，也要积极使用mcp