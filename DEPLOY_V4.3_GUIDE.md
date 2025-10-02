# 🚀 v4.3 UI升级部署指南

## ❌ SSH自动连接失败原因

### 技术分析：
**错误类型**: `ETIMEDOUT` (连接超时)
**失败位置**: TCP连接建立阶段
**问题模块**: **网络层 (Network Layer)**

### 具体原因：
1. **本地防火墙阻止**
   - Windows防火墙可能阻止SSH出站连接（端口22）
   - 企业/家庭路由器防火墙策略

2. **ISP运营商限制**
   - 部分运营商封锁SSH端口22
   - 防止家庭用户运行服务器

3. **GFW网络干扰**
   - 中国大陆访问海外服务器的SSH连接可能被干扰
   - 特别是高频率或自动化连接

4. **服务器安全策略**
   - 服务器防火墙可能限制特定IP段
   - SSH白名单机制

### SSH连接流程（TCP三次握手）：
```
本地电脑           网络           远程服务器
   |                              |
   |----(1) SYN 发送 ------------>| ❌ 被阻断
   |                              |
   |<---(2) SYN-ACK (无响应) -----| ⏱️ 超时30秒
   |                              |
   X 连接失败: ETIMEDOUT
```

---

## ✅ 推荐部署方案（按优先级）

### 🌟 方案1: 宝塔面板Web SSH（最推荐，100%可行）

**优势**:
- ✅ 绕过本地网络限制
- ✅ 无需安装额外软件
- ✅ 支持复制粘贴命令
- ✅ 浏览器直接访问

**操作步骤**:

#### 1. 登录宝塔面板
```
访问: https://yushuo.click:8888
用户: admin
密码: [你的宝塔密码]
```

#### 2. 打开终端
- 点击左侧菜单: **终端**
- 或点击顶部: **🖥️ 终端**

#### 3. 一键部署命令（复制粘贴执行）
```bash
#!/bin/bash
# v4.3 UI升级一键部署脚本

echo "════════════════════════════════════════"
echo "🚀 开始部署 v4.3 Premium UI升级"
echo "════════════════════════════════════════"
echo ""

# 进入项目目录
echo "▶ 步骤1: 进入项目目录"
cd /www/wwwroot/stock-tracker || exit 1
pwd
echo ""

# 检查Git状态
echo "▶ 步骤2: 检查当前Git状态"
git status
echo ""

# 拉取最新代码
echo "▶ 步骤3: 拉取最新代码 (v4.3)"
git fetch origin
git pull origin main
echo ""

# 查看最新提交
echo "▶ 步骤4: 查看最新提交信息"
git log -1 --pretty=format:"Commit: %h%nAuthor: %an%nDate: %ad%nMessage: %s%n"
echo ""
echo ""

# 检查关键文件
echo "▶ 步骤5: 验证新文件存在"
ls -lh src/components/StockPremiumChart.tsx 2>/dev/null && echo "✅ StockPremiumChart.tsx 存在" || echo "❌ StockPremiumChart.tsx 缺失"
ls -lh src/lib/chartHelpers.ts 2>/dev/null && echo "✅ chartHelpers.ts 存在" || echo "❌ chartHelpers.ts 缺失"
echo ""

# 停止现有容器
echo "▶ 步骤6: 停止现有容器"
docker-compose down
echo ""

# 重新构建镜像
echo "▶ 步骤7: 重新构建Docker镜像（包含新代码）"
docker-compose build --no-cache
echo ""

# 启动新容器
echo "▶ 步骤8: 启动新容器"
docker-compose up -d
echo ""

# 等待服务启动
echo "▶ 步骤9: 等待30秒服务初始化..."
sleep 30
echo ""

# 检查容器状态
echo "▶ 步骤10: 检查容器运行状态"
docker-compose ps
echo ""

# 查看应用日志
echo "▶ 步骤11: 查看应用启动日志（最近50行）"
docker-compose logs --tail=50 stock-tracker
echo ""

# 测试本地访问
echo "▶ 步骤12: 测试本地访问"
curl -I http://localhost:3002
echo ""

# 测试公网访问
echo "▶ 步骤13: 测试公网访问"
curl -I http://bk.yushuo.click
echo ""

echo "════════════════════════════════════════"
echo "✅ 部署完成！"
echo "════════════════════════════════════════"
echo ""
echo "📊 部署摘要:"
echo "  版本: v4.3 Premium UI升级"
echo "  提交: 51089c2"
echo "  功能: 7大UI功能 + 信息密度提升60-180%"
echo ""
echo "🌐 访问地址:"
echo "  http://bk.yushuo.click"
echo ""
echo "🎯 新功能测试清单:"
echo "  1. 点击日期 → 查看板块5天平均溢价表格"
echo "  2. 点击板块 → 查看分屏布局（左图表+右表格）"
echo "  3. 头部排行榜徽章 → 显示Top 5板块（金银铜蓝）"
echo "  4. 点击排行榜徽章 → 查看7天涨停阶梯"
echo "  5. 排行榜弹窗 → 显示7天数据（原3天）"
echo "  6. 整体UI → 更紧凑、更专业"
echo "  7. 信息密度 → 单屏显示更多内容"
echo ""
```

