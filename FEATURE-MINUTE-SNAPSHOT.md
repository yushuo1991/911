# 📸 分时图快照功能 v4.22.0

## 🎯 功能概述

新增**"当日分时"**功能，可以查看历史任何一天的分时图快照，不再局限于只能看当天实时分时图。

---

## ✨ 核心特性

### 1️⃣ 自动快照采集
- ⏰ **定时任务**: 每天 15:00 自动执行
- 📊 **采集对象**: 当天所有涨停股票
- 💾 **存储方式**: 文件系统 + 数据库索引
- 🗑️ **自动清理**: 保留最近14天，超期自动删除

### 2️⃣ 双模式切换
- 📊 **今日分时**: 实时从新浪财经API获取
- 📷 **当日分时**: 从数据库读取历史快照
- 🔄 **一键切换**: 界面上随时可切换查看

### 3️⃣ 全面覆盖
在所有显示分时图的位置都支持：
- ✅ 板块详情弹窗
- ✅ 分时图批量展示弹窗
- ✅ 个股详情弹窗

---

## 🏗️ 技术架构

### 数据库设计
```sql
CREATE TABLE minute_chart_snapshots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trade_date DATE NOT NULL,           -- 交易日期
  stock_code VARCHAR(10) NOT NULL,    -- 股票代码
  stock_name VARCHAR(50),             -- 股票名称
  file_path VARCHAR(255) NOT NULL,    -- 图片文件路径
  file_size INT,                      -- 文件大小
  created_at TIMESTAMP,               -- 创建时间
  INDEX idx_date_code (trade_date, stock_code),
  UNIQUE KEY uk_date_code (trade_date, stock_code)
);
```

### 文件存储结构
```
project_root/
└── data/
    └── minute-snapshots/
        ├── 2025-10-21/
        │   ├── 600000.gif
        │   ├── 600519.gif
        │   └── ...
        ├── 2025-10-22/
        │   └── ...
        └── ...
```

### API接口

#### 1. 读取分时图快照
```
GET /api/minute-snapshot?date=2025-10-21&code=600000
```

**响应**: 返回GIF图片数据

---

#### 2. 保存分时图快照
```
POST /api/minute-snapshot
Content-Type: application/json

{
  "date": "2025-10-21",
  "stocks": [
    { "code": "600000", "name": "浦发银行" },
    { "code": "600519", "name": "贵州茅台" }
  ]
}
```

**响应**:
```json
{
  "success": true,
  "message": "分时图快照保存完成",
  "data": {
    "total": 2,
    "success": 2,
    "failed": 0,
    "errors": []
  }
}
```

---

#### 3. 清理过期快照
```
DELETE /api/minute-snapshot
```

**功能**: 删除14天前的所有快照

**响应**:
```json
{
  "success": true,
  "message": "已清理 X 条超过14天的记录",
  "data": {
    "deletedRecords": 150,
    "deletedFiles": 150,
    "cutoffDate": "2025-10-07"
  }
}
```

---

#### 4. 定时任务调度
```
POST /api/snapshot-scheduler
Authorization: Bearer {SCHEDULER_TOKEN}
```

**功能**: 执行完整的快照采集流程
1. 获取当天涨停股票列表
2. 批量下载并保存分时图
3. 自动清理14天前的数据

**响应**:
```json
{
  "success": true,
  "message": "分时图快照定时任务完成",
  "data": {
    "date": "2025-10-21",
    "totalStocks": 85,
    "snapshotResults": {
      "total": 85,
      "success": 85,
      "failed": 0
    },
    "cleanupResults": {
      "deletedRecords": 120,
      "deletedFiles": 120
    }
  }
}
```

---

## 🎨 前端使用

### UI界面

#### 板块详情弹窗
```
┌──────────────────────────────────┐
│  福建板块 - 2025-10-21           │
│  [📊 今日分时] [📷 当日分时]     │
└──────────────────────────────────┘
```

#### 分时图批量展示
```
┌────────────────────────────────────────────┐
│  📊 福建板块 - 今日分时图 (2025-10-21)    │
│  [📊 今日分时] [📷 当日分时]              │
│  ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │分时1│ │分时2│ │分时3│                  │
│  └─────┘ └─────┘ └─────┘                  │
└────────────────────────────────────────────┘
```

点击切换按钮后：
```
┌────────────────────────────────────────────┐
│  📷 福建板块 - 当日分时图 (2025-10-21)    │
│  [📊 今日分时] [📷 当日分时]              │
│  ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │快照1│ │快照2│ │快照3│                  │
│  └─────┘ └─────┘ └─────┘                  │
└────────────────────────────────────────────┘
```

