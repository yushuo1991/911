# 股票追踪系统v4.2 - 宝塔面板部署总结

## 🎯 部署方案完成

已为您创建了完整的宝塔面板部署解决方案，包含以下文件：

### 📋 核心文件

1. **baota-deploy.sh** - 一键自动部署脚本
2. **server-env-check.sh** - 服务器环境检测脚本
3. **log/baota-deployment-guide.md** - 详细部署指南文档

## 🚀 部署步骤（推荐）

### 快速部署（自动化）
```bash
# 1. 连接到您的服务器
ssh root@your-server-ip

# 2. 下载部署脚本
wget https://raw.githubusercontent.com/shishen168/stock-tracker/main/baota-deploy.sh
chmod +x baota-deploy.sh

# 3. 执行部署
sudo ./baota-deploy.sh
```

### 部署前环境检测（建议）
```bash
# 先运行环境检测脚本
wget https://raw.githubusercontent.com/shishen168/stock-tracker/main/server-env-check.sh
chmod +x server-env-check.sh
./server-env-check.sh
```

## 📊 系统架构解析

### 核心模块说明

1. **Next.js应用模块**
   - 功能: 前端界面和API接口
   - 端口: 3002
   - 进程管理: PM2

2. **Nginx反向代理模块**
   - 功能: 请求转发和静态资源服务
   - 配置: 支持子路径 `/cc` 访问
   - SSL: 支持HTTPS证书配置

3. **SQLite数据库模块**
   - 功能: 本地数据存储
   - 位置: `./data/stock_tracker.db`
   - 优势: 轻量级，无需额外数据库服务

4. **定时任务模块**
   - 功能: 股票数据自动更新
   - API: `/api/cron`, `/api/scheduler`
   - 数据源: Tushare API

## 🔧 关键技术点

### 影响分析
- **Nginx模块**: 处理HTTP请求路由，影响访问速度和稳定性
- **PM2模块**: 进程守护和监控，影响应用可靠性
- **数据库模块**: SQLite本地存储，影响数据查询性能
- **API模块**: Tushare数据接口，影响股票数据更新

### 解决的问题
1. **子路径部署**: 配置Nginx支持 `yushuo.click/cc` 访问
2. **进程管理**: PM2确保应用自动重启和监控
3. **静态资源**: 优化Next.js静态文件缓存策略
4. **SSL支持**: 自动适配HTTPS证书配置

## 📁 部署后的目录结构
```
/www/wwwroot/yushuo.click/cc/
├── .next/                 # Next.js构建输出
├── src/                   # 源代码
├── data/                  # SQLite数据库
├── log/                   # 应用日志
├── .env.local            # 环境配置
├── package.json          # 项目配置
├── ecosystem.config.js   # PM2配置
└── node_modules/         # 依赖包
```

## 🎛️ 宝塔面板操作

### 1. 网站管理
- 添加站点: `yushuo.click`
- 配置SSL证书（推荐）
- 设置域名解析

### 2. 软件管理
- 安装Node.js 18+
- 安装PM2管理器（可选）
- 确保Nginx运行正常

### 3. 文件管理
- 项目目录: `/www/wwwroot/yushuo.click/cc`
- 可通过面板直接编辑配置文件
- 支持在线查看日志文件

## 🔍 监控与维护

### 应用监控命令
```bash
# 查看PM2进程状态
pm2 status

# 查看应用日志
pm2 logs stock-tracker-v42

# 重启应用
pm2 restart stock-tracker-v42

# 查看系统资源
pm2 monit
```

### 故障排除
1. **应用无法启动**: 检查PM2日志和环境变量
2. **页面404错误**: 检查Nginx配置和域名解析
3. **数据获取失败**: 验证Tushare API Token有效性
4. **性能问题**: 监控服务器资源使用情况

## 🔄 更新流程

```bash
cd /www/wwwroot/yushuo.click/cc
git pull origin main
npm install
npm run build
pm2 restart stock-tracker-v42
```

## 📞 技术支持

- **访问地址**: https://yushuo.click/cc
- **项目仓库**: https://github.com/shishen168/stock-tracker
- **部署日志**: 保存在 `log/` 目录下
- **问题反馈**: GitHub Issues

---

**🎉 部署方案已准备就绪，请按照上述步骤在服务器上执行部署！**