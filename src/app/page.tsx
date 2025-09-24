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
  const [selectedSectorData, setSelectedSectorData] = useState<{name: string, date: string, stocks: StockPerformance[], followUpData: Record<string, Record<string, number>>, chartData?: { date: string; avgPremium: number; stockCount: number; }[]} | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDateData, setSelectedDateData] = useState<{date: string, sectorData: { sectorName: string; stocks: any[]; avgPremium: number; }[]} | null>(null);
  const [showSectorRankingModal, setShowSectorRankingModal] = useState(false);
  const [showOnly5PlusInDateModal, setShowOnly5PlusInDateModal] = useState(true);

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

  // 处理板块点击显示弹窗 - 计算5天平均溢价数据
  const handleSectorClick = (date: string, sectorName: string, stocks: StockPerformance[], followUpData: Record<string, Record<string, number>>) => {
    // 计算该板块在最近5天的平均溢价数据
    const sector5DaysData: { date: string; avgPremium: number; stockCount: number; }[] = [];

    // 获取当前日期在dates数组中的位置
    const currentDateIndex = dates.indexOf(date);

    // 从当前日期开始，向前取5天数据（如果有的话）
    const startIndex = Math.max(0, currentDateIndex - 4);
    const relevantDates = dates.slice(startIndex, currentDateIndex + 1);

    relevantDates.forEach(checkDate => {
      const dayData = sevenDaysData?.[checkDate];
      if (!dayData || !dayData.categories[sectorName]) {
        sector5DaysData.push({ date: checkDate, avgPremium: 0, stockCount: 0 });
        return;
      }

      const sectorStocks = dayData.categories[sectorName];
      const sectorFollowUpData = dayData.followUpData[sectorName] || {};

      let totalPremium = 0;
      let validStockCount = 0;

      sectorStocks.forEach(stock => {
        const stockFollowUpData = sectorFollowUpData[stock.code] || {};
        const stockTotalReturn = Object.values(stockFollowUpData).reduce((sum, val) => sum + val, 0);
        totalPremium += stockTotalReturn;
        validStockCount++;
      });

      const avgPremium = validStockCount > 0 ? totalPremium / validStockCount : 0;
      sector5DaysData.push({
        date: checkDate,
        avgPremium: avgPremium,
        stockCount: validStockCount
      });
    });

    setSelectedSectorData({
      name: sectorName,
      date: date,
      stocks: stocks,
      followUpData: followUpData,
      chartData: sector5DaysData
    });
    setShowSectorModal(true);
  };

  // 处理日期点击显示所有个股（按板块分类）
  const handleDateClick = (date: string) => {
    const dayData = sevenDaysData?.[date];
    if (!dayData) return;

    // 按板块组织数据
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

      // 按个股累计溢价排序
      sectorStocks.sort((a, b) => b.totalReturn - a.totalReturn);

      // 计算板块平均溢价
      const avgPremium = sectorStocks.reduce((total, stock) => total + stock.totalReturn, 0) / sectorStocks.length;

      sectorData.push({
        sectorName,
        stocks: sectorStocks,
        avgPremium
      });
    });

    // 按板块平均溢价排序
    sectorData.sort((a, b) => b.avgPremium - a.avgPremium);

    setSelectedDateData({ date, sectorData });
    setShowDateModal(true);
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

      // 根据筛选条件过滤
      const filteredSectors = onlyLimitUp5Plus
        ? sectors.filter(sector => sector.count >= 5)
        : sectors;

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

  // 计算板块强度排序数据
  const getSectorStrengthRanking = useMemo(() => {
    if (!sevenDaysData || !dates) return [];

    const sectorStrengthMap: Record<string, { name: string; totalPremium: number; avgPremium: number; stockCount: number; dates: string[] }> = {};

    // 收集所有板块的溢价数据
    dates.forEach(date => {
      const dayData = sevenDaysData[date];
      if (!dayData) return;

      Object.entries(dayData.categories).forEach(([sectorName, stocks]) => {
        if (!sectorStrengthMap[sectorName]) {
          sectorStrengthMap[sectorName] = {
            name: sectorName,
            totalPremium: 0,
            avgPremium: 0,
            stockCount: 0,
            dates: []
          };
        }

        // 计算该板块在该日期的平均溢价
        let sectorDayPremium = 0;
        let sectorDayStockCount = 0;

        stocks.forEach(stock => {
          const followUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
          const stockTotalReturn = Object.values(followUpData).reduce((sum, val) => sum + val, 0);
          sectorDayPremium += stockTotalReturn;
          sectorDayStockCount += 1;
        });

        if (sectorDayStockCount > 0) {
          sectorStrengthMap[sectorName].totalPremium += sectorDayPremium;
          sectorStrengthMap[sectorName].stockCount += sectorDayStockCount;
          if (!sectorStrengthMap[sectorName].dates.includes(date)) {
            sectorStrengthMap[sectorName].dates.push(date);
          }
        }
      });
    });

    // 计算平均溢价并排序
    const rankedSectors = Object.values(sectorStrengthMap)
      .map(sector => ({
        ...sector,
        avgPremium: sector.stockCount > 0 ? sector.totalPremium / sector.stockCount : 0
      }))
      .sort((a, b) => b.avgPremium - a.avgPremium);

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
      {/* 板块溢价趋势弹窗 */}
      {showSectorModal && selectedSectorData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-5xl max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                📈 {selectedSectorData.name} - 平均溢价趋势分析
              </h3>
              <button
                onClick={closeSectorModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {selectedSectorData.chartData && (
              <div className="space-y-6">
                {/* 趋势图表 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">📊 平均溢价趋势图</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={selectedSectorData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatDate(value).slice(5)}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        label={{ value: '溢价(%)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip
                        labelFormatter={(value) => formatDate(value)}
                        formatter={(value: number) => [`${value.toFixed(2)}%`, '平均溢价']}
                        contentStyle={{
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgPremium"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ fill: '#2563eb', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: '#2563eb', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 数据表格 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">📋 详细数据表格</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white rounded-lg shadow-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">日期</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">涨停个股数</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">平均溢价</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">表现等级</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSectorData.chartData.map((dayData, index) => (
                          <tr key={dayData.date} className={`border-t ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="font-medium">{formatDate(dayData.date)}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(dayData.date).toLocaleDateString('zh-CN', { weekday: 'short' })}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                dayData.stockCount >= 5
                                  ? 'bg-green-100 text-green-800'
                                  : dayData.stockCount > 0
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                                {dayData.stockCount} 只
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getPerformanceClass(dayData.avgPremium)
                              }`}>
                                {dayData.avgPremium.toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-2xl">
                                {dayData.avgPremium > 15 ? '🔥' :
                                 dayData.avgPremium > 10 ? '⚡' :
                                 dayData.avgPremium > 5 ? '📈' :
                                 dayData.avgPremium > 0 ? '📊' : '📉'}
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
                      {selectedSectorData.chartData.reduce((sum, d) => sum + d.avgPremium, 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-blue-700 mt-1">总溢价</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(selectedSectorData.chartData.reduce((sum, d) => sum + d.avgPremium, 0) / selectedSectorData.chartData.length).toFixed(1)}%
                    </div>
                    <div className="text-sm text-green-700 mt-1">平均溢价</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.max(...selectedSectorData.chartData.map(d => d.avgPremium)).toFixed(1)}%
                    </div>
                    <div className="text-sm text-purple-700 mt-1">最高溢价</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedSectorData.chartData.reduce((sum, d) => sum + d.stockCount, 0)}
                    </div>
                    <div className="text-sm text-orange-700 mt-1">总涨停数</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 日期所有个股溢价弹窗 */}
      {showDateModal && selectedDateData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-7xl max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                📈 {formatDate(selectedDateData.date)} - 所有涨停个股溢价分析
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
                          return (
                            <div key={followDate} className="text-center bg-gray-50 rounded p-2">
                              <div className="text-gray-400 text-xs mb-1">T+{dayIndex + 1}</div>
                              <div className="text-xs text-gray-400 mb-1">{formatDate(followDate).slice(5)}</div>
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

      {/* 板块强度排序弹窗 */}
      {showSectorRankingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                🏆 板块强度溢价排序 (7天平均)
              </h3>
              <button
                onClick={closeSectorRankingModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {getSectorStrengthRanking.map((sector, index) => (
                <div key={sector.name} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index < 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{sector.name}</h4>
                        <div className="text-sm text-gray-500">
                          活跃{sector.dates.length}天 · 总计{sector.stockCount}只个股
                        </div>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-medium ${
                      getPerformanceClass(sector.avgPremium)
                    }`}>
                      平均溢价: {sector.avgPremium.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              <span className="text-gray-700">只显示≥5个涨停的板块</span>
            </label>

            {/* 板块强度排序按钮 */}
            <button
              onClick={() => setShowSectorRankingModal(true)}
              disabled={loading || !sevenDaysData}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              🏆 板块强度排序
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
                  {/* 日期头部（可点击查看所有个股） */}
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 text-center cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-colors"
                    onClick={() => handleDateClick(date)}
                  >
                    <div className="text-sm font-medium">
                      {formatDate(date).slice(5)} {/* MM-DD格式 */}
                    </div>
                    <div className="text-xs opacity-90">
                      {new Date(date).toLocaleDateString('zh-CN', { weekday: 'short' })}
                    </div>
                    <div className="text-xs mt-1 bg-white/20 rounded px-2 py-1 hover:bg-white/30 transition-colors">
                      {dayData?.stats.total_stocks || 0} 只涨停 👆
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
    </div>
  );
}