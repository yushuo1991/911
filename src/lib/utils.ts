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
  // 平盘
  if (value === 0) {
    return 'bg-gray-100 text-gray-600 border border-gray-200';
  }
  
  // 上涨区间 - 红色渐变
  if (value > 0) {
    if (value >= 9.5) {
      return 'bg-red-600 text-white font-bold shadow-lg'; // 接近涨停，深红色
    } else if (value >= 7) {
      return 'bg-red-500 text-white font-semibold shadow-md'; // 大涨，红色
    } else if (value >= 4) {
      return 'bg-red-400 text-white font-medium shadow-sm'; // 中等上涨，中红色
    } else if (value >= 2) {
      return 'bg-red-300 text-red-900 font-medium'; // 小涨，浅红色
    } else if (value > 0) {
      return 'bg-red-100 text-red-700'; // 微涨，很浅的红色
    }
  }
  
  // 下跌区间 - 绿色渐变
  if (value < 0) {
    if (value <= -9.5) {
      return 'bg-green-600 text-white font-bold shadow-lg'; // 接近跌停，深绿色
    } else if (value <= -7) {
      return 'bg-green-500 text-white font-semibold shadow-md'; // 大跌，绿色
    } else if (value <= -4) {
      return 'bg-green-400 text-white font-medium shadow-sm'; // 中等下跌，中绿色
    } else if (value <= -2) {
      return 'bg-green-300 text-green-900 font-medium'; // 小跌，浅绿色
    } else if (value < 0) {
      return 'bg-green-100 text-green-700'; // 微跌，很浅的绿色
    }
  }
  
  return 'bg-gray-100 text-gray-600'; // 默认
}

export function formatPercentage(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
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