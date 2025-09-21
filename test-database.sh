#!/bin/bash

echo "========================================"
echo "数据库连接测试"
echo "========================================"

# 测试MySQL连接
echo "测试MySQL连接..."
mysql -u stock_user -p'StockPass123!' stock_db -e "SELECT 'MySQL连接成功!' as status;"

if [ $? -eq 0 ]; then
    echo "✓ 数据库连接正常"
else
    echo "✗ 数据库连接失败"
    exit 1
fi

# 检查表结构
echo "检查数据库表..."
mysql -u stock_user -p'StockPass123!' stock_db -e "SHOW TABLES;"

# 检查系统日志
echo "检查系统日志..."
mysql -u stock_user -p'StockPass123!' stock_db -e "SELECT COUNT(*) as log_count FROM system_logs;"

# 检查股票数据
echo "检查股票数据..."
mysql -u stock_user -p'StockPass123!' stock_db -e "SELECT COUNT(*) as stock_count FROM stocks;"

echo "========================================"
echo "数据库测试完成"
echo "========================================"