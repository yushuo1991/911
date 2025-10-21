# 📸 分时图快照功能 - 快速开始

## 🚀 一键部署

### 1. 数据库初始化
```bash
# SSH登录服务器
ssh root@107.173.154.147

# 进入项目目录
cd /www/wwwroot/stock-tracker

# 执行SQL初始化
mysql -u stock_user -p stock_tracker < init-minute-snapshots.sql
# 密码: stock_password_2025
```

### 2. 配置定时任务
```bash
# 添加定时任务（每天15:00执行）
crontab -e

# 添加以下行
0 15 * * 1-5 curl -X POST http://localhost:3002/api/snapshot-scheduler -H "Authorization: Bearer default-secure-token" >> /var/log/minute-snapshot.log 2>&1
```

### 3. 手动测试（可选）
```bash
# 立即执行一次快照采集
curl -X POST http://localhost:3002/api/snapshot-scheduler \
  -H "Authorization: Bearer default-secure-token"
```

---

## 💡 使用方法

### 在界面上使用

#### 步骤1: 打开板块详情
访问 http://bk.yushuo.click，点击任意板块

#### 步骤2: 查看分时图
- 点击 **[📊 今日分时]** → 查看实时分时图
- 点击 **[📷 当日分时]** → 查看历史快照

#### 步骤3: 批量查看
在分时图批量展示窗口，可以一键切换所有分时图的显示模式

---

## 🔍 验证部署

### 检查1: 数据库表
```sql
SHOW TABLES LIKE 'minute_chart_snapshots';
```

### 检查2: 测试API
```bash
# 保存快照
curl -X POST http://localhost:3002/api/minute-snapshot \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-21",
    "stocks": [{"code": "600000", "name": "浦发银行"}]
  }'

# 读取快照
curl http://localhost:3002/api/minute-snapshot?date=2025-10-21&code=600000 > test.gif

# 查看文件
file test.gif
# 应输出: test.gif: GIF image data...
```

### 检查3: 定时任务
```bash
# 查看cron日志
tail -f /var/log/minute-snapshot.log

# 检查采集的文件
ls -lh /www/wwwroot/stock-tracker/data/minute-snapshots/
```

---

## ❓ 常见问题

### Q1: 看不到"当日分时"按钮？
**A**: 清除浏览器缓存（Ctrl+Shift+R）

### Q2: 点击"当日分时"显示"暂无快照"？
**A**: 运行一次手动采集：
```bash
curl -X POST http://localhost:3002/api/snapshot-scheduler \
  -H "Authorization: Bearer default-secure-token"
```

### Q3: 定时任务不执行？
**A**: 检查cron服务：
```bash
systemctl status cron
systemctl start cron
```

---

## 📞 技术支持

- **完整文档**: 查看 `FEATURE-MINUTE-SNAPSHOT.md`
- **问题反馈**: 联系开发者

---

**部署时间**: < 5分钟  
**难度等级**: ⭐⭐☆☆☆  
**推荐度**: ⭐⭐⭐⭐⭐

