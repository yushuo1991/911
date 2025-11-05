# 🚀 v4.8.25 一键部署指南

## 方式1：在Cursor中一键部署（推荐⭐）

这是最简单的方式！在Cursor的终端中执行：

```bash
npm run deploy
```

**功能说明**：
- ✅ 自动SSH连接服务器
- ✅ 自动拉取GitHub最新代码
- ✅ 自动重启Docker容器
- ✅ 自动验证部署结果
- ✅ 全程彩色输出，进度清晰

**前提条件**：
- 已安装Node.js和npm
- 已安装ssh2依赖（运行 `npm install`）

---

## 方式2：手动推送+自动部署

### 步骤1：推送代码到GitHub

在Cursor终端执行：

```bash
git add .
git commit -m "v4.8.25: 图表优化"
git push origin main
```

### 步骤2：一键部署到服务器

```bash
npm run deploy
```

---

## 方式3：使用宝塔面板（适合SSH连接失败时）

1. 访问宝塔面板
2. 进入**终端**
3. 复制粘贴以下命令：

```bash
cd /www/wwwroot/stock-tracker && \
git stash && \
git pull origin main && \
docker compose down && \
docker compose build && \
docker compose up -d && \
sleep 20 && \
docker compose ps && \
curl -I http://localhost:3002 && \
echo "✅ 部署完成！访问 http://bk.yushuo.click 验证"
```

---

## 方式4：Cursor Remote-SSH（未来推荐）

虽然Cursor目前对Remote-SSH支持有限，但可以使用VSCode的方式：

1. 安装**Remote-SSH**扩展
2. `F1` → `Remote-SSH: Connect to Host`
3. 输入：`root@107.173.154.147`
4. 密码：`gJ75hNHdy90TA4qGo9`
5. 直接在服务器上编辑和运行代码

---

## 方式5：设置GitHub Actions（CI/CD自动化）

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Server

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: 107.173.154.147
          username: root
          password: ${{ secrets.SERVER_PASSWORD }}
          script: |
            cd /www/wwwroot/stock-tracker
            git pull origin main
            docker compose down
            docker compose build
            docker compose up -d
```

设置Secret：
- 在GitHub仓库 → Settings → Secrets → New secret
- Name: `SERVER_PASSWORD`
- Value: `gJ75hNHdy90TA4qGo9`

**优点**：每次push到main分支自动部署！

---

## 部署后验证

1. 访问 http://bk.yushuo.click
2. 按 `Ctrl + Shift + R` 强制刷新
3. **测试新功能**：
   - 点击日期 → 查看最高点标注
   - 点击"7天涨停排行" → 查看新配色
   - 切换排序模式 → 验证排序逻辑

---

## 故障排除

### SSH连接失败

**错误**: `Connection refused` 或 `ETIMEDOUT`

**解决方法**：
1. 检查服务器IP是否正确：`107.173.154.147`
2. 检查SSH端口是否开放：`telnet 107.173.154.147 22`
3. 使用方式3（宝塔面板）手动部署

### Docker构建超时

**错误**: `EOF error` 或构建超时

**解决方法**：
```bash
# 在服务器上执行
cd /www/wwwroot/stock-tracker
docker compose down
docker image prune -f
docker compose build --no-cache
docker compose up -d
```

---

## 服务器信息

- **IP**: 107.173.154.147
- **用户**: root
- **密码**: gJ75hNHdy90TA4qGo9
- **端口**: 22
- **项目路径**: /www/wwwroot/stock-tracker
- **访问地址**: http://bk.yushuo.click

---

## 版本历史

### v4.8.25 (2025-10-17)
- ✅ 日期弹窗：每天最高点自动标注板块名称
- ✅ 7天排行：精致配色方案（红绿蓝紫金）
- ✅ 连板排序：完善按状态+涨停时间排序
- ✅ 图表布局：优化左右分栏比例55/45

---

**推荐方式**: 使用 `npm run deploy` 一键部署！🚀