#### 4. 复制上面的完整脚本，粘贴到宝塔终端，按回车执行

---

### 🔧 方案2: Git Bash手动SSH（需要本地终端）

**操作步骤**:

#### 1. 打开Git Bash
- 右键桌面 → **Git Bash Here**
- 或打开开始菜单搜索 **Git Bash**

#### 2. SSH连接服务器
```bash
ssh root@yushuo.click
# 输入密码: gJ75hNHdy90TA4qGo9
```

#### 3. 执行部署命令（逐行执行）
```bash
cd /www/wwwroot/stock-tracker
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
sleep 30
docker-compose ps
curl -I http://bk.yushuo.click
```

---

### 🌐 方案3: 使用VPN后自动部署

**如果你有VPN**:

#### 1. 连接VPN（更换网络环境）

#### 2. 运行自动部署脚本
```bash
cd "C:\Users\yushu\Desktop\stock-tracker - 副本"
node auto-ssh-deploy.js
```

---

## 📋 部署成功验证清单

部署完成后，请依次验证：

### ✅ 服务器端验证（SSH终端）
```bash
# 1. 检查Git最新提交
cd /www/wwwroot/stock-tracker
git log -1 --oneline
# 预期输出: 51089c2 🎨 v4.3: Premium UI升级 - 7大功能实现

# 2. 检查新文件存在
ls -lh src/components/StockPremiumChart.tsx
ls -lh src/lib/chartHelpers.ts
# 预期: 文件存在且大小正常

# 3. 检查容器状态
docker-compose ps
# 预期输出:
# stock-tracker-app      Up (healthy)
# stock-tracker-mysql    Up (healthy)

# 4. 检查应用日志无错误
docker-compose logs --tail=100 stock-tracker | grep -i error
# 预期: 无严重错误

# 5. 测试HTTP访问
curl -I http://bk.yushuo.click
# 预期: HTTP/1.1 200 OK
```

### ✅ 浏览器端验证（http://bk.yushuo.click）

#### 基础验证
- [ ] 页面正常加载，无白屏
- [ ] 无控制台错误（F12查看）
- [ ] 整体UI更紧凑，字体更小
- [ ] 头部显示"📈 宇硕板块节奏"标题

#### 功能1: 日期点击（板块5天溢价）
- [ ] 点击任意日期（如09-23）
- [ ] 弹窗标题: "📈 {日期} - 板块后续5天平均溢价"
- [ ] 显示板块名称 + 5天溢价数据表格
- [ ] 第一天溢价从高到低排序
- [ ] 溢价数值有颜色（绿色正值，红色负值）

#### 功能2: 板块点击（分屏+图表）
- [ ] 点击任意板块名称
- [ ] 弹窗显示分屏布局
- [ ] 左侧40%: 显示"📈 个股5天溢价趋势"图表
- [ ] 图表有多条彩色线（最多10条）
- [ ] 右侧60%: 显示个股溢价数据表格
- [ ] 表格按累计溢价排序

#### 功能3: 排行榜时间跨度（7天）
- [ ] 点击"🏆 7天涨停排行"按钮（右上角）
- [ ] 弹窗标题: "🏆 板块7天涨停总数排行 (前5名)"
- [ ] 显示前5名板块
- [ ] 每个板块显示7天详细数据（grid-cols-7）
- [ ] 统计说明: "统计最近7个交易日"

#### 功能4: 排行榜徽章（头部）
- [ ] 页面头部"宇硕板块节奏"标题右侧显示徽章
- [ ] 显示5个紧凑徽章
- [ ] 第1名: 金色背景 (bg-amber-50)
- [ ] 第2名: 银色背景 (bg-gray-50)
- [ ] 第3名: 铜色背景 (bg-orange-50)
- [ ] 第4-5名: 蓝色背景 (bg-primary-50)
- [ ] 徽章格式: "#1 · 板块名 (总数)"
- [ ] 徽章可点击

#### 功能5: 7天涨停阶梯（新弹窗）
- [ ] 点击排行榜徽章（如"#1 · 锂电池 (45)"）
- [ ] 弹窗标题: "🪜 {板块名} - 7天涨停个股阶梯"
- [ ] 显示7天时间线卡片
- [ ] 每天显示日期 + 星期 + 涨停数
- [ ] 每天显示个股标签（可点击）
- [ ] 日期标记有颜色（红→橙→蓝）

