# 🐳 宝塔面板Docker部署 Stock Tracker 完整指南

## 📋 文件清单

确保上传以下文件到服务器 `/www/wwwroot/stock-tracker/`：

```
stock-tracker/
├── Dockerfile                    # Docker镜像构建文件
├── .env.production               # 生产环境配置
├── src/
│   └── lib/
│       ├── database.ts          # 原始数据库文件
│       └── database-simple.ts   # 简化内存数据库
├── 宝塔Docker部署指南.md         # 本指南文件
└── (其他项目文件...)
```

## 🚀 部署步骤

### 第一步：上传文件
1. 通过宝塔面板 → **文件** 上传项目文件到 `/www/wwwroot/stock-tracker/`
2. 确保所有文件权限正确

### 第二步：构建Docker镜像
1. **宝塔面板** → **Docker** → **镜像管理**
2. 点击 **构建镜像**
3. 填写以下信息：
   - **镜像名称**: `stock-tracker`
   - **标签**: `latest`
   - **Dockerfile路径**: `/www/wwwroot/stock-tracker/Dockerfile`
   - **构建上下文**: `/www/wwwroot/stock-tracker`
4. 点击 **开始构建**

### 第三步：创建容器
构建成功后：
1. **Docker** → **容器管理** → **创建容器**

**基本配置:**
- **容器名称**: `stock-tracker-app`
- **镜像**: `stock-tracker:latest`
- **重启策略**: `always`

**端口映射:**
- **容器端口**: `3000`
- **宿主端口**: `3000`
- **协议**: `TCP`

**环境变量:**
```
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
TUSHARE_TOKEN=2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211
NEXT_PUBLIC_API_URL=http://bk.yushuo.click
NEXT_PUBLIC_API_BASE_URL=http://bk.yushuo.click/api
NEXTAUTH_SECRET=stock-tracker-secret-key-2024
NEXTAUTH_URL=http://bk.yushuo.click
```

**目录挂载:**
- **宿主目录**: `/www/wwwroot/stock-tracker/data`
- **容器目录**: `/app/data`
- **权限**: `读写`

### 第四步：配置反向代理
1. **网站** → **添加站点**
   - **域名**: `bk.yushuo.click`
   - **根目录**: `/www/wwwroot/stock-tracker`

2. **反向代理** → **添加反向代理**
   - **代理名称**: `stock-tracker`
   - **目标URL**: `http://127.0.0.1:3000`
   - **发送域名**: `$host`

### 第五步：启动容器
1. 点击 **创建并启动**
2. 等待容器启动完成

## ✅ 验证部署

1. **检查容器状态**: Docker → 容器管理 → 确认运行中
2. **查看日志**: 点击日志按钮查看启动日志
3. **访问测试**:
   - 直接访问: http://107.173.154.147:3000
   - 域名访问: http://bk.yushuo.click
   - API测试: http://bk.yushuo.click/api/stocks?date=2024-09-20

## 🔧 常见问题

### 构建失败
- 检查Dockerfile语法
- 确保文件路径正确
- 查看构建日志详情

### 容器无法启动
- 检查端口3000是否被占用
- 查看容器日志
- 确认环境变量配置正确

### 无法访问
- 检查防火墙是否开放3000端口
- 确认反向代理配置
- 测试直接IP访问

## 📱 管理操作

### 通过宝塔面板管理
- **启动/停止**: Docker → 容器管理 → 对应按钮
- **重启**: 点击重启按钮
- **查看日志**: 点击日志按钮
- **进入终端**: 点击终端按钮

### 更新应用
1. 上传新的代码文件
2. 重新构建镜像
3. 停止并删除旧容器
4. 用新镜像创建新容器

## 🎯 部署完成

- ✅ **应用地址**: http://bk.yushuo.click
- ✅ **API接口**: http://bk.yushuo.click/api/stocks
- ✅ **Docker管理**: 宝塔面板完全图形化管理
- ✅ **自动重启**: 服务器重启自动启动容器
- ✅ **日志监控**: 实时查看应用日志

**现在你可以完全通过宝塔面板管理应用，无需命令行操作！**