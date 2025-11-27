'use client';

import { StockPerformance } from '@/types/stock';
import { getPerformanceColorClass, getBoardWeight } from '@/lib/utils';

/**
 * 移动端股票卡片组件
 *
 * 功能：
 * - 显示单只股票的核心信息
 * - 板位标签、涨停时间、成交额
 * - 5日表现数据（滑动查看）
 * - 点击查看详情（K线/分时图）
 */

interface MobileStockCardProps {
  stock: StockPerformance;
  date: string;
  followUpDates?: string[];
  onStockClick?: (stock: StockPerformance, date: string) => void;
  showRanking?: boolean;
  ranking?: number;
  globalAmountRank?: number | null;
}

export default function MobileStockCard({
  stock,
  date,
  followUpDates = [],
  onStockClick,
  showRanking = false,
  ranking,
  globalAmountRank,
}: MobileStockCardProps) {
  // 获取板位数字
  const boardNum = getBoardWeight(stock.td_type);

  // 计算5日累计涨幅
  const total5DayReturn = stock.total_return || 0;

  // 获取板位背景色
  const getBoardColorClass = (num: number) => {
    if (num === 1) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (num === 2) return 'bg-green-100 text-green-700 border-green-300';
    if (num >= 3 && num <= 4) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    if (num >= 5) return 'bg-red-100 text-red-700 border-red-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div
      onClick={() => onStockClick?.(stock, date)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md active:shadow-lg transition-shadow cursor-pointer"
    >
      {/* 顶部：股票名称和排名 */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          {/* 股票名称 */}
          <div className="flex items-center gap-2">
            {showRanking && ranking !== undefined && (
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                ranking === 1 ? 'bg-red-500 text-white' :
                ranking === 2 ? 'bg-orange-500 text-white' :
                ranking === 3 ? 'bg-yellow-500 text-white' :
                'bg-gray-300 text-gray-700'
              }`}>
                {ranking}
              </div>
            )}
            <h3 className="text-base font-bold text-gray-900 truncate">{stock.name}</h3>
          </div>
          {/* 股票代码 */}
          <div className="text-xs text-gray-500 mt-0.5">{stock.code}</div>
        </div>

        {/* 板位标签 */}
        <div className={`flex-shrink-0 ml-2 px-2 py-1 rounded-md text-xs font-bold border ${getBoardColorClass(boardNum)}`}>
          {stock.td_type}
        </div>
      </div>

      {/* 中部：基本信息 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* 涨停时间 */}
        <div>
          <div className="text-2xs text-gray-500">涨停时间</div>
          <div className="text-sm font-medium text-gray-900 mt-0.5">
            {stock.limitUpTime || '--'}
          </div>
        </div>

        {/* 成交额 */}
        <div>
          <div className="text-2xs text-gray-500">成交额</div>
          <div className="text-sm font-medium text-gray-900 mt-0.5">
            {stock.amount ? `${(stock.amount / 100000000).toFixed(1)}亿` : '--'}
          </div>
        </div>

        {/* 全局排名 */}
        {globalAmountRank !== undefined && globalAmountRank !== null && (
          <div>
            <div className="text-2xs text-gray-500">金额排名</div>
            <div className="text-sm font-medium text-orange-600 mt-0.5">
              #{globalAmountRank}
            </div>
          </div>
        )}
      </div>

      {/* 底部：5日表现数据（横向滚动） */}
      {followUpDates.length > 0 && (
        <div className="border-t border-gray-100 pt-2">
          <div className="text-2xs text-gray-500 mb-1">后续5日表现</div>
          <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-1">
            {followUpDates.map((followDate, index) => {
              const performance = stock.performance?.[followDate] || 0;
              return (
                <div
                  key={followDate}
                  className="flex-shrink-0 text-center min-w-[60px]"
                >
                  <div className="text-2xs text-gray-400">T+{index + 1}</div>
                  <div className={`text-sm font-semibold ${getPerformanceColorClass(performance)}`}>
                    {performance > 0 ? '+' : ''}{performance.toFixed(1)}%
                  </div>
                </div>
              );
            })}
            {/* 累计涨幅 */}
            <div className="flex-shrink-0 text-center min-w-[60px] border-l border-gray-200 pl-2">
              <div className="text-2xs text-gray-400">累计</div>
              <div className={`text-sm font-bold ${getPerformanceColorClass(total5DayReturn)}`}>
                {total5DayReturn > 0 ? '+' : ''}{total5DayReturn.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 无后续数据提示 */}
      {followUpDates.length === 0 && (
        <div className="border-t border-gray-100 pt-2 text-center text-2xs text-gray-400">
          暂无后续交易日数据
        </div>
      )}
    </div>
  );
}
