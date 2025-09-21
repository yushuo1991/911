import { BoardType, BOARD_WEIGHTS, CATEGORY_EMOJIS, StockPerformance } from '@/types/stock';
import { format } from 'date-fns';

export function cn(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: string): string {
  return format(new Date(date), 'yyyy-MM-dd');
}

export function formatTradingDate(tradingDate: string): string {
  if (tradingDate.length === 8) {
    const year = tradingDate.slice(0, 4);
    const month = tradingDate.slice(4, 6);
    const day = tradingDate.slice(6, 8);
    return `${month}/${day}`;
  }
  return tradingDate;
}

export function getBoardWeight(boardType: string): number {
  // 处理各种板位类型，提取板位数字
  if (boardType === '首板' || boardType === '首') return 1;

  // 处理连板类型：2连板、3连板等
  const lianbanMatch = boardType.match(/(\d+)连板/);
  if (lianbanMatch) return parseInt(lianbanMatch[1]);

  // 处理X天Y板类型：5天4板、3天2板等
  const tianbanMatch = boardType.match(/\d+天(\d+)板/);
  if (tianbanMatch) return parseInt(tianbanMatch[1]);

  // 处理纯板数：二板、三板等
  return BOARD_WEIGHTS[boardType as BoardType] || 1;
}

export function getBoardClass(boardType: string): string {
  // 板位显示为黑字无底纹，简洁样式
  return 'text-gray-900 font-medium';
}

export function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS['其他'];
}

