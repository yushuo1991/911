'use client';

import { useMemo, useRef, useEffect } from 'react';
import MobileModal from './MobileModal';
import { SevenDaysData, StockPerformance } from '@/types/stock';
import { formatDate } from '@/lib/utils';

/**
 * 移动端板块7天历史梯队弹窗
 *
 * 功能：
 * - 显示指定板块在7天内的所有个股
 * - 横向滑动查看不同日期（最新日期在前）
 * - 纵列显示：只显示个股和板数，不显示溢价
 * - 点击日期标题查看完整板块详情
 * - 和PC端逻辑一致
 */

interface MobileSector7DayLadderModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectorName: string;
  sevenDaysData: SevenDaysData;
  dates: string[];
  onDateClick?: (sectorName: string, date: string, stocks: StockPerformance[]) => void;
}

export default function MobileSector7DayLadderModal({
  isOpen,
  onClose,
  sectorName,
  sevenDaysData,
  dates,
  onDateClick,
}: MobileSector7DayLadderModalProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 收集该板块7天内的所有数据（反转后最新日期在前）
  const sectorDailyData = useMemo(() => {
    if (!sevenDaysData || !dates || dates.length === 0) return [];

    return dates.map(date => {
      const dayData = sevenDaysData[date];
      if (!dayData || !dayData.categories) {
        return {
          date,
          stocks: [],
          totalStocks: 0,
        };
      }

      const stocks = dayData.categories[sectorName] || [];
      return {
        date,
        stocks: stocks.sort((a, b) => {
          // 按板数排序（降序），相同板数按涨停时间排序
          const aBoard = a.td_type || '';
          const bBoard = b.td_type || '';
          if (aBoard !== bBoard) return bBoard.localeCompare(aBoard);
          return (a.limitUpTime || '').localeCompare(b.limitUpTime || '');
        }),
        totalStocks: stocks.length,
      };
    }).reverse(); // 最新日期在前
  }, [sevenDaysData, dates, sectorName]);

  // 自动滚动到第一个（最新）日期
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer && sectorDailyData.length > 0 && isOpen) {
      setTimeout(() => {
        scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [sectorDailyData.length, isOpen]);

  // 计算总统计
  const totalStats = useMemo(() => {
    const allStocks = sectorDailyData.flatMap(d => d.stocks);
    return {
      totalCount: allStocks.length,
      daysWithData: sectorDailyData.filter(d => d.totalStocks > 0).length,
    };
  }, [sectorDailyData]);

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${sectorName} - 7天涨停个股梯队`}
      size="large"
    >
      <div className="p-4">
        {/* 总体统计 */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 mb-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">📊 7天总体统计</h4>
          <div className="grid grid-cols-2 gap-3 text-center">
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
          </div>
        </div>

        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
          <p className="text-2xs text-blue-700 text-center">
            💡 提示：点击任意日期列表头部可查看该日板块完整详情
          </p>
        </div>

        {/* 横向滑动日期列表 */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
        >
          {sectorDailyData.length === 0 ? (
            <div className="w-full text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-sm text-gray-500">暂无数据</div>
            </div>
          ) : (
            sectorDailyData.map((dayData, dayIndex) => (
              <div
                key={dayData.date}
                className="flex-shrink-0 w-[85vw] snap-start bg-white rounded-lg border-2 border-gray-200 overflow-hidden"
              >
                {/* 日期标题栏 - 可点击查看详情 */}
                <div
                  onClick={() => {
                    const stocks = dayData.stocks.map(stock => ({
                      ...stock,
                      performance: {},
                      total_return: 0,
                    }));
                    onDateClick?.(sectorName, dayData.date, stocks);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-2 cursor-pointer active:opacity-80 transition-opacity"
                >
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {formatDate(dayData.date)}
                      </span>
                      {dayIndex === 0 && (
                        <span className="bg-white/20 text-2xs px-1.5 py-0.5 rounded">最新</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-2xs">
                      <span>{dayData.totalStocks}只</span>
                      <span>›</span>
                    </div>
                  </div>
                </div>

                {/* 个股列表 - 纵列显示 */}
                {dayData.stocks.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">
                    该板块当日无涨停个股
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                    {dayData.stocks.map((stock, stockIndex) => (
                      <div
                        key={`${stock.code}-${dayData.date}`}
                        className="p-2 hover:bg-blue-50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          {/* 左侧：排名和股票信息 */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-2xs text-gray-500 flex-shrink-0">
                              #{stockIndex + 1}
                            </span>
                            <span className="text-xs font-medium text-gray-900 truncate">
                              {stock.name}
                            </span>
                          </div>

                          {/* 右侧：板数 */}
                          {stock.td_type && (
                            <span className="flex-shrink-0 text-2xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
                              {stock.td_type}
                            </span>
                          )}
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
