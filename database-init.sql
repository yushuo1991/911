-- 股票追踪系统数据库初始化脚本
-- 在宝塔面板phpMyAdmin中执行此脚本

-- 创建股票基础信息表
CREATE TABLE IF NOT EXISTS stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_code VARCHAR(10) NOT NULL COMMENT '股票代码',
    stock_name VARCHAR(100) NOT NULL COMMENT '股票名称',
    category VARCHAR(100) NOT NULL COMMENT '板块分类',
    td_type VARCHAR(50) NOT NULL COMMENT '涨停类型',
    date DATE NOT NULL COMMENT '记录日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_category (category),
    INDEX idx_stock_code (stock_code),
    UNIQUE KEY unique_stock_date (stock_code, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='股票基础信息表';

-- 创建股票表现数据表
CREATE TABLE IF NOT EXISTS stock_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_code VARCHAR(10) NOT NULL COMMENT '股票代码',
    base_date DATE NOT NULL COMMENT '基准日期',
    trading_date DATE NOT NULL COMMENT '交易日期',
    pct_change DECIMAL(8,4) DEFAULT NULL COMMENT '涨跌幅(%)',
    data_source ENUM('tushare', 'mock', 'manual') DEFAULT 'mock' COMMENT '数据来源',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_base_date (base_date),
    INDEX idx_stock_base (stock_code, base_date),
    INDEX idx_trading_date (trading_date),
    UNIQUE KEY unique_performance (stock_code, base_date, trading_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='股票表现数据表';

-- 创建系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info' COMMENT '日志类型',
    message TEXT NOT NULL COMMENT '日志消息',
    details JSON DEFAULT NULL COMMENT '详细信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_log_type (log_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统日志表';

-- 插入示例股票数据
INSERT INTO stocks (stock_code, stock_name, category, td_type, date) VALUES
('000001', '平安银行', '银行', '首板', CURDATE()),
('600036', '招商银行', '银行', '2连板', CURDATE()),
('000002', '万科A', '房地产', '首板', CURDATE()),
('600519', '贵州茅台', '白酒', '3连板', CURDATE()),
('000858', '五粮液', '白酒', '2连板', CURDATE()),
('000063', '中兴通讯', '通信设备', '首板', CURDATE()),
('002415', '海康威视', '安防设备', '2连板', CURDATE()),
('300059', '东方财富', '互联网金融', '首板', CURDATE()),
('002594', '比亚迪', '新能源汽车', '3连板', CURDATE()),
('300750', '宁德时代', '电池', '首板', CURDATE());

-- 插入示例系统日志
INSERT INTO system_logs (log_type, message, details) VALUES
('info', '系统初始化完成', JSON_OBJECT('timestamp', NOW(), 'action', 'database_init')),
('success', '示例数据导入成功', JSON_OBJECT('records_inserted', 10, 'table', 'stocks'));

-- 创建索引优化查询性能
ALTER TABLE stocks ADD INDEX idx_category_date (category, date);
ALTER TABLE stock_performance ADD INDEX idx_stock_trading (stock_code, trading_date);

-- 显示表结构确认
SHOW TABLES;
DESCRIBE stocks;
DESCRIBE stock_performance;
DESCRIBE system_logs;
