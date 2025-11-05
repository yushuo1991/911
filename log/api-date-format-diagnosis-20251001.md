# API数据格式诊断报告

**诊断时间**: 2025-10-01
**问题**: API返回数据，但前端不显示
**核心问题**: 日期格式不一致导致数据匹配失败

---

## 🔍 问题分析

### 1. 日期格式混用问题

在API响应数据中发现了两种日期格式混用：

```json
{
  "followUpData": {
    "摩尔线程概念": {
      "600797": {
        "20250923": 1.56,           // ✅ 格式1: 8位数字字符串 (正确)
        "20250924": -0.01
      },
      "300250": {
        "Tue Sep 23 2025 00:00:00 GMT+0800 (China Standard Time)": 19.9909,  // ❌ 格式2: Date.toString()
        "Wed Sep 24 2025 00:00:00 GMT+0800 (China Standard Time)": 1.7497
      }
    }
  }
}
```

### 2. 问题影响

这种混用会导致：

1. **前端无法匹配日期**
   ```typescript
   // 前端期望: "20250923"
   const followUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
   if (followUpData[futureDate] !== undefined) { // futureDate = "20250923"
     // 无法匹配 "Tue Sep 23 2025 00:00:00 GMT+0800..." 这样的key
   }
   ```

2. **formatDate()函数无法处理**
   ```typescript
   // utils.ts 中的formatDate函数期望标准日期字符串
   const parsedDate = new Date(date); // "20250923" 可以解析
   // 但完整的Date.toString()格式会导致解析错误
   ```

3. **数据查找失败**
   - dates数组: `["20250923", "20250924", ...]`
   - followUpData keys: `["Tue Sep 23 2025...", "Wed Sep 24 2025..."]`
   - 无法匹配 → 显示为0或空

---

## 🔎 问题根源定位

### 位置: `src/app/api/stocks/route.ts`

#### 问题代码段1: `generate7TradingDays()` (第876-891行)

```typescript
function generate7TradingDays(endDate: string): string[] {
  const dates = [];
  const end = new Date(endDate);
  let current = new Date(end);

  while (dates.length < 7) {
    if (current.getDay() !== 0 && current.getDay() !== 6) {
      dates.push(current.toISOString().split('T')[0]); // ✅ 正确: "2025-09-23"
    }
    current.setDate(current.getDate() - 1);
  }

  return dates.reverse();
}
```

这个函数**正确**地生成了 ISO 格式日期 `"2025-09-23"`

#### 问题代码段2: `get7DaysData()` (第796-806行)

```typescript
// 获取该天后5个交易日（用于溢价计算）
const followUpDays = generateTradingDays(day, 5); // ✅ 返回 ["20250923", ...]

// 按分类整理数据
const categories: Record<string, StockPerformance[]> = {};
const followUpData: Record<string, Record<string, Record<string, number>>> = {};

for (const stock of limitUpStocks) {
  const category = stock.ZSName || '其他';

  // 获取后续5日表现
  const followUpPerformance = await getStockPerformance(stock.StockCode, followUpDays, day);
  // followUpPerformance 的 key 应该是 "20250923" 格式

  // 存储后续表现数据
  if (!followUpData[category]) {
    followUpData[category] = {};
  }
  followUpData[category][stock.StockCode] = followUpPerformance; // ⚠️ 这里存储的格式
}
```

#### 问题代码段3: `getStockPerformance()` (第506-613行)

```typescript
async function getStockPerformance(
  stockCode: string,
  tradingDays: string[], // tradingDays = ["20250923", "20250924", ...]
  baseDate?: string
): Promise<Record<string, number>> {

  // ... 缓存检查 ...

  // 逐个日期获取数据
  const performance: Record<string, number> = {};

  for (let i = 0; i < tradingDays.length; i++) {
    const day = tradingDays[i]; // day = "20250923"

    try {
      const pctChg = await getTushareStockDaily(stockCode, day);
      performance[day] = pctChg; // ✅ key应该是 "20250923"

    } catch (error) {
      // 降级使用模拟数据
      const mockData = generateMockPerformance(stockCode, tradingDays);
      tradingDays.forEach(date => {
        if (performance[date] === undefined) {
          performance[date] = mockData[date]; // ⚠️ mockData的key格式?
        }
      });
    }
  }

  return performance; // 返回的key格式取决于上面的逻辑
}
```

