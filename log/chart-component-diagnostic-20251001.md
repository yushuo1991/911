# v4.3 图表组件实现诊断报告

**诊断时间**: 2025-10-01
**诊断对象**: 服务器 /www/wwwroot/stock-tracker
**目标功能**: 板块点击分屏布局 + 溢价趋势图

---

## 一、组件文件检查结果

### ✅ 1. StockPremiumChart.tsx (完整存在)
**路径**: `/www/wwwroot/stock-tracker/src/components/StockPremiumChart.tsx`
**大小**: 9190 bytes
**状态**: ✅ 文件完整，功能齐全

**组件包含**:
- `StockPremiumChart` - 主图表组件 (个股5天溢价趋势)
- `SectorAverageTrend` - 板块平均溢价趋势组件
- `CustomTooltip` - 自定义Tooltip组件
- 完整的TypeScript类型定义

**核心功能**:
```typescript
- 数据转换: transformDataForChart()
- 日期格式化: formatDateForDisplay()
- 多股票折线图渲染
- 最多显示10只个股（可配置）
- 支持10种预设颜色
```

---

### ✅ 2. chartHelpers.ts (完整存在)
**路径**: `/www/wwwroot/stock-tracker/src/lib/chartHelpers.ts`
**大小**: 5829 bytes
**状态**: ✅ 文件完整，工具函数齐全

**工具函数包含**:
1. `transformSectorStocksToChartData()` - 板块个股数据转图表格式
2. `calculateSectorAverageTrend()` - 计算板块平均溢价趋势
3. `sortStocksByTotalReturn()` - 按累计溢价排序
4. `generateChartColors()` - 生成配色方案
5. `getTopPerformingStocks()` - 获取前N只表现最好的个股
6. `calculateSectorStats()` - 计算板块统计数据

---

### ✅ 3. page.tsx 集成情况
**路径**: `/www/wwwroot/stock-tracker/src/app/page.tsx`
**状态**: ✅ 已完整集成

**导入语句**:
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StockPremiumChart, { StockPremiumData } from '@/components/StockPremiumChart';
import { transformSectorStocksToChartData } from '@/lib/chartHelpers';
```

**关键功能**:
1. ✅ `handleSectorClick()` - 板块点击处理函数 (第86行)
2. ✅ `selectedSectorData` - 选中板块数据状态 (第29行)
3. ✅ `getSortedStocksForSector()` - 个股排序函数 (第323行)
4. ✅ 分屏布局实现 (第414-420行)

**分屏布局代码**:
```tsx
<div className="flex-1 flex gap-4 overflow-hidden">
  {/* 左侧：图表 40% */}
  <div className="w-2/5 border-r pr-4 overflow-auto">
    <StockPremiumChart
      data={transformSectorStocksToChartData(
        selectedSectorData.stocks,
        selectedSectorData.followUpData,
        10
      )}
    />
  </div>
  {/* 右侧：表格 60% */}
  <div className="w-3/5 overflow-auto">
    {/* 表格内容 */}
  </div>
</div>
```

---

## 二、数据流检查结果

### ✅ 数据流完整性
```
API响应 → 日期数据 → followUpData → handleSectorClick →
selectedSectorData → transformSectorStocksToChartData →
StockPremiumChart → 图表渲染
```

**数据结构**:
```typescript
followUpData: {
  [板块名称]: {
    [股票代码]: {
      [日期]: 溢价百分比
    }
  }
}
```

**示例**:
```javascript
followUpData = {
  "半导体": {
    "688396": {
      "2025-09-26": 5.32,
      "2025-09-27": 3.15,
      ...
    }
  }
}
```

---

## 三、依赖库检查结果

### ❌ 【关键问题】recharts库未打包到Docker容器

#### 问题分析

**1. package.json配置** ✅
```json
"recharts": "^3.2.1"
```
- 源代码目录已正确配置依赖

**2. 宿主机node_modules** ❌
```bash
ls /www/wwwroot/stock-tracker/node_modules/recharts
# 结果: 不存在
```

**3. Docker容器node_modules** ❌
```bash
docker exec stock-tracker-app ls /app/node_modules/
# 结果: 仅17个包，不包含recharts
```

**容器内实际安装的包**:
```
@next, @swc, busboy, caniuse-lite, client-only,
graceful-fs, nanoid, next, picocolors, react,
react-dom, scheduler, source-map-js, streamsearch,
styled-jsx
```

**4. 构建产物检查** ⚠️
```bash
grep -o 'recharts' /app/.next/server/app/page.js
# 结果: 找到3处recharts引用
```
- 说明代码已编译，但运行时缺少recharts库

---

## 四、根本原因分析

### 问题根源: **Dockerfile standalone模式打包不完整**

#### 当前Dockerfile配置:
```dockerfile
# 生产运行阶段
FROM base AS runner
ENV NODE_ENV=production

# 只复制standalone产物
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
```

#### 问题所在:
1. **standalone模式**: Next.js的standalone输出会自动分析依赖，但可能遗漏动态导入的库
2. **recharts为客户端库**: 通过`'use client'`导入，可能未被正确识别为必要依赖
3. **缺少完整node_modules**: 容器内只有17个核心包，缺少recharts及其依赖

---

## 五、影响范围

### 受影响的模块

1. **前端页面渲染** - ⚠️ 部分功能不可用
   - 板块点击弹窗可以打开
   - 图表组件无法渲染（缺少recharts）
   - 可能显示空白或报错

2. **用户体验** - ⚠️ 核心功能缺失
   - 无法查看个股5天溢价趋势图
   - 无法查看板块平均溢价趋势
   - 只能看到表格数据

3. **浏览器控制台** - ⚠️ 预计出现错误
   - `Module not found: Can't resolve 'recharts'`
   - 或者运行时导入错误

