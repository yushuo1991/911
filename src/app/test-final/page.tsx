'use client';

import { useState, useMemo } from 'react';
import { getPerformanceClass } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 模拟数据 - 增加涨停数量字段
const mockStockData = [
  {
    category: "软件服务",
    limitUpCount: 8, // 涨停数量
    stocks: [
      {
        name: "软件A",
        code: "300001",
        tdType: "首板",
        performance: { "2025-09-17": 2.5, "2025-09-18": 1.8, "2025-09-19": -0.5, "2025-09-20": 0.9, "2025-09-21": 1.2 },
        cumulative: 5.9
      },
      {
        name: "软件B",
        code: "300002",
        tdType: "二板",
        performance: { "2025-09-17": 1.2, "2025-09-18": 3.1, "2025-09-19": 0.8, "2025-09-20": -1.2, "2025-09-21": 0.5 },
        cumulative: 4.4
      }
    ]
  },
  {
    category: "电子信息",
    limitUpCount: 12, // 涨停数量
    stocks: [
      {
        name: "电子A",
        code: "002001",
        tdType: "首板",
        performance: { "2025-09-17": 1.9, "2025-09-18": 2.1, "2025-09-19": 0.3, "2025-09-20": -0.2, "2025-09-21": 0.8 },
        cumulative: 4.9
      },
      {
        name: "电子B",
        code: "002002",
        tdType: "三板",
        performance: { "2025-09-17": 0.8, "2025-09-18": 1.5, "2025-09-19": -1.1, "2025-09-20": 2.3, "2025-09-21": -0.2 },
        cumulative: 3.3
      }
    ]
  },
  {
    category: "新能源",
    limitUpCount: 15, // 涨停数量
    stocks: [
      {
        name: "比亚迪",
        code: "002594",
        tdType: "首板",
        performance: { "2025-09-17": 3.2, "2025-09-18": -1.5, "2025-09-19": 2.8, "2025-09-20": 1.1, "2025-09-21": 0.9 },
        cumulative: 6.5
      },
      {
        name: "宁德时代",
        code: "300750",
        tdType: "二板",
        performance: { "2025-09-17": 2.1, "2025-09-18": 0.8, "2025-09-19": -0.3, "2025-09-20": 1.9, "2025-09-21": 1.5 },
        cumulative: 6.0
      }
    ]
  },
  {
    category: "银行板块",
    limitUpCount: 3, // 涨停数量 - 小于5个
    stocks: [
      {
        name: "工商银行",
        code: "601398",
        tdType: "首板",
        performance: { "2025-09-17": 1.1, "2025-09-18": 0.5, "2025-09-19": 0.8, "2025-09-20": -0.2, "2025-09-21": 0.3 },
        cumulative: 2.5
      },
      {
        name: "建设银行",
        code: "601939",
        tdType: "首板",
        performance: { "2025-09-17": 0.9, "2025-09-18": 0.7, "2025-09-19": 0.4, "2025-09-20": 0.1, "2025-09-21": 0.6 },
        cumulative: 2.7
      }
    ]
  },
  {
    category: "医药生物",
    limitUpCount: 6, // 涨停数量
    stocks: [
      {
        name: "药明康德",
        code: "603259",
        tdType: "首板",
        performance: { "2025-09-17": 1.8, "2025-09-18": 2.3, "2025-09-19": -0.8, "2025-09-20": 1.5, "2025-09-21": 0.9 },
        cumulative: 5.7
      },
      {
        name: "恒瑞医药",
        code: "600276",
        tdType: "二板",
        performance: { "2025-09-17": 0.9, "2025-09-18": 1.8, "2025-09-19": 0.6, "2025-09-20": -0.5, "2025-09-21": 1.2 },
        cumulative: 4.0
      }
    ]
  },
  {
    category: "房地产",
    limitUpCount: 2, // 涨停数量 - 小于5个
    stocks: [
      {
        name: "万科A",
        code: "000002",
        tdType: "首板",
        performance: { "2025-09-17": 0.8, "2025-09-18": -0.3, "2025-09-19": 0.5, "2025-09-20": 0.2, "2025-09-21": -0.1 },
        cumulative: 1.1
      }
    ]
  }
];

const tradingDays = ["2025-09-17", "2025-09-18", "2025-09-19", "2025-09-20", "2025-09-21"];

