# 🔧 MySQL连接问题诊断与解决

**错误信息**: `(2003, "Can't connect to MySQL server on '107.173.154.147' ([Errno 111] Connection refused)")`

**问题分析**: MySQL服务未运行或配置问题

---

## 🔍 问题诊断步骤

### 步骤1: 检查MySQL服务状态

#### 方法A: 通过宝塔面板检查
**路径**: 宝塔面板 → 软件商店 → 已安装

1. 查看MySQL是否已安装
2. 检查MySQL服务状态（是否显示"运行中"）
3. 如果显示"已停止"，点击"启动"

#### 方法B: 通过SSH命令检查
```bash
# SSH连接服务器
ssh root@107.173.154.147

# 检查MySQL服务状态
systemctl status mysql
# 或者
systemctl status mysqld

# 检查MySQL进程
ps aux | grep mysql

# 检查端口监听
netstat -tulpn | grep 3306
```

### 步骤2: MySQL服务启动问题解决

#### 情况1: MySQL未安装
**解决方案**: 通过宝塔面板安装MySQL

1. 宝塔面板 → 软件商店 → 搜索"MySQL"
2. 选择MySQL 8.0版本
3. 点击"安装"
4. 等待安装完成（通常需要5-10分钟）

#### 情况2: MySQL已安装但未启动
**解决方案**: 启动MySQL服务

**通过宝塔面板**:
```
软件商店 → 已安装 → MySQL → 启动
```

**通过SSH命令**:
```bash
# 启动MySQL服务
systemctl start mysql
# 或者
systemctl start mysqld

# 设置开机自启
systemctl enable mysql

# 再次检查状态
systemctl status mysql
```

#### 情况3: MySQL启动失败
**可能原因和解决方案**:

**原因1: 配置文件错误**
```bash
# 检查MySQL错误日志
tail -50 /var/log/mysql/error.log
# 或者
journalctl -u mysql -n 50
```

**原因2: 端口被占用**
```bash
# 检查3306端口占用
lsof -i :3306
# 如果有其他进程占用，结束进程
kill -9 [进程ID]
```

**原因3: 磁盘空间不足**
```bash
# 检查磁盘空间
df -h
# 如果/var分区满了，清理日志文件
rm -f /var/log/mysql/mysql-bin.*
```

**原因4: 内存不足**
```bash
# 检查内存使用
free -h
# 如果内存不足，调整MySQL配置
nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

### 步骤3: MySQL配置文件修复

#### 重置MySQL配置（谨慎操作）
```bash
# 停止MySQL服务
systemctl stop mysql

# 备份原配置
cp /etc/mysql/mysql.conf.d/mysqld.cnf /etc/mysql/mysql.conf.d/mysqld.cnf.backup

# 创建基础配置
cat > /etc/mysql/mysql.conf.d/mysqld.cnf << 'EOF'
[mysqld]
user = mysql
bind-address = 127.0.0.1
port = 3306
datadir = /var/lib/mysql
socket = /var/run/mysqld/mysqld.sock
pid-file = /var/run/mysqld/mysqld.pid
log-error = /var/log/mysql/error.log

# 性能优化（小内存服务器）
innodb_buffer_pool_size = 128M
innodb_log_file_size = 32M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

[mysql]
default-character-set = utf8mb4

[client]
default-character-set = utf8mb4
EOF

# 启动MySQL
systemctl start mysql
```

## 🚀 快速解决方案

### 方案1: 宝塔面板一键修复
```
1. 宝塔面板 → 软件商店 → MySQL → 卸载
2. 等待卸载完成
3. 重新安装MySQL 8.0
4. 安装完成后检查服务状态
```

### 方案2: 手动重装MySQL
```bash
# SSH连接服务器
ssh root@107.173.154.147

# 完全卸载MySQL
apt remove --purge mysql-server mysql-client mysql-common mysql-server-core-* mysql-client-core-*
apt autoremove
apt autoclean

# 删除MySQL数据目录（注意：会丢失所有数据）
rm -rf /var/lib/mysql
rm -rf /etc/mysql

# 更新包列表
apt update

# 重新安装MySQL
apt install mysql-server -y

# 启动并启用MySQL
systemctl start mysql
systemctl enable mysql

# 检查状态
systemctl status mysql
```

### 方案3: 使用轻量级替代方案
如果MySQL安装一直有问题，可以考虑使用SQLite作为临时解决方案：

```javascript
// 修改数据库配置使用SQLite
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./stock.db');
```

## 🔍 详细诊断命令

### 在服务器上运行以下诊断命令
```bash
echo "=== 系统信息 ==="
uname -a
cat /etc/os-release

echo "=== 内存信息 ==="
free -h

echo "=== 磁盘空间 ==="
df -h

echo "=== MySQL相关进程 ==="
ps aux | grep mysql

echo "=== 端口监听状态 ==="
netstat -tulpn | grep 3306

echo "=== MySQL服务状态 ==="
systemctl status mysql 2>/dev/null || systemctl status mysqld 2>/dev/null || echo "MySQL服务未找到"

echo "=== MySQL错误日志 ==="
tail -20 /var/log/mysql/error.log 2>/dev/null || echo "无法读取MySQL错误日志"

echo "=== 宝塔MySQL状态 ==="
/www/server/mysql/bin/mysql --version 2>/dev/null || echo "宝塔MySQL未安装"
```

## 📋 解决步骤建议

### 推荐执行顺序：

1. **通过宝塔面板检查MySQL状态**
   - 如果未安装：直接安装MySQL 8.0
   - 如果已安装但未运行：尝试启动服务

2. **如果启动失败，SSH诊断**
   - 运行上述诊断命令
   - 查看具体错误信息

3. **根据错误信息选择解决方案**
   - 配置问题：修复配置文件
   - 资源问题：清理空间或增加内存
   - 严重问题：重新安装MySQL

4. **验证修复结果**
   ```bash
   # 测试MySQL连接
   mysql -u root -p

   # 检查服务状态
   systemctl status mysql

   # 检查端口监听
   netstat -tulpn | grep 3306
   ```

## 🎯 预防措施

1. **资源监控**: 确保服务器有足够的内存和磁盘空间
2. **定期备份**: 定期备份MySQL数据和配置
3. **日志监控**: 定期检查MySQL错误日志
4. **版本兼容**: 使用稳定版本的MySQL

---

**立即行动建议**:
1. 先通过宝塔面板查看MySQL状态
2. 如果问题复杂，SSH进入服务器运行诊断命令
3. 根据诊断结果选择对应的解决方案

**需要我协助诊断时，请提供上述诊断命令的输出结果！**