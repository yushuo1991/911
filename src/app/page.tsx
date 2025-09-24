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
  const [showOnly5PlusInWeekdayModal, setShowOnly5PlusInWeekdayModal] = useState(true);
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

  // 处理板块点击显示弹窗 - 使用左右分屏样式
  const handleSectorClick = (date: string, sectorName: string, stocks: StockPerformance[], followUpData: Record<string, Record<string, number>>) => {
    const dayData = sevenDaysData?.[date];
    if (!dayData) return;

    // 构建单个板块的数据结构，包含个股详细数据
    const sectorData: { sectorName: string; avgPremium: number; stockCount: number; chartData?: { date: string; avgPremium: number; stockCount: number; }[]; stocksData?: any[] }[] = [];

    // 获取后续5日日期
    const dateIndex = dates.indexOf(date);
    const next5Days = dates.slice(dateIndex + 1, dateIndex + 6);

    // 处理个股数据，按累计溢价排序
    const stocksWithData = stocks.map(stock => {
      const stockFollowUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
      const stockTotalReturn = Object.values(stockFollowUpData).reduce((sum, val) => sum + val, 0);

      // 构建个股的日期数据
      const stockChartData: { date: string; value: number }[] = [];

      next5Days.forEach((nextDate) => {
        const nextDayData = sevenDaysData?.[nextDate];
        if (nextDayData && nextDayData.followUpData[sectorName] && nextDayData.followUpData[sectorName][stock.code]) {
          const nextDayFollowUpData = nextDayData.followUpData[sectorName][stock.code] || {};
          const nextDayStockReturn = Object.values(nextDayFollowUpData).reduce((sum, val) => sum + val, 0);
          stockChartData.push({
            date: nextDate,
            value: nextDayStockReturn
          });
        } else {
          stockChartData.push({
            date: nextDate,
            value: 0
          });
        }
      });

      return {
        ...stock,
        totalReturn: stockTotalReturn,
        chartData: stockChartData,
        followUpData: stockFollowUpData
      };
    }).sort((a, b) => b.totalReturn - a.totalReturn); // 按累计溢价排序

    // 计算板块平均数据
    const totalPremium = stocksWithData.reduce((sum, stock) => sum + stock.totalReturn, 0);
    const avgPremium = stocksWithData.length > 0 ? totalPremium / stocksWithData.length : 0;

    // 计算板块后续5日平均数据
    const sectorChartData: { date: string; avgPremium: number; stockCount: number; }[] = [];
    next5Days.forEach((nextDate, index) => {
      const nextDayData = sevenDaysData?.[nextDate];
      if (nextDayData && nextDayData.categories[sectorName]) {
        const nextDayStocks = nextDayData.categories[sectorName];
        let nextDayTotalPremium = 0;
        let nextDayValidCount = 0;

        nextDayStocks.forEach(stock => {
          const nextDayFollowUpData = nextDayData.followUpData[sectorName]?.[stock.code] || {};
          const nextDayStockReturn = Object.values(nextDayFollowUpData).reduce((sum, val) => sum + val, 0);
          nextDayTotalPremium += nextDayStockReturn;
          nextDayValidCount++;
        });

        const nextDayAvgPremium = nextDayValidCount > 0 ? nextDayTotalPremium / nextDayValidCount : 0;
        sectorChartData.push({
          date: nextDate,
          avgPremium: nextDayAvgPremium,
          stockCount: nextDayValidCount
        });
      }
    });

    sectorData.push({
      sectorName,
      avgPremium,
      stockCount: stocksWithData.length,
      chartData: sectorChartData,
      stocksData: stocksWithData
    });

    setSelectedWeekdayData({ date, sectorData });
    setShowWeekdayModal(true);
  };

  // 处理日期点击显示板块溢价表格和图表
  const handleDateClick = (date: string) => {
    const dayData = sevenDaysData?.[date];
    if (!dayData) return;

    // 计算各板块的5天溢价数据和图表数据
    const sectorData: { sectorName: string; avgPremium: number; stockCount: number; chartData?: { date: string; avgPremium: number; stockCount: number; }[] }[] = [];

    // 获取后续5日日期
    const dateIndex = dates.indexOf(date);
    const next5Days = dates.slice(dateIndex + 1, dateIndex + 6);

    Object.entries(dayData.categories)
      .filter(([sectorName]) => sectorName !== '其他' && sectorName !== 'ST板块')
      .forEach(([sectorName, stocks]) => {
        let totalPremium = 0;
        let validStockCount = 0;
        const sectorChartData: { date: string; avgPremium: number; stockCount: number; }[] = [];

        // 计算当天平均溢价
        stocks.forEach(stock => {
          const followUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
          const stockTotalReturn = Object.values(followUpData).reduce((sum, val) => sum + val, 0);
          totalPremium += stockTotalReturn;
          validStockCount++;
        });

        const avgPremium = validStockCount > 0 ? totalPremium / validStockCount : 0;

        // 计算后续5日数据
        next5Days.forEach((nextDate, index) => {
          const nextDayData = sevenDaysData?.[nextDate];
          if (nextDayData && nextDayData.categories[sectorName]) {
            const nextDayStocks = nextDayData.categories[sectorName];
            let nextDayTotalPremium = 0;
            let nextDayValidCount = 0;

            nextDayStocks.forEach(stock => {
              const nextDayFollowUpData = nextDayData.followUpData[sectorName]?.[stock.code] || {};
              const nextDayStockReturn = Object.values(nextDayFollowUpData).reduce((sum, val) => sum + val, 0);
              nextDayTotalPremium += nextDayStockReturn;
              nextDayValidCount++;
            });

            const nextDayAvgPremium = nextDayValidCount > 0 ? nextDayTotalPremium / nextDayValidCount : 0;
            sectorChartData.push({
              date: nextDate,
              avgPremium: nextDayAvgPremium,
              stockCount: nextDayValidCount
            });
          }
        });

        sectorData.push({
          sectorName,
          avgPremium,
          stockCount: validStockCount,
          chartData: sectorChartData
        });
      });

    // 按板块累计溢价排序（当日+后续5日）
    sectorData.sort((a, b) => {
      const aCumulative = a.avgPremium + (a.chartData?.slice(0, 5).reduce((sum, d) => sum + d.avgPremium, 0) || 0);
      const bCumulative = b.avgPremium + (b.chartData?.slice(0, 5).reduce((sum, d) => sum + d.avgPremium, 0) || 0);
      return bCumulative - aCumulative;
    });

    setSelectedWeekdayData({ date, sectorData });
    setShowWeekdayModal(true);
  };

  // 处理涨停数点击显示当天所有个股按板块分组（优化显示更多数据）
  const handleStockCountClick = (date: string) => {
    const dayData = sevenDaysData?.[date];
    if (!dayData) return;

    // 按板块组织数据，按板块涨停数排序，板块内按累计溢价排序，排除"其他"和"ST板块"
    const sectorData: { sectorName: string; stocks: any[]; avgPremium: number; }[] = [];
    Object.entries(dayData.categories)
      .filter(([sectorName]) => sectorName !== '其他' && sectorName !== 'ST板块')
      .forEach(([sectorName, stocks]) => {
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

      {/* 日期板块溢价分析弹窗 - 左右分屏布局 */}
      {showWeekdayModal && selectedWeekdayData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-4 max-w-[95vw] max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                📈 {(() => {
                  try {
                    const formattedDate = formatDate(selectedWeekdayData.date);
                    const weekday = new Date(selectedWeekdayData.date).toLocaleDateString('zh-CN', { weekday: 'long' });
                    return `${formattedDate} ${weekday}`;
                  } catch (error) {
                    console.warn('[日期弹窗] 日期格式化失败:', selectedWeekdayData.date, error);
                    return selectedWeekdayData.date;
                  }
                })()} - 板块5日溢价分析
              </h3>
              <button
                onClick={closeWeekdayModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 筛选按钮 */}
            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedWeekdayData.sectorData.length === 1
                  ? `单个板块：${selectedWeekdayData.sectorData[0].sectorName}`
                  : `共 ${selectedWeekdayData.sectorData
                      .filter(sector => showOnly5PlusInWeekdayModal ? sector.stockCount >= 5 : true)
                      .length} 个活跃板块`
                }
              </div>
              <button
                onClick={() => setShowOnly5PlusInWeekdayModal(!showOnly5PlusInWeekdayModal)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  showOnly5PlusInWeekdayModal
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                {selectedWeekdayData.sectorData.length === 1
                  ? (showOnly5PlusInWeekdayModal ? '显示全部个股' : '只显示涨幅大于10个股')
                  : (showOnly5PlusInWeekdayModal ? '显示全部板块' : '只显示≥5家板块')
                }
              </button>
            </div>

            {/* 左右分屏布局 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
              {/* 左侧：板块5日溢价数据表 */}
              <div className="bg-gray-50 rounded-lg p-4 overflow-hidden flex flex-col">
                <h4 className="text-lg font-semibold mb-4 text-gray-800">
                  {selectedWeekdayData.sectorData.length === 1
                    ? `📋 ${selectedWeekdayData.sectorData[0].sectorName}个股5日溢价数据表`
                    : '📋 板块5日溢价数据表'
                  }
                </h4>
                <div className="flex-1 overflow-auto">
                  <table className="w-full bg-white rounded-lg shadow-sm text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          {selectedWeekdayData.sectorData.length === 1 ? '个股名称' : '板块名称'}
                        </th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700">当日</th>
                        {(() => {
                          const followUpDates = selectedWeekdayData.sectorData.length > 0 && (selectedWeekdayData.sectorData[0] as any).chartData
                            ? (selectedWeekdayData.sectorData[0] as any).chartData.slice(0, 5).map((d: any) => d.date)
                            : [];
                          return followUpDates.map((date: string, index: number) => {
                            let formattedDate = '';
                            try {
                              const formatted = formatDate(date);
                              formattedDate = formatted ? formatted.slice(5) : `${index + 1}`;
                            } catch (error) {
                              formattedDate = `${index + 1}`;
                            }
                            return (
                              <th key={date} className="px-2 py-2 text-center font-semibold text-gray-700">
                                {formattedDate}
                              </th>
                            );
                          });
                        })()}
                        <th className="px-3 py-2 text-center font-semibold text-gray-700">累计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWeekdayData.sectorData.length === 1
                        ? (() => {
                            // 单板块模式：显示个股数据
                            const sector = selectedWeekdayData.sectorData[0];
                            const stocksData = (sector as any).stocksData || [];
                            const filteredStocks = stocksData.filter((stock: any) =>
                              showOnly5PlusInWeekdayModal ? stock.totalReturn > 10 : true
                            );

                            return filteredStocks.map((stock: any, index: number) => {
                              const chartData = stock.chartData || [];
                              return (
                                <tr key={stock.code} className={`border-t ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50`}>
                                  <td className="px-3 py-2 font-medium text-gray-900">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${
                                        index < 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' : 'bg-gray-200 text-gray-600'
                                      }`}>
                                        {index + 1}
                                      </span>
                                      <span
                                        className="truncate max-w-[120px] cursor-pointer hover:text-blue-600 hover:underline"
                                        title={`${stock.name} (${stock.code})`}
                                        onClick={() => handleStockClick(stock.name, stock.code)}
                                      >
                                        {stock.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${getPerformanceClass(stock.totalReturn)}`}>
                                      {stock.totalReturn.toFixed(1)}%
                                    </div>
                                  </td>
                                  {chartData.slice(0, 5).map((dayData: any, dayIndex: number) => (
                                    <td key={dayData.date || dayIndex} className="px-2 py-2 text-center">
                                      <div className={`px-2 py-1 rounded text-xs font-medium ${getPerformanceClass(dayData.value)}`}>
                                        {dayData.value.toFixed(1)}%
                                      </div>
                                    </td>
                                  ))}
                                  {/* 补齐空白列 */}
                                  {Array.from({ length: Math.max(0, 5 - chartData.length) }, (_, i) => (
                                    <td key={`empty-${i}`} className="px-2 py-2 text-center">
                                      <div className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-400">
                                        --
                                      </div>
                                    </td>
                                  ))}
                                  <td className="px-3 py-2 text-center">
                                    <div className={`px-2 py-1 rounded text-xs font-bold ${getPerformanceClass(
                                      stock.totalReturn + chartData.slice(0, 5).reduce((sum: number, d: any) => sum + d.value, 0)
                                    )}`}>
                                      {(stock.totalReturn + chartData.slice(0, 5).reduce((sum: number, d: any) => sum + d.value, 0)).toFixed(1)}%
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })()
                        : selectedWeekdayData.sectorData
                            .filter(sector => showOnly5PlusInWeekdayModal ? sector.stockCount >= 5 : true)
                            .map((sector, index) => {
                              const chartData = (sector as any).chartData || [];
                              return (
                                <tr key={sector.sectorName} className={`border-t ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50`}>
                                  <td className="px-3 py-2 font-medium text-gray-900">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${
                                        index < 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' : 'bg-gray-200 text-gray-600'
                                      }`}>
                                        {index + 1}
                                      </span>
                                      <span className="truncate max-w-[120px]" title={sector.sectorName}>
                                        {sector.sectorName}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${getPerformanceClass(sector.avgPremium)}`}>
                                      {sector.avgPremium.toFixed(1)}%
                                    </div>
                                  </td>
                                  {chartData.slice(0, 5).map((dayData: any, dayIndex: number) => (
                                    <td key={dayData.date || dayIndex} className="px-2 py-2 text-center">
                                      <div className={`px-2 py-1 rounded text-xs font-medium ${getPerformanceClass(dayData.avgPremium)}`}>
                                        {dayData.avgPremium.toFixed(1)}%
                                      </div>
                                    </td>
                                  ))}
                                  {/* 补齐空白列 */}
                                  {Array.from({ length: Math.max(0, 5 - chartData.length) }, (_, i) => (
                                    <td key={`empty-${i}`} className="px-2 py-2 text-center">
                                      <div className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-400">
                                        --
                                      </div>
                                    </td>
                                  ))}
                                  <td className="px-3 py-2 text-center">
                                    <div className={`px-2 py-1 rounded text-xs font-bold ${getPerformanceClass(
                                      sector.avgPremium + chartData.slice(0, 5).reduce((sum: number, d: any) => sum + d.avgPremium, 0)
                                    )}`}>
                                      {(sector.avgPremium + chartData.slice(0, 5).reduce((sum: number, d: any) => sum + d.avgPremium, 0)).toFixed(1)}%
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 右侧：板块/个股溢价趋势图 */}
              <div className="bg-gray-50 rounded-lg p-4 overflow-hidden flex flex-col">
                <h4 className="text-lg font-semibold mb-4 text-gray-800">
                  {selectedWeekdayData.sectorData.length === 1
                    ? `📈 ${selectedWeekdayData.sectorData[0].sectorName}个股溢价趋势图`
                    : '📊 板块溢价趋势对比图'
                  }
                </h4>
                <div className="flex-1">
                  <div style={{ width: '100%', height: '100%' }}>
                    <ResponsiveContainer>
                      <LineChart
                        data={(() => {
                          if (selectedWeekdayData.sectorData.length === 1) {
                            // 单板块模式：显示个股图表
                            const sector = selectedWeekdayData.sectorData[0];
                            const stocksData = (sector as any).stocksData || [];

                            // 筛选条件：只显示涨幅大于10的个股
                            const filteredStocks = stocksData.filter((stock: any) =>
                              showOnly5PlusInWeekdayModal ? stock.totalReturn > 10 : true
                            ).slice(0, 10); // 最多显示10只股票

                            if (filteredStocks.length === 0) return [];

                            // 找到所有日期
                            const allDates = new Set<string>();
                            filteredStocks.forEach((stock: any) => {
                              if (stock.chartData) {
                                stock.chartData.forEach((d: any) => allDates.add(d.date));
                              }
                            });

                            const sortedDates = Array.from(allDates).sort();

                            // 构建个股图表数据
                            const chartData = [
                              // 当日数据点
                              {
                                label: (() => {
                                  try {
                                    return formatDate(selectedWeekdayData.date).slice(5);
                                  } catch {
                                    return '当日';
                                  }
                                })(),
                                date: selectedWeekdayData.date,
                                ...Object.fromEntries(
                                  filteredStocks.map((stock: any) => [
                                    stock.name.length > 4 ? stock.name.slice(0, 4) : stock.name,
                                    stock.totalReturn
                                  ])
                                )
                              },
                              // 后续日期数据点
                              ...sortedDates.slice(0, 5).map((date, index) => ({
                                label: (() => {
                                  try {
                                    return formatDate(date).slice(5);
                                  } catch {
                                    return `日${index + 1}`;
                                  }
                                })(),
                                date: date,
                                ...Object.fromEntries(
                                  filteredStocks.map((stock: any) => {
                                    const dayData = stock.chartData?.find((d: any) => d.date === date);
                                    return [stock.name.length > 4 ? stock.name.slice(0, 4) : stock.name, dayData?.value || 0];
                                  })
                                )
                              }))
                            ];

                            return chartData;
                          } else {
                            // 多板块模式：显示板块对比图表
                            const filteredSectors = selectedWeekdayData.sectorData
                              .filter(sector => showOnly5PlusInWeekdayModal ? sector.stockCount >= 5 : true)
                              .slice(0, 10);

                            if (filteredSectors.length === 0) return [];

                            const allDates = new Set<string>();
                            filteredSectors.forEach(sector => {
                              if ((sector as any).chartData) {
                                (sector as any).chartData.forEach((d: any) => allDates.add(d.date));
                              }
                            });

                            const sortedDates = Array.from(allDates).sort();

                            const chartData = [
                              {
                                label: (() => {
                                  try {
                                    return formatDate(selectedWeekdayData.date).slice(5);
                                  } catch {
                                    return '当日';
                                  }
                                })(),
                                date: selectedWeekdayData.date,
                                ...Object.fromEntries(
                                  filteredSectors.map(sector => [
                                    sector.sectorName,
                                    sector.avgPremium
                                  ])
                                )
                              },
                              ...sortedDates.slice(0, 5).map((date, index) => ({
                                label: (() => {
                                  try {
                                    return formatDate(date).slice(5);
                                  } catch {
                                    return `日${index + 1}`;
                                  }
                                })(),
                                date: date,
                                ...Object.fromEntries(
                                  filteredSectors.map(sector => {
                                    const dayData = (sector as any).chartData?.find((d: any) => d.date === date);
                                    return [sector.sectorName, dayData?.avgPremium || 0];
                                  })
                                )
                              }))
                            ];

                            return chartData;
                          }
                        })()}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 12 }}
                          axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          label={{ value: '溢价(%)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 shadow-lg rounded border text-xs max-w-xs">
                                  <p className="text-gray-800 font-semibold mb-2">{label}</p>
                                  {payload.map((entry, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                      <span style={{ color: entry.color }} className="mr-2">
                                        {entry.dataKey}:
                                      </span>
                                      <span className="font-semibold">
                                        {entry.value?.toFixed(1)}%
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '10px' }}
                          iconType="line"
                        />

                        {/* 生成线条 */}
                        {selectedWeekdayData.sectorData.length === 1
                          ? (() => {
                              // 单板块模式：为每只个股生成一条线
                              const sector = selectedWeekdayData.sectorData[0];
                              const stocksData = (sector as any).stocksData || [];
                              const filteredStocks = stocksData.filter((stock: any) =>
                                showOnly5PlusInWeekdayModal ? stock.totalReturn > 10 : true
                              ).slice(0, 10);

                              const colors = [
                                '#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#9333ea',
                                '#c2410c', '#0891b2', '#be185d', '#4338ca', '#059669'
                              ];

                              return filteredStocks.map((stock: any, index: number) => (
                                <Line
                                  key={stock.code}
                                  type="monotone"
                                  dataKey={stock.name.length > 4 ? stock.name.slice(0, 4) : stock.name}
                                  stroke={colors[index % colors.length]}
                                  strokeWidth={2}
                                  dot={{ r: 3 }}
                                  activeDot={{ r: 5 }}
                                  connectNulls={false}
                                />
                              ));
                            })()
                          : selectedWeekdayData.sectorData
                              .filter(sector => showOnly5PlusInWeekdayModal ? sector.stockCount >= 5 : true)
                              .slice(0, 10)
                              .map((sector, index) => {
                                // 多板块模式：为每个板块生成一条线
                                const colors = [
                                  '#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#9333ea',
                                  '#c2410c', '#0891b2', '#be185d', '#4338ca', '#059669'
                                ];
                                return (
                                  <Line
                                    key={sector.sectorName}
                                    type="monotone"
                                    dataKey={sector.sectorName}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                    connectNulls={false}
                                  />
                                );
                              })
                        }
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 显示说明 */}
                <div className="mt-3 text-xs text-gray-500 text-center">
                  {selectedWeekdayData.sectorData.length === 1
                    ? (() => {
                        const sector = selectedWeekdayData.sectorData[0];
                        const stocksData = (sector as any).stocksData || [];
                        const filteredCount = stocksData.filter((stock: any) =>
                          showOnly5PlusInWeekdayModal ? stock.totalReturn > 10 : true
                        ).length;
                        return filteredCount > 10
                          ? `显示前10只个股，共${filteredCount}只`
                          : null;
                      })()
                    : selectedWeekdayData.sectorData.filter(sector => showOnly5PlusInWeekdayModal ? sector.stockCount >= 5 : true).length > 10 &&
                      `显示前10个板块，共${selectedWeekdayData.sectorData.filter(sector => showOnly5PlusInWeekdayModal ? sector.stockCount >= 5 : true).length}个`
                  }
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
          <div className="bg-white rounded-xl p-4 max-w-[98vw] max-h-[95vh] overflow-auto shadow-2xl">
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

            {/* 多列网格布局同时显示多个板块 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
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
                    <div key={sector.sectorName} className="bg-gray-50 rounded-lg p-3 h-fit">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 truncate">
                          📈 {sector.sectorName} ({sector.stocks.length})
                        </h4>
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          getPerformanceClass(sector.avgPremium)
                        }`}>
                          {sector.avgPremium.toFixed(1)}%
                        </div>
                      </div>

                      {/* 超紧凑表格显示 */}
                      <div className="overflow-x-auto max-h-[35vh] overflow-y-auto">
                        <table className="w-full text-[10px]">
                          <thead className="bg-white sticky top-0">
                            <tr className="border-b">
                              <th className="px-1 py-0.5 text-left font-semibold text-gray-700 w-16">名称</th>
                              {followUpDates.map((date, index) => {
                                let formattedDate = '';
                                try {
                                  const formatted = formatDate(date);
                                  formattedDate = formatted ? formatted.slice(5) : `${index + 1}`; // 显示月-日
                                } catch (error) {
                                  formattedDate = `${index + 1}`;
                                }
                                return (
                                  <th key={date} className="px-0.5 py-0.5 text-center font-semibold text-gray-700 w-10">
                                    {formattedDate}
                                  </th>
                                );
                              })}
                              <th className="px-1 py-0.5 text-center font-semibold text-gray-700 w-12">累计</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sector.stocks.map((stock, stockIndex) => ( // 显示所有股票
                              <tr key={stock.code} className={`border-b ${stockIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                                <td className="px-1 py-0.5">
                                  <div
                                    className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline text-[9px] leading-tight"
                                    onClick={() => handleStockClick(stock.name, stock.code)}
                                    title={`${stock.name} (${stock.code})`}
                                  >
                                    {stock.name.length > 4 ? stock.name.slice(0, 4) : stock.name}
                                  </div>
                                </td>
                                {followUpDates.map(date => {
                                  const performance = stock.followUpData[date] || 0;
                                  return (
                                    <td key={date} className="px-0.5 py-0.5 text-center">
                                      <div className={`px-0.5 py-0.5 rounded text-[8px] font-medium ${
                                        performance > 5 ? 'bg-red-500 text-white' :
                                        performance > 0 ? 'bg-red-100 text-red-800' :
                                        performance < -5 ? 'bg-green-500 text-white' :
                                        performance < 0 ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-600'
                                      }`}>
                                        {performance > 0 ? `+${performance.toFixed(0)}` : performance.toFixed(0)}
                                      </div>
                                    </td>
                                  );
                                })}
                                <td className="px-1 py-0.5 text-center">
                                  <div className={`px-1 py-0.5 rounded text-[9px] font-medium ${
                                    stock.totalReturn > 10 ? 'bg-red-600 text-white' :
                                    stock.totalReturn > 0 ? 'bg-red-100 text-red-800' :
                                    stock.totalReturn < -10 ? 'bg-green-600 text-white' :
                                    stock.totalReturn < 0 ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {stock.totalReturn > 0 ? `+${stock.totalReturn.toFixed(0)}` : stock.totalReturn.toFixed(0)}
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

      {/* 板块3天涨停排行弹窗 - 简化版 */}
      {showSectorRankingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-4 max-w-3xl max-h-[80vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                🏆 板块3天涨停排行 (前5名)
              </h3>
              <button
                onClick={closeSectorRankingModal}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* 紧凑排行表格 */}
            <div className="bg-white rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">排名</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">板块名称</th>
                    <th className="px-2 py-2 text-center font-semibold text-gray-700">总计</th>
                    {dates.slice(-3).map((date, index) => {
                      try {
                        const formattedDate = formatDate(date).slice(5);
                        return (
                          <th key={date} className="px-2 py-2 text-center font-semibold text-gray-700 text-xs">
                            {formattedDate}
                          </th>
                        );
                      } catch (error) {
                        return (
                          <th key={date} className="px-2 py-2 text-center font-semibold text-gray-700 text-xs">
                            D{index + 1}
                          </th>
                        );
                      }
                    })}
                  </tr>
                </thead>
                <tbody>
                  {getSectorStrengthRanking.map((sector, index) => (
                    <tr key={sector.name} className={`border-t ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50`}>
                      <td className="px-3 py-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md' :
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white shadow-sm' :
                          index === 2 ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white shadow-sm' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{sector.name}</div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-sm ${
                          index === 0 ? 'bg-red-100 text-red-700' :
                          index === 1 ? 'bg-orange-100 text-orange-700' :
                          index === 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {sector.totalLimitUpCount}只
                        </div>
                      </td>
                      {sector.dailyBreakdown.map((day, dayIndex) => (
                        <td key={day.date} className="px-2 py-2 text-center">
                          <div className={`inline-flex items-center justify-center w-8 h-8 rounded text-xs font-semibold ${
                            day.count >= 10 ? 'bg-red-500 text-white' :
                            day.count >= 5 ? 'bg-orange-500 text-white' :
                            day.count > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {day.count}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {getSectorStrengthRanking.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-sm">暂无数据</p>
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
              <span className="text-gray-700">只显示≥5个涨停的板块</span>
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
                    <div className="text-xs opacity-90">
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
              <li>• <span className="font-semibold">点击日期头部</span>: 左右分屏显示板块5日溢价数据表和趋势图</li>
              <li>• <span className="font-semibold">点击板块名称</span>: 显示该板块个股5日溢价表现（涨停数弹窗样式）</li>
              <li>• <span className="font-semibold">点击涨停数</span>: 多列显示各板块个股5日溢价，一屏查看所有数据</li>
              <li>• 点击"3天涨停排行"查看最近3天板块涨停数排名</li>
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