// 个股代码格式转换函数
function getStockCodeFormat(stockCode: string): string {
  if (stockCode.startsWith('6')) {
    return `sh${stockCode}`;
  } else {
    return `sz${stockCode}`;
  }
}

export default function TestFinalPage() {
  const [selectedDate, setSelectedDate] = useState("2025-09-17");
  const [sortAscending, setSortAscending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{name: string, code: string} | null>(null);
  const [onlyLimitUp5Plus, setOnlyLimitUp5Plus] = useState(false); // 新增：只显示5个涨停以上的板块

  // 根据筛选条件过滤数据
  const filteredData = useMemo(() => {
    return onlyLimitUp5Plus
      ? mockStockData.filter(category => category.limitUpCount >= 5)
      : mockStockData;
  }, [onlyLimitUp5Plus]);

  // 板块统计数据（根据筛选条件）
  const categoryStats = useMemo(() => {
    return filteredData.map(category => {
      const dayAverages = tradingDays.map(day => {
        const dayValues = category.stocks.map(stock => stock.performance[day]);
        const average = dayValues.reduce((sum, val) => sum + val, 0) / dayValues.length;
        return { day, average };
      });

      return {
        category: category.category,
        limitUpCount: category.limitUpCount,
        dayAverages,
        totalAverage: dayAverages.reduce((sum, day) => sum + day.average, 0) / dayAverages.length
      };
    });
  }, [filteredData]);

  // 对每个板块内的股票按累计排序
  const sortedData = useMemo(() => {
    return filteredData.map(category => ({
      ...category,
      stocks: [...category.stocks].sort((a, b) =>
        sortAscending ? a.cumulative - b.cumulative : b.cumulative - a.cumulative
      )
    }));
  }, [filteredData, sortAscending]);

  // 处理股票名称点击
  const handleStockClick = (stockName: string, stockCode: string) => {
    setSelectedStock({ name: stockName, code: stockCode });
    setShowModal(true);
  };

  // 关闭弹窗
  const closeModal = () => {
    setShowModal(false);
    setSelectedStock(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* K线图弹窗 */}
      {showModal && selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedStock.name} ({selectedStock.code}) K线图
              </h3>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="text-center">
              <img
                src={`http://image.sinajs.cn/newchart/daily/${getStockCodeFormat(selectedStock.code)}.gif`}
                alt={`${selectedStock.name}K线图`}
                className="max-w-full h-auto rounded-lg shadow-md"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjlmOWY5Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPktcdTdFRkZcdTU2RkVcdTUyMDBcdThGN0RcdTUxMTZcdTUwNjdcdTU5MzQ8L3RleHQ+Cjwvc3ZnPg==';
                }}
              />
              <p className="text-sm text-gray-500 mt-2">
                数据来源: 新浪财经 | 点击空白区域关闭
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex justify-between items-center bg-white rounded-lg shadow-sm p-4">
          <h1 className="text-2xl font-bold text-gray-900">最终版股票板块分析</h1>

          <div className="flex items-center gap-4">
            {/* 板块筛选开关 */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyLimitUp5Plus}
                onChange={(e) => setOnlyLimitUp5Plus(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">只显示≥5个涨停的板块</span>
            </label>

            {/* 日期选择 */}
            <div className="flex gap-2">
              {tradingDays.map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedDate === date
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {date.slice(5)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">

        {/* 1&2. 板块分析 - 两列布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左列：板块强弱趋势图表 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">板块强弱趋势图表</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">
                  {filteredData.length}/{mockStockData.length}板块
                </span>
                {onlyLimitUp5Plus && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    ≥5涨停
                  </span>
                )}
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={tradingDays.map(day => {
                    const dayData = { day: day.slice(5) }; // 只显示月-日
                    categoryStats.forEach(stat => {
                      const dayAvg = stat.dayAverages.find(d => d.day === day);
                      dayData[stat.category] = dayAvg ? parseFloat(dayAvg.average.toFixed(2)) : 0;
                    });
                    return dayData;
                  })}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="day"
                    stroke="#666"
                    fontSize={11}
                  />
                  <YAxis
                    stroke="#666"
                    fontSize={11}
                    label={{ value: '涨跌幅(%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                    formatter={(value, name) => [`${value}%`, `${name}`]}
                    labelFormatter={(label) => `日期: 09-${label}`}
                  />
                  <Legend />
                  {categoryStats.map((stat, index) => {
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                    const color = colors[index % colors.length];
                    return (
                      <Line
                        key={stat.category}
                        type="monotone"
                        dataKey={stat.category}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ fill: color, strokeWidth: 2, r: 3 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                💡 展示各板块5天平均表现趋势，可筛选活跃板块对比
              </p>
            </div>
          </div>

          {/* 右列：板块5日平均表现对比 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">5日平均表现对比</h2>
              <div className="text-sm text-gray-600">
                {onlyLimitUp5Plus ? '已筛选' : '全部'}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-900">板块</th>
                    {tradingDays.map(day => (
                      <th key={day} className="text-center py-2 px-2 font-medium text-gray-900 text-xs">
                        {day.slice(-2)}
                      </th>
                    ))}
                    <th className="text-center py-2 px-3 font-medium text-gray-900">平均</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryStats.map((stat) => (
                    <tr key={stat.category} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium text-gray-900">
                        <div className="flex flex-col">
                          <span className="text-sm">{stat.category}</span>
                          <span className={`text-xs px-1 rounded ${
                            stat.limitUpCount >= 5 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {stat.limitUpCount}个
                          </span>
                        </div>
                      </td>
                      {stat.dayAverages.map(dayAvg => (
                        <td key={dayAvg.day} className="py-2 px-2 text-center">
                          <span className={`px-1 py-1 rounded text-xs ${getPerformanceClass(dayAvg.average)}`}>
                            {dayAvg.average.toFixed(1)}%
                          </span>
                        </td>
                      ))}
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-1 rounded font-medium text-sm ${getPerformanceClass(stat.totalAverage)}`}>
                          {stat.totalAverage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                📊 各板块每日及5日平均表现，绿色标签表示≥5涨停活跃板块
              </p>
            </div>
          </div>
        </div>

        {/* 3. 股票详细数据 - 底部 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">股票详细数据 <span className="text-sm text-blue-600 font-normal">（点击股票名称查看K线图）</span></h2>
            <button
              onClick={() => setSortAscending(!sortAscending)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              累计排序: {sortAscending ? '升序 ↑' : '降序 ↓'}
            </button>
          </div>

          {sortedData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>当前筛选条件下无板块数据</p>
              <p className="text-sm mt-2">请取消"只显示≥5个涨停的板块"筛选</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {sortedData.map((category) => (
                <div key={category.category} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-800">{category.category}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      category.limitUpCount >= 5 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {category.limitUpCount}个涨停
                    </span>
                  </div>

                  <div className="space-y-2">
                    {category.stocks.map((stock) => (
                      <div key={stock.code} className="grid grid-cols-12 gap-2 text-sm">
                        <div className="col-span-2">
                          <div
                            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                            onClick={() => handleStockClick(stock.name, stock.code)}
                          >
                            {stock.name}
                          </div>
                          <div className="text-xs text-gray-500">{stock.tdType}</div>
                        </div>

                        <div className="col-span-7 flex gap-1">
                          {tradingDays.map((day) => (
                            <div key={day} className="flex-1">
                              <div className={`text-center py-1 text-xs ${getPerformanceClass(stock.performance[day])}`}>
                                {stock.performance[day].toFixed(1)}%
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="col-span-3">
                          <div className={`text-center py-1 font-medium ${getPerformanceClass(stock.cumulative)}`}>
                            {stock.cumulative.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 功能说明 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-green-800 mb-2">✅ 最终版功能完成</h3>
          <div className="text-sm text-green-700 space-y-1">
            <p><strong>布局调整:</strong> ✅ 图表置顶 → 5日对比表格 → 股票详细数据</p>
            <p><strong>板块筛选:</strong> ✅ 可勾选"≥5个涨停"筛选活跃板块</p>
            <p><strong>数据统计:</strong> ✅ 图表和表格都支持按筛选条件显示</p>
            <p><strong>K线图功能:</strong> ✅ 点击股票名称查看个股K线图</p>
            <p><strong>排序功能:</strong> ✅ 板块内股票按累计收益排序</p>
            <p><strong>实时显示:</strong> ✅ 当前显示板块数量和筛选状态</p>
          </div>
        </div>
      </div>

      {/* 点击弹窗外部关闭 */}
      {showModal && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeModal}
        />
      )}
    </div>
  );
}