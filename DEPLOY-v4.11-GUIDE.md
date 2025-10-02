# 🚀 v4.11部署指南 - 修复涨停数弹窗状态列

## ⚠️ 问题说明
当前服务器运行的是**v4.9之前的旧版本**，涨停数弹窗中**没有状态列**显示连板数。

v4.11版本已在本地完成并推送到GitHub，需要部署到服务器。

## ✅ 部署步骤

### 方法1: 宝塔面板终端 ⭐ 推荐

1. **登录宝塔面板**
   - 访问: `http://你的服务器IP:8888`
   - 或: `https://你的服务器IP:8888`

2. **打开终端**
   - 点击左侧菜单 "终端"
   - 或点击顶部 "终端" 图标

3. **执行部署命令**
   ```bash
   cd /www/wwwroot/stock-tracker

   # 拉取最新代码
   git pull origin main

   # 停止容器
   docker-compose down

   # 重新构建（关键：清除缓存）
   docker-compose build --no-cache

   # 启动服务
   docker-compose up -d

   # 等待30秒让服务启动
   sleep 30

   # 检查状态
   docker ps | grep stock-tracker
   ```

4. **预期输出**
   ```
   From https://github.com/yushuo1991/911
      ea2314a..f790995  main -> origin/main
   Updating ea2314a..f790995
   ...
   [+] Building 120.5s
   [+] Running 2/2
    ✔ Container stock-tracker-mysql-1  Started
    ✔ Container stock-tracker-app-1    Started
   ```

### 方法2: SSH客户端

如果有SSH客户端（PuTTY、Xshell、MobaXterm等）：

1. 连接服务器: `ssh root@yushuo.click`
2. 执行上述相同命令

### 方法3: 一键部署脚本

在服务器创建脚本文件：
```bash
cat > /tmp/deploy-v4.11.sh << 'EOF'
#!/bin/bash
set -e

echo "📦 开始部署v4.11..."

cd /www/wwwroot/stock-tracker

echo "🔄 拉取最新代码..."
git pull origin main

echo "⏹️  停止容器..."
docker-compose down

echo "🔨 重新构建镜像（清除缓存）..."
docker-compose build --no-cache

echo "🚀 启动服务..."
docker-compose up -d

echo "⏳ 等待服务启动..."
sleep 30

echo "✅ 检查服务状态..."
docker ps | grep stock-tracker

echo ""
echo "🎉 部署完成！请访问 http://bk.yushuo.click 验证"
echo ""
echo "📋 验证清单："
echo "  1. 点击任意日期的'XX只涨停'"
echo "  2. 检查弹窗中是否有'状态'列"
echo "  3. 状态列应显示: 首板、2板、3板等"
EOF

chmod +x /tmp/deploy-v4.11.sh
/tmp/deploy-v4.11.sh
```

## 🧪 部署验证

### 1. 清除浏览器缓存
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### 2. 访问网站
打开 `http://bk.yushuo.click`

### 3. 测试涨停数弹窗
1. 点击任意日期（如09-23）的"53只涨停"
2. 检查弹窗表格结构：

**正确显示** ✅:
```
| 名称     | 状态  | 09-24 | 09-25 | 09-26 | 09-29 | 09-30 | 计   |
|----------|-------|-------|-------|-------|-------|-------|------|
| 德明利   | 3板   | +6.7  | -2.6  | -2.8  | +8.0  | +10.0 | +19.3|
| 张江高科 | 首板  | +10.0 | +2.7  | -0.1  | -1.7  | +7.3  | +18.2|
```

**错误显示** ❌:
```
| 名称     | 09-24 | 09-25 | 09-26 | 09-29 | 09-30 | 计   |
|----------|-------|-------|-------|-------|-------|------|
| 德明利   | +6.7  | -2.6  | -2.8  | +8.0  | +10.0 | +19.3|
```

### 4. 检查状态列颜色
- **首板/1板**: 灰色文字
- **2板**: 橙色文字
- **3板及以上**: 红色文字

### 5. 检查日期列详情弹窗（v4.11优化）
1. 点击"7天涨停阶梯"弹窗中的日期表头
2. 检查弹窗左侧空白是否减少（更紧凑）

## 🔧 故障排查

### 问题1: git pull失败
```bash
# 重置本地修改
cd /www/wwwroot/stock-tracker
git reset --hard HEAD
git pull origin main
```

### 问题2: 容器启动失败
```bash
# 查看日志
docker-compose logs app

# 重启服务
docker-compose restart
```

### 问题3: 仍然显示旧版本
```bash
# 检查Git版本
git log --oneline -1
# 应显示: f790995 feat: v4.11 优化日期列详情弹窗布局减少左侧空白

# 检查代码
grep -n "td_type.replace" src/app/page.tsx
# 应找到3处结果（行665, 1030, 1352）

# 完全重新构建
docker-compose down -v  # 删除卷
docker system prune -f  # 清理缓存
docker-compose up -d --build --force-recreate
```

### 问题4: 浏览器仍显示旧界面
1. 清除浏览器缓存: `Ctrl + Shift + R`
2. 或使用隐私模式/无痕模式访问
3. 或清除站点数据:
   - Chrome: F12 → Application → Clear site data
   - Firefox: F12 → Storage → Clear All

## 📊 版本对比

| 版本   | 状态列 | 日期列布局 | 提交ID  |
|--------|--------|------------|---------|
| v4.8   | ❌     | 正常       | -       |
| v4.9   | ✅     | 正常       | 9d3269b |
| v4.10  | ✅     | 正常       | 957f746 |
| v4.11  | ✅     | **优化**   | f790995 |

## 🆘 需要帮助？

如果部署后问题仍存在，请提供：
1. Git版本检查结果: `git log --oneline -5`
2. 代码检查结果: `grep -n "td_type.replace" src/app/page.tsx`
3. Docker容器状态: `docker ps`
4. 浏览器开发者工具Console截图
5. 弹窗完整截图

---

**部署时间**: 2025-10-02
**目标版本**: v4.11 (commit: f790995)
**预计耗时**: 5-10分钟
