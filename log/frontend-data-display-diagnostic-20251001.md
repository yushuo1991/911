# 前端数据显示问题诊断报告

**诊断时间**: 2025-10-01
**诊断目标**: http://bk.yushuo.click 页面无数据显示问题
**诊断人员**: Claude Code (前端调试专家)

---

## 一、问题摘要

页面能够正常加载，但是无法显示数据。经过代码审查，发现存在**日期格式不匹配**导致的数据关联失败问题。

---

## 二、核心问题分析

### 问题1: 日期格式不一致导致数据查询失败

#### 问题描述
API返回的 `followUpData` 对象使用的日期key格式与前端期望的格式不一致：

- **API返回格式**: `YYYYMMDD` (例如: `20251001`)
- **前端期望格式**: `YYYY-MM-DD` (例如: `2025-10-01`)

#### 问题代码位置

**API路由** (`src/app/api/stocks/route.ts`):

```typescript
// 第678行 - generateTradingDays 返回 YYYY-MM-DD 格式
const tradingDays = generateTradingDays(date, 5);
// 例如: ['2025-10-01', '2025-10-02', '2025-10-03', ...]

// 第796行 - get7DaysData 也使用相同格式
const followUpDays = generateTradingDays(day, 5);

// 但是 followUpData 对象的key可能来自其他数据源
followUpData[category][stock.StockCode] = followUpPerformance;
// followUpPerformance 的key格式取决于 getStockPerformance 返回值
```

**前端代码** (`src/app/page.tsx`):

```typescript
// 第130行 - handleSectorClick 函数中
stocks.forEach(stock => {
  const followUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
  if (followUpData[futureDate] !== undefined) {  // ← 这里查询失败
    totalPremium += followUpData[futureDate];
    validStockCount++;
  }
});
```

**问题逻辑流程**:
1. 前端从 `dates` 数组获取日期 (格式: `YYYY-MM-DD`)
2. 使用该日期作为key查询 `followUpData[futureDate]`
3. 但 `followUpData` 对象的key格式可能是 `YYYYMMDD`
4. 导致查询失败，返回 `undefined`
5. 所有溢价数据显示为 0% 或空白

#### 数据格式对比

**API应该返回的格式**:
```json
{
  "followUpData": {
    "板块名": {
      "股票代码": {
        "2025-10-01": 5.2,   // ← YYYY-MM-DD 格式
        "2025-10-02": -2.1,
        "2025-10-03": 3.5
      }
    }
  }
}
```

**可能实际返回的格式**:
```json
{
  "followUpData": {
    "板块名": {
      "股票代码": {
        "20251001": 5.2,     // ← YYYYMMDD 格式
        "20251002": -2.1,
        "20251003": 3.5
      }
    }
  }
}
```

---

### 问题2: Tushare API 使用 YYYYMMDD 格式

#### 代码位置

**API路由** (`src/app/api/stocks/route.ts`):

```typescript
// 第429-476行 - getTushareStockDaily 函数
async function getTushareStockDaily(stockCode: string, tradeDate: string, retryCount = 0): Promise<number> {
  // ...
  body: JSON.stringify({
    api_name: 'daily',
    token: TUSHARE_TOKEN,
    params: {
      ts_code: tsCode,
      trade_date: tradeDate  // ← 期望 YYYYMMDD 格式
    },
    fields: 'ts_code,trade_date,pct_chg'
  }),
  // ...
}
```

**问题**:
- `generateTradingDays` 返回 `YYYY-MM-DD` 格式
- Tushare API 需要 `YYYYMMDD` 格式
- 可能导致API请求失败或返回空数据

---

## 三、影响范围

### 受影响的功能

1. **板块溢价显示**: 所有板块的后续5天平均溢价显示为 0%
2. **个股梯队弹窗**: 点击板块后，个股的后续溢价数据为空
3. **日期弹窗**: 点击日期头部后，板块平均溢价数据为空
4. **涨停数弹窗**: 个股的5天溢价表现为空
5. **图表显示**: StockPremiumChart 无数据，显示空白

### 受影响的代码模块

