/**
 * 股票代码格式转换工具函数
 * 统一处理6位代码和Tushare格式之间的转换
 */

/**
 * 将6位股票代码转换为Tushare格式（带市场后缀）
 * @param stockCode 6位股票代码（如 600000, 000001, 300750）
 * @returns Tushare格式代码（如 600000.SH, 000001.SZ, 300750.SZ）
 */
export function toTushareCode(stockCode: string): string {
  if (!stockCode || stockCode.length !== 6) {
    console.warn(`[StockCodeUtils] 无效的股票代码: ${stockCode}`);
    return stockCode;
  }

  // 上海股票：6开头
  if (stockCode.startsWith('6')) {
    return `${stockCode}.SH`;
  }

  // 深圳股票：0开头（主板）、3开头（创业板）、2开头（中小板）
  if (stockCode.startsWith('0') || stockCode.startsWith('3') || stockCode.startsWith('2')) {
    return `${stockCode}.SZ`;
  }

  // 北交所：4或8开头（通常不需要处理）
  if (stockCode.startsWith('4') || stockCode.startsWith('8')) {
    return `${stockCode}.BJ`;
  }

  console.warn(`[StockCodeUtils] 未知市场的股票代码: ${stockCode}`);
  return stockCode;
}

/**
 * 将Tushare格式代码转换为6位股票代码
 * @param tushareCode Tushare格式代码（如 600000.SH, 000001.SZ）
 * @returns 6位股票代码（如 600000, 000001）
 */
export function fromTushareCode(tushareCode: string): string {
  if (!tushareCode) {
    return tushareCode;
  }

  // 去除后缀
  const match = tushareCode.match(/^(\d{6})\.(SH|SZ|BJ)$/);
  if (match) {
    return match[1];
  }

  // 如果已经是6位代码，直接返回
  if (/^\d{6}$/.test(tushareCode)) {
    return tushareCode;
  }

  console.warn(`[StockCodeUtils] 无效的Tushare代码: ${tushareCode}`);
  return tushareCode;
}

/**
 * 批量转换为Tushare格式
 * @param stockCodes 6位股票代码数组
 * @returns Tushare格式代码数组
 */
export function batchToTushareCode(stockCodes: string[]): string[] {
  return stockCodes.map(code => toTushareCode(code));
}

/**
 * 批量转换为6位代码
 * @param tushareCodes Tushare格式代码数组
 * @returns 6位股票代码数组
 */
export function batchFromTushareCode(tushareCodes: string[]): string[] {
  return tushareCodes.map(code => fromTushareCode(code));
}

/**
 * 将6位代码转换为新浪财经格式（用于分时图等）
 * @param stockCode 6位股票代码
 * @returns 新浪格式（如 sh600000, sz000001）
 */
export function toSinaCode(stockCode: string): string {
  if (!stockCode || stockCode.length !== 6) {
    return stockCode;
  }

  if (stockCode.startsWith('6')) {
    return `sh${stockCode}`;
  }

  if (stockCode.startsWith('0') || stockCode.startsWith('3') || stockCode.startsWith('2')) {
    return `sz${stockCode}`;
  }

  return stockCode;
}

/**
 * 将日期从YYYY-MM-DD格式转换为YYYYMMDD
 * @param date 日期字符串 YYYY-MM-DD
 * @returns YYYYMMDD格式
 */
export function formatDateToCompact(date: string): string {
  return date.replace(/-/g, '');
}

/**
 * 将日期从YYYYMMDD格式转换为YYYY-MM-DD
 * @param date 日期字符串 YYYYMMDD
 * @returns YYYY-MM-DD格式
 */
export function formatDateToStandard(date: string): string {
  if (date.length !== 8) {
    return date;
  }
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
}
