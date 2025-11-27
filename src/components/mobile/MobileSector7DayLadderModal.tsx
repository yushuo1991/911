'use client';

import { useMemo } from 'react';
import MobileModal from './MobileModal';
import MobileStockCard from './MobileStockCard';
import { SevenDaysData, StockPerformance } from '@/types/stock';
import { formatDate, getPerformanceColorClass } from '@/lib/utils';

/**
 * 移动端板块7天历史梯队弹窗
 *
 * 功能：
 * - 显示指定板块在7天内的所有个股
 * - 按日期分组显示
 * - 显示每只个股的表现数据
 * - 和PC端逻辑一致
 */

interface MobileSector7DayLadderModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectorName: string;
  sevenDaysData: SevenDaysData;
  dates: string[];
  onStockClick?: (stock: StockPerformance, date: string) => void;
}

export default function MobileSector7DayLadderModal({
  isOpen,
  onClose,
  sectorName,
  sevenDaysData,
  dates,
  onStockClick,
}: MobileSector7DayLadderModalProps) {
  // 收集该板块7天内的所有数据
  const sectorDailyData = useMemo(() => {
    if (!sevenDaysData || !dates || dates.length === 0) return [];

    return dates.map(date => {
      const dayData = sevenDaysData[date];
      if (!dayData || !dayData.categories) {
        return {
          date,
          stocks: [],
          totalStocks: 0,
          avgReturn: 0,
          totalAmount: 0,
        };
      }

      const stocks = dayData.categories[sectorName] || [];
      const totalStocks = stocks.length;
      const avgReturn = totalStocks > 0
        ? stocks.reduce((sum, s) => sum + (s.total_return || 0), 0) / totalStocks
        : 0;
      const totalAmount = stocks.reduce((sum, s) => sum + (s.amount || 0), 0);

      return {
        date,
        stocks: stocks.sort((a, b) => (b.total_return || 0) - (a.total_return || 0)),
        totalStocks,
        avgReturn,
        totalAmount,
      };
    }).reverse(); // 从最新日期开始显示
  }, [sevenDaysData, dates, sectorName]);

  // 计算总统计
  const totalStats = useMemo(() => {
    const allStocks = sectorDailyData.flatMap(d => d.stocks);
    const totalCount = allStocks.length;
    const avgReturn = totalCount > 0
      ? allStocks.reduce((sum, s) => sum + (s.total_return || 0), 0) / totalCount
      : 0;
    const totalAmount = allStocks.reduce((sum, s) => sum + (s.amount || 0), 0);

    return {
      totalCount,
      avgReturn,
      totalAmount,
      daysWithData: sectorDailyData.filter(d => d.totalStocks > 0).length,
    };
  }, [sectorDailyData]);

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${sectorName} - 7天历史`}
      size="large"
    >
      <div className="p-4">
        {/* 总体统计 */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-3">📊 7天总体统计</h4>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-2xs text-gray-600 mb-1">累计个股</div>
              <div className="text-lg font-bold text-purple-600">
                {totalStats.totalCount}
              </div>
            </div>
            <div>
              <div className="text-2xs text-gray-600 mb-1">活跃天数</div>
              <div className="text-lg font-bold text-blue-600">
                {totalStats.daysWithData}
              </div>
            </div>
            <div>
              <div className="text-2xs text-gray-600 mb-1">平均溢价</div>
              <div className={`text-lg font-bold ${getPerformanceColorClass(totalStats.avgReturn)}`}>
                {totalStats.avgReturn.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-2xs text-gray-600 mb-1">总金额</div>
              <div className="text-lg font-bold text-orange-600">
                {(totalStats.totalAmount / 100000000).toFixed(0)}亿
              </div>
            </div>
          </div>
        </div>

        {/* 按日期分组的个股列表 */}
        <div className="space-y-3">
          {sectorDailyData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-sm text-gray-500">暂无数据</div>
            </div>
          ) : (
            sectorDailyData.map((dayData, dayIndex) => (
              <div key={dayData.date} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* 日期标题栏 */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {formatDate(dayData.date)}
                      </span>
                      {dayIndex === 0 && (
                        <span className="bg-white/20 text-2xs px-1.5 py-0.5 rounded">最新</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-2xs">
                      <span>{dayData.totalStocks}只</span>
                      <span className={dayData.avgReturn >= 0 ? 'text-yellow-200' : 'text-green-200'}>
                        均{dayData.avgReturn.toFixed(1)}%
                      </span>
                      <span>{(dayData.totalAmount / 100000000).toFixed(1)}亿</span>
                    </div>
                  </div>
                </div>

                {/* 个股列表 */}
                {dayData.stocks.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400">
                    该板块当日无涨停个股
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {dayData.stocks.map((stock, stockIndex) => (
                      <div
                        key={`${stock.code}-${dayData.date}`}
                        onClick={() => onStockClick?.(stock, dayData.date)}
                        className="p-3 hover:bg-blue-50 active:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          {/* 左侧：股票信息 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500">#{stockIndex + 1}</span>
                              <span className="text-sm font-semibold text-gray-900 truncate">
                                {stock.name}
                              </span>
                              {stock.td_type && (
                                <span className="flex-shrink-0 text-2xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">
                                  {stock.td_type}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-2xs text-gray-500">
                              <span>{stock.code}</span>
                              {stock.limitUpTime && (
                                <span>⏰ {stock.limitUpTime}</span>
                              )}
                              {stock.amount && (
                                <span>💰 {(stock.amount / 100000000).toFixed(2)}亿</span>
                              )}
                            </div>
                          </div>

                          {/* 右侧：5日溢价 */}
                          <div className="flex-shrink-0 text-right">
                            <div className={`text-base font-bold ${getPerformanceColorClass(stock.total_return || 0)}`}>
                              {stock.total_return !== undefined && stock.total_return !== null
                                ? `${stock.total_return >= 0 ? '+' : ''}${stock.total_return.toFixed(1)}%`
                                : '-'}
                            </div>
                            <div className="text-2xs text-gray-500">5日溢价</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </MobileModal>
  );
}
