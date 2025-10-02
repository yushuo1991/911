# handleSectorClick 函数深度分析报告

## 📊 问题现象
用户反馈："点击板块名称时数据不对"

## 🔍 代码分析位置
文件：`src/app/page.tsx` 第113-188行

## 🎯 功能定位
`handleSectorClick` 函数负责处理板块名称点击事件，显示单个板块的个股5日溢价表现弹窗。

## 📈 数据流分析

### 1. 函数入参分析
```typescript
const handleSectorClick = (
  date: string,              // 点击的日期
  sectorName: string,        // 板块名称
  stocks: StockPerformance[], // 该板块的个股数据
  followUpData: Record<string, Record<string, number>> // 溢价数据
)
```

### 2. 数据源获取
- **主数据源**: `sevenDaysData?.[date]` - 从全局状态获取指定日期的数据
- **辅助数据**: 传入参数的`stocks`和`followUpData`
- **日期范围**: `dates.slice(dateIndex + 1, dateIndex + 6)` - 后续5个交易日

### 3. 关键数据处理逻辑

#### A. 个股数据处理（第122-145行）
```typescript
const sectorStocks = stocks.map(stock => {
  // 🔥 问题点1: 使用的是传入参数的followUpData，但又从sevenDaysData重新获取
  const stockFollowUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
  const totalReturn = Object.values(stockFollowUpData).reduce((sum, val) => sum + val, 0);
  // ...构建chartData和其他数据
});
```

#### B. 板块图表数据构建（第154-175行）
```typescript
const sectorChartData = next5Days.map(nextDate => {
  const nextDayData = sevenDaysData?.[nextDate];
  // 🔥 问题点2: 重新从sevenDaysData获取数据，可能与传入参数不一致
  const nextDayStocks = nextDayData.categories[sectorName] || [];
  // ...计算溢价
});
```

#### C. 最终数据结构（第177-187行）
```typescript
const sectorData = [{
  sectorName,
  avgPremium: parseFloat(avgPremium.toFixed(2)),
  stockCount: sectorStocks.length,
  stocksData: sectorStocks,        // 🔥 问题点3: 这个字段名与其他函数不一致
  chartData: sectorChartData
}];

// 🔥 问题点4: 使用了错误的弹窗状态
setSelectedWeekdayData({ date, sectorData });
setShowWeekdayModal(true);
```

## 🆚 对比分析：与其他点击函数的差异

### 1. 与 `handleDateClick` 的差异
**handleDateClick（第190-260行）**:
- ✅ 正确使用 `setSelectedWeekdayData` 和 `setShowWeekdayModal`
- ✅ 数据结构一致，没有 `stocksData` 字段
- ✅ 逻辑清晰，数据流向明确

### 2. 与 `handleStockCountClick` 的差异
**handleStockCountClick（第262-335行）**:
- ✅ 使用专门的多窗口状态管理
- ✅ 数据处理逻辑与handleSectorClick类似但更完整
- ✅ 数据结构统一：`stocks` 字段而非 `stocksData`

## 🚨 问题根源定位

### 主要问题1: 数据来源混乱
- **传入参数** vs **重新获取**: 函数既接收了`stocks`和`followUpData`参数，又从`sevenDaysData`重新获取数据
- **数据不一致**: 传入的数据可能已经过滤或处理，而重新获取的是原始数据

### 主要问题2: 数据结构不统一
```typescript
// handleSectorClick 使用的结构
stocksData: sectorStocks,

// 其他函数使用的结构
stocks: sectorStocks,
```

### 主要问题3: 弹窗状态复用问题
- `handleSectorClick` 使用了 `setShowWeekdayModal`
- 但弹窗组件内部对单板块模式的判断基于 `selectedWeekdayData.sectorData.length === 1`
- 这种判断方式脆弱且容易出错

### 主要问题4: 日期计算逻辑重复
每个函数都有自己的日期计算逻辑，容易出现偏差：
```typescript
// 重复出现的模式
const dateIndex = dates.indexOf(date);
const next5Days = dates.slice(dateIndex + 1, dateIndex + 6);
```

## 🔧 解决方案建议

### 1. 统一数据来源
```typescript
// 建议：只使用传入参数，避免重新获取
const handleSectorClick = (date: string, sectorName: string, stocks: StockPerformance[], followUpData: Record<string, Record<string, number>>) => {
  // 直接使用传入的数据，不要重新从sevenDaysData获取
}
```

### 2. 统一数据结构
```typescript
// 统一使用 stocks 字段名
const sectorData = [{
  sectorName,
  avgPremium: parseFloat(avgPremium.toFixed(2)),
  stockCount: sectorStocks.length,
  stocks: sectorStocks,  // 改为 stocks
  chartData: sectorChartData
}];
```

### 3. 使用专门的弹窗状态
```typescript
// 建议为板块点击创建专门的状态
setSelectedSectorData({
  name: sectorName,
  date: date,
  stocks: sectorStocks,
  followUpData: followUpData
});
setShowSectorModal(true);
```

### 4. 提取公共函数
```typescript
// 提取日期计算逻辑
const getNext5TradingDays = (date: string) => {
  const dateIndex = dates.indexOf(date);
  return dates.slice(dateIndex + 1, dateIndex + 6);
};
```

## 📊 影响分析

### 数据一致性问题
- **溢价计算错误**: 由于数据来源混乱，可能导致溢价计算结果不准确
- **个股排序错误**: 排序基于错误的数据，导致个股排名不正确
- **图表显示异常**: chartData构建基于重新获取的数据，与显示的表格数据不匹配

### 用户体验问题
- **数据不对**: 用户点击板块看到的数据与预期不符
- **前后不一致**: 同一个板块在不同地方点击显示的数据可能不同
- **性能问题**: 重复获取和计算数据

## 🎯 修复优先级

1. **高优先级**: 统一数据来源，避免重复获取
2. **高优先级**: 修复数据结构不一致问题
3. **中优先级**: 优化弹窗状态管理
4. **低优先级**: 代码重构和性能优化

---

**结论**: `handleSectorClick`函数存在数据来源混乱、数据结构不统一、状态管理复用等多个问题，这些问题直接导致了"点击板块名称时数据不对"的现象。需要系统性修复以确保数据一致性和用户体验。