# v4.8.26 时区Bug修复 - 完整部署指南

## 📋 修复概要

**问题**: 16点（下午4点）后访问网站，当天数据不刷新，仍显示前一天的数据  
**根本原因**: 时区转换逻辑错误，服务器在北京时区时直接加8小时导致时间计算错误  
**修复版本**: v4.8.26  
**修复日期**: 2025-11-05

---

## 🐛 问题分析

### Bug根源

**错误代码** (v4.8.18):
```typescript
// src/lib/utils.ts
const date = new Date();
const beijingDate = new Date(date.getTime() + (8 * 60 * 60 * 1000)); // ❌ 错误
```

**问题**: 如果服务器已经在北京时区（UTC+8），直接加8小时会变成UTC+16，导致：
- 北京时间16:00 → 错误计算为次日00:00
- 时间判断失败，认为还不到16点
- 不包含当天数据 ❌

### 修复方案

**正确代码** (v4.8.26):
```typescript
const date = new Date();
const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000); // 先转UTC
const beijingTime = utcTime + (8 * 60 * 60 * 1000); // 再加8小时
const beijingDate = new Date(beijingTime);
```

**原理**: 无论服务器在哪个时区，都先转换到UTC基准，再计算北京时间

---

## 📝 修改文件清单

### 1. `src/lib/utils.ts`
- **修改函数**: `getTodayString()`
- **修改内容**: 修正时区转换逻辑

### 2. `src/lib/enhanced-trading-calendar.ts`
- **修改函数**: `get7TradingDaysFromCalendar()`
- **修改内容**: 
  - 修正时区转换逻辑
  - 时间阈值从17:00改为16:00
  - 更新所有相关注释

### 3. 新增文档
- `TIMEZONE-BUG-FIX-REPORT.md` - 详细技术报告
- `DEPLOY-v4.8.26-COMMANDS.txt` - 部署命令清单
- `deploy-v4.8.26-timezone-fix.js` - 自动部署脚本
- `README-v4.8.26-DEPLOY.md` - 本文档

---

## 🚀 部署步骤

### 步骤1: 提交代码到GitHub

#### 方法A: 使用命令行 (如果有git)

```bash
cd C:\Users\yushu\Desktop\bk\911-86887ec382a82d9038e8df20f97a4d0e5ef02a56

# 添加修改的文件
git add src/lib/utils.ts
git add src/lib/enhanced-trading-calendar.ts
git add TIMEZONE-BUG-FIX-REPORT.md
git add DEPLOY-v4.8.26-COMMANDS.txt
git add deploy-v4.8.26-timezone-fix.js
git add README-v4.8.26-DEPLOY.md

# 提交
git commit -m "fix(timezone): 修复时区转换bug，16点后数据不刷新问题 v4.8.26

- 修复时区转换逻辑，正确处理服务器时区偏移
- 时间阈值从17:00调整为16:00
- 修复16点后数据不刷新的问题
- 影响文件: src/lib/utils.ts, src/lib/enhanced-trading-calendar.ts"

# 推送到GitHub
git push origin main
```

#### 方法B: 使用GitHub网页 (如果没有git命令)

1. 访问 https://github.com/yushuo1991/911
2. 点击 `src/lib/utils.ts` 文件
3. 点击编辑按钮（铅笔图标）
4. 找到 `getTodayString()` 函数（约291行）
5. 替换为修复后的代码：

```typescript
export function getTodayString(): string {
  // v4.8.26修复：正确处理北京时间转换，考虑服务器时区
  // 先转换到UTC基准，再加上北京时区偏移（UTC+8）
  const date = new Date();
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000); // 转换为UTC
  const beijingTime = utcTime + (8 * 60 * 60 * 1000); // UTC + 8小时 = 北京时间
  const beijingDate = new Date(beijingTime);
  return beijingDate.toISOString().split('T')[0];
}
```

6. 提交更改
7. 对 `src/lib/enhanced-trading-calendar.ts` 文件重复相同操作

---

### 步骤2: 服务器部署

#### 🎯 一键部署命令 (推荐)

SSH登录服务器并执行：

```bash
ssh root@yushuo.click
```

密码: `gJ75hNHdy90TA4qGo9`

登录后，复制粘贴以下完整命令：

```bash
cd /www/wwwroot/stock-tracker && \
mkdir -p /www/backup/stock-tracker && \
tar -czf /www/backup/stock-tracker/backup-before-v4.8.26-$(date +%Y%m%d-%H%M%S).tar.gz --exclude=node_modules --exclude=.next . 2>/dev/null && \
echo "✓ 备份完成" && \
git stash && \
git pull origin main && \
echo "" && \
echo "=== 最新提交信息 ===" && \
git log -1 --pretty=format:"提交: %h%n说明: %s" && \
echo "" && \
echo "" && \
docker compose down && \
docker compose build --no-cache && \
docker compose up -d && \
echo "等待30秒..." && \
sleep 30 && \
docker compose ps && \
echo "" && \
echo "✅ 部署完成！访问 http://bk.yushuo.click"
```

