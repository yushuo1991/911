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
  | 'sector'
  | 'board'
  | 'date'
  | 'chart'
  | 'kline'
  | 'minute'
  | 'stock-count'
  | 'board-ranking';

/**
 * Props for MobileStockCard component
 */
export interface MobileStockCardProps {
  stock: StockPerformance;
  onTap?: (stock: StockPerformance) => void;
  showSector?: boolean;
  showPerformance?: boolean;
  compact?: boolean;
  index?: number;
}

/**
 * Props for MobileDayCard component
 */
export interface MobileDayCardProps {
  date: string;
  dayData: DayData;
  isExpanded?: boolean;
  onToggle?: (date: string, expanded: boolean) => void;
  onSectorClick?: (sectorName: string, date: string, stocks: StockPerformance[], followUpData: Record<string, Record<string, number>>) => void;
  onWeekdayClick?: (date: string, weekday: string) => void;
}

/**
 * Props for MobileStockView (main timeline view)
 */
export interface MobileStockViewProps {
  sevenDaysData: SevenDaysData | null;
  dates: string[];
  loading: boolean;
  error: string | null;
  onLoadMore?: () => void;
  onSectorClick?: (sectorName: string, date: string, stocks: StockPerformance[], followUpData: Record<string, Record<string, number>>) => void;
  onWeekdayClick?: (date: string, weekday: string) => void;
  onRefresh?: () => Promise<void>;
  maxDays?: number;
}

/**
 * Props for MobileModal component
 */
export interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'full' | 'large' | 'medium' | 'small';
  showCloseButton?: boolean;
  headerActions?: React.ReactNode;
  preventBackdropClose?: boolean;
}

/**
 * Props for MobileSectorModal component
 */
export interface MobileSectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectorName: string;
  date: string;
  stocks: StockPerformance[];
  followUpDates: string[];
  onStockClick?: (stock: StockPerformance, date: string) => void;
  onViewKline?: () => void;
  onViewMinute?: (mode: 'realtime' | 'snapshot') => void;
}

/**
 * Props for MobileBoardModal component
 */
export interface MobileBoardModalProps {
  show: boolean;
  onClose: () => void;
  date: string;
  weekday: string;
  stocks: StockPerformance[];
  chartData?: any[];
}

/**
 * Props for MobileDateModal component
 */
export interface MobileDateModalProps {
  show: boolean;
  onClose: () => void;
  date: string;
  dayData: DayData;
}

/**
 * Modal state and handlers
 */
export interface MobileModalHandlers {
  sector: {
    show: boolean;
    data: { sectorName: string; date: string; stocks: StockPerformance[] } | null;
    open: (sectorName: string, date: string, stocks: StockPerformance[]) => void;
    close: () => void;
  };
  board: {
    show: boolean;
    data: { date: string; weekday: string; stocks: StockPerformance[] } | null;
    open: (date: string, weekday: string, stocks: StockPerformance[]) => void;
    close: () => void;
  };
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
  totalCount: number;
  totalAmount: number;
  averagePremium: number;
  topSector: string;
  boardDistribution: Record<string, number>;
  sectorDistribution: Array<{ name: string; count: number; amount: number }>;
}

/**
 * Sector item data for mobile display
 */
export interface MobileSectorItemData {
  name: string;
  emoji: string;
  count: number;
  amount: number;
  averagePremium: number;
  stocks: StockPerformance[];
}

/**
 * Props for MobileSectorItem component
 */
export interface MobileSectorItemProps {
  sector: MobileSectorItemData;
  date: string;
  onClick?: () => void;
  featured?: boolean;
}

/**
 * Touch gesture event data
 */
export interface TouchGestureData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  duration: number;
  type: 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'tap' | 'long-press';
}

/**
 * Chart configuration for mobile
 */
export interface MobileChartConfig {
  width: number;
  height: number;
  fontSize: number;
  strokeWidth: number;
  showLegend: boolean;
  maxStocks: number;
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
  isMobile: boolean;
  data: any[];
  config?: Partial<MobileChartConfig>;
}

/**
 * Loading state
 */
export interface LoadingState {
  loading: boolean;
  message?: string;
  progress?: number;
}

/**
 * Error state
 */
export interface ErrorState {
  error: boolean;
  message?: string;
  onRetry?: () => void;
}
