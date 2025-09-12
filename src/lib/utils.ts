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
  // 简单的板位显示，统一样式，不使用5级色彩
  return 'bg-gray-600 text-white';
}

export function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS['其他'];
}

export function getPerformanceClass(value: number): string {
  const baseClass = 'text-xs font-medium rounded-md px-2 py-1 text-center min-w-[45px] inline-block';
  
  // 平盘
  if (value === 0) {
    return `bg-gray-200 text-gray-600 ${baseClass}`;
  }
  
  // 上涨区间 - 红色渐变（涨幅越大颜色越深）
  if (value > 0) {
    if (value >= 9.5) {
      return `bg-red-700 text-white font-bold ${baseClass}`;  // 涨停：最深红
    } else if (value >= 7) {
      return `bg-red-600 text-white font-semibold ${baseClass}`; // 大涨：深红
    } else if (value >= 5) {
      return `bg-red-500 text-white ${baseClass}`;  // 中大涨：中深红
    } else if (value >= 3) {
      return `bg-red-400 text-white ${baseClass}`;  // 中涨：中红
    } else if (value >= 1) {
      return `bg-red-300 text-red-900 ${baseClass}`; // 小涨：浅红
    } else {
      return `bg-red-100 text-red-700 ${baseClass}`; // 微涨：淡红
    }
  }
  
  // 下跌区间 - 绿色渐变（跌幅越大颜色越深）
  if (value < 0) {
    if (value <= -9.5) {
      return `bg-green-700 text-white font-bold ${baseClass}`;  // 跌停：最深绿
    } else if (value <= -7) {
      return `bg-green-600 text-white font-semibold ${baseClass}`; // 大跌：深绿
    } else if (value <= -5) {
      return `bg-green-500 text-white ${baseClass}`;  // 中大跌：中深绿
    } else if (value <= -3) {
      return `bg-green-400 text-white ${baseClass}`;  // 中跌：中绿
    } else if (value <= -1) {
      return `bg-green-300 text-green-900 ${baseClass}`; // 小跌：浅绿
    } else {
      return `bg-green-100 text-green-700 ${baseClass}`; // 微跌：淡绿
    }
  }
  
  return `bg-gray-200 text-gray-600 ${baseClass}`; // 默认
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
  // 按板位权重从高到低排序，高板位在最上面，首板在最下面
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