#!/bin/bash

# ===== Docker容器MySQL连接修复脚本 =====
# 修复股票跟踪应用的数据库连接问题
# 目标服务器: 107.173.154.147
# 容器名: stock-app

echo "🔧 开始修复Docker容器MySQL连接问题..."

# 服务器信息
SERVER="107.173.154.147"
CONTAINER_NAME="stock-app"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 步骤1: 检查当前状态
log_info "步骤1: 检查当前容器和数据库状态"

echo "正在检查容器状态..."
ssh root@$SERVER "docker ps --filter name=$CONTAINER_NAME --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

echo "正在检查MySQL服务状态..."
ssh root@$SERVER "systemctl status mysql --no-pager -l" || log_warning "MySQL服务可能未运行"

echo "正在检查容器内的数据库连接..."
ssh root@$SERVER "docker logs $CONTAINER_NAME --tail 10 | grep -i 'database\|mysql\|error'"

# 步骤2: 诊断MySQL权限问题
log_info "步骤2: 诊断MySQL用户权限"

echo "检查MySQL用户权限..."
MYSQL_CHECK=$(ssh root@$SERVER "mysql -u root -p -e \"SELECT user, host FROM mysql.user WHERE user='root';\" 2>/dev/null" || echo "MYSQL_LOGIN_FAILED")

if [[ "$MYSQL_CHECK" == "MYSQL_LOGIN_FAILED" ]]; then
    log_error "无法连接到MySQL，请检查MySQL服务状态和root密码"
    echo "请手动执行以下命令检查MySQL:"
    echo "1. systemctl status mysql"
    echo "2. mysql -u root -p"
    exit 1
fi

# 步骤3: 修复MySQL权限
log_info "步骤3: 修复MySQL用户权限"

echo "正在为Docker容器授权MySQL访问权限..."

# 创建修复SQL脚本
cat > /tmp/fix_mysql_permissions.sql << 'EOF'
-- 检查现有用户
SELECT user, host FROM mysql.user WHERE user='root';

-- 为Docker网络授权root用户
GRANT ALL PRIVILEGES ON *.* TO 'root'@'172.17.0.1' IDENTIFIED BY 'your_mysql_root_password_here';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'172.17.%' IDENTIFIED BY 'your_mysql_root_password_here';

-- 创建专用应用用户 (推荐)
DROP USER IF EXISTS 'stock_app'@'172.17.%';
CREATE USER 'stock_app'@'172.17.%' IDENTIFIED BY 'StockApp2025!';
GRANT ALL PRIVILEGES ON stock_tracker.* TO 'stock_app'@'172.17.%';
GRANT SELECT, INSERT, UPDATE, DELETE ON stock_tracker.* TO 'stock_app'@'172.17.%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 验证权限
SHOW GRANTS FOR 'root'@'172.17.%';
SHOW GRANTS FOR 'stock_app'@'172.17.%';
EOF

log_warning "请手动执行以下步骤修复MySQL权限:"
echo "1. 复制以下SQL脚本到服务器:"
cat /tmp/fix_mysql_permissions.sql
echo ""
echo "2. 登录MySQL并执行脚本:"
echo "   mysql -u root -p < fix_mysql_permissions.sql"
echo ""
echo "3. 或者手动执行关键命令:"
echo "   GRANT ALL PRIVILEGES ON *.* TO 'root'@'172.17.%' IDENTIFIED BY 'your_password';"
echo "   FLUSH PRIVILEGES;"

# 步骤4: 测试数据库连接
log_info "步骤4: 准备数据库连接测试"

# 创建数据库连接测试脚本
cat > /tmp/test_db_connection.js << 'EOF'
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'your_password',
      database: process.env.DB_NAME || 'stock_tracker',
      connectionLimit: 10,
      timeout: 60000
    });

    const [rows] = await pool.execute('SELECT 1 as test');
    console.log('✅ 数据库连接成功:', rows);

    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

testConnection();
EOF

echo "数据库连接测试脚本已准备: /tmp/test_db_connection.js"

# 步骤5: 容器重启和验证
log_info "步骤5: 容器重启和验证脚本"

