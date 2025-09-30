# 数据架构分析报告 - Stock Tracker Application

**生成日期**: 2025-09-30
**分析范围**: src/app/page.tsx, src/app/api/stocks/route.ts, 数据类型定义和工具函数
**目的**: 确保所有新功能开发不破坏现有数据连接

---

## 1. 当前数据流架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend (page.tsx)                     │
│                                                                   │
│  State Management:                                                │
│  - sevenDaysData: SevenDaysData | null  (核心数据状态)          │
│  - dates: string[]  (7个交易日列表)                             │
│  - loading, error: UI状态                                        │
│  - 各种Modal状态: showSectorModal, showDateModal等               │
│                                                                   │
│  Data Fetching:                                                   │
│  [fetch7DaysData] → GET /api/stocks?date=YYYYMMDD&mode=7days    │
│         ↓                                                         │
│  [setSevenDaysData(result.data)]                                 │
│  [setDates(result.dates)]                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Backend API (route.ts)                      │
│                                                                   │
│  get7DaysData(endDate) 处理流程:                                 │
│  1. 生成7个交易日: generate7TradingDays(endDate)                │
│  2. 检查缓存: stockCache.get7DaysCache(cacheKey)                │
│  3. 对每个日期:                                                  │
│     a. 获取当日涨停股票: getLimitUpStocks(day)                  │
│     b. 获取后续5日数据: getStockPerformance(code, followUpDays) │
│     c. 按板块分类: categories[category].push(stockPerformance)  │
│  4. 返回数据结构:                                                │
│     {                                                             │
│       success: true,                                              │
│       data: Record<string, DayData>,  ← SevenDaysData           │
│       dates: string[]                                             │
│     }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     External Data Sources                         │
│                                                                   │
│  1. 涨停股票API (longhuvip.com):                                 │
│     - 输入: Date=YYYYMMDD                                         │
│     - 输出: list[{ZSName, StockList[code, name, td_type]}]      │
│                                                                   │
│  2. Tushare API (日线数据):                                      │
│     - 输入: ts_code, trade_date                                   │
│     - 输出: pct_chg (涨跌幅)                                     │
│                                                                   │
│  3. 数据库缓存层 (stockDatabase):                                │
│     - getCachedStockData(date): 缓存的涨停股票                   │
│     - getCachedStockPerformance(code, baseDate, days): 表现数据  │
│     - get7DaysCache(key): 7天完整数据缓存                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心数据结构定义

### 2.1 类型定义层级 (src/types/stock.ts)

```typescript
// 基础股票信息
Stock {
  StockName: string;    // 股票名称
  StockCode: string;    // 股票代码
  ZSName: string;       // 板块名称（涨停原因）
  TDType: string;       // 板位类型（首板、二板等）
}

// 股票表现数据（含后续涨跌幅）
StockPerformance {
  name: string;                        // 股票名称
  code: string;                        // 股票代码
  td_type: string;                     // 板位类型
  performance: Record<string, number>; // 日期 → 涨跌幅(%)
  total_return: number;                // 累计收益率
}

// 单日完整数据
DayData {
  date: string;                                                    // 交易日期 YYYY-MM-DD
  categories: Record<string, StockPerformance[]>;                 // 板块 → 股票列表
  stats: {
    total_stocks: number;      // 涨停总数
    category_count: number;    // 板块数
    profit_ratio: number;      // 盈利比例
  };
  followUpData: Record<string, Record<string, Record<string, number>>>;
                // ↑板块名   ↑股票代码   ↑日期     ↑涨跌幅(%)
                // 三层嵌套结构：板块 → 股票 → 后续5日表现
}

// 7天数据容器
SevenDaysData = Record<string, DayData>
// 键：日期字符串 "YYYY-MM-DD"
// 值：该日期的完整DayData

// 板块汇总（用于时间轴显示）
SectorSummary {
  name: string;                              // 板块名称
  count: number;                             // 涨停家数
  stocks: StockPerformance[];               // 个股列表
  followUpData: Record<string, Record<string, number>>;
                // ↑股票代码   ↑日期     ↑涨跌幅
}
```

### 2.2 数据转换关系