### 状态管理
```typescript
const [minuteChartMode, setMinuteChartMode] = useState<'realtime' | 'snapshot'>('realtime');
```

### 图片URL生成
```typescript
function getMinuteChartUrl(stockCode: string, mode: 'realtime' | 'snapshot', date?: string): string {
  if (mode === 'snapshot' && date) {
    return `/api/minute-snapshot?date=${date}&code=${stockCode}`;
  } else {
    const codeFormat = getStockCodeFormat(stockCode);
    return `http://image.sinajs.cn/newchart/min/n/${codeFormat}.gif`;
  }
}
```

---

## ⚙️ 部署配置

### 1. 数据库初始化
```bash
# 在MySQL中执行
mysql -u root -p stock_tracker < init-minute-snapshots.sql
```

### 2. 创建数据目录
```bash
mkdir -p /www/wwwroot/stock-tracker/data/minute-snapshots
chown -R nextjs:nodejs /www/wwwroot/stock-tracker/data
```

### 3. 配置定时任务

#### 方式A: 系统Cron (推荐)
```bash
# 编辑crontab
crontab -e

# 添加任务：每个交易日15:00执行
0 15 * * 1-5 curl -X POST http://localhost:3002/api/snapshot-scheduler \
  -H "Authorization: Bearer default-secure-token" >> /var/log/minute-snapshot.log 2>&1
```

#### 方式B: 手动触发
```bash
# 可以随时手动执行
curl -X POST http://localhost:3002/api/snapshot-scheduler \
  -H "Authorization: Bearer default-secure-token"
```

---

## 📊 数据统计

### 存储空间估算
- **单张分时图**: 约 20-50 KB
- **每天涨停股数**: 平均 80-150 只
- **每天存储**: 约 3-7 MB
- **14天存储**: 约 50-100 MB

### 性能指标
- **单次采集时间**: 2-5 分钟 (取决于涨停股数量)
- **API响应时间**: < 100ms
- **图片加载时间**: < 500ms

---

## 🔧 维护管理

### 手动清理
```bash
# 清理14天前的快照
curl -X DELETE http://localhost:3002/api/minute-snapshot
```

### 查看存储使用
```bash
du -sh /www/wwwroot/stock-tracker/data/minute-snapshots/
```

### 数据库维护
```sql
-- 查看快照统计
SELECT 
  trade_date, 
  COUNT(*) as stock_count,
  SUM(file_size)/1024/1024 as total_mb
FROM minute_chart_snapshots
GROUP BY trade_date
ORDER BY trade_date DESC
LIMIT 14;

-- 查看总数
SELECT COUNT(*) as total_snapshots FROM minute_chart_snapshots;

-- 清理指定日期
DELETE FROM minute_chart_snapshots WHERE trade_date < '2025-10-07';
```

---

## ⚠️ 注意事项

1. **存储空间**: 确保服务器有足够的磁盘空间（建议预留2GB）
2. **网络稳定**: 采集过程需要稳定的网络连接到新浪财经API
3. **时间设置**: 定时任务设置在15:00，确保股市已收盘
4. **权限配置**: 确保data目录有正确的读写权限
5. **备份策略**: 重要快照建议定期备份到云存储

---

## 🐛 故障排查

### 问题1: 快照显示"暂无当日快照"
**原因**: 数据库中没有该日期的快照
**解决**:
```bash
# 手动触发采集
curl -X POST http://localhost:3002/api/snapshot-scheduler \
  -H "Authorization: Bearer default-secure-token"
```

### 问题2: 定时任务未执行
**检查**:
```bash
# 查看cron日志
tail -f /var/log/minute-snapshot.log

# 检查cron服务
systemctl status cron
```

### 问题3: 存储空间不足
**清理**:
```bash
# 删除14天前的数据
curl -X DELETE http://localhost:3002/api/minute-snapshot

# 或手动删除
rm -rf /www/wwwroot/stock-tracker/data/minute-snapshots/2025-10-01
```

---

## 📝 更新日志

### v4.22.0 (2025-10-21)
- ✨ 新增分时图快照功能
- ✨ 新增"当日分时"按钮
- ✨ 新增自动定时采集任务
- ✨ 新增自动清理过期数据
- ✨ 新增快照API接口
- 🎨 优化分时图展示界面
- 📚 完善功能文档

---

## 👥 开发团队
- **功能设计**: yushu
- **后端开发**: yushu
- **前端开发**: yushu
- **测试**: yushu

---

**版本**: v4.22.0  
**更新时间**: 2025-10-21  
**文档版本**: 1.0

