# Docker构建错误修复指南

## 错误原因分析

**错误信息**:
```
Error: x Unexpected token `div`. Expected jsx identifier
   ,-[/app/src/app/page.tsx:615:1]
615 |   }
616 |
617 |   return (
618 |     <div className="min-h-screen bg-gray-50 p-3">
     :      ^^^
```

**问题根源**:
- Git传输过程中文件编码或换行符被损坏
- 服务器上的 `page.tsx` 文件在第618行附近出现不可见字符或编码问题
- 这是Windows(CRLF)和Linux(LF)换行符不兼容导致的常见问题

---

## 🚨 手动修复方案 (推荐)

### 方案1: 服务器端Git配置修复

在服务器终端执行以下命令:

```bash
# 1. 进入项目目录
cd /www/wwwroot/stock-tracker

# 2. 配置Git使用LF换行符
git config core.autocrlf input
git config core.eol lf

# 3. 重置所有文件，强制使用LF
git rm --cached -r .
git reset --hard HEAD

# 4. 重新拉取代码
git pull origin main

# 5. 重新构建
docker compose build --no-cache

# 6. 启动服务
docker compose up -d

# 7. 查看状态
docker compose ps
```

---

### 方案2: 本地修复后重新推送

如果方案1不行，在本地执行:

```bash
# 1. 配置Git换行符
git config core.autocrlf false
git config core.eol lf

# 2. 转换所有文件为LF
git add --renormalize .

# 3. 提交
git commit -m "fix: normalize line endings to LF

修复Git换行符问题，确保Linux服务器兼容性

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 4. 推送
git push origin main
```

然后在服务器执行:
```bash
cd /www/wwwroot/stock-tracker
git pull origin main
docker compose build --no-cache
docker compose up -d
```

---

### 方案3: 直接在服务器创建干净文件

在服务器执行:

```bash
# 1. 删除有问题的缓存
cd /www/wwwroot/stock-tracker
rm -rf .next node_modules

# 2. 从GitHub重新克隆(最干净的方式)
cd /www/wwwroot
mv stock-tracker stock-tracker-backup-$(date +%Y%m%d)
git clone https://github.com/yushuo1991/911.git stock-tracker

# 3. 进入项目
cd stock-tracker

# 4. 构建
docker compose build --no-cache

# 5. 启动
docker compose up -d
```

---

## 🔍 问题诊断命令

### 检查文件换行符类型
```bash
cd /www/wwwroot/stock-tracker
file src/app/page.tsx
# 输出应该是: ASCII text, with very long lines (xxx)
# 如果包含 "CRLF" 说明换行符有问题
```

### 查看Git配置
```bash
git config --list | grep -E "autocrlf|eol"
```

### 检查Docker构建详细错误
```bash
docker compose build 2>&1 | grep -A 20 "page.tsx"
```

---

## ⚙️ 预防措施

### 在项目根目录创建 `.gitattributes` 文件

创建文件 `/www/wwwroot/stock-tracker/.gitattributes`，内容:

```
# 自动检测文本文件并规范化
* text=auto

# 强制使用LF换行符的文件
*.ts text eol=lf
*.tsx text eol=lf
*.js text eol=lf
*.jsx text eol=lf
*.json text eol=lf
*.md text eol=lf
*.yml text eol=lf
*.yaml text eol=lf

# 二进制文件
*.png binary
*.jpg binary
*.gif binary
*.ico binary
*.woff binary
*.woff2 binary
```

然后提交:
```bash
git add .gitattributes
git commit -m "chore: add .gitattributes to enforce LF line endings"
git push origin main
```

---

## 📊 快速诊断脚本

保存为 `diagnose-build-error.sh`:

```bash
#!/bin/bash
echo "=== 构建错误诊断 ==="
echo ""

echo "1. 检查文件编码:"
file src/app/page.tsx

echo ""
echo "2. 检查Git配置:"
git config --list | grep -E "autocrlf|eol"

echo ""
echo "3. 检查换行符:"
cat -A src/app/page.tsx | head -20

echo ""
echo "4. 尝试清理构建:"
rm -rf .next node_modules
echo "✓ 已清理 .next 和 node_modules"

echo ""
echo "5. 建议操作:"
echo "   - 运行: git config core.autocrlf input"
echo "   - 运行: git reset --hard HEAD"
echo "   - 运行: git pull origin main"
echo "   - 运行: docker compose build --no-cache"
```

---

## 🎯 推荐执行顺序

1. **先尝试方案1** (最快，不需要重新克隆)
2. 如果方案1失败，尝试**方案3** (最彻底)
3. 如果问题持续，使用**诊断脚本**定位具体问题

---

## ✅ 验证修复成功

构建成功后，检查:

```bash
# 1. 查看容器状态
docker compose ps
# 应该看到所有容器都在运行 (Up)

# 2. 查看日志
docker compose logs -f --tail=50

# 3. 测试访问
curl http://localhost:3000
# 或访问 http://bk.yushuo.click
```

---

## 📞 如果所有方案都失败

请提供以下信息:

1. `file src/app/page.tsx` 的完整输出
2. `git config --list` 的输出
3. `docker compose build` 的完整错误日志
4. 服务器操作系统版本: `uname -a`

---

**生成时间**: 2025-10-16 09:00
**问题模块**: Docker构建 / Git换行符
**影响范围**: Next.js编译失败
**解决难度**: ⭐⭐☆☆☆ (中等)
