# v4.6 版本恢复指南

## 版本信息

- **版本号**: v4.6
- **Git提交**: a3afca2
- **发布日期**: 2025-10-02
- **备份位置**: `/www/backup/stock-tracker/v4.6-*`

## 核心特性

1. ✅ 修复7天阶梯弹窗使用真实API数据（td_type字段）
2. ✅ 日期点击显示当天涨停个股数前5名板块
3. ✅ 板块弹窗支持连板数/涨幅排序切换
4. ✅ "其他"和"ST板块"不参与7天涨停排行

---

## 备份v4.6版本

### 在宝塔终端执行备份

```bash
# 复制备份脚本到服务器
cd /www/wwwroot/stock-tracker

# 创建备份
bash backup-v4.6-commands.sh
```

**或者手动备份**：

```bash
# 1. 创建备份目录
mkdir -p /www/backup/stock-tracker

# 2. 备份代码
cd /www/wwwroot/stock-tracker
tar -czf /www/backup/stock-tracker/v4.6-source.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  .

# 3. 备份Docker镜像
docker save stock-tracker:latest | gzip > /www/backup/stock-tracker/v4.6-docker-image.tar.gz

# 4. 备份数据库
docker exec stock-tracker-mysql mysqldump -uroot -p123456 stock_data > /www/backup/stock-tracker/v4.6-database.sql

# 5. 创建Git标签
git tag -a v4.6 -m "v4.6: 数据完整性修复版本"
git push origin v4.6
```

---

## 恢复v4.6版本

### 方式1: 从Git恢复（推荐）⭐

```bash
# 1. 进入项目目录
cd /www/wwwroot/stock-tracker

# 2. 查看可用版本标签
git tag -l

# 3. 切换到v4.6版本
git fetch --all
git checkout v4.6

# 4. 重新构建部署
docker compose down
docker compose up -d --build

# 5. 验证版本
git log -1 --oneline
# 应该显示: a3afca2 fix: 修复7天阶梯弹窗使用真实API数据
```

### 方式2: 从备份文件恢复

```bash
# 1. 停止当前服务
cd /www/wwwroot/stock-tracker
docker compose down

# 2. 恢复代码
cd /www/wwwroot
rm -rf stock-tracker
tar -xzf /www/backup/stock-tracker/v4.6-source.tar.gz -C stock-tracker

# 3. 恢复Docker镜像（可选，也可以重新构建）
docker load < /www/backup/stock-tracker/v4.6-docker-image.tar.gz

# 4. 启动服务
cd /www/wwwroot/stock-tracker
docker compose up -d

# 5. 恢复数据库（如果需要）
docker exec -i stock-tracker-mysql mysql -uroot -p123456 stock_data < /www/backup/stock-tracker/v4.6-database.sql
```

### 方式3: 从特定Git提交恢复

```bash
# 1. 进入项目目录
cd /www/wwwroot/stock-tracker

# 2. 查看提交历史
git log --oneline -10

# 3. 恢复到特定提交
git reset --hard a3afca2

# 4. 重新部署
docker compose down
docker compose up -d --build
```

---

## 验证恢复成功

### 1. 检查Git版本
```bash
git log -1 --oneline
# 预期: a3afca2 fix: 修复7天阶梯弹窗使用真实API数据
```

### 2. 检查Docker容器
```bash
docker ps | grep stock-tracker
# 应该看到容器在运行
```

### 3. 测试API
```bash
curl http://localhost:3000/api/stocks | head -20
# 应该返回JSON数据
```

### 4. 访问前端
浏览器打开: http://bk.yushuo.click

### 5. 功能验证清单
- [ ] 点击"7天涨停排行"中板块名称
- [ ] 查看7天阶梯弹窗，连板数显示正确
- [ ] 点击日期查看是否显示涨停数前5名板块
- [ ] 测试板块弹窗"切换排序"按钮
- [ ] 确认"其他"和"ST板块"不在7天排行中

---

## 回滚到其他版本

### 查看所有可用版本
```bash
git tag -l
# 显示所有版本标签
```