```
外部API数据 → Stock
     ↓ (添加后续表现)
StockPerformance
     ↓ (按板块分组)
categories: Record<string, StockPerformance[]>
     ↓ (组合成完整日数据)
DayData
     ↓ (收集7天)
SevenDaysData
     ↓ (前端处理)
processedTimelineData: Record<string, SectorSummary[]>
```

---

## 3. 关键代码段分析（禁止修改）

### 3.1 API调用核心 (page.tsx 第54-75行) 🔒

```typescript
const fetch7DaysData = async () => {
  setLoading(true);
  setError(null);

  try {
    const endDate = getTodayString();
    const response = await fetch(`/api/stocks?date=${endDate}&mode=7days`);
    const result = await response.json();

    if (result.success) {
      setSevenDaysData(result.data);  // ← 核心状态设置
      setDates(result.dates || []);    // ← 日期列表设置
    } else {
      setError(result.error || '获取数据失败');
    }
  } catch (err) {
    setError('网络请求失败');
    console.error('Fetch error:', err);
  } finally {
    setLoading(false);
  }
};
```

**禁止修改原因**:
- 这是唯一的数据入口点
- `sevenDaysData` 状态被整个应用依赖
- API endpoint固定: `/api/stocks?date=${endDate}&mode=7days`
- 修改会导致所有下游功能失效

### 3.2 数据处理核心 (page.tsx 第242-278行) 🔒

```typescript
const processedTimelineData = useMemo(() => {
  if (!sevenDaysData || !dates) return {};

  const result: Record<string, SectorSummary[]> = {};

  dates.forEach(date => {
    const dayData = sevenDaysData[date];
    if (!dayData) {
      result[date] = [];
      return;
    }

    // 转换为板块汇总格式
    const sectors: SectorSummary[] = Object.entries(dayData.categories).map(([sectorName, stocks]) => {
      const sectorFollowUpData = dayData.followUpData[sectorName] || {};
      return {
        name: sectorName,
        count: stocks.length,
        stocks: stocks,
        followUpData: sectorFollowUpData
      };
    });

    // 按涨停数量排序
    sectors.sort((a, b) => b.count - a.count);

    // 过滤条件
    const filteredSectors = sectors
      .filter(sector => sector.name !== '其他' && sector.name !== 'ST板块')
      .filter(sector => onlyLimitUp5Plus ? sector.count >= 5 : true);

    result[date] = filteredSectors;
  });

  return result;
}, [sevenDaysData, dates, onlyLimitUp5Plus]);
```

**禁止修改原因**:
- `processedTimelineData` 是主时间轴显示的数据源
- 依赖关系: `sevenDaysData` → `processedTimelineData` → UI渲染
- 修改会破坏时间轴显示逻辑

### 3.3 后端7天数据生成 (route.ts 第734-874行) 🔒

```typescript
async function get7DaysData(endDate: string) {
  const sevenDays = generate7TradingDays(endDate);

  // 缓存检查...

  const result: Record<string, any> = {};

  for (const day of sevenDays) {
    // 获取当天涨停股票
    const limitUpStocks = await getLimitUpStocks(day);

    // 获取该天后5个交易日
    const followUpDays = generateTradingDays(day, 5);

    // 按分类整理数据
    const categories: Record<string, StockPerformance[]> = {};
    const followUpData: Record<string, Record<string, Record<string, number>>> = {};

    for (const stock of limitUpStocks) {
      const category = stock.ZSName || '其他';

      // 获取后续5日表现
      const followUpPerformance = await getStockPerformance(stock.StockCode, followUpDays, day);
      const totalReturn = Object.values(followUpPerformance).reduce((sum, val) => sum + val, 0);

      const stockPerformance: StockPerformance = {
        name: stock.StockName,
        code: stock.StockCode,
        td_type: stock.TDType.replace('首板', '1').replace('首', '1'),
        performance: { [day]: 10.0 },  // 涨停日固定10%
        total_return: Math.round(totalReturn * 100) / 100
      };

      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(stockPerformance);

      // 存储后续表现数据
      if (!followUpData[category]) {
        followUpData[category] = {};
      }
      followUpData[category][stock.StockCode] = followUpPerformance;
    }

    // 计算统计数据
    const stats = calculateStats(categories);

    result[day] = {
      date: day,
      categories,
      stats,
      followUpData
    };
  }

  return NextResponse.json({
    success: true,
    data: result,
    dates: sevenDays
  });
}
```