#### 📋 分步部署命令 (如果上面的命令失败)

```bash
# 1. 进入项目目录
cd /www/wwwroot/stock-tracker

# 2. 备份当前版本
mkdir -p /www/backup/stock-tracker
tar -czf /www/backup/stock-tracker/backup-$(date +%Y%m%d-%H%M%S).tar.gz --exclude=node_modules --exclude=.next .

# 3. 拉取最新代码
git stash
git pull origin main

# 4. 查看更新内容
git log -1

# 5. 停止容器
docker compose down

# 6. 重新构建（清除缓存）
docker compose build --no-cache

# 7. 启动容器
docker compose up -d

# 8. 等待启动
sleep 30

# 9. 检查状态
docker compose ps
docker compose logs --tail=30 app
```

---

## ✅ 验证部署

### 1. 服务器验证

```bash
# 检查容器状态
docker compose ps

# 检查服务响应
curl -I http://localhost:3002

# 查看日志（确认时区逻辑）
docker compose logs --tail=50 app | grep "7天交易日"
```

**预期日志输出**:
```
[7天交易日] 北京时间: 2025-11-05T08:00:00.000Z, 小时: 16, 北京日期: 2025-11-05, 是否包含当天: true
[7天交易日] 当前时间>=16:00，包含当天
```

### 2. 浏览器验证

1. 访问 http://bk.yushuo.click
2. 按 `Ctrl + Shift + R` 强制刷新（清除缓存）
3. 检查显示的最新日期：
   - **16:00前**: 应显示前一交易日
   - **16:00后**: 应显示当天日期 ✅

### 3. 开发者工具验证

1. 按 `F12` 打开浏览器开发者工具
2. 切换到 `Console` 标签
3. 查找包含 `[7天交易日]` 的日志
4. 确认显示:
   - `北京时间` 正确
   - `小时` 数值正确（16-23之间）
   - `是否包含当天: true`

---

## 🎯 预期行为

| 访问时间 | 显示数据 | 说明 |
|---------|---------|------|
| 15:00-15:59 | 前一交易日 | 收盘前，数据未完整 ✓ |
| 16:00-23:59 | 当天数据 | 收盘后，数据已完整 ✓ |
| 周末/节假日 | 最近交易日 | 自动跳过非交易日 ✓ |

---

## 🔄 回滚方案

### 如果部署后出现问题，执行回滚：

#### 方法1: Git回滚
```bash
cd /www/wwwroot/stock-tracker
git log --oneline -5  # 查看最近5次提交
git revert HEAD  # 回滚最后一次提交
git push origin main
docker compose down && docker compose build && docker compose up -d
```

#### 方法2: 恢复备份
```bash
cd /www/backup/stock-tracker
ls -lht | head -5  # 查看最近的备份
# 找到 backup-before-v4.8.26-XXXXXXXX.tar.gz

# 恢复备份
tar -xzf backup-before-v4.8.26-XXXXXXXX.tar.gz -C /www/wwwroot/stock-tracker/
cd /www/wwwroot/stock-tracker
docker compose down && docker compose build && docker compose up -d
```

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| `TIMEZONE-BUG-FIX-REPORT.md` | 详细技术分析报告 |
| `DEPLOY-v4.8.26-COMMANDS.txt` | 部署命令速查表 |
| `diagnose-date-issue.md` | 原始问题诊断 |
| `diagnose-timezone-issue.js` | 时区测试脚本 |

---

## 🆘 故障排查

### 问题1: Git拉取失败
```bash
git stash  # 暂存本地修改
git reset --hard origin/main  # 强制重置
git pull origin main
```

### 问题2: Docker构建失败
```bash
docker system prune -a  # 清理Docker缓存
docker compose build --no-cache
```

### 问题3: 容器无法启动
```bash
docker compose logs app  # 查看错误日志
docker compose down
docker compose up  # 不加-d，查看启动过程
```

### 问题4: 服务无响应
```bash
docker compose ps  # 确认容器运行
netstat -tlnp | grep 3002  # 确认端口监听
docker compose restart app  # 重启应用
```

---

## 📞 技术支持

**修复人员**: Claude AI Assistant  
**修复日期**: 2025-11-05  
**版本号**: v4.8.26  
**访问地址**: http://bk.yushuo.click

**重要提示**: 
- 部署后建议在16:00-16:10期间验证数据刷新
- 务必清除浏览器缓存（Ctrl+Shift+R）
- 查看浏览器控制台日志确认时区判断正确

---

## ✨ 版本历史

- **v4.8.18** - 引入时区bug（直接加8小时）
- **v4.8.22** - 调整时间阈值为17:00
- **v4.8.26** - 修复时区bug + 调整阈值为16:00 ✅ **当前版本**

---

**部署状态**: ⏳ 等待执行  
**风险等级**: 🟢 低风险  
**预估时间**: 5-10分钟

