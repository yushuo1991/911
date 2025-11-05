# ⚡ 快速开始 - 5分钟上手指南

## 🎯 三步更新部署

```bash
git add .
git commit -m "你的修改说明"
git push
```

**就这样！3-5分钟后自动部署完成。**

---

## 📝 常用命令速查

### 本地开发

```bash
npm install        # 安装依赖
npm run dev        # 启动开发服务器 (http://localhost:3000)
npm run build      # 构建生产版本
npm start          # 启动生产服务器
```

### Git 操作

```bash
git status         # 查看修改状态
git add .          # 添加所有修改
git commit -m ""   # 提交修改
git push           # 推送到 GitHub（触发自动部署）
git pull           # 拉取最新代码
git log --oneline  # 查看提交历史
```

### 查看部署状态

```bash
# 在线查看
https://github.com/yushuo1991/stock-tracker/actions

# 命令行查看
gh run list --repo yushuo1991/stock-tracker --limit 5

# 实时监控
gh run watch --repo yushuo1991/stock-tracker
```

---

## 🔗 重要链接

| 项目 | 链接 |
|------|------|
| GitHub 仓库 | https://github.com/yushuo1991/stock-tracker |
| 部署状态 | https://github.com/yushuo1991/stock-tracker/actions |
| 服务器 | ssh root@107.173.154.147 |
| 本地开发 | http://localhost:3000 |

---

## 📂 项目关键目录

```
stock-tracker/
├── src/app/          # 页面和 API 路由
├── src/components/   # React 组件
├── src/lib/          # 工具库和数据处理
├── .github/workflows/# GitHub Actions 配置
└── docs/            # 文档
```

---

## 🆘 快速故障排查

### 部署失败？

1. 访问：https://github.com/yushuo1991/stock-tracker/actions
2. 点击失败的记录查看错误日志
3. 常见问题：
   - 构建失败 → 检查代码语法
   - SSH 失败 → 检查服务器密码
   - 超时 → 重新运行部署

### 本地运行出错？

```bash
# 清理并重新安装
rm -rf node_modules .next
npm install
npm run build
```

---

## 💡 提示

- ✅ 推送前先本地测试：`npm run build`
- ✅ 使用清晰的 commit message
- ✅ 大改动前先创建分支
- ✅ 定期查看部署日志
- ✅ 保持依赖更新：`npm update`

---

## 📚 详细文档

需要更多信息？查看：

- [完整部署指南](./DEPLOY.md)
- [项目 README](../README.md)
- [安全配置](../SECURITY-CONFIG.md)

---

**开始编码吧！🚀**

每次 `git push` 都会自动部署到服务器。

