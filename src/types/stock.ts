export interface Stock {
  StockName: string;
  StockCode: string;
  ZSName: string;
  TDType: string;
  Amount?: number; // 成交额（亿元）- v4.8.8新增
  LimitUpTime?: string; // v4.8.24新增：涨停时间（格式：HH:MM）
}

export interface StockPerformance {
  name: string;
  code: string;
  td_type: string;
  performance: Record<string, number>;
  total_return: number;
  amount?: number; // v4.8.16新增：个股涨停当日成交额（亿元）
  followUpData?: Record<string, number>; // 可选：个股后续日期表现数据
  totalReturn?: number; // 可选：累计收益（用于涨停数弹窗）
  limitUpTime?: string; // v4.8.24新增：涨停时间（格式：HH:MM）
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

// 新增：7天数据结构
export interface DayData {
  date: string;
  categories: CategoryData;
  stats: {
    total_stocks: number;
    category_count: number;
    profit_ratio: number;
  };
  followUpData: Record<string, Record<string, Record<string, number>>>; // 板块->股票代码->后续日期表现
  sectorAmounts?: Record<string, number>; // v4.8.8新增：板块成交额汇总（亿元）
}

export interface SevenDaysData {
  [date: string]: DayData;
}

// 新增：板块汇总信息（用于时间轴显示）
export interface SectorSummary {
  name: string;
  count: number;
  stocks: StockPerformance[];
  followUpData: Record<string, Record<string, number>>; // 股票代码->后续日期表现
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

// v4.8.30新增：15天板块高度走势 - 个股维度追踪
// 单个高板股票的追踪数据
export interface HighBoardStockTracker {
  stockCode: string;           // 股票代码
  stockName: string;           // 股票名称
  sectorName: string;          // 所属板块
  peakBoardNum: number;        // 历史最高板位（例如：5）
  peakDate: string;            // 达到峰值的日期（例如：2024-12-10）
  lifecycle: LifecyclePoint[]; // 生命周期追踪数据（从峰值日开始的每一天）
}

// 生命周期中的单个数据点
export interface LifecyclePoint {
  date: string;                // 日期
  type: 'continuous' | 'broken' | 'terminated';  // 数据点类型

  // 连续涨停期间的数据（type='continuous'时有效）
  boardNum?: number;           // 当前板位（例如：5板 -> 6板 -> 7板）
  isLatest?: boolean;          // 是否是连续涨停的最新一天（用于标记显示）
  td_type?: string;            // v4.8.31新增：td_type字段（例如："6连板"、"10天9板"）

  // 断板后的数据（type='broken'时有效）
  changePercent?: number;      // 涨跌幅%（例如：+8.5, -12.3）
  relativeBoardPosition?: number; // 相对坐标（例如：5板+8.5% = 5.85）

  // 终止标记（type='terminated'时表示追踪结束）
  terminationReason?: 'max_duration' | 'data_unavailable';
}

// 板块高度走势过滤器状态
export interface SectorHeightFilters {
  minBoardNum: number | null;  // 最低板位过滤（null表示全部，4表示≥4板）
  selectedSector: string | null; // 选中的板块（null表示全部）
}