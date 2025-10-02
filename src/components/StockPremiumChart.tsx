'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { formatDate } from '@/lib/utils';

/**
 * 个股5天溢价趋势数据结构
 */
export interface StockPremiumData {
  stockCode: string;
  stockName: string;
  premiums: {
    date: string;
    premium: number;
  }[];
  totalReturn: number;
}

/**
 * 图表数据点结构（用于Recharts）
 */
interface ChartDataPoint {
  date: string;
  [stockCode: string]: string | number; // 动态键，每个股票代码作为一个键
}

/**
 * 图表配置
 */
interface ChartConfig {
  width?: number | string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
  maxStocks?: number;
  showDailyMax?: boolean; // 新增：是否显示每日最高值标注
}

/**
 * Tooltip自定义内容
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  stockNames: Record<string, string>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, stockNames }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-gray-800 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const stockCode = entry.dataKey as string;
          const stockName = stockNames[stockCode] || stockCode;
          const value = typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value;
          return (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-700">{stockName}</span>
              </div>
              <span className={`text-xs font-medium ${
                Number(value) >= 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {Number(value) >= 0 ? '+' : ''}{value}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 默认配置
 */
const DEFAULT_CONFIG: ChartConfig = {
  width: '100%',
  height: 300,
  showLegend: true,
  showGrid: true,
  maxStocks: 10,
  showDailyMax: false,
  colors: [
    '#2563eb', // 蓝色
    '#dc2626', // 红色
    '#16a34a', // 绿色
    '#ea580c', // 橙色
    '#9333ea', // 紫色
    '#0891b2', // 青色
    '#ca8a04', // 黄色
    '#db2777', // 粉色
    '#65a30d', // lime
    '#7c3aed', // violet
  ],
};

/**
 * 计算每日最高值和对应股票
 */
function calculateDailyMaxValues(
  chartData: ChartDataPoint[],
  stockCodes: string[],
  stockNames: Record<string, string>
): { date: string; maxValue: number; maxStockName: string }[] {
  return chartData.map(dataPoint => {
    let maxValue = -Infinity;
    let maxStockCode = '';

    stockCodes.forEach(stockCode => {
      const value = dataPoint[stockCode];
      if (typeof value === 'number' && value > maxValue) {
        maxValue = value;
        maxStockCode = stockCode;
      }
    });

    return {
      date: dataPoint.date as string,
      maxValue,
      maxStockName: stockNames[maxStockCode] || maxStockCode
    };
  });
}

/**
 * 自定义标签：显示每日最高值股票名称
 */
const CustomDot = (props: any) => {
  const { cx, cy, payload, dataKey, dailyMaxInfo, stockNames } = props;

  if (!dailyMaxInfo) return null;

  // 找到当前日期的最高值信息
  const maxInfo = dailyMaxInfo.find((info: any) => info.date === payload.date);
  if (!maxInfo) return null;

  // 检查当前数据点是否是最高值
  const currentValue = payload[dataKey];
  const stockName = stockNames[dataKey];

  if (stockName === maxInfo.maxStockName && typeof currentValue === 'number') {
    return (
      <g>
        {/* 绘制原始的点 */}
        <circle cx={cx} cy={cy} r={4} fill={props.fill} stroke={props.stroke} strokeWidth={2} />
        {/* 添加文字标注 */}
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fill="#dc2626"
          fontSize="10"
          fontWeight="600"
          className="select-none"
        >
          {stockName}
        </text>
      </g>
    );
  }

  return <circle cx={cx} cy={cy} r={4} fill={props.fill} stroke={props.stroke} strokeWidth={2} />;
};

/**
 * 数据转换：将股票溢价数据转换为Recharts需要的格式
 */
