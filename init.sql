-- 股票追踪系统数据库初始化脚本
-- 自动在Docker首次启动时执行

USE stock_tracker;

-- 创建股票数据表
CREATE TABLE IF NOT EXISTS stock_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stock_code VARCHAR(10) NOT NULL,
  stock_name VARCHAR(50) NOT NULL,
  sector_name VARCHAR(100) NOT NULL,
  td_type VARCHAR(20) NOT NULL,
  trade_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_stock_date (stock_code, trade_date),
  INDEX idx_trade_date (trade_date),
  INDEX idx_sector_name (sector_name),
  INDEX idx_stock_code (stock_code),
  INDEX idx_composite (trade_date, sector_name, td_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建股票表现数据表
CREATE TABLE IF NOT EXISTS stock_performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stock_code VARCHAR(10) NOT NULL,
  base_date DATE NOT NULL COMMENT '涨停基准日期',
  performance_date DATE NOT NULL COMMENT '表现日期',
  pct_change DECIMAL(8,4) DEFAULT 0 COMMENT '涨跌幅(%)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_performance (stock_code, base_date, performance_date),
  INDEX idx_base_date (base_date),
  INDEX idx_performance_date (performance_date),
  INDEX idx_stock_code_base (stock_code, base_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建7天数据缓存表
CREATE TABLE IF NOT EXISTS seven_days_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cache_key VARCHAR(255) NOT NULL UNIQUE,
  data JSON NOT NULL,
  dates JSON NOT NULL COMMENT '包含的日期列表',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_cache_key (cache_key),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入初始化完成标记
INSERT INTO stock_data (stock_code, stock_name, sector_name, td_type, trade_date)
VALUES ('000000', '数据库初始化标记', '系统', '首板', CURDATE())
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

SELECT 'Database initialized successfully' AS status;