**禁止修改原因**:
- 这是数据结构的生成源头
- `followUpData` 三层嵌套结构被所有弹窗依赖
- 修改会导致前端数据解析失败

---

## 4. 现有功能的数据路径

### 4.1 时间轴主显示 (第1114-1193行)

**数据来源**:
```
sevenDaysData[date]
  → processedTimelineData[date]
    → sectors: SectorSummary[]
```

**使用的数据字段**:
- `date`: 日期
- `sectors[].name`: 板块名称
- `sectors[].count`: 涨停数
- `sectors[].stocks`: 个股列表
- `sectors[].followUpData`: 后续表现

**计算逻辑**:
```typescript
// 板块平均溢价计算 (第1152-1156行)
const sectorAvgPremium = sector.stocks.reduce((total, stock) => {
  const followUpData = sector.followUpData[stock.code] || {};
  const stockTotalReturn = Object.values(followUpData).reduce((sum, val) => sum + val, 0);
  return total + stockTotalReturn;
}, 0) / sector.stocks.length;
```

### 4.2 板块弹窗 (handleSectorClick, 第82-90行 + 363-519行)

**触发**: 点击板块名称

**传递数据**:
```typescript
setSelectedSectorData({
  name: sectorName,           // 板块名称
  date: date,                 // 日期
  stocks: stocks,             // StockPerformance[]
  followUpData: followUpData  // Record<code, Record<date, pct_chg>>
});
```

**数据使用**:
1. **个股排序** (第461行):
   ```typescript
   getSortedStocksForSector(stocks, followUpData)
   // 按后续5日累计收益排序
   ```

2. **板块趋势图** (第382-457行):
   ```typescript
   // 计算每个日期的平均溢价
   sortedDates.forEach(date => {
     let totalPremium = 0;
     let validStockCount = 0;

     Object.entries(followUpData).forEach(([stockCode, stockData]) => {
       if (stockData[date] !== undefined) {
         totalPremium += stockData[date];
         validStockCount++;
       }
     });

     const avgPremium = validStockCount > 0 ? totalPremium / validStockCount : 0;
   });
   ```

### 4.3 日期弹窗 (handleDateClick, 第93-132行 + 639-748行)

**触发**: 点击日期头部

**数据处理**:
```typescript
const handleDateClick = (date: string) => {
  const dayData = sevenDaysData?.[date];
  if (!dayData) return;

  // 按板块组织数据
  const sectorData: { sectorName: string; stocks: any[]; avgPremium: number; totalCumulativeReturn: number; }[] = [];

  Object.entries(dayData.categories).forEach(([sectorName, stocks]) => {
    const sectorStocks = stocks.map(stock => {
      const followUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
      const totalReturn = Object.values(followUpData).reduce((sum, val) => sum + val, 0);
      return {
        ...stock,
        followUpData,
        totalReturn
      };
    });

    // 按个股累计溢价排序
    sectorStocks.sort((a, b) => b.totalReturn - a.totalReturn);

    // 计算板块平均溢价
    const avgPremium = sectorStocks.reduce((total, stock) => total + stock.totalReturn, 0) / sectorStocks.length;

    // 计算板块累计涨幅总和
    const totalCumulativeReturn = sectorStocks.reduce((total, stock) => total + stock.totalReturn, 0);

    sectorData.push({
      sectorName,
      stocks: sectorStocks,
      avgPremium,
      totalCumulativeReturn
    });
  });

  // 按板块累计涨幅总和排序
  sectorData.sort((a, b) => b.totalCumulativeReturn - a.totalCumulativeReturn);
};
```

### 4.4 涨停数弹窗 (handleStockCountClick, 第135-170行 + 750-882行)

**触发**: 点击"XX只涨停"

