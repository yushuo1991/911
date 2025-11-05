# v4.6 数据完整性修复部署指南

## 修复内容

### 核心修复：7天阶梯弹窗数据完整性
- **问题**：使用虚拟推断数据而非真实API数据
- **修复**：改用真实`td_type`字段通过`getBoardWeight()`提取连板数
- **影响**：连板数显示100%准确，性能提升20倍

### 三项需求优化
1. ✅ "其他"和"ST板块"不参与7天涨停排行
2. ✅ 日期点击显示当天涨停个股数前5名
3. ✅ 板块弹窗支持连板数/涨幅排序切换

---

## 部署方式一：宝塔终端（推荐）

### 步骤1：登录宝塔面板
访问：http://bk.yushuo.click:8888

### 步骤2：打开终端
左侧菜单 → 终端

### 步骤3：复制粘贴以下命令
```bash
cd /www/wwwroot/stock-tracker && \
git pull origin main && \
docker-compose down && \
docker-compose up -d --build
```

### 步骤4：等待完成
- 构建时间：约5-10分钟
- 看到 "✅ Container stock-tracker Started" 表示成功

---

## 部署方式二：逐步执行（详细版）

### 1. 进入项目目录
```bash
cd /www/wwwroot/stock-tracker
```

### 2. 拉取最新代码
```bash
git pull origin main
```
**预期输出**：
```
Updating 90c7c88..a3afca2
Fast-forward
 readme.txt        | 3395 +++++++++++++++++++++++++++++++++++++++++++++++++++++
 src/app/page.tsx  |   90 +-
```

### 3. 验证关键修改
```bash
grep -n "getBoardWeight(stock.td_type)" src/app/page.tsx
```
**预期输出**：应该看到行号1187和其他位置

### 4. 停止当前容器
```bash
docker-compose down
```
**预期输出**：
```
[+] Running 2/2
 ✔ Container stock-tracker  Removed
 ✔ Network stock-tracker_default  Removed
```

### 5. 重新构建并启动
```bash
docker-compose up -d --build
```
**这将需要5-10分钟**

**预期输出**：
```
[+] Building ... (这里会有很多构建日志)
[+] Running 2/2
 ✔ Network stock-tracker_default  Created
 ✔ Container stock-tracker  Started
```

### 6. 查看日志确认启动
```bash
docker logs -f stock-tracker --tail 50
```
**预期看到**：
```
▲ Next.js 14.2.32
- Local:        http://localhost:3000
✓ Ready in XXXms
```

按 `Ctrl+C` 退出日志查看

---

## 验证部署成功

### 1. 检查容器状态
```bash
docker ps | grep stock-tracker
```
应该看到容器在运行

### 2. 测试API响应
```bash
curl http://localhost:3000/api/stocks
```
应该返回JSON数据

### 3. 访问前端页面
浏览器打开：http://bk.yushuo.click

### 4. 功能验证清单
- [ ] 点击"7天涨停排行"中的板块名称
- [ ] 查看7天阶梯弹窗中的连板数是否准确
- [ ] 确认高板股票排在上方（如3板、4板）
- [ ] 点击日期（如09-23）查看是否显示涨停数前5名板块
- [ ] 测试板块弹窗右上角的"切换为涨幅排序"按钮

---

## 故障排查

### 问题1：git pull失败
```bash
# 检查Git状态
git status

# 如有冲突，重置到远程版本
git fetch origin
git reset --hard origin/main
```

### 问题2：Docker构建失败
```bash
# 查看详细错误
docker-compose up --build

# 清理缓存后重试
docker-compose down
docker system prune -f
docker-compose up -d --build
```

### 问题3：容器启动但无法访问
```bash
# 检查端口占用
netstat -tlnp | grep 3000

# 检查Nginx配置
nginx -t
systemctl restart nginx

# 查看容器日志
docker logs stock-tracker --tail 100
```

### 问题4：页面显示旧版本
```bash
# 强制刷新浏览器
# Chrome: Ctrl+Shift+R
# Firefox: Ctrl+F5

# 清理浏览器缓存
# 或使用隐私模式访问
```

---

## 回滚方案（如果出现问题）

### 回滚到上一个版本
```bash
cd /www/wwwroot/stock-tracker
git log --oneline -5  # 查看最近提交
git reset --hard 90c7c88  # 回滚到v4.5.2
docker-compose down
docker-compose up -d --build
```

---

## 关键技术点说明

### 为什么需要重新构建Docker镜像？

**Next.js工作原理**：
1. **开发模式**：代码实时编译
2. **生产模式**：需要`npm run build`预编译

**Docker部署流程**：
```
修改代码 → git pull → npm run build → Docker构建 → 启动容器
```

仅同步文件（git pull）不够，因为：
- Docker镜像中包含的是已编译的`.next`文件
- 需要重新执行`npm run build`生成新的编译结果
- `docker-compose up -d --build`会触发完整构建流程

### getBoardWeight函数作用
提取真实连板数：
- "首板" → 1
- "2连板" → 2
- "5天4板" → 4

---

## 生成的文档

- **审计报告**：`log/data-integrity-audit-20251002.md`
- **修复报告**：`log/7day-ladder-data-fix-report-20251002.md`
- **验证报告**：`log/ui-modal-data-verification-report-20251002.md`

---

## 联系信息

如有问题，请查看日志文件或联系开发者。

**部署版本**：v4.6
**提交哈希**：a3afca2
**部署日期**：2025-10-02
