# Vercel部署指南

## 📋 部署前准备

### 1. 确保项目完整性
检查项目文件是否齐全：
```
stock-tracker-vercel/
├── src/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── README.md
```

### 2. 环境变量准备
- Tushare Token: `2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211`

## 🚀 部署步骤

### 方法一: 通过Vercel CLI部署

1. **安装Vercel CLI**
```bash
npm i -g vercel
```

2. **登录Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
cd stock-tracker-vercel
vercel
```

4. **配置环境变量**
```bash
vercel env add TUSHARE_TOKEN
# 输入: 2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211
```

5. **重新部署**
```bash
vercel --prod
```

### 方法二: 通过Vercel Dashboard部署

1. **上传代码到GitHub**
```bash
git init
git add .
git commit -m "Initial commit: 涨停板跟踪系统"
git remote add origin <你的GitHub仓库地址>
git push -u origin main
```

2. **连接Vercel**
- 访问 [vercel.com](https://vercel.com)
- 登录并点击 "New Project"
- 从GitHub导入项目
- 选择 `stock-tracker-vercel` 仓库

3. **配置环境变量**
在项目设置中添加：
```
TUSHARE_TOKEN = 2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211
```

4. **触发部署**
- 点击 "Deploy" 按钮
- 等待部署完成

## 🔧 部署配置说明

### vercel.json 配置
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "src/app/api/stocks/route.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "TUSHARE_TOKEN": "@tushare-token"
  }
}
```

### 重要配置项说明
- `maxDuration: 30`: API函数最大执行时间30秒
- `env`: 环境变量配置
- `routes`: API路由配置

## 🌐 域名配置

### 使用Vercel提供的域名
部署完成后，Vercel会自动分配一个域名，格式为：
`https://your-project-name.vercel.app`

### 绑定自定义域名
1. 在Vercel Dashboard中选择项目
2. 进入 "Settings" -> "Domains"
3. 添加你的域名
4. 按照指引配置DNS记录

## 📊 性能优化

### 1. 静态资源优化
- 图片使用Next.js Image组件
- CSS自动压缩和优化
- JavaScript代码分割

### 2. API优化
- 设置适当的缓存策略
- 使用Edge Functions加速
- 异常处理和超时控制

### 3. 数据库优化（如需要）
- 考虑使用Vercel KV存储缓存
- 数据请求优化和去重

## 🔍 问题排查

### 常见部署问题

1. **构建失败**
```bash
# 检查依赖
npm install

# 本地构建测试
npm run build
```

2. **API调用失败**
- 检查环境变量是否正确设置
- 验证API接口是否可访问
- 查看Vercel函数日志

3. **样式不显示**
- 确认Tailwind CSS配置正确
- 检查CSS导入路径

### 调试命令
```bash
# 本地开发模式
npm run dev

# 类型检查
npm run type-check

# 构建测试
npm run build
npm run start
```

## 📈 监控和分析

### Vercel Analytics
在Vercel Dashboard中启用：
- Real User Monitoring (RUM)
- Web Vitals监控
- 访问统计分析

### 日志监控
- 查看函数执行日志
- 监控API响应时间
- 错误率统计

## 🔄 CI/CD流程

### 自动部署设置
1. **生产环境**: `main` 分支自动部署
2. **预览环境**: Pull Request自动创建预览版本
3. **开发环境**: `dev` 分支部署到staging环境

### GitHub Actions (可选)
创建 `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🛡️ 安全配置

### 环境变量安全
- 敏感信息使用Vercel Secrets
- 生产环境和开发环境分离
- 定期更换API密钥

### CORS配置
```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
        ],
      },
    ]
  },
}
```

## 📱 移动端优化

### PWA配置（可选）
添加PWA支持：
```bash
npm install next-pwa
```

### 响应式设计验证
- 测试不同设备尺寸
- 验证触摸操作体验
- 检查加载性能

## 🎯 部署清单

部署前检查：
- [ ] 代码无语法错误
- [ ] 本地构建成功
- [ ] API接口测试通过
- [ ] 环境变量配置正确
- [ ] 响应式设计测试
- [ ] 性能测试通过
- [ ] SEO优化完成

部署后验证：
- [ ] 网站可正常访问
- [ ] API功能正常
- [ ] 数据加载正确
- [ ] 移动端适配良好
- [ ] 错误处理正常

---

## 🆘 获取帮助

如遇到问题：
1. 查看Vercel官方文档
2. 检查项目GitHub Issues
3. 联系项目维护者

**祝部署顺利！🎉**