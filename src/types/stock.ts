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
  // 历史涨停复盘API的数据结构
  PlateInfo?: Array<{
    PlateID: string;
    PlateName: string; // 板块名称（涨停原因）
    PlateStockList?: Array<{
      StockID: string;
      StockName: string;
      StockCode: string;
      LimitType: string; // 板位类型
      ChangeRatio: string; // 涨跌幅
      Price: string; // 价格
      Volume: string; // 成交量
      Amount: string; // 成交额
      [key: string]: any;
    }>;
    [key: string]: any;
  }>;
  // 原格式兼容
  List?: Array<{
    Count: string;
    TD: Array<{
      Stock: Array<{
        StockID: string;
        StockName: string;
        Tips?: string;
        ZSName?: string;
        TDType?: string;
        [key: string]: any;
      }>;
      ZSName?: string;
      TDType?: string;
      [key: string]: any;
    }>;
    ZSName?: string;
    [key: string]: any;
  }>;
  data?: Stock[];
  [key: string]: any;
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