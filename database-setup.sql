-- 股票追踪系统数据库初始化脚本
-- 创建数据库和表结构

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS stock_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE stock_db;

-- 创建用户（如果不存在）
CREATE USER IF NOT EXISTS 'stock_user'@'localhost' IDENTIFIED BY 'StockPass123!';
GRANT ALL PRIVILEGES ON stock_db.* TO 'stock_user'@'localhost';
FLUSH PRIVILEGES;

-- 1. 系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_type ENUM('info', 'warning', 'error', 'success') NOT NULL,
    message TEXT NOT NULL,
    details JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_log_type (log_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 股票基础信息表
CREATE TABLE IF NOT EXISTS stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_code VARCHAR(10) NOT NULL COMMENT '股票代码',
    stock_name VARCHAR(100) NOT NULL COMMENT '股票名称',
    category VARCHAR(100) NOT NULL COMMENT '板块分类',
    td_type VARCHAR(20) NOT NULL COMMENT '板位类型（首板、二板等）',
    date DATE NOT NULL COMMENT '涨停日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_stock_date (stock_code, date),
    INDEX idx_date (date),
    INDEX idx_category (category),
    INDEX idx_td_type (td_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 股票表现数据表
CREATE TABLE IF NOT EXISTS stock_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_code VARCHAR(10) NOT NULL COMMENT '股票代码',
    base_date DATE NOT NULL COMMENT '基准日期（涨停日）',
    trading_date DATE NOT NULL COMMENT '交易日期',
    pct_change DECIMAL(8,4) NOT NULL COMMENT '涨跌幅(%)',
    data_source VARCHAR(20) DEFAULT 'tushare' COMMENT '数据来源',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_stock_base_trading (stock_code, base_date, trading_date),
    INDEX idx_base_date (base_date),
    INDEX idx_trading_date (trading_date),
    INDEX idx_stock_code (stock_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 数据预加载状态表
CREATE TABLE IF NOT EXISTS preload_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL COMMENT '数据日期',
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    stock_count INT DEFAULT 0 COMMENT '股票数量',
    duration_ms INT DEFAULT 0 COMMENT '处理耗时(毫秒)',
    error_message TEXT NULL COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_date (date),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入一些示例日志数据
INSERT IGNORE INTO system_logs (log_type, message, details) VALUES
('info', '数据库初始化完成', '{"tables": ["system_logs", "stocks", "stock_performance", "preload_status"]}'),
('success', '股票追踪系统数据库结构创建完成', '{"version": "1.0", "charset": "utf8mb4"}');

-- 显示创建的表
SHOW TABLES;

-- 显示表结构
DESCRIBE stocks;
DESCRIBE stock_performance;
DESCRIBE system_logs;
DESCRIBE preload_status;