# 股票代码问题诊断和修复方案

## 问题描述

用户报告：海峡创新（显示代码：3003300）的涨跌幅数据与实际不符。

## 问题分析

### 1. 代码格式问题

- **显示代码**：3003300（7位数字）
- **正确代码**：300330（6位数字）
- **股票类型**：创业板股票（300开头）

标准股票代码格式：
- 上交所：6XXXXX（6位）
- 深交所主板：00XXXX（6位）
- 创业板：300XXX（6位）
- 科创板：688XXX（6位）

### 2. 可能的原因

1. **外部API返回的代码格式不标准**
   - 可能包含多余的数字
   - 需要进行规范化处理

2. **代码转换错误**
   - 在转换为Tushare格式时，代码本身就不对
   - Tushare会查询不到数据或返回错误的股票数据

3. **数据混淆**
   - 7位代码可能匹配到了错误的股票
   - 或者根本查询不到数据

## 诊断步骤

### 步骤1：使用诊断API检查

访问以下URL检查海峡创新在指定日期的真实数据：

```
http://localhost:3000/api/debug-stock?code=300330&start=2025-10-29&end=2025-11-04
```

同时也检查错误代码（如果存在）：

```
http://localhost:3000/api/debug-stock?code=3003300&start=2025-10-29&end=2025-11-04
```

对比两个请求的结果，看看哪个返回正确的数据。

### 步骤2：检查外部API返回的原始数据

在服务器日志中查找：

```
[API] stockData数组结构 [海峡创新]:
```

检查 `stockData[0]` 的值是什么。

### 步骤3：检查是否有其他股票也有类似问题

在截图中检查其他股票的代码格式是否正确：
- 平潭发展 (000592) ✓ 正确
- 海峡创新 (3003300) ✗ 错误
- 瑞尔特 (002790) ✓ 正确
- 等等...

## 修复方案

### 方案1：规范化股票代码（推荐）

在解析外部API数据时，对股票代码进行规范化处理：

```typescript
function normalizeStockCode(rawCode: string): string {
  // 移除前导零之外的多余数字
  const code = rawCode.trim();
  
  // 创业板：300xxx（保留6位）
  if (code.startsWith('300') && code.length > 6) {
    return code.slice(0, 6);
  }
  
  // 科创板：688xxx（保留6位）
  if (code.startsWith('688') && code.length > 6) {
    return code.slice(0, 6);
  }
  
  // 深市主板：000xxx, 001xxx, 002xxx, 003xxx（保留6位）
  if (code.startsWith('00') && code.length > 6) {
    return code.slice(0, 6);
  }
  
  // 上交所：6xxxxx（保留6位）
  if (code.startsWith('6') && code.length > 6) {
    return code.slice(0, 6);
  }
  
  // 北交所：8xxxxx, 4xxxxx（保留6位）
  if ((code.startsWith('8') || code.startsWith('4')) && code.length > 6) {
    return code.slice(0, 6);
  }
  
  return code;
}
```

### 方案2：添加数据验证

在存储股票数据前，验证代码格式：

```typescript
function isValidStockCode(code: string): boolean {
  // 标准股票代码应该是6位数字
  if (!/^\d{6}$/.test(code)) {
    console.warn(`[数据验证] 无效的股票代码: ${code}`);
    return false;
  }
  return true;
}
```

### 方案3：添加代码映射表

如果外部API始终返回错误的代码，可以建立映射表：

```typescript
const STOCK_CODE_MAP: Record<string, string> = {
  '3003300': '300330', // 海峡创新
  // 添加其他需要映射的代码...
};

function mapStockCode(rawCode: string): string {
  return STOCK_CODE_MAP[rawCode] || rawCode;
}
```

## 实施计划

1. **立即修复**：在 `route.ts` 的第260行添加代码规范化：

```typescript
const rawCode = stockData[0];
const stockCode = normalizeStockCode(rawCode);

if (rawCode !== stockCode) {
  console.log(`[代码规范化] ${stockName}: ${rawCode} → ${stockCode}`);
}
```

2. **添加验证**：在存储前验证代码格式

3. **清除缓存**：修复后需要清除数据库中的旧缓存数据

4. **验证修复**：重新获取数据，确认海峡创新的涨跌幅正确

## 预期结果

修复后：
- 海峡创新代码：300330（正确）
- 涨跌幅数据：匹配Tushare API返回的真实数据
- 其他股票不受影响

## 后续监控

- 定期检查是否有其他股票代码格式异常
- 在日志中记录所有代码规范化操作
- 建立异常代码报警机制

