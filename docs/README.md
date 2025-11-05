# 📚 Stock Tracker 项目文档

欢迎查阅 Stock Tracker 项目文档！本目录包含所有项目相关的文档。

## 📖 文档导航

### 🚀 快速开始

**新手必看：**
- [⚡ 快速开始指南](./QUICK-START.md) - 5分钟快速上手，最常用命令

### 📘 核心文档

**推荐按顺序阅读：**

1. [📋 项目 README](../README.md) - 项目总览和功能介绍
2. [🚀 部署指南](./DEPLOY.md) - 完整的部署和更新说明
3. [📁 项目结构](./PROJECT-STRUCTURE.md) - 详细的文件结构说明
4. [🔒 安全配置](../SECURITY-CONFIG.md) - 安全最佳实践

### 🛠️ 高级文档

**进阶配置：**
- [⚙️ GitHub CLI 设置](./GITHUB-CLI-SETUP.md) - GitHub CLI 详细配置
- [🤖 完全自动化指南](./GitHub-CLI完全自动化指南.md) - 自动化部署深度解析

---

## 📝 文档说明

### ⚡ QUICK-START.md
**适合：** 所有人  
**内容：** 
- 三步更新部署
- 常用命令速查
- 重要链接汇总
- 快速故障排查

**何时查看：**
- 需要快速参考命令
- 忘记如何部署
- 需要快速解决问题

---

### 🚀 DEPLOY.md
**适合：** 部署人员、运维人员  
**内容：**
- 自动化部署系统详解
- 三种更新方法详细说明
- 部署状态监控
- 高级操作（回滚、手动触发等）
- 完整故障排查指南

**何时查看：**
- 首次部署项目
- 需要修改部署配置
- 部署遇到问题
- 需要执行高级操作

---

### 📁 PROJECT-STRUCTURE.md
**适合：** 开发者  
**内容：**
- 完整项目目录结构
- 核心目录详解
- 配置文件说明
- 文件查找指南

**何时查看：**
- 开始开发新功能
- 不知道文件在哪里
- 需要理解项目架构
- 需要修改配置

---

### 🔒 SECURITY-CONFIG.md
**适合：** 运维人员、管理员  
**内容：**
- Token 安全存储
- 密码管理最佳实践
- GitHub Secrets 配置
- 安全检查清单

**何时查看：**
- 设置新的部署环境
- 需要更换密码/Token
- 安全审计
- 遇到安全问题

---

## 🎯 根据场景找文档

### 我想快速更新代码
→ [QUICK-START.md](./QUICK-START.md) 第一部分

### 我想了解如何部署
→ [DEPLOY.md](./DEPLOY.md) 完整阅读

### 部署失败了怎么办
→ [DEPLOY.md - 故障排查](./DEPLOY.md#故障排查)

### 我想开发新功能
→ [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md) + [README](../README.md)

### 我想修改服务器配置
→ [DEPLOY.md - 高级操作](./DEPLOY.md#高级操作)

### 我想配置 GitHub CLI
→ [GITHUB-CLI-SETUP.md](./GITHUB-CLI-SETUP.md)

### 我担心安全问题
→ [SECURITY-CONFIG.md](../SECURITY-CONFIG.md)

---

## 📊 文档更新日志

| 日期 | 文档 | 更新内容 |
|------|------|----------|
| 2025-11-05 | 全部 | 创建完整文档体系 |
| 2025-11-05 | DEPLOY.md | 添加自动部署说明 |
| 2025-11-05 | QUICK-START.md | 创建快速参考指南 |
| 2025-11-05 | PROJECT-STRUCTURE.md | 详细项目结构说明 |

---

## 💡 如何贡献文档

发现文档问题或想要改进？

1. **小修改：** 直接在 GitHub 编辑
   - 访问 https://github.com/yushuo1991/stock-tracker
   - 找到对应文档文件
   - 点击编辑（铅笔图标）
   - 提交修改

2. **大修改：** 创建分支
   ```bash
   git checkout -b docs/improve-deployment-guide
   # 修改文档
   git commit -m "docs: 改进部署指南"
   git push
   # 创建 Pull Request
   ```

---

## 📞 获取帮助

文档没有解决你的问题？

1. **搜索现有问题：**
   https://github.com/yushuo1991/stock-tracker/issues

2. **创建新问题：**
   https://github.com/yushuo1991/stock-tracker/issues/new

3. **查看示例：**
   查看项目中的代码注释

---

## 🔗 外部资源

### 技术文档

- [Next.js 官方文档](https://nextjs.org/docs)
- [React 文档](https://react.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

### 工具文档

- [GitHub CLI 文档](https://cli.github.com/manual/)
- [PM2 文档](https://pm2.keymetrics.io/docs/)
- [Git 文档](https://git-scm.com/doc)

---

## ✨ 快速链接

| 需求 | 文档 | 章节 |
|------|------|------|
| 快速更新代码 | [QUICK-START](./QUICK-START.md) | 三步更新部署 |
| 查看部署状态 | [QUICK-START](./QUICK-START.md) | 查看部署状态 |
| 部署失败排查 | [DEPLOY](./DEPLOY.md) | 故障排查 |
| 修改配置文件 | [PROJECT-STRUCTURE](./PROJECT-STRUCTURE.md) | 配置文件说明 |
| 添加新功能 | [PROJECT-STRUCTURE](./PROJECT-STRUCTURE.md) | 核心目录详解 |
| 回滚版本 | [DEPLOY](./DEPLOY.md) | 高级操作 |
| 安全配置 | [SECURITY-CONFIG](../SECURITY-CONFIG.md) | 全文 |

---

**📖 祝你阅读愉快！有问题随时提 Issue！**

**⚡ 最常用的命令：**
```bash
git add . && git commit -m "update" && git push
```

