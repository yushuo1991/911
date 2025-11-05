# 前端JavaScript错误分析报告

**生成时间**: 2025-10-01
**问题**: 页面不显示数据
**分析范围**: 前端JavaScript代码，重点关注日期处理和数据访问逻辑

---

## 一、关键函数分析

### 1. formatDate() 函数分析 (src/lib/utils.ts)

**位置**: 第8-29行

**功能**: 将日期字符串格式化为 `yyyy-MM-dd` 格式

**代码逻辑**:
```typescript
export function formatDate(date: string): string {
  // 1. 参数验证
  if (!date || typeof date !== 'string') {
    console.warn('[formatDate] 无效的日期参数:', date);
    return '';  // ⚠️ 返回空字符串
  }

  try {
    // 2. 使用 new Date() 解析
    const parsedDate = new Date(date);

    // 3. 检查日期有效性
    if (isNaN(parsedDate.getTime())) {
      console.warn('[formatDate] 无法解析的日期:', date);
      return date; // ⚠️ 返回原始字符串
    }

    // 4. 使用 date-fns 格式化
    return format(parsedDate, 'yyyy-MM-dd');
  } catch (error) {
    console.error('[formatDate] 格式化日期时出错:', error, '日期:', date);
    return date; // ⚠️ 返回原始字符串
  }
}
```

**潜在问题**:

1. **"20250923" 格式处理不当**
   - `new Date("20250923")` 在浏览器中可能返回 `Invalid Date`
   - 正确格式应该是 `"2025-09-23"` 或 `"2025/09/23"`
   - **错误影响**: 如果API返回的dates数组包含 "20250923" 格式，会导致日期解析失败

2. **返回值不一致**
   - 成功时返回 `"yyyy-MM-dd"` 格式
   - 失败时可能返回空字符串 `""` 或原始字符串
   - **错误影响**: 后续代码使用 `.slice(5)` 会出错

3. **错误处理逻辑**
   - 解析失败时返回原始字符串，但不抛出错误
   - **错误影响**: 错误被静默处理，难以追踪

---

### 2. API数据结构分析 (src/app/api/stocks/route.ts)

**7天数据API响应格式** (第868-873行):
```typescript
return NextResponse.json({
  success: true,
  data: result,        // Record<string, DayData>
  dates: sevenDays,    // string[]，格式：["2025-09-24", "2025-09-25", ...]
  cached: false
});
```

**dates数组生成逻辑** (第877-891行):
```typescript
function generate7TradingDays(endDate: string): string[] {
  const dates = [];
  const end = new Date(endDate);
  let current = new Date(end);

  while (dates.length < 7) {
    // 跳过周末
    if (current.getDay() !== 0 && current.getDay() !== 6) {
      dates.push(current.toISOString().split('T')[0]); // ✅ 格式：yyyy-MM-dd
    }
    current.setDate(current.getDate() - 1);
  }

  return dates.reverse(); // 返回从早到晚的顺序
}
```

**结论**: API返回的 `dates` 数组格式是正确的 `"yyyy-MM-dd"`，不存在 `"20250923"` 格式问题。

---

### 3. 前端数据处理逻辑分析 (src/app/page.tsx)

#### 3.1 数据获取和存储 (第63-88行)

