# 📦 宇硕板块节奏 - 备份操作指南

**创建时间**: 2024-09-24 当前
**适用版本**: v1.1+ 及后续版本

---

## 🎯 推荐备份策略：Git版本控制

### ⚡ 日常备份（最方便）
```bash
# 1. 添加所有更改
git add .

# 2. 提交更改
git commit -m "功能描述

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# 3. 重要版本打标签
git tag v1.x-功能名称
```

### 🔄 版本回滚（秒级操作）
```bash
# 查看所有可用版本
git tag

# 回滚到指定版本
git checkout v1.0-stable        # 基础稳定版
git checkout v1.1-popup-optimization  # 弹窗优化版
git checkout v1.1.1-datefix-hotfix   # 日期修复版

# 回到最新开发版本
git checkout main
```

### 📊 版本对比
```bash
# 对比两个版本差异
git diff v1.0-stable v1.1-popup-optimization

# 查看提交历史
git log --oneline --graph

# 查看文件修改历史
git log --follow src/app/page.tsx
```

---

## 🔧 实用备份命令

### 快速备份脚本
```bash
# 保存为 backup.sh
git add .
git commit -m "$(date '+%Y-%m-%d %H:%M') 功能更新备份"
git tag "v$(date '+%y%m%d-%H%M')-backup"
echo "✅ 备份完成: $(git describe --tags)"
```

### 紧急恢复脚本
```bash
# 保存为 restore.sh
echo "📋 可用版本:"
git tag
echo "💡 使用方法: git checkout [版本名]"
echo "💡 回到最新: git checkout main"
```

---

## 🎨 版本命名规范

### 标准格式
- `v[主版本].[次版本]-[功能描述]`
- `v1.0-stable` (稳定基础版)
- `v1.1-popup-optimization` (弹窗优化版)
- `v1.1.1-datefix-hotfix` (日期修复版)

### 特殊版本
- `hotfix` - 紧急修复
- `stable` - 稳定版本
- `experimental` - 实验功能
- `backup` - 日常备份

---

## 🏆 为什么Git比本地备份更方便？

### ✅ Git版本控制优势
- **秒级回滚**: `git checkout v1.0-stable`
- **增量存储**: 只保存差异，节省空间
- **完整历史**: 每次修改都有详细记录
- **版本对比**: 轻松查看版本间差异
- **分支管理**: 支持实验性功能开发
- **远程备份**: 可推送到GitHub等云端

### ❌ 本地文件备份缺点
- **手动操作**: 需要手动复制粘贴文件夹
- **空间占用**: 每个备份都是完整副本
- **版本混乱**: 容易忘记哪个文件夹是什么版本
- **无历史**: 不知道具体修改了什么
- **恢复复杂**: 需要手动替换文件

---

## 🚀 立即行动建议

### 当前待办
1. **提交最新修复**: 日期错误修复功能
2. **创建修复标签**: v1.1.1-datefix-hotfix
3. **保存操作指南**: 本文档作为参考

### 未来习惯
- 每次重要功能完成后立即 `git commit`
- 里程碑版本使用 `git tag` 标记
- 实验性功能在单独分支开发
- 定期推送到远程仓库备份

---

**🤖 Generated with Claude Code**
**📦 备份策略**: Git版本控制 + 技术文档
**⚡ 操作效率**: 秒级回滚，最高便捷性