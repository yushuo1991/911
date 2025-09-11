import { BoardType, BOARD_WEIGHTS, CATEGORY_EMOJIS } from '@/types/stock';
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
  return BOARD_WEIGHTS[boardType as BoardType] || 0;
}

export function getBoardClass(boardType: string): string {
  switch (boardType) {
    case '首板':
      return 'board-first';
    case '二板':
      return 'board-second';
    case '三板':
      return 'board-third';
    case '四板':
      return 'board-fourth';
    default:
      return 'board-high';
  }
}

export function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS['其他'];
}

export function getPerformanceClass(value: number): string {
  // 平盘 - 精致的小色块样式
  if (value === 0) {
    return 'bg-gray-300 text-gray-700 font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
  }
  
  // 上涨区间 - 精致红色小色块
  if (value > 0) {
    if (value >= 9.5) {
      // 涨停级别 - 深红小色块
      return 'bg-red-600 text-white font-bold rounded-md px-2 py-1 text-center min-w-[45px] inline-block shadow-sm';
    } else if (value >= 7) {
      // 大涨 - 中深红小色块
      return 'bg-red-500 text-white font-semibold rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    } else if (value >= 4) {
      // 中涨 - 中红小色块
      return 'bg-red-400 text-white font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    } else if (value >= 2) {
      // 小涨 - 浅红小色块
      return 'bg-red-300 text-red-800 font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    } else if (value > 0) {
      // 微涨 - 淡红小色块
      return 'bg-red-100 text-red-700 font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    }
  }
  
  // 下跌区间 - 精致绿色小色块
  if (value < 0) {
    if (value <= -9.5) {
      // 跌停级别 - 深绿小色块
      return 'bg-green-600 text-white font-bold rounded-md px-2 py-1 text-center min-w-[45px] inline-block shadow-sm';
    } else if (value <= -7) {
      // 大跌 - 中深绿小色块
      return 'bg-green-500 text-white font-semibold rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    } else if (value <= -4) {
      // 中跌 - 中绿小色块
      return 'bg-green-400 text-white font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    } else if (value <= -2) {
      // 小跌 - 浅绿小色块
      return 'bg-green-300 text-green-800 font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    } else if (value < 0) {
      // 微跌 - 淡绿小色块
      return 'bg-green-100 text-green-700 font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
    }
  }
  
  return 'bg-gray-300 text-gray-700 rounded-md px-2 py-1 text-center min-w-[45px] inline-block'; // 默认
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
  currentDate.setDate(currentDate.getDate() + 1); // 从下一天开始

  while (tradingDays.length < days) {
    // 跳过周末
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      const dateStr = currentDate.getFullYear().toString() +
        (currentDate.getMonth() + 1).toString().padStart(2, '0') +
        currentDate.getDate().toString().padStart(2, '0');
      tradingDays.push(dateStr);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return tradingDays;
}

export function generateMockPerformance(stockCode: string, tradingDays: string[]): Record<string, number> {
  const performance: Record<string, number> = {};
  
  for (const day of tradingDays) {
    // 使用股票代码和日期生成伪随机的涨跌幅
    const seed = hashString(stockCode + day);
    // 生成-8%到+8%的涨跌幅
    const pctChange = (seed % 1600 - 800) / 100;
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

export function sortStocksByBoard<T extends { td_type: string }>(stocks: T[]): T[] {
  return stocks.sort((a, b) => getBoardWeight(b.td_type) - getBoardWeight(a.td_type));
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