# 手动上传代码到GitHub指南

## 情况说明
由于网络限制无法通过命令行推送，需要手动上传修改的文件到GitHub。

## 需要上传的文件

### 核心修复文件（必须上传）
1. `src/lib/utils.ts` - 修复了getTodayString()函数的时区bug
2. `src/lib/enhanced-trading-calendar.ts` - 修复了交易日计算的时区bug

### 文档文件（建议上传）
3. `CLAUDE.md` - Claude Code工作指南
4. `TIMEZONE-FIX-REPORT.md` - 时区修复详细报告

---

## 方法一：使用GitHub Desktop（推荐，最简单）

### 步骤：

1. **打开GitHub Desktop**
   - 如果没有安装：https://desktop.github.com/

2. **添加仓库**
   - File → Add Local Repository
   - 选择路径：`C:\Users\yushu\Desktop\bk\911-86887ec382a82d9038e8df20f97a4d0e5ef02a56`

3. **查看更改**
   - 左侧会显示所有修改的文件
   - 确认看到以下文件：
     - ✅ src/lib/utils.ts
     - ✅ src/lib/enhanced-trading-calendar.ts
     - ✅ CLAUDE.md
     - ✅ TIMEZONE-FIX-REPORT.md

4. **推送到GitHub**
   - 点击右上角的 "Push origin" 按钮
   - 等待上传完成

**优点：** 图形界面，最简单直观

---

## 方法二：使用GitHub网页端手动上传

### 步骤：

1. **打开GitHub仓库**
   - 访问：https://github.com/yushuo1991/bkyushuo

2. **上传 utils.ts**
   - 导航到 `src/lib/` 目录
   - 点击 `utils.ts` 文件
   - 点击右上角的编辑图标（铅笔）
   - 打开本地文件：`C:\Users\yushu\Desktop\bk\911-86887ec382a82d9038e8df20f97a4d0e5ef02a56\src\lib\utils.ts`
   - 复制第291-308行的新代码（getTodayString函数）
   - 粘贴替换GitHub上的对应代码
   - 提交信息：`fix: Fix getTodayString timezone bug (v4.8.27)`
   - 点击 "Commit changes"

3. **上传 enhanced-trading-calendar.ts**
   - 导航到 `src/lib/` 目录
   - 点击 `enhanced-trading-calendar.ts` 文件
   - 点击编辑图标
   - 打开本地文件：`C:\Users\yushu\Desktop\bk\911-86887ec382a82d9038e8df20f97a4d0e5ef02a56\src\lib\enhanced-trading-calendar.ts`
   - 复制第245-274行的新代码
   - 粘贴替换GitHub上的对应代码
   - 提交信息：`fix: Fix trading calendar timezone bug (v4.8.27)`
   - 点击 "Commit changes"

4. **上传文档文件**
   - 返回仓库根目录
   - 点击 "Add file" → "Upload files"
   - 拖入以下文件：
     - `C:\Users\yushu\Desktop\bk\911-86887ec382a82d9038e8df20f97a4d0e5ef02a56\CLAUDE.md`
     - `C:\Users\yushu\Desktop\bk\911-86887ec382a82d9038e8df20f97a4d0e5ef02a56\TIMEZONE-FIX-REPORT.md`
   - 提交信息：`docs: Add timezone fix report and CLAUDE.md`
   - 点击 "Commit changes"

**缺点：** 需要逐个文件操作，较繁琐

---

## 方法三：使用移动热点或其他网络

### 步骤：

1. **切换网络**
   - 使用手机开启热点
   - 电脑连接到手机热点

2. **执行推送**
   ```bash
   cd "C:\Users\yushu\Desktop\bk\911-86887ec382a82d9038e8df20f97a4d0e5ef02a56"
   git push origin main
   ```

**优点：** 完整推送所有更改，包括提交历史

---

## 方法四：使用代理（如果有）

### 步骤：

1. **配置Git代理**（替换为你的代理地址）
   ```bash
   git config --global http.proxy http://127.0.0.1:7890
   git config --global https.proxy http://127.0.0.1:7890
   ```

2. **推送**
   ```bash
   cd "C:\Users\yushu\Desktop\bk\911-86887ec382a82d9038e8df20f97a4d0e5ef02a56"
   git push origin main
   ```

3. **取消代理**（推送后）
   ```bash
   git config --global --unset http.proxy
   git config --global --unset https.proxy
   ```

---

## 验证上传成功

无论使用哪种方法，上传后请验证：

1. **访问GitHub仓库**
   https://github.com/yushuo1991/bkyushuo

2. **检查文件**
   - 查看 `src/lib/utils.ts` - getTodayString函数应该使用Intl API
   - 查看 `src/lib/enhanced-trading-calendar.ts` - 时区判断应该使用Intl API

3. **查看Actions部署**
   - 点击 "Actions" 标签
   - 应该看到自动部署任务开始运行
   - 等待约3-5分钟完成部署

4. **验证修复效果**
   - 访问：https://bk.yushuo.click
   - 检查是否显示最新日期的数据

---

## 推荐方案

**最简单：** 方法一（GitHub Desktop）
**最快速：** 方法三（切换网络后命令行推送）
**最稳妥：** 方法二（网页端手动上传核心文件）

---

## 快速参考 - 修改的代码位置

### src/lib/utils.ts (第291-308行)
```typescript
export function getTodayString(): string {
  // v4.8.27修复：使用Intl API正确获取北京时间日期
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

### src/lib/enhanced-trading-calendar.ts (第245-274行)
```typescript
  // v4.8.27修复：使用Intl API正确获取北京时间和小时数
  const now = new Date();

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
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const beijingDateStr = `${year}-${month}-${day}`;

  const isToday = beijingDateStr === endDate;
  const shouldIncludeToday = isToday && beijingHour >= 16;

  console.log(`[7天交易日] 北京时间: ${now.toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}, 小时: ${beijingHour}, 北京日期: ${beijingDateStr}, 是否包含当天: ${shouldIncludeToday}`);
```

---

**需要帮助？** 如果上传过程遇到问题，请告诉我具体步骤和错误信息。