**数据处理**:
```typescript
const handleStockCountClick = (date: string) => {
  const dayData = sevenDaysData?.[date];
  if (!dayData) return;

  const sectorData: { sectorName: string; stocks: any[]; avgPremium: number; }[] = [];

  Object.entries(dayData.categories).forEach(([sectorName, stocks]) => {
    const sectorStocks = stocks.map(stock => {
      const followUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
      const totalReturn = Object.values(followUpData).reduce((sum, val) => sum + val, 0);
      return {
        ...stock,
        followUpData,
        totalReturn
      };
    });

    // 板块内个股按累计溢价排序（降序）
    sectorStocks.sort((a, b) => b.totalReturn - a.totalReturn);

    const avgPremium = sectorStocks.reduce((total, stock) => total + stock.totalReturn, 0) / sectorStocks.length;

    sectorData.push({
      sectorName,
      stocks: sectorStocks,
      avgPremium
    });
  });

  // 按板块涨停数排序（降序）
  sectorData.sort((a, b) => b.stocks.length - a.stocks.length);
};
```

### 4.5 星期几弹窗 (handleWeekdayClick, 第173-203行 + 521-637行)

**触发**: 点击星期几显示

**数据处理**:
```typescript
const handleWeekdayClick = (date: string) => {
  const dayData = sevenDaysData?.[date];
  if (!dayData) return;

  const sectorData: { sectorName: string; avgPremium: number; stockCount: number; }[] = [];

  Object.entries(dayData.categories).forEach(([sectorName, stocks]) => {
    let totalPremium = 0;
    let validStockCount = 0;

    stocks.forEach(stock => {
      const followUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
      const stockTotalReturn = Object.values(followUpData).reduce((sum, val) => sum + val, 0);
      totalPremium += stockTotalReturn;
      validStockCount++;
    });

    const avgPremium = validStockCount > 0 ? totalPremium / validStockCount : 0;
    sectorData.push({
      sectorName,
      avgPremium,
      stockCount: validStockCount
    });
  });

  // 按平均溢价排序
  sectorData.sort((a, b) => b.avgPremium - a.avgPremium);
};
```

### 4.6 板块强度排行 (第292-346行)

**数据来源**: `sevenDaysData` + `dates`

**计算逻辑**:
```typescript
const getSectorStrengthRanking = useMemo(() => {
  if (!sevenDaysData || !dates) return [];

  // 根据当前时间选择3天数据
  const now = new Date();
  const currentHour = now.getHours();
  let recent3Days: string[];

  if (currentHour < 17) {
    recent3Days = dates.slice(-4, -1);  // 17点前：今天之外的前3天
  } else {
    recent3Days = dates.slice(-3);       // 17点后：包含今天的最近3天
  }

  const sectorCountMap: Record<string, { name: string; totalLimitUpCount: number; dailyBreakdown: { date: string; count: number }[] }> = {};

  // 统计最近3天每个板块的涨停家数
  recent3Days.forEach(date => {
    const dayData = sevenDaysData[date];
    if (!dayData) return;

    Object.entries(dayData.categories).forEach(([sectorName, stocks]) => {
      // 排除"其他"和"ST板块"
      if (sectorName === '其他' || sectorName === 'ST板块') return;

      if (!sectorCountMap[sectorName]) {
        sectorCountMap[sectorName] = {
          name: sectorName,
          totalLimitUpCount: 0,
          dailyBreakdown: []
        };
      }

      const dayLimitUpCount = stocks.length;
      sectorCountMap[sectorName].totalLimitUpCount += dayLimitUpCount;
      sectorCountMap[sectorName].dailyBreakdown.push({
        date,
        count: dayLimitUpCount
      });
    });
  });

  // 按总涨停家数排序，取前5名
  const rankedSectors = Object.values(sectorCountMap)
    .sort((a, b) => b.totalLimitUpCount - a.totalLimitUpCount)
    .slice(0, 5);

  return rankedSectors;
}, [sevenDaysData, dates]);
```

---

## 5. 新功能数据需求分析

基于现有数据结构，所有请求的新功能所需数据**已完全存在**于现有结构中:

### 5.1 日期点击 → 板块平均溢价表

**需求**: 显示当日所有板块的5日平均溢价

**数据来源**: ✅ **已存在**
```typescript
// 数据路径
sevenDaysData[date].followUpData[sectorName]
  → Record<stockCode, Record<date, pct_chg>>
```

