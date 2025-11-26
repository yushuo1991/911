# 📈 Stock Tracker - 股票追踪系统

一个基于 Next.js 的实时股票数据追踪和分析系统，支持涨跌幅统计、交易日历、分钟级快照等功能。

## ✨ 主要特性

- 🔄 **实时数据更新**：自动获取股票实时行情数据
- 📊 **性能统计分析**：7日涨跌幅统计、平均值计算
- 📅 **交易日历管理**：自动识别交易日/非交易日
- ⏱️ **分钟级快照**：记录关键时间点的股票数据
- 🎨 **可视化图表**：交互式图表展示股票走势
- 🌐 **自动化部署**：GitHub Actions 自动部署到服务器

## 🚀 技术栈

- **前端框架**：Next.js 14 + React 18
- **样式方案**：Tailwind CSS
- **图表库**：Recharts
- **数据库**：MySQL
- **部署方式**：GitHub Actions + PM2
- **服务器**：Node.js 18+

## 📦 快速开始

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（复制 .env.example 并修改）
cp .env.example .env.local

# 3. 启动开发服务器
npm run dev

# 4. 访问应用
打开浏览器访问 http://localhost:3000
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 🔄 如何更新部署

### 方法 1：Git 命令（推荐）

每次修改代码后，只需三步：

```bash
git add .
git commit -m "描述你的修改"
git push
```

推送后，GitHub Actions 会自动：
- ✅ 构建项目
- ✅ 运行测试
- ✅ 部署到服务器
- ✅ 重启服务

**大约 3-5 分钟后，你的更新就会自动部署到服务器！**

### 方法 2：GitHub 网页编辑

1. 访问 `https://github.com/yushuo1991/stock-tracker`
2. 找到要修改的文件，点击"编辑"（铅笔图标）
3. 修改后点击 "Commit changes"
4. 自动部署！

### 方法 3：使用脚本一键部署

双击运行：`GitHub-CLI自动化.bat`

或命令行：
```powershell
powershell -ExecutionPolicy Bypass -File auto-deploy-github.ps1
```

## 📊 查看部署状态

### 在线查看
访问：https://github.com/yushuo1991/stock-tracker/actions

### 命令行查看
```bash
# 查看最近的部署记录
gh run list --repo yushuo1991/stock-tracker --limit 5

# 实时监控当前部署
gh run watch --repo yushuo1991/stock-tracker
```

## 📁 项目结构

```
stock-tracker/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 自动部署配置
├── src/
│   ├── app/
│   │   ├── api/               # API 路由
│   │   ├── page.tsx           # 主页面
│   │   └── layout.tsx         # 布局组件
│   ├── components/            # React 组件
│   ├── lib/                   # 工具库和数据处理
│   └── types/                 # TypeScript 类型定义
├── docs/                      # 项目文档
├── scripts/                   # 辅助脚本
├── package.json              # 项目依赖配置
└── README.md                 # 项目说明（本文件）
```

## 🔧 配置说明

### 环境变量

在 `.env.local` 中配置以下变量：

```env
# 数据库配置
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=stock_tracker

# API 配置
API_KEY=your-api-key
```

### GitHub Secrets（用于自动部署）

在 GitHub 仓库设置中配置以下 Secrets：

- `SERVER_HOST`: 服务器 IP 地址
- `SERVER_USER`: SSH 用户名
- `SERVER_PASSWORD`: SSH 密码
- `SERVER_PORT`: SSH 端口（默认 22）

## 📖 详细文档

- [部署指南](./docs/DEPLOY.md) - 完整的部署和更新指南
- [开发文档](./docs/DEVELOPMENT.md) - 本地开发环境配置
- [API 文档](./docs/API.md) - API 接口说明
- [安全配置](./SECURITY-CONFIG.md) - 安全最佳实践

## 🐛 故障排查

### 部署失败？

1. 检查 GitHub Actions 日志：https://github.com/yushuo1991/stock-tracker/actions
2. 查看错误信息，常见问题：
   - 构建失败：检查代码语法错误
   - SSH 连接失败：检查服务器密码是否正确
   - 依赖安装失败：检查 package.json 配置

### 本地运行问题？

```bash
# 清理依赖重新安装
rm -rf node_modules package-lock.json
npm install

# 清理构建缓存
rm -rf .next
npm run build
```

## 📝 版本历史

- **v4.21.3** (2025-11-20) - ✅ **里程碑版本**：完成星期几连板内容完整修订
  - 修复连板个股识别问题（中文数字板位转换）
  - 统一星期模态框与板块模态框功能
  - 修复交易日查询范围不足问题
- **v4.20.1** (2025-11-05) - 完善自动化部署，修复时区问题
- **v4.8.26** - 优化交易日历和数据处理逻辑
- **v4.8.18** - 修复北京时间转换问题
- **v4.14** - 稳定版本，添加分钟级快照功能

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License

## 📞 联系方式

- GitHub: [@yushuo1991](https://github.com/yushuo1991)
- 项目仓库：https://github.com/yushuo1991/stock-tracker

---

**⚡ 快速更新代码只需要：`git add . && git commit -m "update" && git push`**




