# 🚀 Ubuntu快速部署指南 - 股票追踪系统

## 📋 概述

这是一个专为Ubuntu服务器设计的快速部署方案，包含：
- ✅ **MySQL数据库**存储数据
- ✅ **自动定时任务**每天18:00同步数据
- ✅ **PM2进程管理**确保服务稳定
- ✅ **Nginx反向代理**提供Web服务
- ✅ **真实API数据**集成Tushare

## 🎯 部署步骤

### 第一步：本地打包

在Windows本地运行：
```bash
# 双击运行打包脚本
package-for-server.bat
```

这将创建 `project.tar.gz` 压缩包。

### 第二步：上传文件

```bash
# 上传项目文件
scp project.tar.gz root@107.173.154.147:/var/www/stock-tracker/

# 上传部署脚本
scp quick-deploy.sh root@107.173.154.147:/root/
```

### 第三步：服务器部署

SSH连接到服务器：
```bash
ssh root@107.173.154.147
```

运行一键部署脚本：
```bash
chmod +x quick-deploy.sh
./quick-deploy.sh
```

### 第四步：验证部署

打开浏览器访问：
**http://107.173.154.147**

## 🗄️ 数据库架构

### 主要数据表

1. **stocks** - 股票基础信息
   ```sql
   - stock_code: 股票代码
   - stock_name: 股票名称
   - category: 板块分类
   - td_type: 涨停类型
   - date: 涨停日期
   ```

2. **stock_performance** - 股票表现数据
   ```sql
   - stock_code: 股票代码
   - base_date: 涨停基准日期
   - trading_date: 交易日期
   - pct_change: 涨跌幅
   ```

### 数据库连接信息
- **主机**: localhost
- **端口**: 3306
- **数据库**: stock_db
- **用户名**: stock_user
- **密码**: StockPass123!

## ⏰ 自动化任务

### 定时同步
- **时间**: 每天18:00
- **任务**: 自动获取当日涨停数据并存储到数据库
- **日志**: `/var/www/stock-tracker/logs/sync.log`

### 查看定时任务
```bash
crontab -l
```

## 🛠️ 管理命令

### 应用管理
```bash
# 查看应用状态
pm2 status

# 重启应用
pm2 restart stock-tracker

# 查看应用日志
pm2 logs stock-tracker

# 停止应用
pm2 stop stock-tracker
```

### 数据库管理
```bash
# 连接数据库
mysql -ustock_user -pStockPass123! stock_db

# 查看今日数据
mysql -ustock_user -pStockPass123! stock_db -e "SELECT category, COUNT(*) as count FROM stocks WHERE date = CURDATE() GROUP BY category;"

# 手动清理旧数据（30天前）
mysql -ustock_user -pStockPass123! stock_db -e "DELETE FROM stocks WHERE date < DATE_SUB(CURDATE(), INTERVAL 30 DAY);"
```

### 手动数据同步
```bash
cd /var/www/stock-tracker
node scripts/sync.js
```

### 服务管理
```bash
# Nginx
systemctl status nginx
systemctl restart nginx

# MySQL
systemctl status mysql
systemctl restart mysql

# 查看服务器资源
htop
df -h
```

## 📊 系统监控

### 日志文件位置
- **应用日志**: `/var/www/stock-tracker/logs/`
- **PM2日志**: `pm2 logs stock-tracker`
- **Nginx日志**: `/var/log/nginx/`
- **MySQL日志**: `/var/log/mysql/`

### 性能监控
```bash
# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看网络连接
netstat -tulpn | grep :3000
```

## 🔧 故障排除

### 常见问题

#### 1. 应用无法启动
```bash
# 查看PM2日志
pm2 logs stock-tracker

# 检查端口占用
netstat -tulpn | grep :3000

# 重启应用
pm2 restart stock-tracker
```

#### 2. 数据库连接失败
```bash
# 检查MySQL状态
systemctl status mysql

# 测试数据库连接
mysql -ustock_user -pStockPass123! stock_db -e "SELECT 1;"

# 重启MySQL
systemctl restart mysql
```

#### 3. Nginx配置问题
```bash
# 测试Nginx配置
nginx -t

# 重新加载配置
systemctl reload nginx

# 查看Nginx错误日志
tail -f /var/log/nginx/error.log
```

#### 4. 数据同步失败
```bash
# 查看同步日志
tail -f /var/www/stock-tracker/logs/sync.log

# 手动测试同步
cd /var/www/stock-tracker
node scripts/sync.js

# 检查定时任务
crontab -l
```

## 🔄 数据更新流程

### 自动流程
1. **18:00** - 定时任务触发
2. **API调用** - 获取当日涨停数据
3. **数据清理** - 删除当日旧数据
4. **数据插入** - 存储新数据到MySQL
5. **Tushare** - 获取股票表现数据
6. **日志记录** - 记录同步结果

### 手动更新
如需立即更新数据：
```bash
cd /var/www/stock-tracker
node scripts/sync.js
```

## 📈 数据查询示例

### SQL查询示例
```sql
-- 查看今日涨停统计
SELECT category, COUNT(*) as count
FROM stocks
WHERE date = CURDATE()
GROUP BY category
ORDER BY count DESC;

-- 查看指定股票表现
SELECT s.stock_name, sp.trading_date, sp.pct_change
FROM stocks s
JOIN stock_performance sp ON s.stock_code = sp.stock_code
WHERE s.stock_code = '000001' AND sp.base_date = CURDATE()
ORDER BY sp.trading_date;

-- 查看板块平均表现
SELECT s.category, AVG(sp.pct_change) as avg_performance
FROM stocks s
JOIN stock_performance sp ON s.stock_code = sp.stock_code
WHERE s.date = CURDATE()
GROUP BY s.category;
```

## 🎉 部署完成

部署成功后，你将拥有：

- 🌐 **Web界面**: http://107.173.154.147
- 🗄️ **数据存储**: MySQL持久化存储
- ⏰ **自动更新**: 每日18:00自动同步
- 📊 **真实数据**: 集成Tushare API
- 🔄 **高可用**: PM2进程守护
- 🚀 **高性能**: Nginx代理缓存

享受你的股票追踪系统吧！ 🎊