**计算公式**:
```typescript
// 板块平均溢价 = 板块内所有个股的5日累计溢价的平均值
function calculateSectorAvgPremium(sectorName: string, date: string): number {
  const dayData = sevenDaysData[date];
  const stocks = dayData.categories[sectorName];
  const followUpData = dayData.followUpData[sectorName];

  let totalPremium = 0;
  let validStockCount = 0;

  stocks.forEach(stock => {
    const stockFollowUp = followUpData[stock.code] || {};
    const stock5DayTotal = Object.values(stockFollowUp).reduce((sum, val) => sum + val, 0);
    totalPremium += stock5DayTotal;
    validStockCount++;
  });

  return validStockCount > 0 ? totalPremium / validStockCount : 0;
}
```

**实现状态**: ✅ **已实现** (handleWeekdayClick, 第173-203行)

### 5.2 板块点击 → 个股溢价

**需求**: 显示该板块个股的5日溢价详情

**数据来源**: ✅ **已存在**
```typescript
// 数据路径
selectedSectorData.followUpData[stockCode]
  → Record<date, pct_chg>
```

**计算公式**:
```typescript
// 个股5日累计溢价
function calculateStock5DayPremium(stockCode: string, followUpData: Record<string, Record<string, number>>): number {
  const stockData = followUpData[stockCode] || {};
  return Object.values(stockData).reduce((sum, val) => sum + val, 0);
}
```

**实现状态**: ✅ **已实现** (板块弹窗, 第363-519行)

### 5.3 7天排行榜

**需求**: 按最近7天表现排序板块

**数据来源**: ✅ **已存在**
```typescript
// 数据路径
dates.forEach(date => {
  sevenDaysData[date].categories[sectorName]
    → StockPerformance[]
});
```

**计算公式**:
```typescript
// 板块7日平均溢价 = 7天内该板块所有涨停个股的平均溢价
function calculate7DaySectorPremium(sectorName: string): number {
  const sectorPremiums: number[] = [];

  dates.forEach(date => {
    const dayData = sevenDaysData[date];
    const stocks = dayData.categories[sectorName] || [];

    if (stocks.length > 0) {
      const followUpData = dayData.followUpData[sectorName] || {};

      stocks.forEach(stock => {
        const stockFollowUp = followUpData[stock.code] || {};
        const stock5DayTotal = Object.values(stockFollowUp).reduce((sum, val) => sum + val, 0);
        sectorPremiums.push(stock5DayTotal);
      });
    }
  });

  return sectorPremiums.length > 0
    ? sectorPremiums.reduce((sum, val) => sum + val, 0) / sectorPremiums.length
    : 0;
}
```

**实现状态**: ⚠️ **部分实现** (板块强度排行仅统计3天涨停数，未计算溢价)

### 5.4 排行榜板块点击 → 7天梯队

**需求**: 显示该板块在7天内每天的涨停个股及溢价

**数据来源**: ✅ **已存在**
```typescript
// 数据路径
dates.forEach(date => {
  const dayData = sevenDaysData[date];
  const stocks = dayData.categories[sectorName];
  const followUpData = dayData.followUpData[sectorName];
});
```

**数据结构**:
```typescript
interface Sector7DayLadder {
  sectorName: string;
  dailyData: Array<{
    date: string;
    stocks: Array<{
      name: string;
      code: string;
      td_type: string;
      followUp5Days: Record<string, number>;  // 后续5日表现
      totalPremium: number;                    // 5日累计溢价
    }>;
    avgPremium: number;  // 当日平均溢价
  }>;
  overall7DayAvg: number;  // 7日总平均
}
```

**实现状态**: ❌ **未实现**

---

## 6. 关键数据访问模式

### 6.1 安全的数据访问方式 ✅

```typescript
// 模式1: 可选链 + 空值合并
const dayData = sevenDaysData?.[date];
if (!dayData) return;

// 模式2: 解构赋值保护
const { categories = {}, followUpData = {} } = dayData;

// 模式3: 默认值保护
const followUpData = dayData.followUpData[sectorName]?.[stockCode] || {};

// 模式4: 数组方法保护
const totalReturn = Object.values(followUpData).reduce((sum, val) => sum + val, 0);
```

