/**
 * 统一数据处理器 - 解决板块点击和日期点击数据不一致问题
 * 提供统一的数据计算、缓存和格式化功能
 */

import { SevenDaysData, StockPerformance } from '@/types/stock';
import { getPerformanceClass, formatDate } from './utils';

export interface ProcessedSectorData {
  sectorName: string;
  avgPremium: number;
  stockCount: number;
  stocks?: ProcessedStockData[];  // 🔧 修复：统一使用 stocks 字段名
  chartData?: { date: string; avgPremium: number; stockCount: number; }[];
}

export interface ProcessedStockData extends StockPerformance {
  totalReturn: number;
  chartData: { date: string; value: number; }[];
}

export interface UnifiedDataResult {
  type: 'single' | 'multiple';
  date: string;
  sectorData: ProcessedSectorData[];
}

/**
 * 统一数据处理器类
 */
export class UnifiedDataProcessor {
  private sevenDaysData: SevenDaysData;
  private dates: string[];
  private calculationCache: Map<string, any> = new Map();

  constructor(sevenDaysData: SevenDaysData, dates: string[]) {
    this.sevenDaysData = sevenDaysData;
    this.dates = dates;
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(date: string, sectorName?: string, type?: string): string {
    return `${date}-${sectorName || 'all'}-${type || 'default'}`;
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache<T>(key: string): T | null {
    return this.calculationCache.get(key) || null;
  }

  /**
   * 存储到缓存
   */
  private setToCache<T>(key: string, data: T): void {
    this.calculationCache.set(key, data);
  }

  /**
   * 计算个股的后续表现数据
   */
  private calculateStockChartData(
    stockCode: string,
    sectorName: string,
    baseDate: string,
    followUpDates: string[]
  ): { date: string; value: number; }[] {
    const cacheKey = this.getCacheKey(baseDate, `${sectorName}-${stockCode}`, 'chart');
    const cached = this.getFromCache<{ date: string; value: number; }[]>(cacheKey);
    if (cached) return cached;

    const chartData = followUpDates.map(nextDate => {
      const nextDayData = this.sevenDaysData[nextDate];
      if (!nextDayData) return { date: nextDate, value: 0 };

      const nextDayFollowUp = nextDayData.followUpData[sectorName]?.[stockCode] || {};
      const dayValue = Object.values(nextDayFollowUp).reduce((sum, val) => sum + val, 0);
      return {
        date: nextDate,
        value: parseFloat(dayValue.toFixed(2))
      };
    });

    this.setToCache(cacheKey, chartData);
    return chartData;
  }

  /**
   * 处理单个板块的个股数据
   */
  private processSectorStocks(
    sectorName: string,
    stocks: StockPerformance[],
    baseDate: string,
    followUpData: Record<string, Record<string, number>>
  ): ProcessedStockData[] {
    const cacheKey = this.getCacheKey(baseDate, sectorName, 'stocks');
    const cached = this.getFromCache<ProcessedStockData[]>(cacheKey);
    if (cached) return cached;

    // 获取后续5日日期
    const dateIndex = this.dates.indexOf(baseDate);
    const next5Days = this.dates.slice(dateIndex + 1, dateIndex + 6);

    const processedStocks = stocks.map(stock => {
      const stockFollowUpData = followUpData[stock.code] || {};
      const totalReturn = Object.values(stockFollowUpData).reduce((sum, val) => sum + val, 0);

      // 计算个股图表数据
      const chartData = this.calculateStockChartData(stock.code, sectorName, baseDate, next5Days);

      return {
        ...stock,
        followUpData: stockFollowUpData,
        totalReturn: parseFloat(totalReturn.toFixed(2)),
        chartData: chartData
      };
    });

    // 按累计溢价排序（降序）
    processedStocks.sort((a, b) => b.totalReturn - a.totalReturn);

    this.setToCache(cacheKey, processedStocks);
    return processedStocks;
  }

  /**
   * 计算板块的图表数据
   */
  private calculateSectorChartData(
    sectorName: string,
    baseDate: string,
    followUpDates: string[]
  ): { date: string; avgPremium: number; stockCount: number; }[] {
    const cacheKey = this.getCacheKey(baseDate, sectorName, 'sector-chart');
    const cached = this.getFromCache<{ date: string; avgPremium: number; stockCount: number; }[]>(cacheKey);
    if (cached) return cached;

    const chartData = followUpDates.map(nextDate => {
      const nextDayData = this.sevenDaysData[nextDate];
      if (!nextDayData) return { date: nextDate, avgPremium: 0, stockCount: 0 };

      const nextDayStocks = nextDayData.categories[sectorName] || [];
      let totalPremium = 0;
      let validCount = 0;

      nextDayStocks.forEach((nextStock: any) => {
        const nextStockFollowUp = nextDayData.followUpData[sectorName]?.[nextStock.code] || {};
        const stockReturn = Object.values(nextStockFollowUp).reduce((sum, val) => sum + val, 0);
        totalPremium += stockReturn;
        validCount++;
      });

      const dayAvgPremium = validCount > 0 ? totalPremium / validCount : 0;
      return {
        date: nextDate,
        avgPremium: parseFloat(dayAvgPremium.toFixed(2)),
        stockCount: validCount
      };
    });

    this.setToCache(cacheKey, chartData);
    return chartData;
  }

  /**
   * 处理单个板块数据 - 核心统一逻辑
   */
  public processSingleSector(
    date: string,
    sectorName: string,
    stocks: StockPerformance[],
    followUpData: Record<string, Record<string, number>>
  ): ProcessedSectorData {
    const cacheKey = this.getCacheKey(date, sectorName, 'single');
    const cached = this.getFromCache<ProcessedSectorData>(cacheKey);
    if (cached) return cached;

    // 处理个股数据
    const stocksData = this.processSectorStocks(sectorName, stocks, date, followUpData);

    // 计算板块平均溢价
    const avgPremium = stocksData.reduce((total, stock) => total + stock.totalReturn, 0) / stocksData.length;

    // 获取后续5日日期
    const dateIndex = this.dates.indexOf(date);
    const next5Days = this.dates.slice(dateIndex + 1, dateIndex + 6);

    // 计算板块图表数据
    const chartData = this.calculateSectorChartData(sectorName, date, next5Days);

    const result: ProcessedSectorData = {
      sectorName,
      avgPremium: parseFloat(avgPremium.toFixed(2)),
      stockCount: stocksData.length,
      stocks: stocksData,  // 🔧 修复：统一使用 stocks 字段名
      chartData
    };

    this.setToCache(cacheKey, result);
    return result;
  }

  /**
   * 处理多个板块数据 - 用于日期点击
   */
  public processMultipleSectors(date: string, excludeSectors: string[] = ['其他', 'ST板块']): ProcessedSectorData[] {
    const cacheKey = this.getCacheKey(date, 'multiple', 'sectors');
    const cached = this.getFromCache<ProcessedSectorData[]>(cacheKey);
    if (cached) return cached;

    const dayData = this.sevenDaysData[date];
    if (!dayData) return [];

    const sectorDataList: ProcessedSectorData[] = [];

    // 获取后续5日日期
    const dateIndex = this.dates.indexOf(date);
    const next5Days = this.dates.slice(dateIndex + 1, dateIndex + 6);

    Object.entries(dayData.categories)
      .filter(([sectorName]) => !excludeSectors.includes(sectorName))
      .forEach(([sectorName, stocks]) => {
        let totalPremium = 0;
        let validStockCount = 0;

        // 计算当天平均溢价
        stocks.forEach(stock => {
          const followUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
          const stockTotalReturn = Object.values(followUpData).reduce((sum, val) => sum + val, 0);
          totalPremium += stockTotalReturn;
          validStockCount++;
        });

        const avgPremium = validStockCount > 0 ? totalPremium / validStockCount : 0;

        // 计算后续5日数据
        const chartData = this.calculateSectorChartData(sectorName, date, next5Days);

        sectorDataList.push({
          sectorName,
          avgPremium: parseFloat(avgPremium.toFixed(2)),
          stockCount: validStockCount,
          chartData
        });
      });

    // 按板块累计溢价排序（当日+后续5日）
    sectorDataList.sort((a, b) => {
      const aCumulative = a.avgPremium + (a.chartData?.slice(0, 5).reduce((sum, d) => sum + d.avgPremium, 0) || 0);
      const bCumulative = b.avgPremium + (b.chartData?.slice(0, 5).reduce((sum, d) => sum + d.avgPremium, 0) || 0);
      return bCumulative - aCumulative;
    });

    this.setToCache(cacheKey, sectorDataList);
    return sectorDataList;
  }

  /**
   * 统一的板块点击处理
   */
  public handleSectorClick(
    date: string,
    sectorName: string,
    stocks: StockPerformance[],
    followUpData: Record<string, Record<string, number>>
  ): UnifiedDataResult {
    const sectorData = this.processSingleSector(date, sectorName, stocks, followUpData);

    return {
      type: 'single',
      date,
      sectorData: [sectorData]
    };
  }

  /**
   * 统一的日期点击处理
   */
  public handleDateClick(date: string): UnifiedDataResult {
    const sectorData = this.processMultipleSectors(date);

    return {
      type: 'multiple',
      date,
      sectorData
    };
  }

  /**
   * 清空缓存
   */
  public clearCache(): void {
    this.calculationCache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.calculationCache.size,
      keys: Array.from(this.calculationCache.keys())
    };
  }
}

/**
 * 创建统一数据处理器实例的工厂函数
 */
export function createUnifiedDataProcessor(sevenDaysData: SevenDaysData, dates: string[]): UnifiedDataProcessor {
  return new UnifiedDataProcessor(sevenDaysData, dates);
}

/**
 * 检查数据一致性的验证函数
 */
export function validateDataConsistency(
  sectorResult: UnifiedDataResult,
  dateResult: UnifiedDataResult,
  sectorName: string
): boolean {
  if (sectorResult.date !== dateResult.date) return false;

  const sectorData = sectorResult.sectorData[0];
  const correspondingSector = dateResult.sectorData.find(s => s.sectorName === sectorName);

  if (!correspondingSector) return false;

  // 验证关键数据是否一致
  const avgPremiumMatch = Math.abs(sectorData.avgPremium - correspondingSector.avgPremium) < 0.01;
  const stockCountMatch = sectorData.stockCount === correspondingSector.stockCount;

  return avgPremiumMatch && stockCountMatch;
}