'use client';

import { useState, useEffect, useMemo } from 'react';
import { SevenDaysData, DayData, SectorSummary, StockPerformance } from '@/types/stock';
import { getPerformanceClass, getTodayString, formatDate } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 个股代码格式转换函数
function getStockCodeFormat(stockCode: string): string {
  if (stockCode.startsWith('6')) {
    return `sh${stockCode}`;
  } else {
    return `sz${stockCode}`;
  }
}

export default function Home() {
  const [sevenDaysData, setSevenDaysData] = useState<SevenDaysData | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlyLimitUp5Plus, setOnlyLimitUp5Plus] = useState(false);
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{name: string, code: string} | null>(null);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [selectedSectorData, setSelectedSectorData] = useState<{name: string, date: string, stocks: StockPerformance[], followUpData: Record<string, Record<string, number>>} | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDateData, setSelectedDateData] = useState<{date: string, sectorData: { sectorName: string; stocks: any[]; avgPremium: number; }[]} | null>(null);
  const [showSectorRankingModal, setShowSectorRankingModal] = useState(false);
  const [showOnly5PlusInDateModal, setShowOnly5PlusInDateModal] = useState(true);
  const [showWeekdayModal, setShowWeekdayModal] = useState(false);
  const [selectedWeekdayData, setSelectedWeekdayData] = useState<{date: string, sectorData: { sectorName: string; avgPremium: number; stockCount: number; }[], chartData?: { date: string; avgPremium: number; stockCount: number; }[]} | null>(null);
  const [showStockCountModal, setShowStockCountModal] = useState(false);
  const [selectedStockCountData, setSelectedStockCountData] = useState<{date: string, sectorData: { sectorName: string; stocks: any[]; avgPremium: number; }[]} | null>(null);
  const [showOnly5PlusInStockCountModal, setShowOnly5PlusInStockCountModal] = useState(true);

  // 生成最近7个交易日
  const generate7TradingDays = (endDate: string): string[] => {
    const dates = [];
    const end = new Date(endDate);
    let current = new Date(end);

    while (dates.length < 7) {
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        dates.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() - 1);
    }

    return dates.reverse();
  };

  const fetch7DaysData = async () => {
    setLoading(true);
    setError(null);

    try {
      const endDate = getTodayString();
      const response = await fetch(`/api/stocks?date=${endDate}&mode=7days`);
      const result = await response.json();

      if (result.success) {
        setSevenDaysData(result.data);
        setDates(result.dates || []);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      setError('网络请求失败');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch7DaysData();
  }, []);

  // 处理板块点击显示弹窗 - 显示该板块个股梯队
  const handleSectorClick = (date: string, sectorName: string, stocks: StockPerformance[], followUpData: Record<string, Record<string, number>>) => {
    setSelectedSectorData({
      name: sectorName,
      date: date,
      stocks: stocks,
      followUpData: followUpData
    });
    setShowSectorModal(true);
  };

  // 处理日期点击显示所有个股（按板块分类）
  const handleDateClick = (date: string) => {
    const dayData = sevenDaysData?.[date];
    if (!dayData) return;

    // 按板块组织数据
    const sectorData: { sectorName: string; stocks: any[]; avgPremium: number; totalCumulativeReturn: number; }[] = [];
    Object.entries(dayData.categories).forEach(([sectorName, stocks]) => {
      const sectorStocks = stocks.map(stock => {
        const followUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
        const totalReturn = Object.values(followUpData).reduce((sum, val) => sum + val, 0);
        return {
          ...stock,
          followUpData,
          totalReturn
        };
      });

      // 按个股累计溢价排序
      sectorStocks.sort((a, b) => b.totalReturn - a.totalReturn);

      // 计算板块平均溢价
      const avgPremium = sectorStocks.reduce((total, stock) => total + stock.totalReturn, 0) / sectorStocks.length;

      // 计算板块累计涨幅总和
      const totalCumulativeReturn = sectorStocks.reduce((total, stock) => total + stock.totalReturn, 0);

      sectorData.push({
        sectorName,
        stocks: sectorStocks,
        avgPremium,
        totalCumulativeReturn
      });
    });

    // 按板块累计涨幅总和排序
    sectorData.sort((a, b) => b.totalCumulativeReturn - a.totalCumulativeReturn);

    setSelectedDateData({ date, sectorData });
    setShowDateModal(true);
  };

  // 处理涨停数点击显示当天所有个股按板块分组
  const handleStockCountClick = (date: string) => {
    const dayData = sevenDaysData?.[date];
    if (!dayData) return;

    // 按板块组织数据，按板块涨停数排序，板块内按累计溢价排序
    const sectorData: { sectorName: string; stocks: any[]; avgPremium: number; }[] = [];
    Object.entries(dayData.categories).forEach(([sectorName, stocks]) => {
      const sectorStocks = stocks.map(stock => {
        const followUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
        const totalReturn = Object.values(followUpData).reduce((sum, val) => sum + val, 0);
        return {
          ...stock,
          followUpData,
          totalReturn
        };
      });

      // 板块内个股按累计溢价排序（降序）
      sectorStocks.sort((a, b) => b.totalReturn - a.totalReturn);

      // 计算板块平均溢价
      const avgPremium = sectorStocks.reduce((total, stock) => total + stock.totalReturn, 0) / sectorStocks.length;

      sectorData.push({
        sectorName,
        stocks: sectorStocks,
        avgPremium
      });
    });

    // 按板块涨停数排序（降序）
    sectorData.sort((a, b) => b.stocks.length - a.stocks.length);

    setSelectedStockCountData({ date, sectorData });
    setShowStockCountModal(true);
  };

  // 处理星期几点击显示板块平均溢价表格和图表
  const handleWeekdayClick = (date: string) => {
    const dayData = sevenDaysData?.[date];
    if (!dayData) return;

    // 计算各板块的平均溢价数据
    const sectorData: { sectorName: string; avgPremium: number; stockCount: number; }[] = [];
    Object.entries(dayData.categories).forEach(([sectorName, stocks]) => {
      let totalPremium = 0;
      let validStockCount = 0;

      stocks.forEach(stock => {
        const followUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
        const stockTotalReturn = Object.values(followUpData).reduce((sum, val) => sum + val, 0);
        totalPremium += stockTotalReturn;
        validStockCount++;
      });

      const avgPremium = validStockCount > 0 ? totalPremium / validStockCount : 0;
      sectorData.push({
        sectorName,
        avgPremium,
        stockCount: validStockCount
      });
    });

    // 按平均溢价排序
    sectorData.sort((a, b) => b.avgPremium - a.avgPremium);

    setSelectedWeekdayData({ date, sectorData });
    setShowWeekdayModal(true);
  };

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

  const closeSectorModal = () => {
    setShowSectorModal(false);
    setSelectedSectorData(null);
  };

  const closeDateModal = () => {
    setShowDateModal(false);
    setSelectedDateData(null);
  };

  const closeSectorRankingModal = () => {
    setShowSectorRankingModal(false);
  };

  const closeWeekdayModal = () => {
    setShowWeekdayModal(false);
    setSelectedWeekdayData(null);
  };

  const closeStockCountModal = () => {
    setShowStockCountModal(false);
    setSelectedStockCountData(null);
  };

  // 处理7天数据，按日期生成板块汇总
  const processedTimelineData = useMemo(() => {
    if (!sevenDaysData || !dates) return {};

    const result: Record<string, SectorSummary[]> = {};

    dates.forEach(date => {
      const dayData = sevenDaysData[date];
      if (!dayData) {
        result[date] = [];
        return;
      }

      // 转换为板块汇总格式
      const sectors: SectorSummary[] = Object.entries(dayData.categories).map(([sectorName, stocks]) => {
        // 确保 followUpData 结构正确
        const sectorFollowUpData = dayData.followUpData[sectorName] || {};
        return {
          name: sectorName,
          count: stocks.length,
          stocks: stocks,
          followUpData: sectorFollowUpData
        };
      });

      // 按涨停数量排序
      sectors.sort((a, b) => b.count - a.count);

      // 根据筛选条件过滤，默认排除"其他"和"ST板块"
      const filteredSectors = sectors
        .filter(sector => sector.name !== '其他' && sector.name !== 'ST板块')
        .filter(sector => onlyLimitUp5Plus ? sector.count >= 5 : true);

      result[date] = filteredSectors;
    });

    return result;
  }, [sevenDaysData, dates, onlyLimitUp5Plus]);

  // 获取展开的股票数据（按后续5日累计收益排序）
  const getSortedStocksForSector = (stocks: StockPerformance[], followUpData: Record<string, Record<string, number>>) => {
    return [...stocks].sort((a, b) => {
      const aFollowUp = followUpData[a.code] || {};
      const bFollowUp = followUpData[b.code] || {};
      const aTotalReturn = Object.values(aFollowUp).reduce((sum, val) => sum + val, 0);
      const bTotalReturn = Object.values(bFollowUp).reduce((sum, val) => sum + val, 0);
      return bTotalReturn - aTotalReturn; // 降序排列
    });
  };

  // 计算板块最近3天涨停家数排序（前5名）
  const getSectorStrengthRanking = useMemo(() => {
    if (!sevenDaysData || !dates) return [];

    // 根据当前时间选择3天数据：17点前选择前3天，17点后包含今天
    const now = new Date();
    const currentHour = now.getHours();
    let recent3Days: string[];

    if (currentHour < 17) {
      // 17点前：选择今天之外的前3天
      recent3Days = dates.slice(-4, -1);
    } else {
      // 17点后：选择包含前2天和今天
      recent3Days = dates.slice(-3);
    }

    if (recent3Days.length === 0) return [];

    const sectorCountMap: Record<string, { name: string; totalLimitUpCount: number; dailyBreakdown: { date: string; count: number }[] }> = {};

    // 统计最近3天每个板块的涨停家数，排除"其他"和"ST板块"
    recent3Days.forEach(date => {
      const dayData = sevenDaysData[date];
      if (!dayData) return;

      Object.entries(dayData.categories).forEach(([sectorName, stocks]) => {
        // 排除"其他"板块和"ST板块"
        if (sectorName === '其他' || sectorName === 'ST板块') {
          return;
        }

        if (!sectorCountMap[sectorName]) {
          sectorCountMap[sectorName] = {
            name: sectorName,
            totalLimitUpCount: 0,
            dailyBreakdown: []
          };
        }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在获取7天数据...</p>
          <p className="text-gray-500 text-sm mt-2">这可能需要几分钟时间</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* 板块个股梯队弹窗 */}
      {showSectorModal && selectedSectorData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                📊 {selectedSectorData.name} - 个股梯队详情 ({formatDate(selectedSectorData.date)})
              </h3>
              <button
                onClick={closeSectorModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 text-sm text-gray-600">
              共 {selectedSectorData.stocks.length} 只个股，按5日累计溢价排序
            </div>

            {/* 板块5天平均溢价趋势图表 */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">📈 板块5天平均溢价趋势</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(() => {
                      const chartData: { date: string; avgPremium: number; stockCount: number }[] = [];

                      // 获取所有交易日期
                      const allDates = new Set<string>();
                      Object.values(selectedSectorData.followUpData).forEach(stockData => {
                        Object.keys(stockData).forEach(date => allDates.add(date));
                      });

                      const sortedDates = Array.from(allDates).sort().slice(0, 5);

                      sortedDates.forEach(date => {
                        let totalPremium = 0;
                        let validStockCount = 0;

                        Object.entries(selectedSectorData.followUpData).forEach(([stockCode, stockData]) => {
                          if (stockData[date] !== undefined) {
                            totalPremium += stockData[date];
                            validStockCount++;
                          }
                        });

                        const avgPremium = validStockCount > 0 ? totalPremium / validStockCount : 0;

                        let formattedDate = '';
                        try {
                          const formatted = formatDate(date);
                          formattedDate = formatted ? formatted.slice(5) : date;
                        } catch (error) {
                          formattedDate = date;
                        }

                        chartData.push({
                          date: formattedDate,
                          avgPremium: Math.round(avgPremium * 100) / 100,
                          stockCount: validStockCount
                        });
                      });

                      return chartData;
                    })()}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'avgPremium' ? `${value}%` : value,
                        name === 'avgPremium' ? '平均溢价' : '个股数量'
                      ]}
                      labelFormatter={(label) => `日期: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgPremium"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                      name="平均溢价(%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getSortedStocksForSector(selectedSectorData.stocks, selectedSectorData.followUpData).map((stock, index) => {
                const followUpDates = Object.keys(selectedSectorData.followUpData[stock.code] || {}).sort();
                const totalReturn = Object.values(selectedSectorData.followUpData[stock.code] || {}).reduce((sum, val) => sum + val, 0);
                return (
                  <div key={stock.code} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400 font-mono w-8">#{index + 1}</span>
                          <h5
                            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                            onClick={() => handleStockClick(stock.name, stock.code)}
                          >
                            {stock.name} ({stock.code})
                          </h5>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 ml-10">
                          <span>{stock.td_type}</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        getPerformanceClass(totalReturn)
                      }`}>
                        累计: {totalReturn.toFixed(1)}%
                      </div>
                    </div>

                    {/* T+1到T+5表现网格 */}
                    <div className="grid grid-cols-5 gap-2 ml-10">
                      {followUpDates.slice(0, 5).map((followDate, dayIndex) => {
                        const performance = selectedSectorData.followUpData[stock.code]?.[followDate] || 0;

                        // 安全格式化日期
                        let formattedDate = '';
                        try {
                          const formatted = formatDate(followDate);
                          formattedDate = formatted ? formatted.slice(5) : `日期${dayIndex + 1}`;
                        } catch (error) {
                          console.warn('[板块弹窗] 日期格式化失败:', followDate, error);
                          formattedDate = `日期${dayIndex + 1}`;
                        }

                        return (
                          <div key={followDate || `day-${dayIndex}`} className="text-center bg-gray-50 rounded p-2">
                            <div className="text-xs text-gray-400 mb-1">{formattedDate}</div>
                            <div className={`px-2 py-1 rounded text-sm font-medium ${getPerformanceClass(performance)}`}>
                              {performance.toFixed(1)}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 星期几板块平均溢价弹窗 */}
      {showWeekdayModal && selectedWeekdayData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-5xl max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                📈 {(() => {
                  try {
                    const formattedDate = formatDate(selectedWeekdayData.date);
                    const weekday = new Date(selectedWeekdayData.date).toLocaleDateString('zh-CN', { weekday: 'long' });
                    return `${formattedDate} ${weekday}`;
                  } catch (error) {
                    console.warn('[星期几弹窗] 日期格式化失败:', selectedWeekdayData.date, error);
                    return selectedWeekdayData.date;
                  }
                })()} - 板块平均溢价分析
              </h3>
              <button
                onClick={closeWeekdayModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* 板块溢价数据表格 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-4 text-gray-800">📋 板块平均溢价数据表</h4>
                <div className="overflow-x-auto">
                  <table className="w-full bg-white rounded-lg shadow-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">排名</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">板块名称</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">涨停个股数</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">平均溢价</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">表现等级</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWeekdayData.sectorData.map((sector, index) => (
                        <tr key={sector.sectorName} className={`border-t ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                          <td className="px-4 py-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index < 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{sector.sectorName}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              sector.stockCount >= 5
                                ? 'bg-green-100 text-green-800'
                                : sector.stockCount > 0
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}>
                              {sector.stockCount} 只
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              getPerformanceClass(sector.avgPremium)
                            }`}>
                              {sector.avgPremium.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-2xl">
                              {sector.avgPremium > 15 ? '🔥' :
                               sector.avgPremium > 10 ? '⚡' :
                               sector.avgPremium > 5 ? '📈' :
                               sector.avgPremium > 0 ? '📊' : '📉'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 统计摘要 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedWeekdayData.sectorData.length}
                  </div>
                  <div className="text-sm text-blue-700 mt-1">活跃板块数</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedWeekdayData.sectorData.reduce((sum, s) => sum + s.stockCount, 0)}
                  </div>
                  <div className="text-sm text-green-700 mt-1">总涨停数</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedWeekdayData.sectorData.length > 0 ? Math.max(...selectedWeekdayData.sectorData.map(s => s.avgPremium)).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-purple-700 mt-1">最高溢价</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedWeekdayData.sectorData.length > 0 ? (selectedWeekdayData.sectorData.reduce((sum, s) => sum + s.avgPremium, 0) / selectedWeekdayData.sectorData.length).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-orange-700 mt-1">平均溢价</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 日期所有个股溢价弹窗 */}
      {showDateModal && selectedDateData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-7xl max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                📈 {(() => {
                  try {
                    return formatDate(selectedDateData.date);
                  } catch (error) {
                    console.warn('[日期弹窗] 标题日期格式化失败:', selectedDateData.date, error);
                    return selectedDateData.date;
                  }
                })()} - 所有涨停个股溢价分析
              </h3>
              <button
                onClick={closeDateModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                共 {selectedDateData.sectorData
                  .filter(sector => showOnly5PlusInDateModal ? sector.stocks.length >= 5 : true)
                  .reduce((total, sector) => total + sector.stocks.length, 0)} 只涨停个股，按5日累计溢价排序
              </div>
              <button
                onClick={() => setShowOnly5PlusInDateModal(!showOnly5PlusInDateModal)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  showOnly5PlusInDateModal
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                {showOnly5PlusInDateModal ? '显示全部板块' : '只显示≥5家板块'}
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedDateData.sectorData
                .filter(sector => showOnly5PlusInDateModal ? sector.stocks.length >= 5 : true)
                .flatMap(sector =>
                  sector.stocks.map(stock => ({
                    ...stock,
                    sectorName: sector.sectorName,
                    sectorAvgPremium: sector.avgPremium
                  }))
                )
                .sort((a, b) => b.totalReturn - a.totalReturn)
                .map((stock, index) => {
                  const followUpDates = Object.keys(stock.followUpData).sort();
                  return (
                    <div key={`${stock.code}-${stock.sectorName}`} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400 font-mono w-8">#{index + 1}</span>
                            <h5
                              className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                              onClick={() => handleStockClick(stock.name, stock.code)}
                            >
                              {stock.name} ({stock.code})
                            </h5>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 ml-10">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{stock.sectorName}</span>
                            <span>{stock.td_type}</span>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          getPerformanceClass(stock.totalReturn)
                        }`}>
                          累计: {stock.totalReturn.toFixed(1)}%
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-2 ml-10">
                        {followUpDates.slice(0, 5).map((followDate, dayIndex) => {
                          const performance = stock.followUpData[followDate] || 0;

                          // 安全格式化日期
                          let formattedDate = '';
                          try {
                            const formatted = formatDate(followDate);
                            formattedDate = formatted ? formatted.slice(5) : `日期${dayIndex + 1}`;
                          } catch (error) {
                            console.warn('[日期弹窗] 日期格式化失败:', followDate, error);
                            formattedDate = `日期${dayIndex + 1}`;
                          }

                          return (
                            <div key={followDate || `day-${dayIndex}`} className="text-center bg-gray-50 rounded p-2">
                              <div className="text-xs text-gray-400 mb-1">{formattedDate}</div>
                              <div className={`px-2 py-1 rounded text-sm font-medium ${getPerformanceClass(performance)}`}>
                                {performance.toFixed(1)}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* 涨停数弹窗 - 按板块分组显示个股溢价 */}
      {showStockCountModal && selectedStockCountData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-[95vw] max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                📊 {(() => {
                  try {
                    return formatDate(selectedStockCountData.date);
                  } catch (error) {
                    console.warn('[涨停数弹窗] 标题日期格式化失败:', selectedStockCountData.date, error);
                    return selectedStockCountData.date;
                  }
                })()} - 涨停个股5天溢价表现
              </h3>
              <button
                onClick={closeStockCountModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                共 {selectedStockCountData.sectorData
                  .filter(sector => showOnly5PlusInStockCountModal ? sector.stocks.length >= 5 : true)
                  .reduce((total, sector) => total + sector.stocks.length, 0)} 只涨停个股，按板块分组显示
              </div>
              <button
                onClick={() => setShowOnly5PlusInStockCountModal(!showOnly5PlusInStockCountModal)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  showOnly5PlusInStockCountModal
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                {showOnly5PlusInStockCountModal ? '显示全部板块' : '只显示≥5家板块'}
              </button>
            </div>

            {/* 按板块分组显示 */}
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {selectedStockCountData.sectorData
                .filter(sector => showOnly5PlusInStockCountModal ? sector.stocks.length >= 5 : true)
                .map((sector, sectorIndex) => {
                  // 获取该板块的5日期范围
                  const allFollowUpDates = new Set<string>();
                  sector.stocks.forEach(stock => {
                    Object.keys(stock.followUpData).forEach(date => {
                      allFollowUpDates.add(date);
                    });
                  });
                  const followUpDates = Array.from(allFollowUpDates).sort().slice(0, 5);

                  return (
                    <div key={sector.sectorName} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-800">
                          📈 {sector.sectorName} ({sector.stocks.length}只)
                        </h4>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          getPerformanceClass(sector.avgPremium)
                        }`}>
                          平均: {sector.avgPremium.toFixed(1)}%
                        </div>
                      </div>

                      {/* 紧凑的表格显示 */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-white">
                            <tr className="border-b">
                              <th className="px-2 py-1 text-left font-semibold text-gray-700 min-w-[120px]">名称</th>
                              {followUpDates.map((date, index) => {
                                let formattedDate = '';
                                try {
                                  const formatted = formatDate(date);
                                  formattedDate = formatted ? formatted.slice(5).replace('-', '') : `${date.slice(-2)}`;
                                } catch (error) {
                                  console.warn('[涨停数弹窗] 日期格式化失败:', date, error);
                                  formattedDate = `${date.slice(-2)}`;
                                }
                                return (
                                  <th key={date} className="px-1 py-1 text-center font-semibold text-gray-700 min-w-[45px]">
                                    {formattedDate}
                                  </th>
                                );
                              })}
                              <th className="px-2 py-1 text-center font-semibold text-gray-700 min-w-[60px]">累计</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sector.stocks.map((stock, stockIndex) => (
                              <tr key={stock.code} className={`border-b ${stockIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                                <td className="px-2 py-1">
                                  <div
                                    className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline truncate"
                                    onClick={() => handleStockClick(stock.name, stock.code)}
                                    title={`${stock.name} (${stock.code})`}
                                  >
                                    {stock.name.length > 6 ? stock.name.slice(0, 6) : stock.name}
                                    <span className="text-gray-400 text-[10px] ml-1">{stock.code}</span>
                                  </div>
                                </td>
                                {followUpDates.map(date => {
                                  const performance = stock.followUpData[date] || 0;
                                  return (
                                    <td key={date} className="px-1 py-1 text-center">
                                      <div className={`px-1 py-0.5 rounded text-[10px] font-medium ${getPerformanceClass(performance)}`}>
                                        {performance > 0 ? `+${performance.toFixed(1)}` : performance.toFixed(1)}
                                      </div>
                                    </td>
                                  );
                                })}
                                <td className="px-2 py-1 text-center">
                                  <div className={`px-2 py-0.5 rounded text-xs font-medium ${getPerformanceClass(stock.totalReturn)}`}>
                                    {stock.totalReturn > 0 ? `+${stock.totalReturn.toFixed(1)}%` : `${stock.totalReturn.toFixed(1)}%`}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
      )}

      {/* 板块强度排序弹窗 */}
      {showSectorRankingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                🏆 板块3天涨停总数排行 (前5名)
              </h3>
              <button
                onClick={closeSectorRankingModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 最近3天概况 */}
            <div className="mb-6 bg-blue-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-800 mb-2">📊 统计说明</h4>
              <p className="text-blue-700 text-sm">
                统计最近3个交易日各板块涨停总数，按总数降序排列，显示前5名最活跃板块
              </p>
              {dates.length >= 3 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-blue-600 font-medium">统计日期:</span>
                  {dates.slice(-3).map(date => {
                    try {
                      return (
                        <span key={date} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {formatDate(date).slice(5)}
                        </span>
                      );
                    } catch (error) {
                      return (
                        <span key={date} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {date}
                        </span>
                      );
                    }
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {getSectorStrengthRanking.map((sector, index) => (
                <div key={sector.name} className="bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg' :
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white shadow-md' :
                          index === 2 ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white shadow-md' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{sector.name}</h4>
                          <div className="text-sm text-gray-500">
                            最近3天累计涨停数
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-4 py-2 rounded-full font-bold text-lg ${
                          index === 0 ? 'bg-red-100 text-red-700' :
                          index === 1 ? 'bg-orange-100 text-orange-700' :
                          index === 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {sector.totalLimitUpCount} 只
                        </div>
                      </div>
                    </div>

                    {/* 3天详细分解 */}
                    <div className="grid grid-cols-3 gap-3 mt-4 bg-gray-50 rounded-lg p-3">
                      {sector.dailyBreakdown.map((day, dayIndex) => {
                        let formattedDate = '';
                        try {
                          formattedDate = formatDate(day.date).slice(5);
                        } catch (error) {
                          formattedDate = day.date;
                        }

                        return (
                          <div key={day.date} className="text-center bg-white rounded p-2 border">
                            <div className="text-xs text-gray-500 mb-1">{formattedDate}</div>
                            <div className={`text-lg font-semibold ${
                              day.count >= 10 ? 'text-red-600' :
                              day.count >= 5 ? 'text-orange-600' :
                              day.count > 0 ? 'text-blue-600' : 'text-gray-400'
                            }`}>
                              {day.count}
                            </div>
                            <div className="text-xs text-gray-400">只涨停</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {getSectorStrengthRanking.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-lg">暂无数据</p>
                <p className="text-sm">最近3天没有足够的涨停数据</p>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* 页面标题和控制 */}
      <div className="max-w-full mx-auto mb-6">
        <div className="flex justify-between items-center bg-white rounded-lg shadow-sm p-4">
          <h1 className="text-2xl font-bold text-gray-900">📈 宇硕板块节奏</h1>

          <div className="flex items-center gap-4">
            {/* 板块筛选开关 */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyLimitUp5Plus}
                onChange={(e) => setOnlyLimitUp5Plus(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">
                {(() => {
                  if (!sevenDaysData || !dates) {
                    return "只显示≥5个涨停的板块";
                  }

                  // 计算当前显示的板块总数和符合≥5个条件的板块数
                  let totalSectors = 0;
                  let filtered5PlusSectors = 0;

                  dates.forEach(date => {
                    const dayData = sevenDaysData[date];
                    if (dayData) {
                      Object.entries(dayData.categories).forEach(([sectorName, stocks]) => {
                        if (sectorName !== '其他' && sectorName !== 'ST板块') {
                          totalSectors++;
                          if (stocks.length >= 5) {
                            filtered5PlusSectors++;
                          }
                        }
                      });
                    }
                  });

                  if (onlyLimitUp5Plus) {
                    return `显示全部板块 (当前${filtered5PlusSectors}个≥5家)`;
                  } else {
                    return `只显示≥5家板块 (共${totalSectors}个板块)`;
                  }
                })()}
              </span>
            </label>

            {/* 板块3天涨停排行按钮 */}
            <button
              onClick={() => setShowSectorRankingModal(true)}
              disabled={loading || !sevenDaysData}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              🏆 3天涨停排行
            </button>

            {/* 刷新按钮 */}
            <button
              onClick={fetch7DaysData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '刷新中...' : '🔄 刷新数据'}
            </button>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="max-w-full mx-auto mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* 7天时间轴主内容 */}
      {sevenDaysData && dates.length > 0 && (
        <div className="max-w-full mx-auto">
          {/* 时间轴网格 */}
          <div className="grid grid-cols-7 gap-3">
            {dates.map((date) => {
              const dayData = sevenDaysData[date];
              const sectors = processedTimelineData[date] || [];

              return (
                <div key={date} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* 日期头部 */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 text-center">
                    <div
                      className="text-sm font-medium cursor-pointer hover:bg-white/10 rounded px-2 py-1 transition-colors"
                      onClick={() => handleDateClick(date)}
                    >
                      {formatDate(date).slice(5)} {/* MM-DD格式 */}
                    </div>
                    <div className="text-xs opacity-90 px-2 py-1">
                      {new Date(date).toLocaleDateString('zh-CN', { weekday: 'short' })}
                    </div>
                    <div
                      className="text-xs mt-1 bg-white/20 rounded px-2 py-1 cursor-pointer hover:bg-white/30 transition-colors"
                      onClick={() => handleStockCountClick(date)}
                    >
                      {dayData?.stats.total_stocks || 0} 只涨停
                    </div>
                  </div>

                  {/* 板块列表 */}
                  <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
                    {sectors.length === 0 ? (
                      <div className="text-center text-gray-500 py-4 text-sm">
                        暂无数据
                      </div>
                    ) : (
                      sectors.map((sector) => {
                        // 计算板块平均溢价
                        const sectorAvgPremium = sector.stocks.reduce((total, stock) => {
                          const followUpData = sector.followUpData[stock.code] || {};
                          const stockTotalReturn = Object.values(followUpData).reduce((sum, val) => sum + val, 0);
                          return total + stockTotalReturn;
                        }, 0) / sector.stocks.length;

                        return (
                          <div
                            key={sector.name}
                            className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all"
                            onClick={() => handleSectorClick(date, sector.name, sector.stocks, sector.followUpData)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm truncate hover:text-blue-600 transition-colors">
                                  {sector.name} 📊
                                </div>
                                <div className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                                  sector.count >= 5 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {sector.count}个涨停
                                </div>
                              </div>
                              <div className="ml-2 text-right">
                                <div className="text-xs text-gray-500">平均溢价</div>
                                <div className={`text-xs px-2 py-1 rounded font-medium ${
                                  getPerformanceClass(sectorAvgPremium)
                                }`}>
                                  {sectorAvgPremium.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 使用说明 */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-blue-800 font-medium mb-2">💡 使用说明</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• 按最近7个交易日排列，显示每日涨停板块及数量和平均溢价</li>
              <li>• <span className="font-semibold">点击日期头部</span>: 单列显示当日所有涨停个股，支持≥5家板块筛选</li>
              <li>• <span className="font-semibold">点击板块名称</span>: 查看该板块5天平均溢价趋势图和数据表格</li>
              <li>• 点击"板块强度排序"查看7天板块溢价强度排名</li>
              <li>• 点击股票名称可查看K线图</li>
              <li>• 可筛选只显示≥5个涨停的活跃板块</li>
            </ul>
          </div>
        </div>
      )}

      {/* 无数据提示 */}
      {sevenDaysData && dates.length === 0 && !loading && (
        <div className="max-w-full mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                📊
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无7天数据</h3>
            <p className="text-gray-500">
              无法获取最近7天的涨停数据，请稍后重试
            </p>
          </div>
        </div>
      )}

      {/* 点击弹窗外部关闭 */}
      {showModal && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeModal}
        />
      )}
      {showSectorModal && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeSectorModal}
        />
      )}
      {showDateModal && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeDateModal}
        />
      )}
      {showSectorRankingModal && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeSectorRankingModal}
        />
      )}
      {showWeekdayModal && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeWeekdayModal}
        />
      )}
      {showStockCountModal && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeStockCountModal}
        />
      )}
    </div>
  );
}