### 6.2 危险的数据访问方式 ❌

```typescript
// 错误1: 直接访问可能不存在的嵌套属性
const stocks = sevenDaysData[date].categories[sectorName];  // ❌ 可能崩溃

// 错误2: 假设数据总是存在
const avgPremium = calculateAvg(stocks);  // ❌ stocks可能为undefined

// 错误3: 不检查数组长度
const firstStock = stocks[0];  // ❌ 可能为undefined
```

---

## 7. 数据计算函数库

### 7.1 已有工具函数 (src/lib/utils.ts)

```typescript
// 日期处理
formatDate(date: string): string                      // 格式化日期为 YYYY-MM-DD
formatTradingDate(tradingDate: string): string       // YYYYMMDD → MM/DD
generateTradingDays(startDate: string, days: number): string[]  // 生成后续交易日
getTodayString(): string                              // 获取今天日期字符串

// 板位处理
getBoardWeight(boardType: string): number             // 获取板位权重
getBoardClass(boardType: string): string             // 获取板位样式类
sortStocksByBoard(stocks: T[]): T[]                  // 按板位排序

// 表现样式
getPerformanceClass(value: number): string           // 根据涨跌幅返回样式类
formatPercentage(value: number): string              // 格式化百分比

// 统计计算
calculateStats(categories: Record<string, any[]>)    // 计算统计数据
calculateDailyAverage(stocks: StockPerformance[], day: string): number  // 计算日平均
```

### 7.2 需要新增的计算函数

```typescript
// 建议添加到 src/lib/utils.ts

/**
 * 计算板块在某天的5日平均溢价
 * @param sectorName 板块名称
 * @param date 日期
 * @param sevenDaysData 7天数据
 * @returns 5日平均溢价百分比
 */
export function calculateSector5DayAvgPremium(
  sectorName: string,
  date: string,
  sevenDaysData: SevenDaysData
): number {
  const dayData = sevenDaysData[date];
  if (!dayData) return 0;

  const stocks = dayData.categories[sectorName] || [];
  const followUpData = dayData.followUpData[sectorName] || {};

  if (stocks.length === 0) return 0;

  let totalPremium = 0;
  let validStockCount = 0;

  stocks.forEach(stock => {
    const stockFollowUp = followUpData[stock.code] || {};
    const stock5DayTotal = Object.values(stockFollowUp).reduce((sum, val) => sum + val, 0);
    totalPremium += stock5DayTotal;
    validStockCount++;
  });

  return validStockCount > 0 ? Math.round((totalPremium / validStockCount) * 100) / 100 : 0;
}

/**
 * 计算板块7日综合表现
 * @param sectorName 板块名称
 * @param dates 日期数组
 * @param sevenDaysData 7天数据
 * @returns { avgPremium: number; totalStocks: number; dailyBreakdown: Array }
 */
export function calculateSector7DayPerformance(
  sectorName: string,
  dates: string[],
  sevenDaysData: SevenDaysData
): {
  avgPremium: number;
  totalStocks: number;
  dailyBreakdown: Array<{
    date: string;
    limitUpCount: number;
    avgPremium: number;
  }>;
} {
  const dailyBreakdown: Array<{
    date: string;
    limitUpCount: number;
    avgPremium: number;
  }> = [];

  let totalPremium = 0;
  let totalStockCount = 0;

  dates.forEach(date => {
    const dayData = sevenDaysData[date];
    if (!dayData) {
      dailyBreakdown.push({
        date,
        limitUpCount: 0,
        avgPremium: 0
      });
      return;
    }

    const stocks = dayData.categories[sectorName] || [];
    const followUpData = dayData.followUpData[sectorName] || {};

    let dayTotalPremium = 0;
    let dayValidStockCount = 0;

    stocks.forEach(stock => {
      const stockFollowUp = followUpData[stock.code] || {};
      const stock5DayTotal = Object.values(stockFollowUp).reduce((sum, val) => sum + val, 0);
      dayTotalPremium += stock5DayTotal;
      dayValidStockCount++;
    });

    const dayAvgPremium = dayValidStockCount > 0 ? dayTotalPremium / dayValidStockCount : 0;

    dailyBreakdown.push({
      date,
      limitUpCount: stocks.length,
      avgPremium: Math.round(dayAvgPremium * 100) / 100
    });

    totalPremium += dayTotalPremium;
    totalStockCount += dayValidStockCount;
  });

  const avgPremium = totalStockCount > 0 ? Math.round((totalPremium / totalStockCount) * 100) / 100 : 0;

  return {
    avgPremium,
    totalStocks: totalStockCount,
    dailyBreakdown
  };
}

/**
 * 获取所有板块的7日排行
 * @param dates 日期数组
 * @param sevenDaysData 7天数据
 * @returns 排序后的板块数组
 */
export function get7DaySectorRanking(
  dates: string[],
  sevenDaysData: SevenDaysData
): Array<{
  sectorName: string;
  avgPremium: number;
  totalStocks: number;
}> {
  // 收集所有板块名称
  const allSectors = new Set<string>();
  dates.forEach(date => {
    const dayData = sevenDaysData[date];
    if (dayData) {
      Object.keys(dayData.categories).forEach(sector => {
        if (sector !== '其他' && sector !== 'ST板块') {
          allSectors.add(sector);
        }
      });
    }
  });

  // 计算每个板块的7日表现
  const sectorRankings = Array.from(allSectors).map(sectorName => {
    const performance = calculateSector7DayPerformance(sectorName, dates, sevenDaysData);
    return {
      sectorName,
      avgPremium: performance.avgPremium,
      totalStocks: performance.totalStocks
    };
  });

  // 按平均溢价降序排序
  sectorRankings.sort((a, b) => b.avgPremium - a.avgPremium);

  return sectorRankings;
}
```

