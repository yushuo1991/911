'use client';

import { useMemo } from 'react';
import MobileModal from './MobileModal';
import { SevenDaysData } from '@/types/stock';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDate } from '@/lib/utils';

/**
 * 移动端7天涨停排行弹窗
 *
 * 功能：
 * - 显示7天涨停总数排行前5名的板块
 * - 板块7天涨停趋势图（多条线）
 * - 板块排行列表，可点击查看详情
 * - 和PC端逻辑一致
 */

interface Mobile7DayRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sevenDaysData: SevenDaysData;
  dates: string[];
  onSectorClick?: (sectorName: string) => void;
}

export default function Mobile7DayRankingModal({
  isOpen,
  onClose,
  sevenDaysData,
  dates,
  onSectorClick,
}: Mobile7DayRankingModalProps) {
  // 计算板块最近7天涨停家数排序（前5名）
  const sectorRanking = useMemo(() => {
    if (!sevenDaysData || !dates || dates.length === 0) return [];

    // 收集所有出现过的板块名称（排除"其他"和"ST板块"）
    const allSectorNames = new Set<string>();
    dates.forEach(date => {
      const dayData = sevenDaysData[date];
      if (dayData && dayData.categories) {
        Object.keys(dayData.categories).forEach(sectorName => {
          if (sectorName !== '其他' && sectorName !== 'ST板块') {
            allSectorNames.add(sectorName);
          }
        });
      }
    });

    // 为每个板块统计7天数据
    const sectorCountMap: Record<string, {
      name: string;
      totalLimitUpCount: number;
      dailyBreakdown: { date: string; count: number; }[];
    }> = {};

    allSectorNames.forEach(sectorName => {
      sectorCountMap[sectorName] = {
        name: sectorName,
        totalLimitUpCount: 0,
        dailyBreakdown: []
      };
    });

    // 统计最近7天每个板块的涨停家数
    dates.forEach(date => {
      const dayData = sevenDaysData[date];
      if (!dayData) return;

      allSectorNames.forEach(sectorName => {
        const stocks = dayData.categories[sectorName] || [];
        const dayLimitUpCount = stocks.length;

        sectorCountMap[sectorName].totalLimitUpCount += dayLimitUpCount;
        sectorCountMap[sectorName].dailyBreakdown.push({
          date,
          count: dayLimitUpCount
        });
      });
    });

    // 按总涨停家数排序，取前5名
    const rankedSectors = Object.values(sectorCountMap)
      .sort((a, b) => b.totalLimitUpCount - a.totalLimitUpCount)
      .slice(0, 5);

    return rankedSectors;
  }, [sevenDaysData, dates]);

  // 准备图表数据
  const chartData = useMemo(() => {
    if (sectorRanking.length === 0) return [];

    return dates.map(date => {
      const dataPoint: any = { date: formatDate(date).slice(5) }; // MM-DD格式
      sectorRanking.forEach(sector => {
        const dayData = sector.dailyBreakdown.find(d => d.date === date);
        dataPoint[sector.name] = dayData ? dayData.count : 0;
      });
      return dataPoint;
    });
  }, [sectorRanking, dates]);

  // 图表颜色
  const colors = [
    '#ef4444', // 鲜红色 (第1名)
    '#3b82f6', // 鲜蓝色 (第2名)
    '#10b981', // 鲜绿色 (第3名)
    '#f59e0b', // 鲜橙色 (第4名)
    '#8b5cf6', // 鲜紫色 (第5名)
  ];

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title="🏆 7天涨停排行"
      size="large"
    >
      <div className="p-4">
        {/* 统计说明 */}
        <div className="mb-4 bg-blue-50 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-blue-800 mb-1">📊 统计说明</h4>
          <p className="text-blue-700 text-2xs">
            统计最近7个交易日各板块涨停总数，按总数降序排列，显示前5名最活跃板块
          </p>
          {dates.length >= 7 && (
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-blue-600 font-medium text-2xs">统计日期:</span>
              {dates.map(date => (
                <span key={date} className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-2xs">
                  {formatDate(date).slice(5)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 趋势图 */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
            <h4 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-lg">📈</span>
              <span>板块7天涨停趋势图</span>
            </h4>
            <div className="bg-gray-50 rounded-lg p-2">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    stroke="#9ca3af"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: 11,
                    }}
                    formatter={(value: any, name: string) => [`${value}只`, name]}
                    labelStyle={{ fontWeight: 'bold', color: '#1f2937' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                    iconType="line"
                  />
                  {sectorRanking.map((sector, index) => (
                    <Line
                      key={sector.name}
                      type="monotone"
                      dataKey={sector.name}
                      stroke={colors[index]}
                      strokeWidth={2}
                      dot={{ fill: colors[index], strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5 }}
                      name={sector.name}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-2xs text-gray-500 mt-2 text-center">
              💡 展示前5名板块近7天涨停家数变化趋势
            </p>
          </div>
        )}

        {/* 板块排行列表 */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">🏆 板块排行榜</h4>
          {sectorRanking.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-sm text-gray-500">暂无排行数据</div>
            </div>
          ) : (
            sectorRanking.map((sector, index) => (
              <div
                key={sector.name}
                onClick={() => onSectorClick?.(sector.name)}
                className="bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 active:bg-blue-50 transition-colors cursor-pointer p-3"
              >
                <div className="flex items-center justify-between">
                  {/* 左侧：排名和板块名 */}
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg' :
                      index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white shadow-md' :
                      index === 2 ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white shadow-md' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900">{sector.name}</h5>
                      <div className="text-2xs text-gray-500">
                        最近7天累计涨停数
                      </div>
                    </div>
                  </div>

                  {/* 右侧：总数 */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">
                      {sector.totalLimitUpCount}
                    </div>
                    <div className="text-2xs text-gray-500">只</div>
                  </div>
                </div>

                {/* 每日明细 */}
                <div className="mt-3 flex gap-1 overflow-x-auto">
                  {sector.dailyBreakdown.map((day) => (
                    <div
                      key={day.date}
                      className="flex-shrink-0 bg-gray-50 rounded px-2 py-1 text-center min-w-[45px]"
                    >
                      <div className="text-2xs text-gray-600">
                        {formatDate(day.date).slice(5)}
                      </div>
                      <div className={`text-xs font-bold ${
                        day.count > 0 ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {day.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MobileModal>
  );
}