---

## 六、解决方案

### 🎯 方案1: 修复Dockerfile（推荐）

**修改Dockerfile，确保recharts被打包**:

```dockerfile
# ===================================
# 生产运行阶段
# ===================================
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

RUN mkdir -p /app/data /app/logs && \
    chown -R nextjs:nodejs /app

# 【关键修改】先复制完整的node_modules
COPY --from=builder /app/node_modules ./node_modules

# 然后复制其他文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
```

**部署步骤**:
```bash
# 1. 修改Dockerfile
vi /www/wwwroot/stock-tracker/Dockerfile

# 2. 重新构建镜像
cd /www/wwwroot/stock-tracker
docker build -t stock-tracker:v4.3-chart .

# 3. 停止并删除旧容器
docker stop stock-tracker-app
docker rm stock-tracker-app

# 4. 启动新容器
docker run -d \
  --name stock-tracker-app \
  -p 3000:3000 \
  -v /www/wwwroot/stock-tracker/data:/app/data \
  -v /www/wwwroot/stock-tracker/logs:/app/logs \
  --env-file /www/wwwroot/stock-tracker/.env \
  stock-tracker:v4.3-chart

# 5. 验证
docker exec stock-tracker-app ls /app/node_modules/ | grep recharts
```

---

### 🎯 方案2: 安装缺失依赖到容器（临时）

```bash
# 在运行中的容器内安装recharts
docker exec stock-tracker-app sh -c "npm install recharts@^3.2.1"

# 重启容器
docker restart stock-tracker-app
```

**⚠️ 警告**: 此方案仅临时有效，容器重建后会丢失

---

### 🎯 方案3: 禁用standalone模式（不推荐）

修改`next.config.js`:
```javascript
const nextConfig = {
  // output: 'standalone',  // 注释掉此行
  reactStrictMode: true,
  ...
}
```

**缺点**: 会大幅增加Docker镜像体积（从~200MB增至~1GB）

---

## 七、验证清单

部署完成后，请执行以下验证：

### 1. 容器内依赖检查
```bash
docker exec stock-tracker-app ls /app/node_modules/ | grep recharts
# 预期输出: recharts
```

### 2. 访问测试
```bash
curl http://localhost:3000
# 检查是否有JavaScript错误
```

### 3. 浏览器测试
1. 访问 http://bk.yushuo.click
2. 点击任意板块
3. 查看弹窗左侧是否显示图表
4. 打开浏览器控制台，检查是否有错误

### 4. 功能验证
- [ ] 板块点击弹窗正常打开
- [ ] 左侧显示折线图（个股5天溢价趋势）
- [ ] 右侧显示表格（个股详情）
- [ ] 图表可交互（hover显示详情）
- [ ] 无JavaScript报错

---

## 八、总结

### 组件实现状态: ✅ 代码完整

| 项目 | 状态 | 说明 |
|------|------|------|
| StockPremiumChart.tsx | ✅ | 9190字节，功能完整 |
| chartHelpers.ts | ✅ | 5829字节，工具齐全 |
| page.tsx集成 | ✅ | 分屏布局已实现 |
| 数据流 | ✅ | 从API到组件完整 |
| TypeScript类型 | ✅ | 类型定义完整 |

### 部署状态: ❌ 依赖缺失

| 项目 | 状态 | 说明 |
|------|------|------|
| package.json配置 | ✅ | recharts@^3.2.1 |
| 宿主机node_modules | ❌ | 未安装 |
| 容器node_modules | ❌ | 未打包 |
| Dockerfile配置 | ⚠️ | standalone模式遗漏 |

### 推荐操作: 执行方案1

**立即修复Dockerfile并重新部署**，确保recharts库正确打包到Docker容器中。

---

## 九、技术知识点

### 什么是Recharts？
- **定义**: 基于React的图表库，使用D3.js作为底层
- **功能**: 提供折线图、柱状图、饼图等多种图表组件
- **优势**: 组件化设计，与React完美集成，声明式API

### 什么是Next.js Standalone模式？
- **定义**: Next.js的输出模式，生成最小化的独立运行包
- **优势**: 减小Docker镜像体积，加快部署速度
- **原理**: 自动分析依赖，只打包运行时必需的文件
- **缺陷**: 可能遗漏动态导入或客户端库

### 为什么会缺少recharts？
1. **客户端组件标记**: `'use client'`可能导致依赖分析失败
2. **动态导入**: 部分导入可能未被识别为必要依赖
3. **Tree-shaking**: 未使用的导出被移除，但库本身被误判为未使用
4. **Standalone限制**: 该模式主要优化服务端渲染，对客户端库支持有限

### 解决后的影响
- **用户体验**: 可视化数据展示，趋势一目了然
- **数据分析**: 通过图表快速发现涨跌规律
- **交互性**: 悬停显示详细数据，提升专业感
- **性能**: recharts基于Canvas渲染，性能优异

---

**报告生成时间**: 2025-10-01
**下一步行动**: 执行方案1修复Dockerfile，重新部署
