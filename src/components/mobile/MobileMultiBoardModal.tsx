'use client';

import { useState } from 'react';
import MobileModal from './MobileModal';
import MobileStockCard from './MobileStockCard';
import MobilePremiumChart from './MobilePremiumChart';
import { StockPerformance } from '@/types/stock';
import { getPerformanceColorClass, getBoardWeight } from '@/lib/utils';

/**
 * 移动端连板个股梯队弹窗
 *
 * 功能：
 * - 显示2板及以上的连板个股
 * - 5日平均溢价趋势图（简化版）
 * - 按连板数或涨幅排序
 * - 显示全局金额排名
 * - 点击个股查看详情
 */

interface MultiBoardStock extends StockPerformance {
  boardNum: number;
  globalAmountRank: number | null;
}

interface MobileMultiBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  stocks: MultiBoardStock[];
  followUpDates: string[];
  onStockClick?: (stock: StockPerformance, date: string) => void;
  onViewKline?: () => void;
  onViewMinute?: (mode: 'realtime' | 'snapshot') => void;
}

export default function MobileMultiBoardModal({
  isOpen,
  onClose,
  date,
  stocks,
  followUpDates,
  onStockClick,
  onViewKline,
  onViewMinute,
}: MobileMultiBoardModalProps) {
  const [filterOver10, setFilterOver10] = useState(false);
  const [sortMode, setSortMode] = useState<'board' | 'return'>('board');
  const [showChart, setShowChart] = useState(false); // 控制曲线图显示

  // 筛选和排序
  const processedStocks = stocks
    .filter(stock => {
      if (!filterOver10) return true;
      return (stock.total_return || 0) > 10;
    })
    .sort((a, b) => {
      if (sortMode === 'board') {
        // 按板位排序（高板位 -> 低板位）
        if (a.boardNum !== b.boardNum) return b.boardNum - a.boardNum;
        // 相同板位按涨停时间排序
        return (a.limitUpTime || '').localeCompare(b.limitUpTime || '');
      } else {
        // 按5日累计涨幅排序
        return (b.total_return || 0) - (a.total_return || 0);
      }
    });

  // 计算统计数据
  const stats = {
    totalStocks: stocks.length,
    filteredStocks: processedStocks.length,
    avgReturn: stocks.length > 0
      ? stocks.reduce((sum, s) => sum + (s.total_return || 0), 0) / stocks.length
      : 0,
    highestBoard: Math.max(...stocks.map(s => s.boardNum), 0),
  };

  // 板位分布数据（用于简化图表）
  const boardDistribution = processedStocks.reduce((acc, stock) => {
    const board = stock.boardNum;
    if (!acc[board]) {
      acc[board] = { count: 0, totalReturn: 0 };
    }
    acc[board].count++;
    acc[board].totalReturn += stock.total_return || 0;
    return acc;
  }, {} as Record<number, { count: number; totalReturn: number }>);

  // 准备曲线图数据（基于followUpDates的平均溢价）
  const chartData = followUpDates.map((followDate, index) => {
    const dayPerformances = stocks
      .map(s => s.performance?.[followDate] || 0)
      .filter(p => p !== 0);
    const avgPremium = dayPerformances.length > 0
      ? dayPerformances.reduce((sum, p) => sum + p, 0) / dayPerformances.length
      : 0;
    return {
      date: `T+${index + 1}`,
      avgPremium,
      stockCount: dayPerformances.length,
    };
  });

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={`连板梯队 (${date})`}
      size="large"
      headerActions={
        <>
          {/* 查看K线按钮 */}
          {onViewKline && (
            <button
              onClick={onViewKline}
              className="px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600 active:bg-blue-700"
            >
              📈 K线
            </button>
          )}
          {/* 查看分时图按钮 */}
          {onViewMinute && (
            <>
              <button
                onClick={() => onViewMinute('realtime')}
                className="px-2 py-1 text-xs font-medium bg-green-500 text-white rounded hover:bg-green-600 active:bg-green-700"
              >
                📊 今日
              </button>
              <button
                onClick={() => onViewMinute('snapshot')}
                className="px-2 py-1 text-xs font-medium bg-purple-500 text-white rounded hover:bg-purple-600 active:bg-purple-700"
              >
                📷 当日
              </button>
            </>
          )}
        </>
      }
    >
      <div className="p-4">
        {/* 统计信息卡片（可点击显示/隐藏曲线图） */}
        <div
          onClick={() => setShowChart(!showChart)}
          className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-4 cursor-pointer active:bg-red-100 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-gray-700">📊 梯队统计</div>
            <div className="text-xs text-red-600">
              {showChart ? '▼ 收起曲线' : '► 查看曲线'}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-2xs text-gray-600 mb-1">个股</div>
              <div className="text-lg font-bold text-red-600">
                {stats.filteredStocks}
                {filterOver10 && <span className="text-xs text-gray-500">/{stats.totalStocks}</span>}
              </div>
            </div>
            <div>
              <div className="text-2xs text-gray-600 mb-1">最高板</div>
              <div className="text-lg font-bold text-orange-600">
                {stats.highestBoard}板
              </div>
            </div>
            <div>
              <div className="text-2xs text-gray-600 mb-1">平均溢价</div>
              <div className={`text-lg font-bold ${getPerformanceColorClass(stats.avgReturn)}`}>
                {stats.avgReturn.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-2xs text-gray-600 mb-1">后续</div>
              <div className="text-lg font-bold text-gray-700">
                {followUpDates.length}天
              </div>
            </div>
          </div>
        </div>

        {/* 溢价趋势曲线图（点击统计卡片显示） */}
        {showChart && chartData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
            <div className="text-xs font-semibold text-gray-700 mb-2">📈 后续溢价趋势</div>
            <MobilePremiumChart data={chartData} height={180} />
          </div>
        )}

        {/* 板位分布（简化图表） */}
        {Object.keys(boardDistribution).length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <div className="text-xs font-semibold text-gray-700 mb-2">📊 板位分布</div>
            <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {Object.entries(boardDistribution)
                .sort(([a], [b]) => parseInt(b) - parseInt(a))
                .map(([board, data]) => {
                  const avgReturn = data.totalReturn / data.count;
                  return (
                    <div
                      key={board}
                      className="flex-shrink-0 bg-white rounded-lg p-2 text-center min-w-[60px] border border-gray-200"
                    >
                      <div className="text-xs font-bold text-gray-700">{board}板</div>
                      <div className="text-lg font-bold text-red-600 mt-1">{data.count}</div>
                      <div className={`text-2xs mt-1 ${getPerformanceColorClass(avgReturn)}`}>
                        {avgReturn > 0 ? '+' : ''}{avgReturn.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* 筛选和排序工具栏 */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
          {/* 排序模式 */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortMode('board')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                sortMode === 'board'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              连板排序
            </button>
            <button
              onClick={() => setSortMode('return')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                sortMode === 'return'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              涨幅排序
            </button>
          </div>

          {/* 筛选按钮 */}
          <button
            onClick={() => setFilterOver10(!filterOver10)}
            className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
              filterOver10
                ? 'bg-orange-100 text-orange-700 border-orange-300'
                : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
            }`}
          >
            {filterOver10 ? '显示全部' : '>10%'}
          </button>
        </div>

        {/* 个股列表 */}
        <div className="space-y-3">
          {processedStocks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📊</div>
              <div className="text-gray-500">
                {filterOver10 ? '暂无涨幅>10%的个股' : '暂无数据'}
              </div>
            </div>
          ) : (
            processedStocks.map((stock, index) => (
              <MobileStockCard
                key={stock.code}
                stock={stock}
                date={date}
                followUpDates={followUpDates}
                showRanking={true}
                ranking={index + 1}
                globalAmountRank={stock.globalAmountRank}
                onStockClick={onStockClick}
              />
            ))
          )}
        </div>
      </div>
    </MobileModal>
  );
}
