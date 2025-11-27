'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getPerformanceColorClass } from '@/lib/utils';

/**
 * 移动端溢价趋势图表组件
 *
 * 功能：
 * - 轻量级Recharts折线图
 * - 响应式宽度（适配小屏幕）
 * - 简化坐标轴和网格
 * - 触摸优化的Tooltip
 */

interface MobilePremiumChartProps {
  data: Array<{
    date: string;
    avgPremium: number;
    stockCount?: number;
  }>;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
}

export default function MobilePremiumChart({
  data,
  height = 200,
  showGrid = true,
  showLegend = false,
}: MobilePremiumChartProps) {
  // 自定义Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
          <div className="text-xs text-gray-600">{data.date}</div>
          <div className={`text-sm font-bold ${getPerformanceColorClass(data.avgPremium)}`}>
            溢价: {data.avgPremium > 0 ? '+' : ''}{data.avgPremium.toFixed(1)}%
          </div>
          {data.stockCount !== undefined && (
            <div className="text-xs text-gray-500 mt-0.5">
              个股: {data.stockCount}只
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // 如果没有数据
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg" style={{ height }}>
        <div className="text-center text-gray-400">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-sm">暂无数据</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db' }}
            tickFormatter={(value) => {
              // 简化日期显示：只显示月-日
              const parts = value.split('-');
              return parts.length >= 3 ? `${parts[1]}-${parts[2]}` : value;
            }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <line className="text-xs" />
          )}
          <Line
            type="monotone"
            dataKey="avgPremium"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3, fill: '#ef4444' }}
            activeDot={{ r: 5, fill: '#dc2626' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
