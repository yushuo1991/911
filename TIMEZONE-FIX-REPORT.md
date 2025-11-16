# 时区Bug修复报告 (v4.8.27)

## 问题诊断

### 症状
- 用户在11月17日无法看到11月14日及之后的最新数据
- 数据刷新延迟，最新数据不显示

### 根本原因
**时区转换逻辑存在严重bug**

在服务器配置为UTC+8（中国标准时间）的环境下，代码中的时区转换逻辑错误地假设服务器在UTC时区，导致：

1. **重复计算时区偏移**
   ```javascript
   // 错误的逻辑
   const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000); // -480分钟
   const beijingTime = utcTime + (8 * 60 * 60 * 1000); // 再+8小时
   // 结果：在凌晨0:00-8:00之间，日期落后1天
   ```

2. **影响范围**
   - `src/lib/utils.ts` 的 `getTodayString()` 函数
   - `src/lib/enhanced-trading-calendar.ts` 的 `get7TradingDaysFromCalendar()` 函数

3. **实际影响**
   - 凌晨0:00-8:00期间：系统识别的日期落后1天
   - 例如：真实时间 2025-11-17 00:44，系统识别为 2025-11-16
   - 前端调用API时传入错误的日期
   - 7天数据范围计算错误
   - 用户看不到最新数据

## 修复方案

### 技术实现

使用 **Intl API** 直接获取Asia/Shanghai时区的准确时间，无需手动计算偏移：

**修复后的 getTodayString() 函数：**
```typescript
export function getTodayString(): string {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';

  return `${year}-${month}-${day}`;
}
```

**修复后的 get7TradingDaysFromCalendar() 时间判断：**
```typescript
const formatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hour12: false
});

const parts = formatter.formatToParts(now);
const beijingHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
const beijingDateStr = `${year}-${month}-${day}`;
```

### 修复验证

**修复前：**
- 真实北京时间：2025/11/17 00:44
- 系统识别日期：2025-11-16 ❌

**修复后：**
- 真实北京时间：2025/11/17 00:48
- 系统识别日期：2025-11-17 ✅

## 提交信息

```
Commit: 1a08a81
Author: Claude Code
Date: 2025-11-17 00:48

fix: Fix critical timezone bug causing data refresh delay (v4.8.27)

Files changed:
- src/lib/utils.ts (18 lines changed)
- src/lib/enhanced-trading-calendar.ts (19 lines changed)

Total: 2 files changed, 37 insertions(+), 18 deletions(-)
```

## 推送状态

### 当前状态
✅ **代码已修复并提交到本地仓库**
⚠️ **推送到GitHub受网络限制**

### 网络诊断
- GitHub可以ping通 (20.205.243.166, 94ms延迟)
- HTTPS端口443连接被阻止或重置
- GitHub CLI已认证但无法建立HTTPS连接
- 可能原因：防火墙、网络策略、ISP限制

### 手动推送方案

**方案1：使用不同网络环境**
```bash
cd "C:\Users\yushu\Desktop\bk\911-86887ec382a82d9038e8df20f97a4d0e5ef02a56"
git push origin main
```

**方案2：使用代理（如果有）**
```bash
git config --global http.proxy http://proxy-server:port
git push origin main
```

**方案3：使用SSH（需要配置密钥）**
```bash
# 先配置SSH密钥
git remote set-url origin git@github.com:yushuo1991/bkyushuo.git
git push origin main
```

**方案4：稍后自动部署**
GitHub Actions会在下次成功推送后自动部署到服务器

## 预期效果

修复部署后，系统将：
- ✅ 正确识别北京时间，不再有日期延迟
- ✅ 及时获取和显示最新涨停数据
- ✅ 7天数据范围计算准确
- ✅ 16:00后正常包含当天数据
- ✅ 在任何服务器时区配置下都能正常工作

## 重要提醒

此修复解决了**数据刷新延迟**的核心问题。代码已在本地修复并验证，只需在网络恢复后推送即可生效。

---

**修复时间：** 2025-11-17 00:50
**严重程度：** 高 (影响数据时效性)
**修复状态：** 代码已修复，待推送部署