---

## 8. 安全开发指南

### 8.1 禁止修改的代码区域 🔒

| 文件 | 行号范围 | 功能 | 原因 |
|------|----------|------|------|
| page.tsx | 54-75 | fetch7DaysData | 唯一数据入口 |
| page.tsx | 242-278 | processedTimelineData | 主时间轴数据处理 |
| page.tsx | 1114-1193 | 时间轴渲染 | UI核心渲染逻辑 |
| route.ts | 734-874 | get7DaysData | 数据结构生成 |
| route.ts | 142-183 | getLimitUpStocks | 外部API调用 |
| route.ts | 506-613 | getStockPerformance | 表现数据获取 |
| types/stock.ts | 1-53 | 类型定义 | 数据结构基础 |

### 8.2 可以安全修改的区域 ✅

1. **新增Modal组件**: 在现有Modal之后添加新的弹窗组件
2. **新增事件处理函数**: 添加新的 `handle*` 函数处理用户交互
3. **新增计算函数**: 在 `utils.ts` 添加新的计算工具函数
4. **新增useMemo逻辑**: 基于现有数据创建新的派生状态

### 8.3 开发新功能的标准流程

```
1. 分析需求
   ↓
2. 确认数据来源（从sevenDaysData中）
   ↓
3. 编写计算函数（在utils.ts或组件内）
   ↓
4. 添加事件处理函数（handle*Click）
   ↓
5. 创建Modal状态和组件
   ↓
6. 在UI中添加触发点（onClick）
   ↓
7. 测试数据流完整性
```

### 8.4 数据访问检查清单 ✅

在访问 `sevenDaysData` 时，必须检查:

```typescript
// ✅ 正确的访问模式
function safeDataAccess(date: string, sectorName: string, stockCode: string) {
  // 1. 检查顶层数据存在
  if (!sevenDaysData) return null;

  // 2. 检查日期数据存在
  const dayData = sevenDaysData[date];
  if (!dayData) return null;

  // 3. 检查板块数据存在
  const stocks = dayData.categories[sectorName];
  if (!stocks || stocks.length === 0) return null;

  // 4. 检查后续数据存在
  const followUpData = dayData.followUpData[sectorName]?.[stockCode];
  if (!followUpData) return {};

  return followUpData;
}
```

---

## 9. 性能优化建议

### 9.1 已有优化机制

1. **useMemo缓存**: `processedTimelineData`, `getSectorStrengthRanking`
2. **API缓存**: 内存缓存 + 数据库缓存
3. **懒加载**: Modal按需渲染
4. **条件渲染**: 基于loading和error状态

