/**
 * Type definitions for mobile-specific components and interfaces
 */

import { StockPerformance, DayData, SevenDaysData } from './stock';

/**
 * Device type union
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * View mode for conditional rendering
 */
export type ViewMode = 'mobile' | 'desktop';

/**
 * Modal types in the application
 */
export type ModalType =
  | 'sector' // 板块详情
  | 'board' // 连板梯队
  | 'date' // 日期详情
  | 'chart' // 图表
  | 'kline' // K线图
  | 'minute' // 分时图
  | 'stock-count' // 股票数量
  | 'board-ranking'; // 连板排名

/**
 * Props for MobileStockCard component
 */
export interface MobileStockCardProps {
  /** Stock data with performance metrics */
  stock: StockPerformance;
  /** Click handler */
  onTap?: (stock: StockPerformance) => void;
  /** Whether to show sector information */
  showSector?: boolean;
  /** Whether to show performance data */
  showPerformance?: boolean;
  /** Compact mode for list view */
  compact?: boolean;
  /** Index number (for ranking) */
  index?: number;
}

/**
 * Props for MobileDayCard component
 */
export interface MobileDayCardProps {
  /** Date string (YYYY-MM-DD) */
  date: string;
  /** Day data including categories and stats */
  dayData: DayData;
  /** Whether this is the first (most recent) day */
  isFirst?: boolean;
  /** Whether the card is initially expanded */
  defaultExpanded?: boolean;
  /** Click handler for sector items */
  onSectorClick?: (sectorName: string, stocks: StockPerformance[]) => void;
  /** Click handler for weekday text */
  onWeekdayClick?: (date: string, weekday: string) => void;
}

/**
 * Props for MobileStockView (main timeline view)
 */
export interface MobileStockViewProps {
  /** 7-day stock data */
  data: SevenDaysData;
  /** Loading state */
  loading?: boolean;
  /** Load more callback */
  onLoadMore?: () => void;
  /** Whether more data is available */
  hasMore?: boolean;
  /** Modal state handlers */
  modals?: MobileModalHandlers;
}

/**
 * Props for MobileModal component
 */
export interface MobileModalProps {
  /** Whether modal is visible */
  show: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Full screen mode (default true) */
  fullScreen?: boolean;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Custom header content */
  headerContent?: React.ReactNode;
  /** Footer content */
  footerContent?: React.ReactNode;
}

/**
 * Props for MobileSectorModal component
 */
export interface MobileSectorModalProps {
  /** Modal visibility */
  show: boolean;
  /** Close handler */
  onClose: () => void;
  /** Sector name */
  sectorName: string;
  /** Date for this sector data */
  date: string;
  /** Stocks in this sector */
  stocks: StockPerformance[];
  /** Follow-up dates for performance chart */
  followUpDates: string[];
}

/**
 * Props for MobileBoardModal component (连板梯队)
 */
export interface MobileBoardModalProps {
  /** Modal visibility */
  show: boolean;
  /** Close handler */
  onClose: () => void;
  /** Date string */
  date: string;
  /** Weekday name */
  weekday: string;
  /** Multi-board stocks (2板+) */
  stocks: StockPerformance[];
  /** Chart data for premium trend */
  chartData?: any[];
}

/**
 * Props for MobileDateModal component
 */
export interface MobileDateModalProps {
  /** Modal visibility */
  show: boolean;
  /** Close handler */
  onClose: () => void;
  /** Date string */
  date: string;
  /** Day data */
  dayData: DayData;
}

/**
 * Modal state and handlers
 */
export interface MobileModalHandlers {
  /** Sector modal */
  sector: {
    show: boolean;
    data: { sectorName: string; date: string; stocks: StockPerformance[] } | null;
    open: (sectorName: string, date: string, stocks: StockPerformance[]) => void;
    close: () => void;
  };
  /** Board modal */
  board: {
    show: boolean;
    data: { date: string; weekday: string; stocks: StockPerformance[] } | null;
    open: (date: string, weekday: string, stocks: StockPerformance[]) => void;
    close: () => void;
  };
  /** Date modal */
  date: {
    show: boolean;
    data: { date: string; dayData: DayData } | null;
    open: (date: string, dayData: DayData) => void;
    close: () => void;
  };
}

/**
 * Mobile-specific statistics for display
 */
export interface MobileStats {
  /** Total limit-up count */
  totalCount: number;
  /** Total amount (in 亿) */
  totalAmount: number;
  /** Average premium percentage */
  averagePremium: number;
  /** Top sector by count */
  topSector: string;
  /** Board distribution (首板: X, 二板: Y, ...) */
  boardDistribution: Record<string, number>;
  /** Sector distribution by count */
  sectorDistribution: Array<{ name: string; count: number; amount: number }>;
}

/**
 * Sector item data for mobile display
 */
export interface MobileSectorItemData {
  /** Sector name */
  name: string;
  /** Emoji icon */
  emoji: string;
  /** Stock count */
  count: number;
  /** Total amount */
  amount: number;
  /** Average premium */
  averagePremium: number;
  /** Stocks in this sector */
  stocks: StockPerformance[];
}

/**
 * Props for MobileSectorItem component
 */
export interface MobileSectorItemProps {
  /** Sector data */
  sector: MobileSectorItemData;
  /** Date for this sector */
  date: string;
  /** Click handler */
  onClick?: () => void;
  /** Whether this is a featured/top sector */
  featured?: boolean;
}

/**
 * Touch gesture event data
 */
export interface TouchGestureData {
  /** Touch start X position */
  startX: number;
  /** Touch start Y position */
  startY: number;
  /** Touch end X position */
  endX: number;
  /** Touch end Y position */
  endY: number;
  /** Delta X */
  deltaX: number;
  /** Delta Y */
  deltaY: number;
  /** Touch duration in ms */
  duration: number;
  /** Gesture type */
  type: 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'tap' | 'long-press';
}

/**
 * Chart configuration for mobile
 */
export interface MobileChartConfig {
  /** Chart width */
  width: number;
  /** Chart height */
  height: number;
  /** Font size */
  fontSize: number;
  /** Stroke width */
  strokeWidth: number;
  /** Show legend */
  showLegend: boolean;
  /** Max stocks to display */
  maxStocks: number;
  /** Margin */
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Responsive chart props
 */
export interface ResponsiveChartProps {
  /** Whether in mobile mode */
  isMobile: boolean;
  /** Chart data */
  data: any[];
  /** Configuration override */
  config?: Partial<MobileChartConfig>;
}

/**
 * Loading state
 */
export interface LoadingState {
  /** Is loading */
  loading: boolean;
  /** Loading message */
  message?: string;
  /** Progress percentage (0-100) */
  progress?: number;
}

/**
 * Error state
 */
export interface ErrorState {
  /** Has error */
  error: boolean;
  /** Error message */
  message?: string;
  /** Retry callback */
  onRetry?: () => void;
}
