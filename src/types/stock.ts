export interface Stock {
  StockName: string;
  StockCode: string;
  ZSName: string;
  TDType: string;
}

export interface StockPerformance {
  name: string;
  code: string;
  td_type: string;
  performance: Record<string, number>;
  total_return: number;
}

export interface CategoryData {
  [category: string]: StockPerformance[];
}

export interface TrackingData {
  date: string;
  trading_days: string[];
  categories: CategoryData;
  stats: {
    total_stocks: number;
    category_count: number;
    profit_ratio: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LimitUpApiResponse {
  List?: Array<{
    Count: string;
    TD: Array<{
      Stock: Array<{
        StockID: string;
        StockName: string;
        Tips?: string;
      }>;
    }>;
  }>;
  data?: Stock[];
}

export interface TushareResponse {
  trade_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  pre_close: number;
  change: number;
  pct_chg: number;
  vol: number;
  amount: number;
}

export type BoardType = '首板' | '二板' | '三板' | '四板' | '五板' | '六板' | '七板' | '八板' | '九板' | '十板';

export const BOARD_WEIGHTS: Record<BoardType, number> = {
  '首板': 1,
  '二板': 2,
  '三板': 3,
  '四板': 4,
  '五板': 5,
  '六板': 6,
  '七板': 7,
  '八板': 8,
  '九板': 9,
  '十板': 10,
};

export const CATEGORY_EMOJIS: Record<string, string> = {
  '人工智能': '🤖',
  '新能源汽车': '🔋',
  '医药生物': '💊',
  '光伏能源': '☀️',
  '半导体': '💻',
  '军工': '🚀',
  '房地产': '🏠',
  '金融': '💰',
  '其他': '📊',
};