```typescript
const fetch7DaysData = async () => {
  setLoading(true);
  setError(null);

  try {
    const endDate = getTodayString();
    const response = await fetch(`/api/stocks?date=${endDate}&mode=7days`);
    const result = await response.json();

    if (result.success) {
      setSevenDaysData(result.data);  // ✅ 存储数据
      setDates(result.dates || []);   // ✅ 存储dates数组
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

**潜在问题**:
- `result.dates` 可能为 `undefined`，会导致 `dates` 为空数组 `[]`
- **错误影响**: 后续所有依赖 `dates` 的操作都会失败

---

#### 3.2 handleDateClick 关键逻辑 (第102-157行)

```typescript
const handleDateClick = (date: string) => {
  const dayData = sevenDaysData?.[date];
  if (!dayData || !dates) return;

  // 找到当前日期在dates数组中的位置
  const currentDateIndex = dates.indexOf(date); // ⚠️ 关键查找
  if (currentDateIndex === -1) return;

  // 获取次日起5个交易日
  const next5Days = dates.slice(currentDateIndex + 1, currentDateIndex + 6);
  if (next5Days.length === 0) {
    console.warn('[handleDateClick] 没有后续交易日数据');
    return;
  }

  // ... 后续处理
}
```

**潜在问题**:

1. **日期格式不匹配导致 `indexOf` 返回 -1**
   - 如果 `date` 参数是 "2025-09-24"，但 `dates` 数组包含 "Tue Sep 24 2025..."
   - **错误影响**: `currentDateIndex === -1`，函数直接返回，数据不显示

2. **followUpData 数据结构访问错误** (第130-134行)
   ```typescript
   stocks.forEach(stock => {
     const followUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
     if (followUpData[futureDate] !== undefined) {
       totalPremium += followUpData[futureDate];
       validStockCount++;
     }
   });
   ```

   **数据结构期望**:
   ```typescript
   dayData.followUpData[sectorName][stock.code][futureDate] = number
   ```

   **潜在问题**:
   - 如果 `futureDate` 格式不匹配（例如 "20250925" vs "2025-09-25"）
   - **错误影响**: `followUpData[futureDate]` 返回 `undefined`，数据被跳过

---

#### 3.3 日期格式化多处使用 (多个弹窗组件)

**问题代码示例** (第554行):
```typescript
const formattedDate = formatDate(followDate).slice(5);
```

**潜在错误**:
1. 如果 `formatDate()` 返回空字符串 `""`
   - `"".slice(5)` 返回 `""`
   - 表格列头显示为空

2. 如果 `formatDate()` 返回原始字符串 `"20250925"`
   - `"20250925".slice(5)` 返回 `"925"`
   - 显示错误的日期

3. 如果 `followDate` 为 `undefined`
   - `formatDate(undefined)` 返回 `""`
   - **错误影响**: 列头为空，数据对不上

---

## 二、可能的JavaScript错误类型

### 1. TypeError: Cannot read property 'slice' of undefined

**发生位置**: 所有调用 `formatDate().slice(5)` 的地方

**触发条件**:
- `formatDate()` 返回 `undefined`（当前代码不会，但如果修改可能出现）

**影响**: 页面崩溃，白屏

---

### 2. 数据不显示 (静默错误)

**发生位置**: `handleDateClick`, `handleSectorClick`, 等数据处理函数

**触发条件**:
1. `dates.indexOf(date)` 返回 `-1`
   - 原因: 日期格式不匹配

2. `followUpData[futureDate]` 返回 `undefined`
   - 原因: futureDate 格式错误或日期不存在

3. `next5Days.length === 0`
   - 原因: 当前日期是最后一天，没有后续交易日

**影响**:
- 弹窗不显示数据
- 表格为空
- 用户看到 "没有后续交易日数据" 或空白表格

---

### 3. 日期显示错误

**发生位置**: 所有表格列头、日期标题

**触发条件**:
- `formatDate()` 解析失败，返回原始字符串
- `.slice(5)` 截取错误位置

**影响**:
- 日期显示为 "925" 而不是 "09-25"
- 列头错位

---

## 三、关键数据流图

```
API Response
  ├── success: true
  ├── data: {
  │     "2025-09-24": {
  │        categories: {...},
  │        followUpData: {
  │          "AI概念": {
  │            "000001": {
  │              "20250925": 3.5,  ← ⚠️ 如果是这个格式就错了
  │              "20250926": 2.1,
  │              ...
  │            }
  │          }
  │        }
  │     }
  │   }
  └── dates: ["2025-09-24", "2025-09-25", ...] ← ✅ 正确格式

前端处理
  ├── setDates(result.dates)
  ├── dates.indexOf(date) ← ⚠️ 如果date格式不匹配会返回-1
  ├── dates.slice(currentDateIndex + 1, currentDateIndex + 6)
  └── followUpData[sectorName][stockCode][futureDate] ← ⚠️ 关键访问点
