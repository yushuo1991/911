'use client';

import { useMemo } from 'react';
import { SevenDaysData } from '@/types/stock';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * 移动端数据趋势面板
 *
 * 显示7天数据的整体趋势：
 * - 涨停数量趋势
 * - 平均溢价趋势
 * - 板块数量趋势
 * - 总金额趋势
 */

interface MobileTrendPanelProps {
  sevenDaysData: SevenDaysData;
  dates: string[];
}

export default function MobileTrendPanel({ sevenDaysData, dates }: MobileTrendPanelProps) {
  // 准备图表数据
  const chartData = useMemo(() => {
    return dates.map(date => {
      const dayData = sevenDaysData[date];
      if (!dayData) return null;

      // 计算总金额（亿）
      const totalAmount = Object.values(dayData.categories || {}).reduce(
        (sum, stocks) => sum + stocks.reduce((stockSum, s) => stockSum + (s.amount || 0), 0),
        0
      ) / 100000000;

      return {
        date: date.substring(5), // 只保留 MM-DD
        涨停数: dayData.stats?.total_stocks || 0,
        板块数: dayData.stats?.category_count || 0,
        平均溢价: Number((dayData.stats?.profit_ratio || 0).toFixed(1)),
        总金额: Number(totalAmount.toFixed(0)),
      };
    }).filter(Boolean);
  }, [sevenDaysData, dates]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <div>暂无趋势数据</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* 涨停数量 & 板块数量 */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <div className="text-sm font-semibold text-gray-700 mb-2">📈 涨停&板块趋势</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#666" />
            <YAxis tick={{ fontSize: 11 }} stroke="#666" />
            <Tooltip
              contentStyle={{ fontSize: 12, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 8 }}
              labelStyle={{ fontWeight: 'bold', color: '#333' }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="涨停数"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="板块数"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 平均溢价趋势 */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <div className="text-sm font-semibold text-gray-700 mb-2">💹 平均溢价趋势</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#666" />
            <YAxis tick={{ fontSize: 11 }} stroke="#666" />
            <Tooltip
              contentStyle={{ fontSize: 12, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 8 }}
              labelStyle={{ fontWeight: 'bold', color: '#333' }}
              formatter={(value: number) => `${value}%`}
            />
            <Bar
              dataKey="平均溢价"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 总金额趋势 */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <div className="text-sm font-semibold text-gray-700 mb-2">💰 总金额趋势</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#666" />
            <YAxis tick={{ fontSize: 11 }} stroke="#666" />
            <Tooltip
              contentStyle={{ fontSize: 12, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 8 }}
              labelStyle={{ fontWeight: 'bold', color: '#333' }}
              formatter={(value: number) => `${value}亿`}
            />
            <Bar
              dataKey="总金额"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 数据总览 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-gray-200">
        <div className="text-sm font-semibold text-gray-700 mb-3">📊 数据总览</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600 mb-1">总天数</div>
            <div className="text-2xl font-bold text-blue-600">{chartData.length}</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600 mb-1">平均涨停</div>
            <div className="text-2xl font-bold text-red-600">
              {Math.round(chartData.reduce((sum, d) => sum + (d?.涨停数 || 0), 0) / chartData.length)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600 mb-1">平均板块</div>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(chartData.reduce((sum, d) => sum + (d?.板块数 || 0), 0) / chartData.length)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600 mb-1">平均金额</div>
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(chartData.reduce((sum, d) => sum + (d?.总金额 || 0), 0) / chartData.length)}亿
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