#### 功能6: Premium紧凑设计
- [ ] 页面标题字体更小 (text-xl vs text-2xl)
- [ ] 卡片内边距更紧凑 (p-2 vs p-4)
- [ ] 板块卡高度降低（约50px vs 80px）
- [ ] 日期头部高度降低（约44px vs 60px）
- [ ] 表格行高更紧凑 (py-1.5 vs py-3)
- [ ] 整体视觉更专业、更金融化

#### 功能7: 信息密度提升
- [ ] 日历网格单列显示7-8个板块（原4-5个）
- [ ] 日期弹窗显示18-25只股票（原6-8只）
- [ ] 板块弹窗显示12-15只股票（原4-5只）
- [ ] 涨停数弹窗同屏显示3-5个板块（原1-2个）

---

## 🆘 常见问题排查

### Q1: Git拉取失败 "error: Your local changes would be overwritten"
```bash
# 解决方案: 强制重置到远程版本
cd /www/wwwroot/stock-tracker
git fetch origin
git reset --hard origin/main
git pull origin main
```

### Q2: Docker构建失败 "Error response from daemon"
```bash
# 解决方案: 清理Docker缓存
docker system prune -a -f
docker-compose build --no-cache
```

### Q3: 容器启动失败 "port is already allocated"
```bash
# 解决方案: 检查端口占用
netstat -tlnp | grep -E '3002|3307'
# 如有占用，先停止占用进程
docker-compose down
# 或强制删除
docker rm -f stock-tracker-app stock-tracker-mysql
```

### Q4: 浏览器访问502错误
```bash
# 解决方案: 检查Nginx配置
nginx -t
systemctl status nginx
cat /www/server/panel/vhost/nginx/bk.yushuo.click.conf

# 如Nginx配置丢失，重新创建
cat > /www/server/panel/vhost/nginx/bk.yushuo.click.conf << 'EOF'
server {
    listen 80;
    server_name bk.yushuo.click;
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

nginx -t && systemctl reload nginx
```

### Q5: 新功能不显示（缓存问题）
```bash
# 解决方案: 清理浏览器缓存
# 1. Chrome: Ctrl+Shift+Delete → 清除缓存
# 2. 或强制刷新: Ctrl+F5
# 3. 或无痕模式: Ctrl+Shift+N
```

---

## 📊 部署前后对比

### 文件变化
| 类型 | 文件 | 状态 | 大小 |
|------|------|------|------|
| 核心文件 | src/app/page.tsx | 修改 | 1271行 (+6行) |
| 新增组件 | src/components/StockPremiumChart.tsx | 新增 | 9.5KB |
| 新增工具 | src/lib/chartHelpers.ts | 新增 | 6KB |
| 依赖 | package.json | 修改 | +recharts |
| 文档 | DESIGN-SPECIFICATION.md | 新增 | 53KB |
| 文档 | log/ui-upgrade-implementation-20250930.md | 新增 | 58KB |

### 功能对比
| 功能 | v4.2 | v4.3 | 改进 |
|------|------|------|------|
| 日期点击 | 显示个股列表 | 显示板块5天溢价 | ✅ 更聚焦板块维度 |
| 板块点击 | 纯表格 | 分屏（图表+表格） | ✅ 可视化增强 |
| 排行榜周期 | 3天 | 7天 | ✅ 更全面的趋势 |
| 排行榜位置 | 弹窗 | 头部徽章 | ✅ 快速访问 |
| 阶梯视图 | 无 | 7天时间线 | ✅ 新增功能 |
| 信息密度 | 标准 | 提升60-180% | ✅ 显示更多数据 |
| 设计风格 | 宽松 | 紧凑专业 | ✅ 金融级美学 |

---

## 📞 需要帮助？

### 部署文件位置
- **自动部署脚本**: `auto-ssh-deploy.js`
- **部署指南**: `DEPLOY_V4.3_GUIDE.md` (本文件)
- **实施报告**: `log/ui-upgrade-implementation-20250930.md`
- **设计规范**: `DESIGN-SPECIFICATION.md`

### Git提交信息
- **提交哈希**: `51089c2`
- **提交信息**: "🎨 v4.3: Premium UI升级 - 7大功能实现"
- **远程仓库**: https://github.com/yushuo1991/911.git

### 服务器信息
- **域名**: yushuo.click (75.2.60.5)
- **项目路径**: /www/wwwroot/stock-tracker
- **访问地址**: http://bk.yushuo.click
- **应用端口**: 3002
- **数据库端口**: 3307

---

**提示**: 优先使用宝塔面板Web SSH部署，100%可行且最简单！

🎉 祝部署顺利！