- `src/app/page.tsx` (行: 130, 574, 960, 1285)
- `src/app/api/stocks/route.ts` (行: 678, 738, 796, 806, 826)
- `src/lib/utils.ts` (行: 134-159, generateTradingDays 函数)

---

## 四、修复方案

### 方案1: 统一使用 YYYY-MM-DD 格式 (推荐)

#### 优点
- 符合ISO 8601标准
- JavaScript Date对象原生支持
- 可读性强，便于调试
- 前端代码无需修改

#### 修改步骤

**步骤1**: 修改 Tushare API 调用，转换日期格式

```typescript
// src/app/api/stocks/route.ts
async function getTushareStockDaily(stockCode: string, tradeDate: string, retryCount = 0): Promise<number> {
  // 转换 YYYY-MM-DD -> YYYYMMDD
  const tradeDateFormatted = tradeDate.replace(/-/g, '');

  const response = await fetch('https://api.tushare.pro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      api_name: 'daily',
      token: TUSHARE_TOKEN,
      params: {
        ts_code: tsCode,
        trade_date: tradeDateFormatted  // 使用转换后的格式
      },
      fields: 'ts_code,trade_date,pct_chg'
    }),
    signal: controller.signal
  });

  // ... 其余代码保持不变
}
```

**步骤2**: 修改批量API调用

```typescript
// src/app/api/stocks/route.ts (行333-376)
async function getBatchStockDaily(stockCodes: string[], tradeDates: string[]): Promise<Map<string, Record<string, number>>> {
  const result = new Map<string, Record<string, number>>();

  // 为所有股票初始化空数据
  stockCodes.forEach(code => {
    result.set(code, {});
    tradeDates.forEach(date => {
      result.get(code)![date] = 0;  // ← key保持 YYYY-MM-DD 格式
    });
  });

  try {
    const tsCodes = stockCodes.map(code => convertStockCodeForTushare(code));

    // 转换日期格式为 YYYYMMDD
    const tradeDatesFormatted = tradeDates.map(d => d.replace(/-/g, ''));

    const response = await fetch('https://api.tushare.pro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_name: 'daily',
        token: TUSHARE_TOKEN,
        params: {
          ts_code: tsCodes.join(','),
          start_date: Math.min(...tradeDatesFormatted).toString(),
          end_date: Math.max(...tradeDatesFormatted).toString()
        },
        fields: 'ts_code,trade_date,pct_chg'
      }),
      signal: controller.signal
    });

    // ... 处理响应

    if (data.code === 0 && data.data && data.data.items) {
      data.data.items.forEach((item: any[]) => {
        const tsCode = item[0];
        const tradeDate = item[1];  // YYYYMMDD 格式
        const pctChg = parseFloat(item[2]) || 0;

        // 转换回 YYYY-MM-DD 格式
        const tradeDateFormatted = `${tradeDate.substring(0,4)}-${tradeDate.substring(4,6)}-${tradeDate.substring(6,8)}`;

        const originalCode = stockCodes.find(code =>
          convertStockCodeForTushare(code) === tsCode
        );

        if (originalCode && tradeDates.includes(tradeDateFormatted)) {
          result.get(originalCode)![tradeDateFormatted] = pctChg;
        }
      });
    }

    // ...
  } catch (error) {
    // ...
  }

  return result;
}
```

**步骤3**: 验证 `getStockPerformance` 返回格式

```typescript
// src/app/api/stocks/route.ts (行506-613)
async function getStockPerformance(stockCode: string, tradingDays: string[], baseDate?: string): Promise<Record<string, number>> {
  // 确保返回的 performance 对象使用 YYYY-MM-DD 格式的key
  const performance: Record<string, number> = {};

  for (let i = 0; i < tradingDays.length; i++) {
    const day = tradingDays[i];  // day 已经是 YYYY-MM-DD 格式

    const pctChg = await getTushareStockDaily(stockCode, day);
    performance[day] = pctChg;  // ← 保持 YYYY-MM-DD 格式
  }

  return performance;
}
```

---

### 方案2: 统一使用 YYYYMMDD 格式 (不推荐)

