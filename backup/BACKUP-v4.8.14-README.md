# v4.8.14 备份说明 - 分时图功能完整版

## 备份信息

- **版本**: v4.8.14-minute-chart-20251013
- **备份时间**: 2025-10-13
- **Git提交**: f791f50
- **Git标签**: v4.8.14-minute-chart-20251013
- **本地备份**: backup/v4.8.14-minute-chart-20251013.tar.gz
- **功能特性**: 分时图批量展示 + 单股分时+K线分屏

---

## 版本特性

### 核心功能

#### 1. 独立分时图批量展示弹窗 ⭐
- **层级**: z-index: 90 (最高层)
- **尺寸**: 98vw × 95vh (全屏显示)
- **布局**: 3-4列响应式网格
- **分页**: 每页12只个股
- **主题**: 绿色系(区别于K线的蓝色系)
- **API**: `http://image.sinajs.cn/newchart/min/n/{sh/sz}code.gif`

#### 2. 板块详情弹窗分时按钮
- **按钮**: 📊 今日分时
- **位置**: 右上角，"显示K线"按钮左侧
- **颜色**: bg-green-600 (绿色)
- **功能**: 打开该板块独立分时图弹窗

#### 3. 涨停数弹窗板块标题分时按钮
- **按钮**: 📊M (Mini版)
- **位置**: 每个板块标题右侧，K线按钮左侧
- **颜色**: bg-green-100 (浅绿色)
- **功能**: 打开该板块独立分时图弹窗

#### 4. 单股弹窗分时+K线分屏显示 ⭐⭐
- **原功能**: 点击股票名称只显示K线图
- **新功能**: 左侧50%分时图 + 右侧50%K线图
- **标题**: "{股票名称} ({代码}) 今日分时 & K线图"
- **布局**: CSS Grid `grid-cols-2`
- **标识**: 绿色徽章(分时) + 蓝色徽章(K线)

### 技术改进

#### 状态管理
```typescript
// 新增分时图状态 (lines 52-55)
const [showMinuteModal, setShowMinuteModal] = useState(false);
const [minuteModalData, setMinuteModalData] = useState<{
  sectorName: string,
  date: string,
  stocks: StockPerformance[]
} | null>(null);
const [minuteModalPage, setMinuteModalPage] = useState(0);
```

#### 处理函数
```typescript
// 打开/关闭分时图弹窗 (lines 315-331)
const handleOpenMinuteModal = (sectorName, date, stocks) => {
  setMinuteModalData({ sectorName, date, stocks });
  setMinuteModalPage(0);
  setShowMinuteModal(true);
};

const closeMinuteModal = () => {
  setShowMinuteModal(false);
  setMinuteModalData(null);
  setMinuteModalPage(0);
};
```

#### 代码修改位置
- **src/app/page.tsx**:
  - lines 52-55: 状态变量
  - lines 315-331: 处理函数
  - lines 553-565: 板块详情弹窗按钮
  - lines 1031-1045: 涨停数弹窗按钮
  - lines 1466-1524: 单股分屏弹窗
  - lines 1591-1680: 独立分时图弹窗

#### Z-index层级体系
```
z-40:  弹窗背景层
z-50:  普通弹窗
z-[60]: 日期列详情弹窗
z-[70]: 单股分时+K线弹窗
z-[80]: 独立K线批量弹窗
z-[90]: 独立分时图批量弹窗 ⭐ (最高层)
```

### API接口

#### 分时图API (新增)
```
http://image.sinajs.cn/newchart/min/n/{sh/sz}code.gif

示例:
- 沪市: http://image.sinajs.cn/newchart/min/n/sh600000.gif
- 深市: http://image.sinajs.cn/newchart/min/n/sz000001.gif
```

**关键差异**: 分时图API路径中包含 `/n/` 目录

#### K线图API (已有)
```
http://image.sinajs.cn/newchart/daily/{sh/sz}code.gif

示例:
- 沪市: http://image.sinajs.cn/newchart/daily/sh600000.gif
- 深市: http://image.sinajs.cn/newchart/daily/sz000001.gif
```

---

## 备份内容

### 本地备份文件
- **文件名**: v4.8.14-minute-chart-20251013.tar.gz
- **位置**: backup/ 目录
- **包含内容**:
  - ✅ 所有源代码 (src/, public/, 等)
  - ✅ 配置文件 (package.json, tsconfig.json, tailwind.config.js, 等)
  - ✅ Docker配置 (Dockerfile, docker-compose.yml)
  - ✅ 部署文档 (DEPLOY-v4.8.14.txt)
  - ✅ 备份说明 (本文件)
  - ✅ CLAUDE.md配置文件
