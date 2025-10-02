# handleSectorClick 问题修复方案

## 🎯 问题根源总结

通过深度分析，发现 `handleSectorClick` 函数存在以下关键问题：

### 1. **数据字段名不匹配** （🔥 主要问题）
```typescript
// handleSectorClick 创建的数据结构
stocksData: sectorStocks,

// 但弹窗组件期望的数据结构
const stocksData = (sector as any).stocksData || [];
```

弹窗组件在单板块模式下尝试访问 `stocksData` 字段，但其他函数都使用 `stocks` 字段。

### 2. **数据处理逻辑混乱**
- 既接收 `followUpData` 参数，又从 `sevenDaysData` 重新获取
- 可能导致数据不一致

### 3. **弹窗状态复用问题**
- 使用了通用的 `WeekdayModal`，依赖数组长度判断单板块模式
- 这种判断方式脆弱且容易出错

## 🔧 修复方案

### 方案1: 快速修复（推荐）
只修复数据字段名问题，保持现有架构：

```typescript
const handleSectorClick = (date: string, sectorName: string, stocks: StockPerformance[], followUpData: Record<string, Record<string, number>>) => {
  // ... 现有逻辑保持不变 ...

  // 🔧 修复：将 stocksData 改为 stocks
  const sectorData = [{
    sectorName,
    avgPremium: parseFloat(avgPremium.toFixed(2)),
    stockCount: sectorStocks.length,
    stocks: sectorStocks,  // ✅ 改为 stocks 而不是 stocksData
    chartData: sectorChartData
  }];

  setSelectedWeekdayData({ date, sectorData });
  setShowWeekdayModal(true);
};
```

### 方案2: 完整重构（最佳长期方案）
创建专门的板块点击处理逻辑：

```typescript
// 1. 添加新的状态
const [showSingleSectorModal, setShowSingleSectorModal] = useState(false);
const [selectedSingleSectorData, setSelectedSingleSectorData] = useState<{
  sectorName: string;
  date: string;
  stocks: StockPerformance[];
  chartData: any[];
} | null>(null);

// 2. 重写 handleSectorClick
const handleSectorClick = (date: string, sectorName: string, stocks: StockPerformance[], followUpData: Record<string, Record<string, number>>) => {
  // 直接使用传入的数据，避免重复获取
  const dateIndex = dates.indexOf(date);
  const next5Days = dates.slice(dateIndex + 1, dateIndex + 6);

  const processedStocks = stocks.map(stock => {
    const stockFollowUpData = followUpData[stock.code] || {};
    const totalReturn = Object.values(stockFollowUpData).reduce((sum, val) => sum + val, 0);

    // 构建个股图表数据
    const chartData = next5Days.map(nextDate => {
      const nextDayData = sevenDaysData?.[nextDate];
      const nextDayFollowUp = nextDayData?.followUpData[sectorName]?.[stock.code] || {};
      const dayValue = Object.values(nextDayFollowUp).reduce((sum, val) => sum + val, 0);
      return { date: nextDate, value: parseFloat(dayValue.toFixed(2)) };
    });

    return {
      ...stock,
      followUpData: stockFollowUpData,
      totalReturn: parseFloat(totalReturn.toFixed(2)),
      chartData: chartData
    };
  });

  // 按累计溢价排序
  processedStocks.sort((a, b) => b.totalReturn - a.totalReturn);

  setSelectedSingleSectorData({
    sectorName,
    date,
    stocks: processedStocks,
    chartData: [] // 如需要板块整体图表，在此构建
  });
  setShowSingleSectorModal(true);
};
```

## 🚀 推荐实施步骤

### 步骤1: 立即修复（5分钟）
修改第183行，将 `stocksData` 改为 `stocks`：

```typescript
// 第177-184行
const sectorData = [{
  sectorName,
  avgPremium: parseFloat(avgPremium.toFixed(2)),
  stockCount: sectorStocks.length,
  stocks: sectorStocks,  // 🔧 修复：改为 stocks
  chartData: sectorChartData
}];
```

### 步骤2: 验证修复效果
1. 点击任意板块名称
2. 检查弹窗是否正确显示个股数据
3. 验证数据排序和溢价计算是否正确

### 步骤3: 优化弹窗组件（可选）
修改弹窗组件中的字段访问逻辑，统一使用 `stocks` 字段：

```typescript
// 在弹窗组件中，将所有 stocksData 改为 stocks
const stocksData = (sector as any).stocks || [];  // 统一字段名
```

## 📊 修复影响评估

### 修复前的问题
- ❌ 点击板块名称后弹窗显示空白或错误数据
- ❌ 个股排序混乱
- ❌ 溢价计算可能不准确

### 修复后的效果
- ✅ 点击板块名称正确显示个股列表
- ✅ 个股按5日累计溢价正确排序
- ✅ 数据表格和图表显示一致
- ✅ 用户体验恢复正常

## 🔍 测试验证方案

1. **功能测试**
   - 点击不同日期的不同板块名称
   - 验证个股数据显示正确性
   - 检查排序逻辑是否正确

2. **数据一致性测试**
   - 对比板块点击和涨停数点击的数据
   - 验证溢价计算结果一致性
   - 检查图表数据与表格数据匹配

3. **边界情况测试**
   - 测试只有1只股票的板块
   - 测试没有后续交易日数据的情况
   - 测试数据为空的板块

## 💡 预防措施

1. **代码规范**
   - 统一数据结构字段命名
   - 避免在组件间传递时改变字段名

2. **类型安全**
   - 为数据结构定义明确的 TypeScript 接口
   - 避免使用 `any` 类型

3. **测试覆盖**
   - 为关键函数编写单元测试
   - 添加数据结构验证

---

**结论**: 这是一个典型的数据字段名不匹配问题，通过简单的字段重命名即可快速修复。建议立即实施步骤1的快速修复方案。