export function getPerformanceClass(value: number): string {
  // 确保value是数字类型
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // 平盘 - 中性灰色
  if (numValue === 0) {
    return 'bg-slate-100 text-slate-600 text-xs font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
  }

  // 上涨区间 - 基于 #da4453 的红色渐变
  if (numValue > 0) {
    if (numValue >= 9.5) {
      // 涨停 - #da4453
      return 'bg-stock-red-600 text-white font-bold text-xs rounded-md px-2 py-1 text-center min-w-[45px] inline-block shadow-sm';
    } else if (numValue >= 7) {
      // 大涨 - 深红色
      return 'bg-stock-red-500 text-white font-semibold text-xs rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    } else if (numValue >= 5) {
      // 中大涨 - 中红色
      return 'bg-stock-red-400 text-white text-xs font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    } else if (numValue >= 3) {
      // 中涨 - 浅红色
      return 'bg-stock-red-300 text-red-900 text-xs font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    } else if (numValue >= 1) {
      // 小涨 - 淡红色
      return 'bg-stock-red-200 text-red-800 text-xs font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    } else if (numValue > 0) {
      // 微涨 - 最淡红色
      return 'bg-stock-red-100 text-red-700 text-xs font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    }
  }

  // 下跌区间 - 基于 #37bc9b 和 #434a54 的绿色渐变
  if (numValue < 0) {
    if (numValue <= -9.5) {
      // 跌停 - #434a54 深灰蓝色
      return 'bg-stock-dark text-white font-bold text-xs rounded-md px-2 py-1 text-center min-w-[45px] inline-block shadow-sm';
    } else if (numValue <= -7) {
      // 大跌 - #37bc9b 绿色
      return 'bg-stock-green-500 text-white font-semibold text-xs rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    } else if (numValue <= -5) {
      // 中大跌 - 中绿色
      return 'bg-stock-green-400 text-white text-xs font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    } else if (numValue <= -3) {
      // 中跌 - 浅绿色
      return 'bg-stock-green-300 text-green-900 text-xs font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    } else if (numValue <= -1) {
      // 小跌 - 淡绿色
      return 'bg-stock-green-200 text-green-800 text-xs font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    } else if (numValue < 0) {
      // 微跌 - 最淡绿色
      return 'bg-stock-green-100 text-green-700 text-xs font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    }
  }

  // 默认情况 - 中性色
  return 'bg-slate-100 text-slate-600 text-xs font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
}

export function formatPercentage(value: number): string {
  // 确保数值精度和格式一致性
  const formattedValue = Math.abs(value) < 0.1 && value !== 0
    ? value.toFixed(2) // 对于非常小的数值显示两位小数
    : value.toFixed(1); // 通常情况显示一位小数

  return `${value > 0 ? '+' : value < 0 ? '' : ''}${formattedValue}%`;
}

export function generateTradingDays(startDate: string, days: number = 5): string[] {
  const tradingDays: string[] = [];
  let currentDate = new Date(startDate);

  // 获取今天的日期，只比较年月日
  const today = new Date();
  today.setHours(23, 59, 59, 999); // 设置为今天的最后一刻

  // 从选择日期的第二天开始往后推，生成后续交易日
  currentDate.setDate(currentDate.getDate() + 1); // 从第二天开始

  while (tradingDays.length < days) {
    // 检查是否超过今天的日期
    if (currentDate > today) {
      console.log(`[日期生成] 到达未来日期 ${currentDate.toISOString().split('T')[0]}，停止生成`);
      break;
    }

    // 跳过周末
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      const dateStr = currentDate.getFullYear().toString() +
        (currentDate.getMonth() + 1).toString().padStart(2, '0') +
        currentDate.getDate().toString().padStart(2, '0');
      tradingDays.push(dateStr);
      console.log(`[日期生成] 添加交易日: ${dateStr}`);
    }
    currentDate.setDate(currentDate.getDate() + 1); // 往后推一天
  }

  console.log(`[日期生成] 从 ${startDate} 生成了 ${tradingDays.length} 个交易日:`, tradingDays);
  return tradingDays;
}

export function generateMockPerformance(stockCode: string, tradingDays: string[]): Record<string, number> {
  const performance: Record<string, number> = {};
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // 为不同股票代码生成不同的基础种子
  const baseSeed = hashString(stockCode);

  for (let i = 0; i < tradingDays.length; i++) {
    const day = tradingDays[i];

    // 检查是否为未来日期
    const dayDate = new Date(
      parseInt(day.slice(0, 4)),
      parseInt(day.slice(4, 6)) - 1,
      parseInt(day.slice(6, 8))
    );

    if (dayDate > today) {
      console.log(`[模拟数据] 跳过未来日期: ${day}`);
      performance[day] = 0; // 未来日期返回0
      continue;
    }

    // 改进种子生成：使用更复杂的组合确保每个股票每个日期都有独特的种子
    const seed = hashString(`${stockCode}_${day}_${i}_${tradingDays.length}_${tradingDays[0]}`);

    // 添加额外的随机性：基于日期数字的各位数字
    const dayNum = parseInt(day);
    const extraSeed = hashString(`${stockCode}_${dayNum % 1000}_${Math.floor(dayNum / 10000)}`);
    const combinedSeed = (seed + extraSeed * 7) % 2147483647;

    // 根据不同板块生成不同范围的涨跌幅
    let maxChange = 8; // 默认最大涨跌幅8%

    // ST股票更大波动
    if (stockCode.startsWith('ST') || stockCode.includes('ST')) {
      maxChange = 5; // ST股票限制5%
    }
    // 科创板和创业板更大波动
    else if (stockCode.startsWith('68') || stockCode.startsWith('30')) {
      maxChange = 12; // 科创板/创业板更大波动
    }

    // 生成基础涨跌幅
    let pctChange = ((combinedSeed % (maxChange * 200)) - (maxChange * 100)) / 100;

    // 添加连续性（前一日有影响）
    if (i > 0) {
      const prevChange = performance[tradingDays[i-1]];
      // 30%概率继续前一日趋势，70%概率独立
      if ((combinedSeed % 10) < 3) {
        pctChange = pctChange * 0.7 + prevChange * 0.3;
      }
    }

    // 根据股票类型调整概率分布
    const codeHash = baseSeed % 100;

    // 强势股：更多上涨概率
    if (codeHash < 20) {
      pctChange = Math.abs(pctChange) * (combinedSeed % 2 === 0 ? 1 : -0.3);
    }
    // 弱势股：更多下跌概率
    else if (codeHash > 80) {
      pctChange = Math.abs(pctChange) * (combinedSeed % 2 === 0 ? -1 : 0.3);
    }

    performance[day] = Math.round(pctChange * 100) / 100;
  }

  return performance;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export function sortStocksByBoard<T extends { td_type: string; name?: string }>(stocks: T[]): T[] {
  return stocks.sort((a, b) => {
    // 按td_type字符串倒序排序
    return b.td_type.localeCompare(a.td_type);
  });
}

export function calculateStats(categories: Record<string, any[]>) {
  const total_stocks = Object.values(categories).reduce((sum, stocks) => sum + stocks.length, 0);
  const category_count = Object.keys(categories).length;

  let profitable_count = 0;
  Object.values(categories).forEach(stocks => {
    stocks.forEach((stock: any) => {
      if (stock.total_return > 0) {
        profitable_count++;
      }
    });
  });

  const profit_ratio = total_stocks > 0 ? (profitable_count / total_stocks) * 100 : 0;

  return {
    total_stocks,
    category_count,
    profit_ratio: Math.round(profit_ratio * 10) / 10
  };
}

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function calculateDailyAverage(stocks: StockPerformance[], day: string): number {
  const validPerformances = stocks
    .filter(stock => stock.performance[day] !== undefined && stock.performance[day] !== null)
    .map(stock => stock.performance[day]);

  if (validPerformances.length === 0) return 0;

  const sum = validPerformances.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / validPerformances.length) * 100) / 100;
}