```

---

## 四、错误发生的可能场景

### 场景1: API返回的followUpData日期格式错误

**API代码** (route.ts 第826行):
```typescript
followUpData[category][stock.StockCode] = followUpPerformance;
```

**followUpPerformance来自** (route.ts 第806行):
```typescript
const followUpPerformance = await getStockPerformance(stock.StockCode, followUpDays, day);
```

**followUpDays生成** (route.ts 第796行):
```typescript
const followUpDays = generateTradingDays(day, 5);
```

**generateTradingDays函数** (utils.ts 第134-165行):
```typescript
export function generateTradingDays(startDate: string, days: number = 5): string[] {
  const tradingDays: string[] = [];
  let currentDate = new Date(startDate);

  // ...

  while (tradingDays.length < days) {
    // ...
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      const dateStr = currentDate.getFullYear().toString() +
        (currentDate.getMonth() + 1).toString().padStart(2, '0') +
        currentDate.getDate().toString().padStart(2, '0');
      tradingDays.push(dateStr); // ⚠️ 生成 "20250925" 格式！
      // ...
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return tradingDays;
}
```

**🔥 发现核心问题！**

`generateTradingDays()` 生成的是 `"20250925"` 格式（YYYYMMDD），而不是 `"2025-09-25"` 格式！

这导致：
1. `followUpData` 的key是 `"20250925"`
2. 前端使用 `dates` 数组（格式 `"2025-09-25"`）去查找
3. **查找失败**，返回 `undefined`
4. 数据不显示

---

### 场景2: formatDate处理YYYYMMDD格式失败

**测试**:
```javascript
new Date("20250925")  // Invalid Date (大多数浏览器)
new Date("2025-09-25") // 有效
```

**formatDate行为**:
```typescript
formatDate("20250925")
  → new Date("20250925") → Invalid Date
  → isNaN(parsedDate.getTime()) → true
  → return "20250925"  // 返回原始字符串

formatDate("20250925").slice(5)
  → "925"  // ❌ 错误的日期显示
```

---

## 五、修复建议

### 1. 立即修复：统一日期格式

**修改 generateTradingDays() 函数** (utils.ts 第154-157行):

```typescript
// ❌ 错误代码
const dateStr = currentDate.getFullYear().toString() +
  (currentDate.getMonth() + 1).toString().padStart(2, '0') +
  currentDate.getDate().toString().padStart(2, '0');

// ✅ 正确代码
const dateStr = currentDate.toISOString().split('T')[0]; // "2025-09-25"
```

---

### 2. 增强 formatDate() 函数

**添加YYYYMMDD格式支持**:

```typescript
export function formatDate(date: string): string {
  if (!date || typeof date !== 'string') {
    console.warn('[formatDate] 无效的日期参数:', date);
    return '';
  }

  try {
    let dateToFormat = date;

    // 检测并转换YYYYMMDD格式
    if (/^\d{8}$/.test(date)) {
      // "20250925" → "2025-09-25"
      dateToFormat = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
      console.log(`[formatDate] 转换YYYYMMDD格式: ${date} → ${dateToFormat}`);
    }

    const parsedDate = new Date(dateToFormat);

    if (isNaN(parsedDate.getTime())) {
      console.warn('[formatDate] 无法解析的日期:', date);
      return date;
    }

    return format(parsedDate, 'yyyy-MM-dd');
  } catch (error) {
    console.error('[formatDate] 格式化日期时出错:', error, '日期:', date);
    return date;
  }
}
```

---

### 3. 添加数据验证

**在 handleDateClick 中添加日志**:

```typescript
const handleDateClick = (date: string) => {
  console.log('[handleDateClick] 点击日期:', date);
  console.log('[handleDateClick] dates数组:', dates);

  const dayData = sevenDaysData?.[date];
  if (!dayData || !dates) {
    console.warn('[handleDateClick] 缺少数据:', { dayData: !!dayData, dates: !!dates });
    return;
  }

  const currentDateIndex = dates.indexOf(date);
  console.log('[handleDateClick] 日期索引:', currentDateIndex);

  if (currentDateIndex === -1) {
    console.error('[handleDateClick] 在dates数组中找不到日期:', date);
    return;
  }

  // ... 后续逻辑
}
```

---

### 4. 检查API响应数据

**添加前端日志** (page.tsx fetch7DaysData):

```typescript
if (result.success) {
  console.log('[API响应] 完整数据:', result);
  console.log('[API响应] dates数组:', result.dates);
  console.log('[API响应] data样例:', Object.keys(result.data));

  // 检查followUpData格式
  const firstDate = Object.keys(result.data)[0];
  if (firstDate && result.data[firstDate].followUpData) {
    const firstSector = Object.keys(result.data[firstDate].followUpData)[0];
    if (firstSector) {
      const firstStock = Object.keys(result.data[firstDate].followUpData[firstSector])[0];
      console.log('[API响应] followUpData日期格式示例:',
        Object.keys(result.data[firstDate].followUpData[firstSector][firstStock])
      );
    }
  }

  setSevenDaysData(result.data);
  setDates(result.dates || []);
}
```

---

## 六、诊断步骤

### 步骤1: 打开浏览器控制台

1. 访问页面: http://bk.yushuo.click
2. 按 F12 打开开发者工具
3. 切换到 **Console** 标签

### 步骤2: 查找错误信息

**查找关键词**:
- `[formatDate]`
- `[handleDateClick]`
- `Invalid Date`
- `undefined`
- `TypeError`
- `无法解析`
- `没有后续交易日数据`

### 步骤3: 检查网络请求

1. 切换到 **Network** 标签
2. 找到 `/api/stocks?date=...&mode=7days` 请求
3. 查看 **Response** 标签，检查:
   - `dates` 数组格式
   - `followUpData` 对象的key格式
   - 是否有数据

### 步骤4: 在Console中手动测试

```javascript
// 测试formatDate
formatDate("2025-09-25")  // 应该返回 "2025-09-25"
formatDate("20250925")    // 检查是否能正确处理

// 测试Date解析
new Date("2025-09-25")    // 有效
new Date("20250925")      // Invalid Date

// 检查dates数组
console.log(dates)

// 检查sevenDaysData
console.log(sevenDaysData)
```

---

## 七、总结

### 核心问题

**generateTradingDays() 函数生成的日期格式为 "YYYYMMDD"，与API返回的dates数组格式 "YYYY-MM-DD" 不一致。**

### 影响范围

1. **followUpData 数据无法访问**
   - key格式: `"20250925"`
   - 查询格式: `"2025-09-25"`
   - 结果: `undefined`

2. **页面不显示数据**
   - 弹窗表格为空
   - 图表无数据
   - 用户体验差

3. **日期显示错误**
   - `formatDate("20250925").slice(5)` → `"925"`
   - 列头显示错误

### 修复优先级

1. **P0 (立即修复)**: 修改 `generateTradingDays()` 使用 `toISOString().split('T')[0]`
2. **P1 (重要)**: 增强 `formatDate()` 支持YYYYMMDD格式
3. **P2 (建议)**: 添加数据验证和详细日志

---

**报告结束**

