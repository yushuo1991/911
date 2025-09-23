# 宝塔面板Docker部署指南

## 📋 系统要求

- **服务器**: Linux系统 (CentOS 7+/Ubuntu 18.04+)
- **宝塔面板**: 7.7.0+ 版本
- **Docker**: 已安装Docker和Docker Compose
- **端口**: 确保3000端口可用

## 🚀 快速部署步骤

### 1. 准备工作

在宝塔面板中安装Docker管理器:
- 进入宝塔面板 → 软件商店 → Docker管理器 → 安装

### 2. 上传项目文件

将项目文件上传到服务器，推荐位置:
```bash
/www/wwwroot/stock-tracker/
```

### 3. 一键部署

在项目目录执行部署脚本:
```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. 宝塔面板反向代理配置

在宝塔面板中设置反向代理:

1. **创建网站**:
   - 域名: your-domain.com (或子域名)
   - 根目录: 随意选择一个目录

2. **配置反向代理**:
   - 进入网站设置 → 反向代理 → 添加反向代理
   - 代理名称: stock-tracker
   - 目标URL: http://127.0.0.1:3000
   - 发送域名: $host
   - 保存配置

3. **SSL证书** (可选):
   - 网站设置 → SSL → Let's Encrypt → 申请免费证书

## 📊 使用Docker Compose部署

也可以使用Docker Compose进行部署:

```bash
# 构建并启动
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 🔧 常用管理命令

### 容器管理
```bash
# 查看容器状态
docker ps | grep stock-tracker

# 查看实时日志
docker logs -f stock-tracker-app

# 重启容器
docker restart stock-tracker-app

# 进入容器
docker exec -it stock-tracker-app sh

# 停止容器
docker stop stock-tracker-app
```

### 镜像管理
```bash
# 查看镜像
docker images | grep stock-tracker

# 删除镜像
docker rmi stock-tracker

# 清理无用镜像
docker image prune -f
```

## 🌐 域名配置

### 主域名部署
如果要在主域名部署 (如: yushuo.click):
- 反向代理目标URL: http://127.0.0.1:3000
- 配置根路径代理: /

### 子域名部署
如果要在子域名部署 (如: stock.yushuo.click):
- 创建子域名网站
- 反向代理目标URL: http://127.0.0.1:3000

### 子目录部署
如果要在子目录部署 (如: yushuo.click/stock):
- 反向代理路径: /stock
- 目标URL: http://127.0.0.1:3000
- 需要修改Next.js配置的basePath

## 🔄 更新部署

当需要更新应用时:

1. **拉取最新代码**:
   ```bash
   git pull origin main
   ```

2. **重新部署**:
   ```bash
   ./deploy.sh
   ```

## 📝 环境变量配置

在.env文件中配置必要的环境变量:
```env
NODE_ENV=production
TUSHARE_TOKEN=your_tushare_token_here
```

## 🐛 故障排除

### 1. 容器无法启动
```bash
# 查看详细日志
docker logs stock-tracker-app

# 检查端口占用
netstat -tlnp | grep 3000
```

### 2. 网站无法访问
- 检查防火墙是否开放3000端口
- 确认反向代理配置正确
- 检查容器是否正常运行

### 3. API数据获取失败
- 确认.env文件中的TUSHARE_TOKEN正确
- 检查服务器网络连接
- 查看应用日志排查API调用问题

## 📊 性能优化

### 1. 资源限制
```bash
# 限制容器资源使用
docker run -d \
  --name stock-tracker-app \
  --memory="512m" \
  --cpus="1" \
  -p 3000:3000 \
  stock-tracker
```

### 2. 日志管理
```bash
# 设置日志大小限制
docker run -d \
  --name stock-tracker-app \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  -p 3000:3000 \
  stock-tracker
```

## ✅ 部署完成检查

部署完成后，访问你的域名，确认:
- [x] 页面正常加载
- [x] 股票数据能正常获取
- [x] 日期选择功能正常
- [x] K线图弹窗正常显示
- [x] 板块分析图表正常

---

**技术支持**: 如有问题请检查容器日志或联系技术支持