#### 问题代码段4: `generateMockPerformance()` (调用自 `lib/utils.ts`)

需要检查模拟数据生成函数是否正确处理日期格式。

---

## 🎯 问题根源确认 ✅

### **问题已定位！**

**根本原因**: MySQL DATE类型在JavaScript中返回Date对象，作为key时自动toString()

#### 问题代码位置

**文件**: `src/lib/database.ts`
**行号**: 第242行

```typescript
// ❌ 错误：row.performance_date是Date对象
(rows as any[]).forEach(row => {
  performance[row.performance_date] = parseFloat(row.pct_change);
  // row.performance_date 是 Date 对象
  // 当作为对象key时，会调用 .toString()
  // 结果: "Tue Sep 23 2025 00:00:00 GMT+0800 (China Standard Time)"
});
```

#### 数据库表结构

**文件**: `src/lib/database.ts`
**行号**: 第75-76行

```sql
CREATE TABLE IF NOT EXISTS stock_performance (
  ...
  base_date DATE NOT NULL,           -- MySQL DATE类型
  performance_date DATE NOT NULL,    -- MySQL DATE类型 ⚠️ 问题根源
  ...
)
```

MySQL的DATE字段通过`mysql2`驱动返回时是**JavaScript Date对象**，不是字符串。

#### 问题流程

1. API调用 `getCachedStockPerformance()`
2. 从MySQL查询返回: `row.performance_date` = `Date对象`
3. 使用Date对象作为key: `performance[Date对象]`
4. JavaScript自动转换: `Date对象.toString()` = `"Tue Sep 23 2025..."`
5. API返回的数据中就有了长格式日期key
6. 前端匹配失败: `"20250923"` ≠ `"Tue Sep 23 2025..."`

#### 为什么有些数据是正确格式？

- **从Tushare API获取**: 直接使用 `"20250923"` 字符串作为key ✅
- **从数据库缓存读取**: Date对象转换为长字符串 ❌
- **generateMockPerformance**: 使用传入的 `day` 字符串作为key ✅

---

## 📝 其他检查结果 ✅

1. **`src/lib/utils.ts` - `generateMockPerformance()`** ✅ 正确
   - 第176-187行：使用 `day` 作为key，格式正确

2. **`src/app/api/stocks/route.ts`** ✅ 大部分正确
   - `generate7TradingDays()`: 生成ISO格式正确
   - `getStockPerformance()`: 使用传入的日期字符串正确
   - 唯一问题：从数据库读取时格式错误

---

## 🔧 修复方案 (精确定位)

### ✅ 方案: 修复数据库读取时的Date对象转换

**位置**: `src/lib/database.ts` 第242行

#### 修复代码

```typescript
// ❌ 修改前 (第239-243行)
if (Array.isArray(rows) && rows.length === tradingDays.length) {
  const performance: Record<string, number> = {};
  (rows as any[]).forEach(row => {
    performance[row.performance_date] = parseFloat(row.pct_change);
  });

// ✅ 修改后
if (Array.isArray(rows) && rows.length === tradingDays.length) {
  const performance: Record<string, number> = {};
  (rows as any[]).forEach(row => {
    // 将Date对象转换为YYYYMMDD格式
    const dateKey = formatDateToYYYYMMDD(row.performance_date);
    performance[dateKey] = parseFloat(row.pct_change);
  });
```

#### 辅助函数 (添加到 database.ts 顶部)