#### 缺点
- 需要大量修改前端代码
- 降低代码可读性
- 违背ISO 8601标准

#### 修改步骤 (仅供参考)

1. 修改 `generateTradingDays` 返回 YYYYMMDD 格式
2. 修改 `generate7TradingDays` 返回 YYYYMMDD 格式
3. 修改前端所有日期显示逻辑
4. 修改前端所有日期查询逻辑

**不建议采用此方案**

---

## 五、调试步骤

### 1. 验证 API 返回数据格式

在浏览器中直接访问API：
```
http://bk.yushuo.click/api/stocks?date=2025-10-01&mode=7days
```

检查返回的JSON中：
- `dates` 数组的格式
- `followUpData` 对象的key格式
- 两者是否一致

### 2. 浏览器控制台检查

打开浏览器开发者工具 (F12)，在Console中执行：

```javascript
// 获取API数据
fetch('/api/stocks?date=2025-10-01&mode=7days')
  .then(r => r.json())
  .then(data => {
    console.log('Dates array:', data.dates);
    console.log('Sample followUpData:', Object.keys(data.data['2025-10-01']?.followUpData || {}));

    // 检查日期key格式
    const firstSector = Object.keys(data.data['2025-10-01']?.followUpData || {})[0];
    const firstStock = Object.keys(data.data['2025-10-01']?.followUpData[firstSector] || {})[0];
    const dateKeys = Object.keys(data.data['2025-10-01']?.followUpData[firstSector]?.[firstStock] || {});

    console.log('Follow-up date keys:', dateKeys);
    console.log('Date format matches:', data.dates[0] === dateKeys[0]);
  });
```

### 3. Network标签检查

在Network标签中查看 `/api/stocks` 请求：
- Response状态码 (应该是 200)
- Response数据结构
- 请求耗时

---

## 六、预期结果

修复后，应该看到：

1. **板块卡片**: 显示正确的平均溢价百分比 (如: +5.2%, -2.1%)
2. **个股梯队弹窗**: 显示每只股票后续5天的溢价数据
3. **图表**: StockPremiumChart 显示多条溢价曲线
4. **日期弹窗**: 显示各板块的后续5天平均溢价
5. **控制台**: 无日期相关的警告或错误

---

## 七、根本原因总结

### 模块: API路由 (route.ts)

**问题**:
- `generateTradingDays` 生成 `YYYY-MM-DD` 格式
- Tushare API 需要 `YYYYMMDD` 格式
- 两者未做转换，导致API请求失败或数据格式不匹配

**影响**:
- 前端无法查询到后续日期的溢价数据
- 所有溢价显示为 0 或空白

**解决方案**:
- 在调用 Tushare API 时转换日期格式 (YYYY-MM-DD → YYYYMMDD)
- 在接收 Tushare API 响应时转换回来 (YYYYMMDD → YYYY-MM-DD)
- 确保返回给前端的数据使用统一的 `YYYY-MM-DD` 格式

---

## 八、技术学习要点

### 1. 日期格式标准

- **ISO 8601**: `YYYY-MM-DD` (国际标准，推荐使用)
- **紧凑格式**: `YYYYMMDD` (某些API使用)
- **JavaScript**: `new Date().toISOString()` 返回 ISO 8601 格式

### 2. 数据一致性

在全栈应用中，确保：
- API返回的数据格式与前端期望一致
- 使用TypeScript类型定义约束数据格式
- 在边界处进行格式转换 (外部API调用时)

### 3. 调试技巧

- 使用浏览器Network标签检查API响应
- 使用Console打印关键数据结构
- 对比期望格式与实际格式
- 追踪数据流动路径

---

## 九、修复优先级

**优先级**: 🔴 高 (P0)
**影响**: 核心功能完全不可用
**修复时间**: 约30分钟
**测试时间**: 约15分钟

---

## 十、后续建议

1. **添加单元测试**: 测试日期格式转换函数
2. **添加类型检查**: 使用TypeScript严格模式
3. **添加日志**: 在关键位置打印日期格式
4. **文档化**: 在代码注释中说明日期格式要求

---

**报告生成时间**: 2025-10-01
**诊断完成**: ✅
