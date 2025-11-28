'use client';

import { useState } from 'react';
import { DayData } from '@/types/stock';
import { formatDate, getPerformanceColorClass } from '@/lib/utils';
import { MobileDayCardProps } from '@/types/mobile';

/**
 * 移动端日期卡片组件
 *
 * 功能：
 * - 可折叠/展开的日期卡片
 * - 显示当日涨停统计（总数、板块数、金额等）
 * - 板块列表（点击查看详情）
 * - 响应式设计，适配小屏幕
 */
export default function MobileDayCard({
  date,
  dayData,
  isExpanded = false,
  onToggle,
  onSectorClick,
  onWeekdayClick,
}: MobileDayCardProps) {
  const [localExpanded, setLocalExpanded] = useState(isExpanded);

  // 切换展开/折叠状态
  const handleToggle = () => {
    const newState = !localExpanded;
    setLocalExpanded(newState);
    onToggle?.(date, newState);
  };

  // 计算统计数据
  const stats = dayData.stats || {
    total_stocks: 0,
    category_count: 0,
    profit_ratio: 0,
  };

  // 获取星期几
  const weekdayMap: Record<number, string> = {
    0: '周日',
    1: '周一',
    2: '周二',
    3: '周三',
    4: '周四',
    5: '周五',
    6: '周六',
  };
  const weekday = weekdayMap[new Date(date).getDay()] || '';

  // 计算总金额（从所有板块的股票中累加）
  const totalAmount = Object.values(dayData.categories || {}).reduce(
    (sum, stocks) => sum + stocks.reduce((stockSum, s) => stockSum + (s.amount || 0), 0),
    0
  );

  // 获取板块列表（按涨停数量倒序，过滤ST和其他板块）
  const sectors = Object.entries(dayData.categories || {})
    .filter(([sectorName]) => sectorName !== '其他' && sectorName !== 'ST板块')
    .map(([sectorName, stocks]) => ({
      name: sectorName,
      count: stocks.length,
      avgPremium: stocks.length > 0
        ? stocks.reduce((sum, s) => sum + (s.total_return || 0), 0) / stocks.length
        : 0,
      totalAmount: dayData.sectorAmounts?.[sectorName] || 0, // 使用sectorAmounts字段
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // 只显示前10个板块

  return (
    <div className="bg-white rounded-lg shadow-md mb-3 overflow-hidden border border-gray-200">
      {/* 卡片头部（可点击折叠/展开） */}
      <div
        className="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 cursor-pointer active:bg-blue-200 transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          {/* 日期和星期 */}
          <div className="flex items-center gap-2">
            <div className="text-lg font-bold text-gray-900">{formatDate(date)}</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWeekdayClick?.(date, weekday);
              }}
              className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {weekday}
            </button>
          </div>

          {/* 展开/折叠图标 */}
          <div className="text-gray-500 text-xl">
            {localExpanded ? '▼' : '▶'}
          </div>
        </div>

        {/* 统计数据（始终显示） */}
        <div className="grid grid-cols-2 gap-2 mt-2 text-center">
          <div>
            <div className="text-2xs text-gray-600">涨停</div>
            <div className="text-sm font-semibold text-red-600">{stats.total_stocks}</div>
          </div>
          <div>
            <div className="text-2xs text-gray-600">板块</div>
            <div className="text-sm font-semibold text-blue-600">{stats.category_count}</div>
          </div>
        </div>
      </div>

      {/* 卡片内容（展开时显示） */}
      {localExpanded && (
        <div className="px-4 py-3">
          {/* 板块列表标题 */}
          <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
            <span>📊 板块TOP{sectors.length}</span>
            <span className="text-2xs text-gray-500">点击查看详情</span>
          </div>

          {/* 板块列表 */}
          <div className="space-y-2">
            {sectors.length === 0 ? (
              <div className="text-center text-gray-400 py-4 text-sm">暂无板块数据</div>
            ) : (
              sectors.map((sector, index) => (
                <div
                  key={sector.name}
                  onClick={() => {
                    const stocks = dayData.categories?.[sector.name] || [];
                    const followUpData = dayData.followUpData?.[sector.name] || {};
                    onSectorClick?.(sector.name, date, stocks, followUpData);
                  }}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
                >
                  {/* 左侧：排名和板块名 */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-red-500 text-white' :
                      index === 1 ? 'bg-orange-500 text-white' :
                      index === 2 ? 'bg-yellow-500 text-white' :
                      'bg-gray-300 text-gray-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {sector.name}
                    </div>
                  </div>

                  {/* 右侧：涨停数和平均溢价 */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">数量</div>
                      <div className="text-sm font-semibold text-red-600">{sector.count}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">金额</div>
                      <div className="text-sm font-semibold text-green-600">{sector.totalAmount.toFixed(1)}亿</div>
                    </div>
                    <div className="text-gray-400">›</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