```typescript
/**
 * 将Date对象或日期字符串转换为YYYYMMDD格式
 * @param date - Date对象、ISO字符串或YYYYMMDD字符串
 * @returns YYYYMMDD格式的字符串
 */
function formatDateToYYYYMMDD(date: Date | string): string {
  if (typeof date === 'string') {
    // 如果已经是YYYYMMDD格式，直接返回
    if (/^\d{8}$/.test(date)) {
      return date;
    }
    // 如果是ISO格式 YYYY-MM-DD，转换为YYYYMMDD
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date.replace(/-/g, '');
    }
    // 其他格式，转换为Date对象处理
    date = new Date(date);
  }

  // Date对象转换为YYYYMMDD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
```

#### 需要修改的位置

1. **`getCachedStockPerformance()`** - 第242行
2. **`getCachedStockData()`** - 可能也需要检查（如果返回日期字段）

---

## 🚀 执行步骤

### 第一步: 修改代码

1. **在 `src/lib/database.ts` 顶部添加辅助函数**
   ```typescript
   function formatDateToYYYYMMDD(date: Date | string): string { ... }
   ```

2. **修改 `getCachedStockPerformance()` 第242行**
   ```typescript
   const dateKey = formatDateToYYYYMMDD(row.performance_date);
   performance[dateKey] = parseFloat(row.pct_change);
   ```

3. **检查并修改 `getCachedStockData()` (如果需要)**

### 第二步: 清理缓存

```bash
# 连接MySQL
mysql -u root -p

# 清空缓存表（数据会自动重新生成）
TRUNCATE TABLE stock_performance;
TRUNCATE TABLE seven_days_cache;
```

或者在API中添加清理接口

### 第三步: 重启应用

```bash
# 开发环境
npm run dev

# 生产环境
docker-compose down
docker-compose up -d --build
```

### 第四步: 验证修复

1. **检查API响应**
   ```bash
   curl "http://localhost:3000/api/stocks?date=2025-09-22&mode=7days" | jq '.data[].followUpData'
   ```

2. **验证日期格式统一**
   - 所有日期key应该是 `"20250923"` 格式
   - 没有长格式 `"Tue Sep 23..."`

3. **前端显示正常**
   - 板块点击显示溢价数据
   - 数值不为0
   - 图表正常渲染

---

## 📊 影响模块

- **API模块**: `src/app/api/stocks/route.ts`
- **工具模块**: `src/lib/utils.ts` (generateMockPerformance)
- **数据库模块**: `src/lib/database.ts` (缓存读写)
- **前端模块**: `src/app/page.tsx` (数据展示)

---

## 🎓 技术要点

### 问题本质
这是一个**数据契约问题** - API、数据库、前端之间对日期格式的约定不一致。

### 解决关键
建立统一的日期格式标准，并在所有数据边界处进行格式验证和转换。

### 最佳实践
1. 定义明确的数据类型和格式规范
2. 在数据出入口进行格式校验
3. 使用TypeScript类型系统增强约束
4. 添加日志记录格式转换过程
5. 编写单元测试验证格式转换

---

---

## 📋 总结

### 问题本质
MySQL DATE类型返回JavaScript Date对象，在用作对象key时自动调用toString()，产生长格式字符串，导致前端无法匹配。

### 影响范围
- **数据库缓存读取**: 所有从 stock_performance 表读取的数据
- **7天数据模式**: mode=7days 时受影响最大
- **前端显示**: 板块溢价数据显示为0或空白

### 修复方案
在 `src/lib/database.ts` 的 `getCachedStockPerformance()` 方法中，添加Date对象到YYYYMMDD字符串的转换。

### 预期效果
- ✅ API返回统一的 "20250923" 格式日期key
- ✅ 前端成功匹配并显示溢价数据
- ✅ 数据库缓存命中率提升
- ✅ 图表正常渲染

### 技术价值
这个案例展示了：
1. **类型转换陷阱**: 对象作为key时的隐式类型转换
2. **边界处理**: 数据库与应用层之间的格式统一
3. **调试技巧**: 通过日志分析定位数据格式问题
4. **最佳实践**: 在数据边界处进行格式标准化

---

**诊断完成时间**: 2025-10-01
**问题定位**: ✅ 完成
**修复方案**: ✅ 提供
**待执行**: 代码修改 + 缓存清理 + 测试验证
