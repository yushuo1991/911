-- 分时图快照表
CREATE TABLE IF NOT EXISTS minute_chart_snapshots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trade_date DATE NOT NULL COMMENT '交易日期',
  stock_code VARCHAR(10) NOT NULL COMMENT '股票代码',
  stock_name VARCHAR(50) COMMENT '股票名称',
  file_path VARCHAR(255) NOT NULL COMMENT '图片文件路径',
  file_size INT COMMENT '文件大小(字节)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_date_code (trade_date, stock_code),
  INDEX idx_created_at (created_at),
  UNIQUE KEY uk_date_code (trade_date, stock_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分时图快照表';