### 回滚到v4.5.2
```bash
cd /www/wwwroot/stock-tracker
git checkout v4.5.2  # 或者 git reset --hard 61942c5
docker compose down
docker compose up -d --build
```

### 回滚到v4.2（稳定版本）
```bash
cd /www/wwwroot/stock-tracker
git checkout v4.2-stable-20250930
docker compose down
docker compose up -d --build
```

---

## 关键文件对比

### v4.6 vs v4.5.2 主要变化

**src/app/page.tsx**:
```typescript
// v4.6 新增：使用真实API数据
const sortedStocks = day.stocks
  .map(stock => ({
    ...stock,
    boardCount: getBoardWeight(stock.td_type) // ✅ 真实数据
  }))
  .sort((a, b) => b.boardCount - a.boardCount);

// v4.5.2 旧版：虚拟计算（已废弃）
const stocksWithBoardCount = day.stocks.map(stock => {
  let boardCount = 1;
  for (let i = dayIndex - 1; i >= 0; i--) {
    // ... 循环推断逻辑
  }
  return { ...stock, boardCount };
});
```

**新增功能**:
1. 导入 `getBoardWeight` 函数（行5）
2. 新增 `sectorModalSortMode` 状态（行46）
3. 修改 `handleDateClick` 按股票数排序（行152-155）
4. 修改 `getSortedStocksForSector` 支持双模式排序（行373-394）
5. 添加排序切换按钮（行523-528）

---

## 数据库恢复（如果需要）

### 恢复到v4.6数据库状态
```bash
# 1. 备份当前数据库
docker exec stock-tracker-mysql mysqldump -uroot -p123456 stock_data > /tmp/current-backup.sql

# 2. 恢复v4.6数据库
docker exec -i stock-tracker-mysql mysql -uroot -p123456 stock_data < /www/backup/stock-tracker/v4.6-database.sql

# 3. 验证数据
docker exec -it stock-tracker-mysql mysql -uroot -p123456 stock_data -e "SELECT COUNT(*) FROM stock_data;"
```

---

## 故障排查

### 问题1: Git checkout失败
```bash
# 清理未提交的更改
git stash
git checkout v4.6

# 或者强制切换
git fetch --all
git reset --hard origin/main
git checkout v4.6
```

### 问题2: Docker构建失败
```bash
# 清理缓存
docker system prune -af
docker compose build --no-cache
docker compose up -d
```

### 问题3: 数据库连接失败
```bash
# 检查MySQL容器
docker ps -a | grep mysql

# 重启MySQL
docker restart stock-tracker-mysql

# 查看日志
docker logs stock-tracker-mysql --tail 50
```

### 问题4: 页面显示旧版本
```bash
# 清理浏览器缓存
# Chrome: Ctrl+Shift+Delete

# 清理Next.js缓存
cd /www/wwwroot/stock-tracker
rm -rf .next
docker compose down
docker compose up -d --build
```

---

## 下载备份到本地

```bash
# 从本地电脑执行（如果SSH可用）
scp root@yushuo.click:/www/backup/stock-tracker/v4.6-source.tar.gz ./
scp root@yushuo.click:/www/backup/stock-tracker/v4.6-database.sql ./

# 或者通过宝塔文件管理器下载
# 路径: /www/backup/stock-tracker/
```

---

## 版本历史

| 版本 | 日期 | 提交哈希 | 主要特性 |
|------|------|----------|----------|
| v4.6 | 2025-10-02 | a3afca2 | 数据完整性修复，真实API数据 |
| v4.5.2 | 2025-10-01 | 90c7c88 | 星期几弹窗字体优化 |
| v4.5.1 | 2025-10-01 | 61942c5 | 日期格式修复 |
| v4.5 | 2025-10-01 | 61cd87a | 数据修复版本 |
| v4.2 | 2025-09-30 | - | 稳定版本（备份点） |

---

## 联系与支持

如有问题，请查看：
- 审计报告: `log/data-integrity-audit-20251002.md`
- 修复报告: `log/7day-ladder-data-fix-report-20251002.md`
- 验证报告: `log/ui-modal-data-verification-report-20251002.md`

**恢复版本**: v4.6
**文档日期**: 2025-10-02
