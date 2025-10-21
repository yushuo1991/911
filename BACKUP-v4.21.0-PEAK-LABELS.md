# 📦 版本备份：v4.21.0 - 图表峰值标签功能

## 📅 备份信息
- **版本号**: v4.21.0
- **备份时间**: 2025年10月21日 12:56
- **备份文件**: `backup/v4.21.0-peak-labels-20251021.tar.gz`
- **Git提交**: cd2f8fc

## ✨ 本版本更新内容

### 1️⃣ 7天涨停排行图表峰值标签
**功能描述**：
- 点击"🏆 7天涨停排行"按钮后，图表会在每个交易日的最高值处显示板块名称
- 自动识别每日涨停数最高的板块
- 标签使用与曲线相同的颜色，11px字体，加粗显示

**实现位置**：
- 文件：`src/app/page.tsx`
- 行数：1549-1596
- 核心逻辑：遍历7天数据，计算每天的峰值，只在峰值点显示标签

### 2️⃣ 日期模态框图表峰值标签
**功能描述**：
- 点击日期卡片后，板块溢价图会在每天的最高值处显示板块名称
- 计算后续5日内每天的最大平均溢价值
- 在最高值板块上方显示标签
- 与7天排行图使用相同的视觉样式

**实现位置**：
- 文件：`src/app/page.tsx`
- 行数：1096-1145
- 核心逻辑：计算每日最大溢价值，在峰值板块显示标签

## 🎨 技术实现细节

### 标签样式统一
```typescript
<text
  x={props.x}
  y={props.y - 10}
  textAnchor="middle"
  fill={colors[index]}
  fontSize={11}
  fontWeight="bold"
>
  {sectorName}
</text>
```

### 峰值计算逻辑
1. 遍历当前日期所有板块的数值
2. 找出最大值及对应板块名称
3. 处理多个板块同时达到峰值的情况
4. 只在峰值点渲染标签，避免图表拥挤

## 📊 部署记录

### 部署方式
- **方式**: Docker容器化部署
- **容器名**: stock-tracker-app
- **端口映射**: 3002:3000
- **数据库**: MySQL 8.0 (独立容器)

### 部署命令
```bash
git add src/app/page.tsx
git commit -m "feat: 添加图表峰值标签功能"
git push origin main
npm run deploy
```

### 部署耗时
- Git拉取: 2秒
- Docker构建: ~10分钟
- 容器启动: 20秒
- **总耗时**: 约10分43秒

## 🌐 访问地址
- **生产环境**: http://bk.yushuo.click
- **服务器IP**: 107.173.154.147
- **项目路径**: /www/wwwroot/stock-tracker

## 🔄 回滚方案

### 如需回滚到 v4.20.1
```bash
# 方式1: Git回滚
cd /www/wwwroot/stock-tracker
git log --oneline -10  # 查看提交历史
git reset --hard f34276f  # 回滚到v4.20.1的提交
docker compose down
docker compose build
docker compose up -d

# 方式2: 使用备份
cd /www/wwwroot
tar -xzf backup/v4.20.1-xxx.tar.gz
cd stock-tracker
docker compose down
docker compose build
docker compose up -d
```

## ✅ 测试清单

- [x] 7天排行图表峰值标签显示正确
- [x] 日期模态框图表峰值标签显示正确
- [x] 标签颜色与曲线匹配
- [x] 标签位置准确（峰值点上方10px）
- [x] 多峰值情况处理正确
- [x] 无linter错误
- [x] 容器健康检查通过
- [x] 生产环境访问正常

## 📝 相关文件

### 修改的文件
- `src/app/page.tsx` - 主要功能实现

### 配置文件
- `package.json` - 版本号更新
- `docker-compose.yml` - Docker配置
- `Dockerfile` - 镜像构建

### 部署脚本
- `deploy-v4.8.25-auto.js` - SSH自动部署

## 🐛 已知问题
- 无

## 📌 备注
- 本次更新为功能增强，不涉及破坏性变更
- 向后兼容所有v4.20.x版本
- 建议在使用前按 Ctrl+Shift+R 强制刷新浏览器缓存

## 👤 开发者
- **开发**: yushu
- **提交**: cd2f8fc
- **日期**: 2025-10-21

---

**备份状态**: ✅ 已完成
**部署状态**: ✅ 生产环境运行中
**文档版本**: 1.0

