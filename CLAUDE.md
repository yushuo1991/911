- 默认使用多agent解决问题，以便能够更高效快速的实现效果
- 我的每一次提示词需要写入read me.txt中

# 项目备份记录

## v4.8.14-minute-chart-20251013 (当前稳定版本 - 分时图完整版) ⭐

### 备份信息
- **备份时间**: 2025-10-13
- **版本标签**: v4.8.14-minute-chart-20251013
- **Git提交**: f791f50
- **备注**: 分时图批量展示 + 单股分时+K线分屏
- **本地备份**: backup/v4.8.14-minute-chart-20251013.tar.gz
- **GitHub标签**: https://github.com/yushuo1991/911/releases/tag/v4.8.14-minute-chart-20251013

### 核心功能
- ✅ 独立分时图批量展示弹窗（z-index: 90，最高层）
- ✅ 板块详情弹窗分时按钮（📊 今日分时，绿色主题）
- ✅ 涨停数弹窗板块标题分时按钮（📊M）
- ✅ 单股弹窗分时+K线左右分屏显示（50%+50%）
- ✅ 独立K线批量展示弹窗（v4.8.12继承）
- ✅ 全局排序模式控制（连板/涨幅排序）
- ✅ 7天板块节奏分析
- ✅ 个股后续5天溢价追踪

### 技术特性
- 分时图API: `http://image.sinajs.cn/newchart/min/n/{sh/sz}code.gif`（注意 `/n/` 路径）
- K线图API: `http://image.sinajs.cn/newchart/daily/{sh/sz}code.gif`
- 98vw × 95vh 全屏弹窗
- 3-4列响应式网格布局
- 每页12只个股分页展示
- 绿色主题分时图 vs 蓝色主题K线图
- 懒加载 + 图片占位处理
- 排序联动（与全局排序模式一致）

### 性能指标
- 弹窗打开速度: <500ms
- API响应时间: <2s（取决于新浪API）
- 图片懒加载: loading="lazy"
- 分页切换: <100ms
- 备份文件: ~1-2MB (压缩后)

### 下载备份到本地
```bash
# 方式1: 从本地解压
cd "C:\Users\yushu\Desktop\stock-tracker - 副本"
tar -xzf "backup/v4.8.14-minute-chart-20251013.tar.gz" -C ../stock-tracker-v4.8.14

# 方式2: 从GitHub克隆（标签推送成功后）
git clone --branch v4.8.14-minute-chart-20251013 https://github.com/yushuo1991/911.git stock-tracker-v4.8.14
```

### 恢复到服务器
```bash
cd /www/wwwroot/stock-tracker
git fetch origin --tags
git checkout v4.8.14-minute-chart-20251013
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 详细文档
- 完整备份说明: `backup/BACKUP-v4.8.14-README.md`
- 部署指南: `DEPLOY-v4.8.14.txt`
- v4.8.13部署: `DEPLOY-v4.8.13.txt`（前置版本）

---

## v4.14-stable-20251002 (历史版本 - 10-2定稿)

### 备份信息
- **备份时间**: 2025-10-02 21:40
- **版本标签**: v4.14-stable-20251002
- **Git提交**: cffc6e8
- **备注**: 10-2定稿
- **本地备份**: backup/v4.14-stable-20251002-10-2定稿.tar.gz (992KB)
- **GitHub标签**: https://github.com/yushuo1991/911/releases/tag/v4.14-stable-20251002

### 核心功能
- ✅ Tushare交易日历集成（自动过滤节假日）
- ✅ 全局排序模式控制（连板/涨幅排序）
- ✅ 涨停数弹窗状态列（显示连板数）
- ✅ 7天板块节奏分析
- ✅ 个股后续5天溢价追踪
- ✅ 板块强度排行榜（Top 5）

### 重要修复
- 🐛 修复国庆节等节假日错误显示问题（v4.14）
- 🐛 修复涨停数弹窗缺少状态列问题（v4.12）
- 🐛 修复排序模式需在弹窗中切换的问题（v4.13）
- 🐛 修复"首板"显示不统一问题（v4.12.1）

### 技术升级
- 集成Tushare trade_cal API（真实交易日历）
- 智能缓存系统（4小时）
- 频率控制（60次/分钟）
- 降级策略（API失败时使用周末过滤）

### 性能指标
- API响应时间: <500ms
- 缓存命中率: >80%
- 页面加载: <2s
- Tushare调用频率: <60次/分钟

### 下载备份到本地
```bash
# 方式1: 从本地解压
cd "C:\Users\yushu\Desktop\stock-tracker - 副本"
tar -xzf "backup/v4.14-stable-20251002-10-2定稿.tar.gz" -C ../stock-tracker-v4.14

# 方式2: 从GitHub克隆
git clone --branch v4.14-stable-20251002 https://github.com/yushuo1991/911.git stock-tracker-v4.14
```

### 恢复到服务器
```bash
cd /www/wwwroot/stock-tracker
git pull origin main
# 或检出特定标签
git checkout v4.14-stable-20251002
docker compose build --no-cache
docker compose up -d
```

### 详细文档
- 完整备份说明: `BACKUP-v4.14-README.md`
- v4.14修复报告: `log/trading-day-holiday-fix-20251002.md`
- 状态列诊断: `log/stock-count-modal-status-column-diagnosis-20251002.md`

---

## v4.2-stable-20250930 (历史版本)

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
| v4.8.14-minute-chart-20251013 | 2025-10-13 | 分时图批量展示+单股分屏 | backup/v4.8.14-minute-chart-20251013.tar.gz |
| v4.14-stable-20251002 | 2025-10-02 | 10-2定稿，Tushare交易日历 | backup/v4.14-stable-20251002-10-2定稿.tar.gz |
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