import { StockPremiumData } from '@/components/StockPremiumChart';
import { StockPerformance } from '@/types/stock';

/**
 * 将板块个股数据转换为图表数据格式
 * @param stocks - 板块内的个股列表
 * @param followUpData - 后续表现数据 (股票代码 -> 日期 -> 溢价)
 * @param maxStocks - 最多显示的个股数量（按累计溢价排序）
 * @param dates - 可选的日期数组，用于确保正确的日期排序
 * @returns 图表数据数组
 */
export function transformSectorStocksToChartData(
  stocks: StockPerformance[],
  followUpData: Record<string, Record<string, number>>,
  maxStocks: number = 10,
  dates?: string[]
): StockPremiumData[] {
  // 计算每只股票的累计溢价并排序
  const stocksWithTotal = stocks.map(stock => {
    const stockFollowUp = followUpData[stock.code] || {};
    const totalReturn = Object.values(stockFollowUp).reduce((sum, val) => sum + val, 0);

    // 将日期和溢价转换为数组格式
    // 如果提供了dates数组，使用它来确保正确的日期顺序
    let premiums;
    if (dates && dates.length > 0) {
      // 使用dates数组的顺序
      premiums = dates
        .filter(date => stockFollowUp[date] !== undefined)
        .map(date => ({
          date,
          premium: Math.round(stockFollowUp[date] * 100) / 100, // 保留2位小数
        }));
    } else {
      // 降级方案：使用字符串排序
      premiums = Object.entries(stockFollowUp)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, premium]) => ({
          date,
          premium: Math.round(premium * 100) / 100, // 保留2位小数
        }));
    }

    return {
      stockCode: stock.code,
      stockName: stock.name,
      premiums,
      totalReturn: Math.round(totalReturn * 100) / 100,
    };
  });

  // 按累计溢价降序排序，取前N只
  return stocksWithTotal
    .sort((a, b) => b.totalReturn - a.totalReturn)
    .slice(0, maxStocks);
}

/**
 * 计算板块平均溢价趋势数据
 * @param followUpData - 后续表现数据 (股票代码 -> 日期 -> 溢价)
 * @returns 平均溢价趋势数组
 */
export function calculateSectorAverageTrend(
  followUpData: Record<string, Record<string, number>>
): {
  date: string;
  avgPremium: number;
  stockCount: number;
}[] {
  // 收集所有日期
  const allDates = new Set<string>();
  Object.values(followUpData).forEach(stockData => {
    Object.keys(stockData).forEach(date => allDates.add(date));
  });

  const sortedDates = Array.from(allDates).sort().slice(0, 5); // 只取前5个交易日

  // 计算每个日期的平均溢价
  return sortedDates.map(date => {
    let totalPremium = 0;
    let validStockCount = 0;

    Object.entries(followUpData).forEach(([stockCode, stockData]) => {
      if (stockData[date] !== undefined) {
        totalPremium += stockData[date];
        validStockCount++;
      }
    });

    const avgPremium = validStockCount > 0 ? totalPremium / validStockCount : 0;

    return {
      date,
      avgPremium: Math.round(avgPremium * 100) / 100,
      stockCount: validStockCount,
    };
  });
}

/**
 * 按累计溢价对个股排序（用于表格显示）
 * @param stocks - 个股列表
 * @param followUpData - 后续表现数据
 * @returns 排序后的个股列表（带累计溢价）
 */
export function sortStocksByTotalReturn(
  stocks: StockPerformance[],
  followUpData: Record<string, Record<string, number>>
): (StockPerformance & { totalReturn: number; followUpValues: Record<string, number> })[] {
  return stocks.map(stock => {
    const followUpValues = followUpData[stock.code] || {};
    const totalReturn = Object.values(followUpValues).reduce((sum, val) => sum + val, 0);

    return {
      ...stock,
      totalReturn,
      followUpValues,
    };
  }).sort((a, b) => b.totalReturn - a.totalReturn);
}

/**
 * 为图表生成配色方案
 * @param count - 需要的颜色数量
 * @returns 颜色数组
 */
export function generateChartColors(count: number): string[] {
  const baseColors = [
    '#2563eb', // 蓝色
    '#dc2626', // 红色
    '#16a34a', // 绿色
    '#ea580c', // 橙色
    '#9333ea', // 紫色
    '#0891b2', // 青色
    '#ca8a04', // 黄色
    '#db2777', // 粉色
    '#65a30d', // lime
    '#7c3aed', // violet
  ];

  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  // 如果需要更多颜色，重复使用基础颜色
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
}

/**
 * 过滤出前N只表现最好的个股
 * @param stocks - 个股列表
 * @param followUpData - 后续表现数据
 * @param topN - 前N只
 * @returns 过滤后的个股代码列表
 */
export function getTopPerformingStocks(
  stocks: StockPerformance[],
  followUpData: Record<string, Record<string, number>>,
  topN: number = 5
): string[] {
  const sorted = sortStocksByTotalReturn(stocks, followUpData);
  return sorted.slice(0, topN).map(stock => stock.code);
}

/**
 * 计算板块统计数据
 * @param followUpData - 后续表现数据
 * @returns 统计数据对象
 */
export function calculateSectorStats(
  followUpData: Record<string, Record<string, number>>
): {
  totalStocks: number;
  profitableStocks: number;
  profitRatio: number;
  avgTotalReturn: number;
  maxReturn: number;
  minReturn: number;
} {
  const stockReturns: number[] = [];

  Object.values(followUpData).forEach(stockData => {
    const totalReturn = Object.values(stockData).reduce((sum, val) => sum + val, 0);
    stockReturns.push(totalReturn);
  });

  const totalStocks = stockReturns.length;
  const profitableStocks = stockReturns.filter(r => r > 0).length;
  const profitRatio = totalStocks > 0 ? (profitableStocks / totalStocks) * 100 : 0;
  const avgTotalReturn = totalStocks > 0
    ? stockReturns.reduce((sum, val) => sum + val, 0) / totalStocks
    : 0;
  const maxReturn = stockReturns.length > 0 ? Math.max(...stockReturns) : 0;
  const minReturn = stockReturns.length > 0 ? Math.min(...stockReturns) : 0;

  return {
    totalStocks,
    profitableStocks,
    profitRatio: Math.round(profitRatio * 10) / 10,
    avgTotalReturn: Math.round(avgTotalReturn * 100) / 100,
    maxReturn: Math.round(maxReturn * 100) / 100,
    minReturn: Math.round(minReturn * 100) / 100,
  };
}