### 9.2 新功能性能注意事项

```typescript
// ✅ 推荐：使用useMemo缓存计算结果
const sector7DayRanking = useMemo(() => {
  if (!sevenDaysData || !dates) return [];
  return get7DaySectorRanking(dates, sevenDaysData);
}, [sevenDaysData, dates]);

// ❌ 避免：在渲染中重复计算
return (
  <div>
    {get7DaySectorRanking(dates, sevenDaysData).map(...)}  // 每次渲染都计算
  </div>
);
```

---

## 10. 测试数据验证

### 10.1 数据完整性验证

```typescript
// 验证函数示例
function validateSevenDaysData(data: SevenDaysData, dates: string[]): boolean {
  // 检查1: 所有日期都有数据
  for (const date of dates) {
    if (!data[date]) {
      console.error(`缺失日期数据: ${date}`);
      return false;
    }
  }

  // 检查2: 每个日期的数据结构完整
  for (const date of dates) {
    const dayData = data[date];

    if (!dayData.categories || !dayData.stats || !dayData.followUpData) {
      console.error(`${date} 数据结构不完整`);
      return false;
    }

    // 检查3: followUpData与categories对应
    for (const sectorName in dayData.categories) {
      const stocks = dayData.categories[sectorName];
      const sectorFollowUp = dayData.followUpData[sectorName] || {};

      stocks.forEach(stock => {
        if (!sectorFollowUp[stock.code]) {
          console.warn(`${date} ${sectorName} ${stock.code} 缺失followUpData`);
        }
      });
    }
  }

  return true;
}
```

---

## 11. 常见问题排查

### Q1: Modal中数据显示为空或undefined

**原因**: 数据访问路径错误或缺少空值检查

**解决**:
```typescript
// ❌ 错误
const stocks = selectedSectorData.followUpData[stockCode];

// ✅ 正确
const stocks = selectedSectorData?.followUpData?.[stockCode] || {};
```

### Q2: 计算结果为NaN

**原因**: 对undefined或null进行数学运算

**解决**:
```typescript
// ❌ 错误
const total = values.reduce((sum, val) => sum + val, 0);

// ✅ 正确
const total = values
  .filter(val => typeof val === 'number' && !isNaN(val))
  .reduce((sum, val) => sum + val, 0);
```

### Q3: 排序结果不符合预期

**原因**: 字符串排序而非数值排序

**解决**:
```typescript
// ❌ 错误
sectors.sort((a, b) => a.avgPremium - b.avgPremium);  // 可能按字符串排序

// ✅ 正确
sectors.sort((a, b) => {
  const numA = parseFloat(a.avgPremium) || 0;
  const numB = parseFloat(b.avgPremium) || 0;
  return numB - numA;  // 降序
});
```

---

## 12. 总结与建议

### 12.1 核心发现 ✅

1. **数据结构完整**: 所有请求的新功能所需数据已存在于 `SevenDaysData` 中
2. **无需API修改**: 后端API已提供所有必要数据
3. **计算逻辑简单**: 大部分功能只需前端数据聚合和排序

### 12.2 开发路径

**新功能可以100%基于现有数据实现，无需修改:**
- ✅ API endpoint
- ✅ 数据结构定义
- ✅ 数据获取逻辑
- ✅ 核心状态管理

**只需新增:**
- ✅ 事件处理函数 (handle*Click)
- ✅ Modal组件
- ✅ 计算工具函数 (utils.ts)
- ✅ useMemo派生状态

### 12.3 推荐实现优先级

1. **高优先级**: 7天板块排行榜 (数据已有，只需计算和显示)
2. **中优先级**: 排行榜板块点击显示7天梯队 (需要新Modal组件)
3. **低优先级**: 优化现有功能的显示效果

### 12.4 风险评估

- **数据风险**: ✅ 低 (无需修改数据流)
- **性能风险**: ✅ 低 (使用useMemo缓存)
- **兼容性风险**: ✅ 低 (纯增量开发)
- **维护风险**: ✅ 低 (遵循现有模式)

---

**文档版本**: 1.0
**最后更新**: 2025-09-30
**维护者**: Data Architecture Analyst Agent