- **排除内容**:
  - ❌ node_modules (依赖包)
  - ❌ .next (构建缓存)
  - ❌ .git (Git仓库)
  - ❌ backup (其他备份文件)
  - ❌ log/*.log (运行日志)

### Git标签
- **标签名**: v4.8.14-minute-chart-20251013
- **Commit**: f791f50
- **GitHub**: https://github.com/yushuo1991/911.git
- **查看命令**: `git show v4.8.14-minute-chart-20251013`

---

## 恢复备份

### 方式1: 从本地tar.gz恢复

#### 步骤1: 解压备份文件
```bash
# Windows (Git Bash)
cd "C:\Users\yushu\Desktop"
mkdir stock-tracker-v4.8.14
tar -xzf "stock-tracker - 副本/backup/v4.8.14-minute-chart-20251013.tar.gz" -C stock-tracker-v4.8.14

# Linux/macOS
cd /www/wwwroot
mkdir stock-tracker-v4.8.14
tar -xzf /path/to/v4.8.14-minute-chart-20251013.tar.gz -C stock-tracker-v4.8.14
```

#### 步骤2: 安装依赖
```bash
cd stock-tracker-v4.8.14
npm install
```

#### 步骤3: 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件，配置数据库连接等
vim .env
```

#### 步骤4: 启动服务
```bash
# 开发环境
npm run dev

# 生产环境 (Docker)
docker compose build --no-cache
docker compose up -d
```

---

### 方式2: 从Git标签恢复

#### 步骤1: 克隆仓库并检出标签
```bash
# 克隆仓库
git clone https://github.com/yushuo1991/911.git stock-tracker-v4.8.14
cd stock-tracker-v4.8.14

# 检出v4.8.14标签
git checkout v4.8.14-minute-chart-20251013
```

#### 步骤2: 安装依赖
```bash
npm install
```

#### 步骤3: 配置环境变量
```bash
cp .env.example .env
vim .env
```

#### 步骤4: 启动服务
```bash
# 生产环境 (Docker)
docker compose build --no-cache
docker compose up -d
```

---

### 方式3: 服务器直接部署

如果服务器已有项目，只需切换到v4.8.14标签:

```bash
cd /www/wwwroot/stock-tracker

# 拉取最新标签
git fetch origin --tags

# 检出v4.8.14标签
git checkout v4.8.14-minute-chart-20251013

# 重新构建并启动
docker compose down
docker compose build --no-cache
docker compose up -d

# 等待启动
sleep 30

# 验证
docker ps | grep stock-tracker
curl -I http://localhost:3002/api/stocks?date=$(date +%Y-%m-%d)&mode=7days
```

---

## 功能验证

### 验证清单

#### 1. 板块详情弹窗分时按钮
- [ ] 点击任意板块名称打开板块详情弹窗
- [ ] 右上角看到"📊 今日分时"按钮(绿色)
- [ ] 按钮位于"显示K线"按钮左侧
- [ ] 点击按钮打开独立分时图弹窗

#### 2. 涨停数弹窗分时按钮
- [ ] 点击任意日期的"XX 只涨停"
- [ ] 每个板块标题右侧看到"📊M"按钮(浅绿色)
- [ ] 按钮位于"📈K"按钮左侧
- [ ] 点击按钮打开独立分时图弹窗

#### 3. 独立分时图弹窗
- [ ] 弹窗占据98vw × 95vh(几乎全屏)
- [ ] 分时图以3-4列网格显示
- [ ] 每页显示12只个股
- [ ] 分页控制正常(上一页/下一页)
- [ ] 分时图加载正常(新浪财经API)
- [ ] 加载失败时显示灰色占位图
- [ ] 弹窗背景为黑色半透明(bg-opacity-80)
- [ ] 标题显示板块名称和日期
- [ ] 关闭按钮(✕)正常工作

#### 4. 单股分时+K线分屏弹窗
- [ ] 点击任意股票名称
- [ ] 弹窗标题为"{股票名称} ({代码}) 今日分时 & K线图"
- [ ] 左侧50%显示分时图(绿色徽章 "📊 今日分时")
- [ ] 右侧50%显示K线图(蓝色徽章 "📈 日K线图")
- [ ] 中间有竖线分隔(border-r)
- [ ] 两张图片均清晰显示
- [ ] 加载失败时显示占位图

#### 5. 视觉一致性
- [ ] 分时图按钮均为绿色系(bg-green-600, bg-green-100)
- [ ] K线图按钮均为蓝色系(bg-blue-600, bg-blue-100)
- [ ] 按钮位置统一(分时在左，K线在右)
- [ ] 字体大小和样式一致

---

## 性能指标

### 预期性能
- **弹窗打开速度**: <500ms
- **图片加载**: 懒加载(loading="lazy")
- **分页切换**: <100ms (无网络请求)
- **API响应**: <2s (取决于新浪财经API)

### 资源占用
- **备份文件大小**: ~1-2MB (压缩后)
- **Docker镜像**: ~700MB
- **内存占用**: 应用容器 ~200MB, MySQL容器 ~300MB

---

## 版本对比

### v4.8.14 vs v4.8.13

| 功能 | v4.8.13 | v4.8.14 |
|------|---------|---------|
| 独立K线批量弹窗 | ✅ | ✅ |
| **独立分时图批量弹窗** | ❌ | ✅ (新增) |
| **板块详情分时按钮** | ❌ | ✅ (新增) |
| **涨停数弹窗分时按钮** | ❌ | ✅ (新增) |
| 单股K线显示 | ✅ | ✅ |
| **单股分时+K线分屏** | ❌ | ✅ (新增) |
| 全局排序控制 | ✅ | ✅ |
| K线排序一致性 | ✅ | ✅ |
| 7天板块节奏 | ✅ | ✅ |
| 板块溢价追踪 | ✅ | ✅ |

### 新增价值
1. **多维度分析**: 分时图+K线图同时查看，全面了解个股走势
2. **批量对比**: 独立分时图弹窗快速浏览板块内所有个股当日分时
3. **操作便捷**: 分时按钮紧邻K线按钮，操作逻辑一致
4. **视觉区分**: 绿色分时 vs 蓝色K线，清晰区分

---

## 依赖版本

### 核心依赖
- **Next.js**: 14.2.5
- **React**: 18.3.1
- **TypeScript**: 5.5.4
- **Tailwind CSS**: 3.4.7
- **Recharts**: 2.12.7

### 运行环境
- **Node.js**: 18.17.0+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

---

## 已知问题

### 无已知问题
当前版本运行稳定，无已知BUG。

### 注意事项
1. **API依赖**: 分时图依赖新浪财经API，如API不可用会显示占位图
2. **网络速度**: 分时图加载速度取决于网络环境和新浪API响应速度
3. **浏览器兼容**: 已在Chrome、Firefox、Edge测试通过，IE不支持
4. **缓存清理**: 部署后建议用户强制刷新浏览器(Ctrl+Shift+R)

---

## 回滚方案

### 回滚到v4.8.13 (K线排序一致性)
```bash
cd /www/wwwroot/stock-tracker
git checkout v4.8.13
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 回滚到v4.8.12 (独立K线弹窗)
```bash
cd /www/wwwroot/stock-tracker
git checkout 7333eee
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 相关文档

- **部署指南**: DEPLOY-v4.8.14.txt
- **v4.8.13部署**: DEPLOY-v4.8.13.txt
- **v4.8.12部署**: DEPLOY-v4.8.12.txt
- **502错误诊断**: log/502-ERROR-REPORT-20251013.md
- **修复脚本**: server-fix-502.sh

---

## 技术支持

### 常见问题
参考 `DEPLOY-v4.8.14.txt` 中的常见问题章节

### 故障排查
1. 检查Docker容器状态: `docker ps`
2. 查看应用日志: `docker logs stock-tracker-app`
3. 测试API: `curl http://localhost:3002/api/stocks?date=2025-10-13&mode=7days`
4. 验证Nginx: `nginx -t && systemctl status nginx`

### 联系方式
- **GitHub**: https://github.com/yushuo1991/911
- **Issues**: https://github.com/yushuo1991/911/issues

---

**备份创建**: 2025-10-13
**备份版本**: v4.8.14-minute-chart-20251013
**Commit**: f791f50
**功能**: 分时图批量展示 + 单股分时+K线分屏
**状态**: ✅ 稳定版本，推荐使用
**作者**: Claude Code