cat > /tmp/restart_and_verify.sh << 'EOF'
#!/bin/bash

echo "🔄 重启容器并验证修复结果..."

# 重启容器
echo "正在重启stock-app容器..."
docker restart stock-app

# 等待容器启动
echo "等待容器启动..."
sleep 10

# 检查容器状态
echo "检查容器状态:"
docker ps --filter name=stock-app

# 检查应用日志
echo "检查应用启动日志:"
docker logs stock-app --tail 20

# 测试API
echo "测试API响应:"
curl -s -I http://localhost:3000/api/stocks?date=2025-09-26

# 检查数据库连接日志
echo "检查数据库连接日志:"
docker logs stock-app --tail 50 | grep -i "database\|mysql" | tail -10

echo "✅ 验证完成"
EOF

chmod +x /tmp/restart_and_verify.sh

# 步骤6: 配置文件优化建议
log_info "步骤6: 配置文件优化建议"

cat > /tmp/database_config_fix.ts << 'EOF'
// 优化后的数据库配置 (src/lib/database.ts)
import mysql from 'mysql2/promise';

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'stock_app',  // 使用专用用户
  password: process.env.DB_PASSWORD || 'StockApp2025!',
  database: process.env.DB_NAME || 'stock_tracker',
  port: parseInt(process.env.DB_PORT || '3306'),

  // 连接池配置
  connectionLimit: 10,
  queueLimit: 0,
  timeout: 60000,

  // 移除过时配置
  // acquireTimeout: 60000,  // 删除
  // createDatabaseIfNotExist: true,  // 删除

  // 新的配置选项
  acquireTimeout: 60000,
  reconnect: true,
  charset: 'utf8mb4',

  // 错误处理
  supportBigNumbers: true,
  bigNumberStrings: true
};

// 创建连接池
const pool = mysql.createPool(poolConfig);

// 添加连接测试
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const [rows] = await pool.execute('SELECT 1 as test');
    console.log('[数据库] 连接测试成功');
    return true;
  } catch (error) {
    console.error('[数据库] 连接测试失败:', error.message);
    return false;
  }
}

export default pool;
EOF

# 生成完整的修复指令
log_success "修复脚本和配置文件已生成完成!"

echo ""
echo "📋 完整修复流程:"
echo "=================="
echo ""
echo "1. 【服务器端】修复MySQL权限:"
echo "   scp /tmp/fix_mysql_permissions.sql root@$SERVER:/tmp/"
echo "   ssh root@$SERVER 'mysql -u root -p < /tmp/fix_mysql_permissions.sql'"
echo ""
echo "2. 【容器端】测试数据库连接:"
echo "   scp /tmp/test_db_connection.js root@$SERVER:/tmp/"
echo "   ssh root@$SERVER 'docker exec $CONTAINER_NAME node /tmp/test_db_connection.js'"
echo ""
echo "3. 【重启验证】:"
echo "   scp /tmp/restart_and_verify.sh root@$SERVER:/tmp/"
echo "   ssh root@$SERVER 'chmod +x /tmp/restart_and_verify.sh && /tmp/restart_and_verify.sh'"
echo ""
echo "4. 【代码优化】更新数据库配置文件:"
echo "   参考: /tmp/database_config_fix.ts"
echo ""

# 一键执行选项
log_info "是否立即执行修复? (需要MySQL root密码)"
read -p "输入 'yes' 开始自动修复: " AUTO_FIX

if [[ "$AUTO_FIX" == "yes" ]]; then
    echo "开始自动修复流程..."

    # 上传脚本到服务器
    scp /tmp/fix_mysql_permissions.sql root@$SERVER:/tmp/
    scp /tmp/test_db_connection.js root@$SERVER:/tmp/
    scp /tmp/restart_and_verify.sh root@$SERVER:/tmp/

    echo "脚本已上传到服务器，请手动执行SQL修复:"
    echo "ssh root@$SERVER 'mysql -u root -p < /tmp/fix_mysql_permissions.sql'"

else
    log_info "手动修复模式，请按照上述流程逐步执行"
fi

log_success "🎉 修复脚本执行完成! 详细诊断报告请查看: container-diagnostic-report-20250928.md"