function transformDataForChart(stocksData: StockPremiumData[]): {
  chartData: ChartDataPoint[];
  stockNames: Record<string, string>;
} {
  if (!stocksData || stocksData.length === 0) {
    return { chartData: [], stockNames: {} };
  }

  // 收集所有日期
  const datesSet = new Set<string>();
  stocksData.forEach(stock => {
    stock.premiums.forEach(p => datesSet.add(p.date));
  });

  const sortedDates = Array.from(datesSet).sort();

  // 构建图表数据
  const chartData: ChartDataPoint[] = sortedDates.map(date => {
    const dataPoint: ChartDataPoint = { date: formatDateForDisplay(date) };

    stocksData.forEach(stock => {
      const premium = stock.premiums.find(p => p.date === date);
      if (premium) {
        dataPoint[stock.stockCode] = premium.premium;
      }
    });

    return dataPoint;
  });

  // 构建股票名称映射（用于tooltip）
  const stockNames: Record<string, string> = {};
  stocksData.forEach(stock => {
    stockNames[stock.stockCode] = stock.stockName;
  });

  return { chartData, stockNames };
}

/**
 * 格式化日期显示（MM-DD格式）
 */
function formatDateForDisplay(date: string): string {
  try {
    const formatted = formatDate(date);
    return formatted ? formatted.slice(5) : date;
  } catch (error) {
    console.warn('[StockPremiumChart] 日期格式化失败:', date, error);
    return date.slice(5) || date;
  }
}

/**
 * 个股溢价趋势图表组件
 */
interface StockPremiumChartProps {
  data: StockPremiumData[];
  config?: Partial<ChartConfig>;
  title?: string;
}

export default function StockPremiumChart({ data, config = {}, title }: StockPremiumChartProps) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { chartData, stockNames } = transformDataForChart(data);

  // 限制显示的股票数量
  const limitedData = data.slice(0, finalConfig.maxStocks);
  const stockCodes = limitedData.map(s => s.stockCode);

  // 计算每日最高值（如果启用）
  const dailyMaxInfo = finalConfig.showDailyMax
    ? calculateDailyMaxValues(chartData, stockCodes, stockNames)
    : null;

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">暂无图表数据</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-lg font-semibold mb-4 text-gray-800">{title}</h4>
      )}
      <div style={{ height: finalConfig.height }}>
        <ResponsiveContainer width={finalConfig.width} height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: finalConfig.showDailyMax ? 20 : 5, // 增加上边距为标注预留空间
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            {finalConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}

            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />

            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              tickFormatter={(value) => `${value}%`}
            />

            <Tooltip
              content={<CustomTooltip stockNames={stockNames} />}
            />

            {finalConfig.showLegend && (
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => stockNames[value] || value}
              />
            )}

            {stockCodes.map((stockCode, index) => (
              <Line
                key={stockCode}
                type="monotone"
                dataKey={stockCode}
                stroke={finalConfig.colors![index % finalConfig.colors!.length]}
                strokeWidth={2}
                dot={finalConfig.showDailyMax ? (props) => (
                  <CustomDot
                    {...props}
                    dailyMaxInfo={dailyMaxInfo}
                    stockNames={stockNames}
                  />
                ) : { fill: finalConfig.colors![index % finalConfig.colors!.length], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name={stockNames[stockCode]}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {data.length > finalConfig.maxStocks! && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          仅显示前 {finalConfig.maxStocks} 只个股，共 {data.length} 只
        </p>
      )}
    </div>
  );
}

/**
 * 板块平均溢价趋势组件（简化版）
 */
interface SectorAverageTrendProps {
  sectorName: string;
  averageData: {
    date: string;
    avgPremium: number;
    stockCount: number;
  }[];
  config?: Partial<ChartConfig>;
}

export function SectorAverageTrend({ sectorName, averageData, config = {} }: SectorAverageTrendProps) {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    showLegend: false,
  };

  if (averageData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">暂无图表数据</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h4 className="text-lg font-semibold mb-4 text-gray-800">
        📈 {sectorName} - 5天平均溢价趋势
      </h4>
      <div style={{ height: finalConfig.height }}>
        <ResponsiveContainer width={finalConfig.width} height="100%">
          <LineChart
            data={averageData.map(d => ({
              ...d,
              date: formatDateForDisplay(d.date)
            }))}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            {finalConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}

            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />

            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              tickFormatter={(value) => `${value}%`}
            />

            <Tooltip
              formatter={(value: any, name: string) => [
                name === 'avgPremium' ? `${value}%` : value,
                name === 'avgPremium' ? '平均溢价' : '个股数量'
              ]}
              labelFormatter={(label) => `日期: ${label}`}
            />

            <Line
              type="monotone"
              dataKey="avgPremium"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="平均溢价(%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}