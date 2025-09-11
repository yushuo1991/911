# 涨停板跟踪系统 - Vercel部署版

基于Next.js 14构建的现代化涨停板跟踪系统，支持实时数据查询和可视化展示。

## ✨ 功能特性

- 📅 **历史日期查询** - 支持查询任意历史交易日的涨停数据
- 📊 **板位排序** - 按板位高低自动排序（高板位优先显示）
- 🎯 **分类展示** - 按涨停原因自动分类（人工智能、新能源汽车等）
- 📈 **表现跟踪** - 显示后续5个交易日的涨跌幅表现
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 💨 **实时加载** - 快速数据获取和展示
- 📥 **数据下载** - 支持JSON格式数据导出

## 🚀 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React  
- **部署**: Vercel
- **数据源**: 龙虎榜API + Tushare

## 📦 快速开始

### 1. 克隆项目
```bash
git clone <项目地址>
cd stock-tracker-vercel
```

### 2. 安装依赖
```bash
npm install
# 或
yarn install
```

### 3. 环境配置
```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 文件，配置必要的环境变量：
```env
TUSHARE_TOKEN=你的tushare_token
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🌐 Vercel部署

### 一键部署
点击下方按钮一键部署到Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/stock-tracker-vercel)

### 手动部署
1. 在Vercel中导入项目
2. 配置环境变量：
   - `TUSHARE_TOKEN`: 你的Tushare API Token
3. 点击部署

## 📁 项目结构

```
stock-tracker-vercel/
├── src/
│   ├── app/                 # App Router目录
│   │   ├── api/            # API路由
│   │   │   └── stocks/     # 股票数据API
│   │   ├── globals.css     # 全局样式
│   │   ├── layout.tsx      # 布局组件
│   │   └── page.tsx        # 首页
│   ├── components/         # React组件
│   │   └── StockTracker.tsx # 主要组件
│   ├── lib/                # 工具函数
│   │   └── utils.ts        # 通用工具
│   └── types/              # TypeScript类型定义
│       └── stock.ts        # 股票相关类型
├── package.json            # 项目配置
├── next.config.js          # Next.js配置
├── tailwind.config.js      # Tailwind配置
└── tsconfig.json          # TypeScript配置
```

## 🔧 API接口

### GET /api/stocks

查询指定日期的涨停股票数据。

**参数:**
- `date`: 查询日期，格式为 `YYYY-MM-DD`

**响应:**
```json
{
  "success": true,
  "data": {
    "date": "2024-03-15",
    "trading_days": ["20240318", "20240319", "..."],
    "categories": {
      "人工智能": [
        {
          "name": "科大讯飞",
          "code": "002230.SZ",
          "td_type": "首板",
          "performance": {
            "20240318": 3.2,
            "20240319": -1.5
          },
          "total_return": 8.5
        }
      ]
    },
    "stats": {
      "total_stocks": 45,
      "category_count": 8,
      "profit_ratio": 67.5
    }
  }
}
```

## 🎨 主要功能

### 日期选择
- 支持选择任意历史交易日
- 自动验证日期有效性
- 限制最大日期为当天

### 数据展示
- **股票信息**: 名称、代码
- **板位标识**: 首板、二板、三板等，不同颜色区分
- **后续表现**: 5个交易日的涨跌幅，绿色上涨红色下跌
- **总收益**: 5日累计收益率

### 排序规则
- 同一分类内按板位高低排序
- 板位越高越靠前显示
- 相同板位按股票名称排序

### 响应式设计
- 桌面端：表格形式展示
- 移动端：卡片形式展示
- 自适应布局，完美适配各种屏幕

## 🔍 数据来源

1. **涨停个股数据**: 龙虎榜API
   - 实时获取当日涨停股票
   - 包含股票名称、代码、板位、涨停原因
   
2. **历史价格数据**: Tushare Pro
   - 获取股票历史交易数据
   - 计算后续交易日涨跌幅

3. **容错机制**: 
   - API失败时使用模拟数据
   - 确保系统始终可用

## 📊 统计信息

系统自动计算并展示：
- 涨停个股总数
- 涨停原因分类数量
- 5日内盈利比例

## 🎯 未来规划

- [ ] 增加更多数据源
- [ ] 添加图表可视化
- [ ] 支持自定义跟踪天数
- [ ] 添加预警功能
- [ ] 增加历史统计分析

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 支持

如有问题，请通过以下方式联系：
- 提交GitHub Issue
- 发送邮件到项目维护者

---

**注意**: 本系统仅供学习和研究使用，不构成投资建议。投资有风险，入市需谨慎。