# 前端渲染诊断报告 - 页面不显示数据

**诊断时间**: 2025-10-01
**问题**: 页面中所有个股匹配相应日期的数据都不显示

---

## 🎯 问题根本原因

### **核心问题：日期格式不匹配导致数据查找失败**

后端 API 返回的 `followUpData` 使用 **YYYYMMDD 格式**（如 `"20250923"`），而前端在查询时使用的是 **YYYY-MM-DD 格式**（如 `"2025-09-23"`），导致数据查找永远失败。

---

## 📊 详细分析

### 1. 后端数据格式（route.ts）

**文件位置**: `src/app/api/stocks/route.ts`

#### 第796行 - 生成交易日（YYYYMMDD格式）
```typescript
// 获取该天后5个交易日（用于溢价计算）
const followUpDays = generateTradingDays(day, 5);
```

#### generateTradingDays函数（utils.ts 第134-165行）
```typescript
export function generateTradingDays(startDate: string, days: number = 5): string[] {
  // ...
  const dateStr = currentDate.getFullYear().toString() +
    (currentDate.getMonth() + 1).toString().padStart(2, '0') +
    currentDate.getDate().toString().padStart(2, '0');
  tradingDays.push(dateStr);  // ❌ 返回 "20250923" 格式
  // ...
}
```

**返回格式**: `["20250923", "20250924", "20250925", ...]`

#### 第806行 - 存储到followUpData
```typescript
const followUpPerformance = await getStockPerformance(stock.StockCode, followUpDays, day);
// ...
followUpData[category][stock.StockCode] = followUpPerformance;
// followUpPerformance 的 key 是 "20250923" 格式
```

**API 返回的数据结构**:
```json
{
  "data": {
    "2025-09-23": {
      "followUpData": {
        "板块名称": {
          "股票代码": {
            "20250924": 1.5,  // ❌ YYYYMMDD 格式
            "20250925": 2.3,
            "20250926": -0.8
          }
        }
      }
    }
  },
  "dates": ["2025-09-23", "2025-09-24", ...]  // ✅ YYYY-MM-DD 格式
}
```

---

### 2. 前端查询逻辑（page.tsx）

**文件位置**: `src/app/page.tsx`

#### 第551-561行 - 板块详情弹窗获取followUp日期
```typescript
// 使用dates数组确保日期正确排序
const currentDateIndex = dates.indexOf(selectedSectorData.date);
const followUpDates = currentDateIndex !== -1
  ? dates.slice(currentDateIndex + 1, currentDateIndex + 6)
  : [];
```

**dates数组格式**: `["2025-09-23", "2025-09-24", ...]` ✅ YYYY-MM-DD

#### 第570-589行 - 查询followUpData
```typescript
return followUpDates.map((followDate) => {
  let totalPremium = 0;
  let validCount = 0;
  selectedSectorData.stocks.forEach(stock => {
    const performance = selectedSectorData.followUpData[stock.code]?.[followDate];
    // ❌ followDate = "2025-09-24"
    // ❌ followUpData key = "20250924"
    // ❌ 结果: performance = undefined (永远找不到)

    if (performance !== undefined) {
      totalPremium += performance;
      validCount++;
    }
  });
  // ...
});
```

**匹配失败原因**:
- 查询 key: `"2025-09-24"` (YYYY-MM-DD)
- 数据 key: `"20250924"` (YYYYMMDD)
- 结果: `undefined` (找不到数据)

---

## 🔍 影响范围

### 受影响的功能模块

1. **板块详情弹窗** (handleSectorClick)
   - 第574行: 查询个股后续5天溢价数据
   - 第639-648行: 表格显示每日溢价数据

2. **日期点击弹窗** (handleDateClick)
   - 第130-135行: 查询板块平均溢价
   - 第846-851行: 表格显示每日数据

3. **涨停数弹窗** (handleStockCountClick)
   - 第168-169行: 计算个股累计溢价
   - 第959-968行: 表格显示后续5天数据

4. **星期几弹窗** (handleWeekdayClick)
   - 第209-210行: 计算板块平均溢价

5. **日期列详情弹窗** (handleDateColumnClick)
   - 第317-321行: 构建followUpData
   - 第1284-1293行: 表格显示后续5天数据

6. **主页板块卡片**
   - 第1484-1488行: 计算板块平均溢价显示

---

## 🛠️ 解决方案

### 方案A：修改后端统一使用 YYYY-MM-DD 格式（推荐）

**优势**:
- 符合前端 dates 数组格式
- 与 API 返回的 data 对象 key 格式一致
- 可读性更好
- 避免格式转换开销

**修改位置**: `src/lib/utils.ts` 第154-156行

```typescript
// 修改前
const dateStr = currentDate.getFullYear().toString() +
  (currentDate.getMonth() + 1).toString().padStart(2, '0') +
  currentDate.getDate().toString().padStart(2, '0');

// 修改后
const dateStr = currentDate.toISOString().split('T')[0];
// 返回 "2025-09-24" 格式
```

---

### 方案B：修改前端查询时转换格式

**缺点**:
- 需要在多个位置添加转换逻辑
- 增加运行时开销
- 代码可维护性差

**示例**:
```typescript
// 需要在所有查询位置添加转换
const formatToYYYYMMDD = (date: string) => date.replace(/-/g, '');
const performance = followUpData[stock.code]?.[formatToYYYYMMDD(followDate)];
```

---

## 📝 修复步骤（推荐方案A）

1. **修改 generateTradingDays 函数**
   - 文件: `src/lib/utils.ts`
   - 行数: 第154-156行
   - 修改: 使用 `toISOString().split('T')[0]` 返回 YYYY-MM-DD 格式

2. **清理缓存**
   - 删除数据库中的旧缓存数据（YYYYMMDD 格式）
   - 或等待2小时缓存自动过期

3. **测试验证**
   - 刷新页面重新获取数据
   - 点击板块查看详情弹窗
   - 确认溢价数据正常显示

---

## 🎓 技术学习点

### 问题模块：前端数据处理层

**根本原因**:
- **数据一致性问题** - 后端生成的数据 key 格式与前端查询格式不一致
- **接口契约未明确** - API 返回数据的日期格式没有统一规范

**影响**:
- 前端能正常加载数据，但无法正确显示具体数值
- 用户看到空白或0值数据

**解决思路**:
1. **统一数据格式** - 前后端使用相同的日期格式标准
2. **接口文档化** - 明确定义 API 返回数据的格式规范
3. **类型安全** - 使用 TypeScript 类型定义确保数据结构一致

### 调试技巧

1. **数据流追踪**
   - API 响应 → 状态存储 → 查询使用
   - 在每个环节打印数据格式

2. **关键断点**
   - `followUpData` 存储位置
   - 查询 `followUpData[key]` 的位置
   - 检查 key 格式是否一致

3. **控制台检查**
   ```javascript
   console.log('查询key:', followDate);
   console.log('数据keys:', Object.keys(followUpData[stock.code]));
   ```

---

## ✅ 验证清单

修复后需要验证以下功能：

- [ ] 主页板块卡片显示平均溢价数值
- [ ] 点击板块显示个股5天溢价表格
- [ ] 点击日期头部显示板块后续5天平均溢价
- [ ] 点击涨停数显示个股溢价表格
- [ ] 点击星期几显示板块平均溢价分析
- [ ] 点击7天阶梯日期列显示个股后续5天溢价

---

**诊断完成** ✅
