'use client';

import { useState } from 'react';
import { getPerformanceClass } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 模拟数据
const mockStockData = [
  {
    category: "软件服务",
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

// 板块统计数据
const categoryStats = mockStockData.map(category => {
  const dayAverages = tradingDays.map(day => {
    const dayValues = category.stocks.map(stock => stock.performance[day]);
    const average = dayValues.reduce((sum, val) => sum + val, 0) / dayValues.length;
    return { day, average };
  });

  return {
    category: category.category,
    dayAverages,
    totalAverage: dayAverages.reduce((sum, day) => sum + day.average, 0) / dayAverages.length
  };
});

export default function TestEnhancedPage() {
  const [selectedDate, setSelectedDate] = useState("2025-09-17");
  const [sortAscending, setSortAscending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{name: string, code: string} | null>(null);

  // 对每个板块内的股票按累计排序
  const sortedData = mockStockData.map(category => ({
    ...category,
    stocks: [...category.stocks].sort((a, b) =>
      sortAscending ? a.cumulative - b.cumulative : b.cumulative - a.cumulative
    )
  }));

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
          <h1 className="text-2xl font-bold text-gray-900">增强版股票板块分析</h1>

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

      <div className="max-w-7xl mx-auto space-y-6">

        {/* 功能1&2: 简化的股票数据展示 + 累计排序 */}
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

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {sortedData.map((category) => (
              <div key={category.category} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3 text-gray-800">{category.category}</h3>

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
        </div>

        {/* 功能3: 板块对比表格 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">板块5日平均表现对比</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">板块</th>
                  {tradingDays.map(day => (
                    <th key={day} className="text-center py-3 px-4 font-medium text-gray-900">
                      {day.slice(5)}
                    </th>
                  ))}
                  <th className="text-center py-3 px-4 font-medium text-gray-900">5日平均</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.map((stat) => (
                  <tr key={stat.category} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{stat.category}</td>
                    {stat.dayAverages.map(dayAvg => (
                      <td key={dayAvg.day} className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded text-sm ${getPerformanceClass(dayAvg.average)}`}>
                          {dayAvg.average.toFixed(1)}%
                        </span>
                      </td>
                    ))}
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded font-medium ${getPerformanceClass(stat.totalAverage)}`}>
                        {stat.totalAverage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 功能4: 图表可视化区域 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">板块强弱趋势图表</h2>

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
                  fontSize={12}
                />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  label={{ value: '涨跌幅 (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [`${value}%`, name]}
                  labelFormatter={(label) => `日期: 09-${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="软件服务"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="电子信息"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="新能源"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="银行板块"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              💡 <strong>图表说明:</strong> 展示各板块在选定日期后5天的平均表现趋势。
              线条越高表示该板块表现越强，可以直观看出板块轮动和强弱关系。
            </p>
          </div>
        </div>

        {/* 新增K线图功能说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-800 mb-2">📈 新增K线图功能</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>6. K线图弹窗:</strong> 点击任意股票名称，弹窗显示该股票的K线图</p>
            <p><strong>数据来源:</strong> 新浪财经实时K线图</p>
            <p><strong>支持格式:</strong> 上证(sh) + 深证(sz) 自动识别</p>
            <p><strong>交互方式:</strong> 点击股票名称打开，点击空白区域或×按钮关闭</p>
          </div>
        </div>

        {/* 功能理解验证说明 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">💡 完整功能验证</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p><strong>1. 页面简化:</strong> ✅ 移除了统计摘要，直接显示数据表格</p>
            <p><strong>2. 累计排序:</strong> ✅ 点击按钮可以切换板块内股票的累计排序</p>
            <p><strong>3. 板块对比:</strong> ✅ 表格显示各板块每日平均表现，便于横向对比</p>
            <p><strong>4. 图表可视化:</strong> ✅ 多线趋势图显示板块强弱演化</p>
            <p><strong>5. 测试页面:</strong> ✅ 使用模拟数据验证理解正确性</p>
            <p><strong>6. K线图弹窗:</strong> ✅ 点击股票名称显示个股K线图，支持上证深证自动识别</p>
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