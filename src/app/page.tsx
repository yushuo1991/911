'use client';

import { useState, useEffect, useMemo } from 'react';
import { SevenDaysData, DayData, SectorSummary, StockPerformance } from '@/types/stock';
import { getPerformanceClass, getPerformanceColorClass, getTodayString, formatDate, getBoardWeight } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StockPremiumChart, { StockPremiumData } from '@/components/StockPremiumChart';
import { transformSectorStocksToChartData } from '@/lib/chartHelpers';

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
  const [selectedDateData, setSelectedDateData] = useState<{date: string, sectorData: { sectorName: string; avgPremiumByDay: Record<string, number>; stockCount: number; total5DayPremium: number; }[]} | null>(null);
  const [showSectorRankingModal, setShowSectorRankingModal] = useState(false);
  const [showOnly5PlusInDateModal, setShowOnly5PlusInDateModal] = useState(true);
  const [showWeekdayModal, setShowWeekdayModal] = useState(false);
  const [selectedWeekdayData, setSelectedWeekdayData] = useState<{date: string, sectorData: { sectorName: string; avgPremium: number; stockCount: number; }[], chartData?: { date: string; avgPremium: number; stockCount: number; }[]} | null>(null);
  const [showStockCountModal, setShowStockCountModal] = useState(false);
  const [selectedStockCountData, setSelectedStockCountData] = useState<{date: string, sectorData: { sectorName: string; stocks: any[]; avgPremium: number; }[]} | null>(null);
  const [showOnly5PlusInStockCountModal, setShowOnly5PlusInStockCountModal] = useState(true);
  const [show7DayLadderModal, setShow7DayLadderModal] = useState(false);
  const [selected7DayLadderData, setSelected7DayLadderData] = useState<{sectorName: string, dailyBreakdown: {date: string, stocks: StockPerformance[]}[]} | null>(null);
  // 新增：日期列详情弹窗状态
  const [showDateColumnDetail, setShowDateColumnDetail] = useState(false);
  const [selectedDateColumnData, setSelectedDateColumnData] = useState<{date: string, stocks: StockPerformance[], followUpData: Record<string, Record<string, number>>} | null>(null);
  // 新增：板块弹窗筛选状态
  const [showOnly10PlusInSectorModal, setShowOnly10PlusInSectorModal] = useState(false);
  // 新增：板块弹窗排序模式（需求3）
  const [sectorModalSortMode, setSectorModalSortMode] = useState<'board' | 'return'>('board');
  // 新增：独立K线弹窗状态
  const [showKlineModal, setShowKlineModal] = useState(false);
  const [klineModalData, setKlineModalData] = useState<{sectorName: string, date: string, stocks: StockPerformance[]} | null>(null);
  const [klineModalPage, setKlineModalPage] = useState(0);
  // 新增：独立分时图弹窗状态
  const [showMinuteModal, setShowMinuteModal] = useState(false);
  const [minuteModalData, setMinuteModalData] = useState<{sectorName: string, date: string, stocks: StockPerformance[]} | null>(null);
  const [minuteModalPage, setMinuteModalPage] = useState(0);

  // generate7TradingDays 函数已移除
  // 现在从API获取真实交易日列表（API内部使用Tushare交易日历，已排除节假日）

  // v4.8.19新增：获取板块成交额排名
  const getSectorAmountRank = (date: string, sectorName: string): number | null => {
    const dayData = sevenDaysData?.[date];
    if (!dayData || !dayData.sectorAmounts) return null;

    // 获取所有板块的成交额，并排序
    const sectorAmounts = Object.entries(dayData.sectorAmounts)
      .map(([name, amount]) => ({ name, amount }))
      .filter(s => s.amount > 0)
      .sort((a, b) => b.amount - a.amount); // 按成交额降序

    // 找到当前板块的排名（1开始）
    const rank = sectorAmounts.findIndex(s => s.name === sectorName);
    return rank !== -1 ? rank + 1 : null;
  };

  // v4.8.19新增：获取板块内个股成交额排名
  const getStockAmountRankInSector = (stocks: StockPerformance[], stockCode: string): number | null => {
    // 获取所有有成交额数据的个股，并按成交额降序排序
    const stocksWithAmount = stocks
      .filter(s => s.amount && s.amount > 0)
      .sort((a, b) => (b.amount || 0) - (a.amount || 0));

    // 找到当前个股的排名（1开始）
    const rank = stocksWithAmount.findIndex(s => s.code === stockCode);
    return rank !== -1 ? rank + 1 : null;
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

  // 处理板块点击显示弹窗 - 显示该板块个股梯队（新：分屏布局，左侧图表，右侧表格）
  const handleSectorClick = (date: string, sectorName: string, stocks: StockPerformance[], followUpData: Record<string, Record<string, number>>) => {
    setSelectedSectorData({
      name: sectorName,
      date: date,
      stocks: stocks,
      followUpData: followUpData
    });
    setShowSectorModal(true);
  };

  // 处理日期点击 - 需求2：显示当天涨停个股数前5名板块
  const handleDateClick = (date: string) => {
    const dayData = sevenDaysData?.[date];
    if (!dayData || !dates) return;

    // 找到当前日期在dates数组中的位置
    const currentDateIndex = dates.indexOf(date);
    if (currentDateIndex === -1) return;

    // 获取次日起5个交易日
    const next5Days = dates.slice(currentDateIndex + 1, currentDateIndex + 6);
    if (next5Days.length === 0) {
      console.warn('[handleDateClick] 没有后续交易日数据');
      // v4.8.25优化：即使没有后续数据，也显示当天板块信息
      // 不再直接返回，而是继续显示当天板块（后续数据为空）
    }

    // 按板块组织数据，计算每个板块在后续5天的平均溢价
    const sectorData: { sectorName: string; avgPremiumByDay: Record<string, number>; stockCount: number; total5DayPremium: number; }[] = [];

    Object.entries(dayData.categories).forEach(([sectorName, stocks]) => {
      const avgPremiumByDay: Record<string, number> = {};
      let total5DayPremium = 0;

      // 对于后续的每一天，计算该板块的平均溢价
      next5Days.forEach(futureDate => {
        let totalPremium = 0;
        let validStockCount = 0;

        stocks.forEach(stock => {
          const followUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
          if (followUpData[futureDate] !== undefined) {
            totalPremium += followUpData[futureDate];
            validStockCount++;
          }
        });

        const avgPremium = validStockCount > 0 ? totalPremium / validStockCount : 0;
        avgPremiumByDay[futureDate] = avgPremium;
        total5DayPremium += avgPremium;
      });

      sectorData.push({
        sectorName,
        avgPremiumByDay,
        stockCount: stocks.length,
        total5DayPremium
      });
    });

    // 需求2修改：过滤掉"其他"和"ST板块"，按当天涨停个股数降序排序，取前5名
    const top5Sectors = sectorData
      .filter(sector => sector.sectorName !== '其他' && sector.sectorName !== 'ST板块')
      .sort((a, b) => b.stockCount - a.stockCount)
      .slice(0, 5);

    setSelectedDateData({ date, sectorData: top5Sectors });
    setShowDateModal(true);
  };

  // 处理涨停数点击显示当天所有个股按板块分组
  const handleStockCountClick = (date: string) => {
    const dayData = sevenDaysData?.[date];
    if (!dayData) return;

    // 按板块组织数据，按板块涨停数排序，板块内按状态优先、涨停时间次要排序
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

      // v4.8.25修复：板块内个股按状态优先、涨停时间次要排序
      sectorStocks.sort((a, b) => {
        const aBoardWeight = getBoardWeight(a.td_type);
        const bBoardWeight = getBoardWeight(b.td_type);
        
        // 首要条件：按状态排序
        if (aBoardWeight !== bBoardWeight) {
          return bBoardWeight - aBoardWeight; // 降序排列，高板在前
        }
        
        // 次要条件：状态相同时，按涨停时间排序（越早越在前）
        const aTime = a.limitUpTime || '23:59';
        const bTime = b.limitUpTime || '23:59';
        return aTime.localeCompare(bTime); // 时间升序，早的在前
      });

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

  // 处理排行榜徽章点击 - 显示该板块的7天涨停阶梯
  const handleRankingBadgeClick = (sectorName: string) => {
    if (!sevenDaysData || !dates) return;

    // 收集该板块在7天内每天的涨停个股（v4.8.7修复：显示所有7天，即使某天没有涨停个股）
    const dailyBreakdown: {date: string, stocks: StockPerformance[]}[] = [];

    dates.forEach(date => {
      const dayData = sevenDaysData[date];
      // v4.8.7修复：即使该日期没有该板块的涨停个股，也显示该日期（stocks为空数组）
      dailyBreakdown.push({
        date,
        stocks: (dayData && dayData.categories[sectorName]) ? dayData.categories[sectorName] : []
      });
    });

    setSelected7DayLadderData({
      sectorName,
      dailyBreakdown
    });
    setShow7DayLadderModal(true);
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

  const close7DayLadderModal = () => {
    setShow7DayLadderModal(false);
    setSelected7DayLadderData(null);
  };

  const closeDateColumnDetail = () => {
    setShowDateColumnDetail(false);
    setSelectedDateColumnData(null);
  };

  // 打开独立K线弹窗
  const handleOpenKlineModal = (sectorName: string, date: string, stocks: StockPerformance[]) => {
    setKlineModalData({
      sectorName,
      date,
      stocks
    });
    setKlineModalPage(0); // 重置页码
    setShowKlineModal(true);
  };

  // 关闭独立K线弹窗
  const closeKlineModal = () => {
    setShowKlineModal(false);
    setKlineModalData(null);
    setKlineModalPage(0);
  };

  // 打开独立分时图弹窗
  const handleOpenMinuteModal = (sectorName: string, date: string, stocks: StockPerformance[]) => {
    setMinuteModalData({
      sectorName,
      date,
      stocks
    });
    setMinuteModalPage(0); // 重置页码
    setShowMinuteModal(true);
  };

  // 关闭独立分时图弹窗
  const closeMinuteModal = () => {
    setShowMinuteModal(false);
    setMinuteModalData(null);
    setMinuteModalPage(0);
  };

  // 处理日期列点击 - 显示该日期个股的后续5天溢价详情
  const handleDateColumnClick = (date: string, stocks: StockPerformance[], sectorName: string) => {
    const dayData = sevenDaysData?.[date];
    if (!dayData || !dates) return;

    // 获取该日期在dates数组中的索引
    const currentDateIndex = dates.indexOf(date);
    if (currentDateIndex === -1) return;

    // 获取后续5天
    const next5Days = dates.slice(currentDateIndex + 1, currentDateIndex + 6);

    // 构建followUpData
    const followUpData: Record<string, Record<string, number>> = {};
    stocks.forEach(stock => {
      const stockFollowUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
      followUpData[stock.code] = {};
      next5Days.forEach(futureDate => {
        if (stockFollowUpData[futureDate] !== undefined) {
          followUpData[stock.code][futureDate] = stockFollowUpData[futureDate];
        }
      });
    });

    setSelectedDateColumnData({
      date,
      stocks,
      followUpData
    });
    setShowDateColumnDetail(true);
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

  // 获取展开的股票数据 - 需求3：支持按连板数或累计收益排序
  const getSortedStocksForSector = (
    stocks: StockPerformance[],
    followUpData: Record<string, Record<string, number>>,
    sortMode: 'board' | 'return' = 'board'
  ) => {
    return [...stocks].sort((a, b) => {
      if (sortMode === 'board') {
        // v4.8.24新增：状态为主，涨停时间为辅的复合排序
        const aBoardWeight = getBoardWeight(a.td_type);
        const bBoardWeight = getBoardWeight(b.td_type);

        // 首要条件：按状态排序
        if (aBoardWeight !== bBoardWeight) {
          return bBoardWeight - aBoardWeight; // 降序排列，高板在前
        }

        // 次要条件：状态相同时，按涨停时间排序（越早越在前）
        const aTime = a.limitUpTime || '23:59'; // 默认最晚时间
        const bTime = b.limitUpTime || '23:59';

        // 时间格式：HH:MM，比较数值大小
        return aTime.localeCompare(bTime); // 时间升序，早的在前

      } else {
        // 按累计收益排序
        const aFollowUp = followUpData[a.code] || {};
        const bFollowUp = followUpData[b.code] || {};
        const aTotalReturn = Object.values(aFollowUp).reduce((sum, val) => sum + val, 0);
        const bTotalReturn = Object.values(bFollowUp).reduce((sum, val) => sum + val, 0);
        return bTotalReturn - aTotalReturn; // 降序排列
      }
    });
  };

  // 计算板块最近7天涨停家数排序（前5名）- 修改为7天
  const getSectorStrengthRanking = useMemo(() => {
    if (!sevenDaysData || !dates) return [];

    // 使用全部7天数据
    const recent7Days = dates;

    if (recent7Days.length === 0) return [];

    const sectorCountMap: Record<string, { name: string; totalLimitUpCount: number; dailyBreakdown: { date: string; count: number }[] }> = {};

    // v4.8.24新增：确保所有板块在7天中都有记录，没有涨停时记录为0
    // 首先收集所有出现过的板块名称
    const allSectorNames = new Set<string>();
    recent7Days.forEach(date => {
      const dayData = sevenDaysData[date];
      if (dayData && dayData.categories) {
        Object.keys(dayData.categories).forEach(sectorName => {
          // 排除"其他"板块和"ST板块"
          if (sectorName !== '其他' && sectorName !== 'ST板块') {
            allSectorNames.add(sectorName);
          }
        });
      }
    });

    // 为每个板块初始化统计
    allSectorNames.forEach(sectorName => {
      sectorCountMap[sectorName] = {
        name: sectorName,
        totalLimitUpCount: 0,
        dailyBreakdown: []
      };
    });

    // 统计最近7天每个板块的涨停家数
    recent7Days.forEach(date => {
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

  // v4.8.24新增：准备板块曲线图数据
  const prepareSectorChartData = useMemo(() => {
    if (!sevenDaysData || !dates || dates.length === 0) return [];

    // 获取所有出现过的板块名称
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

    // 为曲线图准备数据
    const chartData = Array.from(allSectorNames).map(sectorName => {
      const dataPoint: any = { name: sectorName };

      // 为每个日期添加数据
      dates.forEach(date => {
        const dayData = sevenDaysData[date];
        const count = (dayData?.categories[sectorName] || []).length;
        dataPoint[date] = count;
      });

      return dataPoint;
    });

    return chartData;
  }, [sevenDaysData, dates]);

  // 骨架屏组件 - 修复用户看不到功能的问题
  const SkeletonScreen = () => (
    <div className="min-h-screen bg-gray-50 p-3">
      {/* Loading Toast */}
      <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        <span className="text-xs">正在加载7天数据...</span>
      </div>

      {/* 页面标题和控制骨架 */}
      <div className="max-w-full mx-auto mb-4">
        <div className="flex justify-between items-center bg-white rounded-lg shadow-sm p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
            {/* Top 5徽章占位 */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* 7天网格骨架 */}
      <div className="grid grid-cols-7 gap-2">
        {[...Array(7)].map((_, dayIndex) => (
          <div key={dayIndex} className="space-y-2">
            {/* 日期头骨架 */}
            <div className="bg-white rounded-lg shadow-sm p-2">
              <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
            </div>
            {/* 板块卡片骨架 */}
            {[...Array(3)].map((_, cardIndex) => (
              <div key={cardIndex} className="bg-white rounded-lg shadow-sm p-2 space-y-1">
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  // 如果正在加载，显示骨架屏而不是完全阻塞UI
  if (loading) {
    return <SkeletonScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      {/* 板块个股梯队弹窗 - 新：分屏布局 */}
      {showSectorModal && selectedSectorData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60]">
          <div className="bg-white rounded-xl p-4 max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                📊 {selectedSectorData.name} - 个股梯队详情 ({formatDate(selectedSectorData.date)})
              </h3>
              <button
                onClick={closeSectorModal}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-2 flex justify-between items-center">
              <div className="text-2xs text-gray-600">
                共 {selectedSectorData.stocks.length} 只个股，按{sectorModalSortMode === 'board' ? '连板数' : '5日累计溢价'}排序
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const sortedStocks = getSortedStocksForSector(
                      selectedSectorData.stocks,
                      selectedSectorData.followUpData,
                      sectorModalSortMode
                    );
                    handleOpenMinuteModal(selectedSectorData.name, selectedSectorData.date, sortedStocks);
                  }}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
                >
                  📊 今日分时
                </button>
                <button
                  onClick={() => {
                    const sortedStocks = getSortedStocksForSector(
                      selectedSectorData.stocks,
                      selectedSectorData.followUpData,
                      sectorModalSortMode
                    );
                    handleOpenKlineModal(selectedSectorData.name, selectedSectorData.date, sortedStocks);
                  }}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                >
                  📈 显示K线
                </button>
                <button
                  onClick={() => setShowOnly10PlusInSectorModal(!showOnly10PlusInSectorModal)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    showOnly10PlusInSectorModal
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  {showOnly10PlusInSectorModal ? '显示全部个股' : '显示涨幅>10%'}
                </button>
              </div>
            </div>

            {/* 分屏布局：左侧图表40%，右侧表格60% */}
            <div className="flex-1 flex gap-4 overflow-hidden">
              {/* 左侧：图表 */}
              <div className="w-2/5 border-r pr-4 overflow-auto">
                <h4 className="text-sm font-semibold mb-3 text-gray-800">📈 个股5天溢价趋势</h4>
                <div className="h-64">
                  <StockPremiumChart
                    data={transformSectorStocksToChartData(
                      // 需求：图表联动过滤 - 根据showOnly10PlusInSectorModal过滤股票
                      getSortedStocksForSector(selectedSectorData.stocks, selectedSectorData.followUpData, sectorModalSortMode)
                        .filter(stock => {
                          if (!showOnly10PlusInSectorModal) return true;
                          const totalReturn = Object.values(selectedSectorData.followUpData[stock.code] || {}).reduce((sum, val) => sum + val, 0);
                          return totalReturn > 10;
                        }),
                      selectedSectorData.followUpData,
                      50, // 增加maxStocks限制，确保所有过滤后的股票都显示
                      (() => {
                        // 计算后续5天的日期数组，确保图表日期顺序正确
                        const currentDateIndex = dates.indexOf(selectedSectorData.date);
                        return currentDateIndex !== -1 ? dates.slice(currentDateIndex + 1, currentDateIndex + 6) : [];
                      })()
                    )}
                    config={{ height: 256, maxStocks: 50, showDailyMax: true }}
                  />
                </div>
              </div>

              {/* 右侧：表格 */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white border-b-2">
                    <tr>
                      <th className="px-2 py-1.5 text-left text-2xs font-semibold text-gray-700">#</th>
                      <th className="px-2 py-1.5 text-left text-2xs font-semibold text-gray-700">股票</th>
                      <th className="px-2 py-1.5 text-center text-2xs font-semibold text-gray-700">板数</th>
                      <th className="px-2 py-1.5 text-center text-2xs font-semibold text-gray-700">成交额</th>
                      {(() => {
                        // 使用dates数组确保日期正确排序
                        const currentDateIndex = dates.indexOf(selectedSectorData.date);
                        const followUpDates = currentDateIndex !== -1 ? dates.slice(currentDateIndex + 1, currentDateIndex + 6) : [];
                        return followUpDates.map((followDate, index) => {
                          const formattedDate = formatDate(followDate).slice(5);
                          return (
                            <th key={followDate} className="px-2 py-1.5 text-center text-2xs font-semibold text-gray-700">
                              {formattedDate}
                            </th>
                          );
                        });
                      })()}
                      <th className="px-2 py-1.5 text-center text-2xs font-semibold text-gray-700">累计</th>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <th colSpan={4} className="px-2 py-1 text-right text-2xs text-blue-700">板块平均:</th>
                      {(() => {
                        // 使用dates数组确保日期正确排序
                        const currentDateIndex = dates.indexOf(selectedSectorData.date);
                        const followUpDates = currentDateIndex !== -1 ? dates.slice(currentDateIndex + 1, currentDateIndex + 6) : [];
                        return followUpDates.map((followDate) => {
                          let totalPremium = 0;
                          let validCount = 0;
                          selectedSectorData.stocks.forEach(stock => {
                            const performance = selectedSectorData.followUpData[stock.code]?.[followDate];
                            if (performance !== undefined) {
                              totalPremium += performance;
                              validCount++;
                            }
                          });
                          const avgPremium = validCount > 0 ? totalPremium / validCount : 0;
                          return (
                            <th key={followDate} className="px-2 py-1 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getPerformanceClass(avgPremium)}`}>
                                {avgPremium.toFixed(1)}%
                              </span>
                            </th>
                          );
                        });
                      })()}
                      <th className="px-2 py-1 text-center">
                        <span className="px-1.5 py-0.5 rounded text-2xs font-medium bg-blue-100 text-blue-700">
                          {(() => {
                            let totalAll = 0;
                            let countAll = 0;
                            selectedSectorData.stocks.forEach(stock => {
                              const stockTotal = Object.values(selectedSectorData.followUpData[stock.code] || {}).reduce((sum, val) => sum + val, 0);
                              totalAll += stockTotal;
                              countAll++;
                            });
                            return countAll > 0 ? (totalAll / countAll).toFixed(1) : '0.0';
                          })()}%
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedStocksForSector(selectedSectorData.stocks, selectedSectorData.followUpData, sectorModalSortMode)
                      .filter(stock => {
                        if (!showOnly10PlusInSectorModal) return true;
                        const totalReturn = Object.values(selectedSectorData.followUpData[stock.code] || {}).reduce((sum, val) => sum + val, 0);
                        return totalReturn > 10;
                      })
                      .map((stock, index) => {
                        // 使用dates数组确保日期正确排序
                        const currentDateIndex = dates.indexOf(selectedSectorData.date);
                        const followUpDates = currentDateIndex !== -1 ? dates.slice(currentDateIndex + 1, currentDateIndex + 6) : [];
                        const totalReturn = Object.values(selectedSectorData.followUpData[stock.code] || {}).reduce((sum, val) => sum + val, 0);
                        return (
                          <tr key={stock.code} className="border-b hover:bg-primary-50 transition">
                            <td className="px-2 py-1.5 text-2xs text-gray-400">#{index + 1}</td>
                            <td className="px-2 py-1.5">
                              <button
                                className="text-primary-600 hover:text-primary-700 font-medium hover:underline text-xs"
                                onClick={() => handleStockClick(stock.name, stock.code)}
                              >
                                {stock.name}
                              </button>
                              <span className="text-2xs text-gray-400 ml-1">({stock.code})</span>
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <span className={`text-2xs font-medium ${
                                stock.td_type.includes('3') || stock.td_type.includes('4') || stock.td_type.includes('5') || stock.td_type.includes('6') || stock.td_type.includes('7') || stock.td_type.includes('8') || stock.td_type.includes('9') || stock.td_type.includes('10') ? 'text-red-600' :
                                stock.td_type.includes('2') ? 'text-orange-600' :
                                'text-gray-600'
                              }`}>
                                {stock.td_type.replace('连板', '板')}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              {(() => {
                                // v4.8.19新增：个股成交额前2名红色高亮
                                if (!stock.amount || stock.amount === 0) {
                                  return <span className="text-2xs text-gray-700">-</span>;
                                }

                                // 获取该个股在板块内的成交额排名
                                const rank = getStockAmountRankInSector(selectedSectorData.stocks, stock.code);

                                // 根据排名选择颜色
                                let colorClass = 'text-2xs text-gray-700'; // 默认灰色
                                if (rank === 1) {
                                  colorClass = 'text-2xs px-1.5 py-0.5 rounded bg-stock-orange-600 text-white font-semibold'; // 第1名：深橙色 #E9573F
                                } else if (rank === 2) {
                                  colorClass = 'text-2xs px-1.5 py-0.5 rounded bg-stock-orange-400 text-white font-medium'; // 第2名：中橙色 #F4A261
                                }

                                return (
                                  <span
                                    className={colorClass}
                                    title={rank ? `个股成交额排名: 第${rank}名` : ''}
                                  >
                                    {stock.amount.toFixed(2)}亿
                                  </span>
                                );
                              })()}
                            </td>
                            {followUpDates.slice(0, 5).map((followDate, dayIndex) => {
                              const performance = selectedSectorData.followUpData[stock.code]?.[followDate] || 0;
                              return (
                                <td key={followDate || `day-${dayIndex}`} className="px-2 py-1.5 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getPerformanceClass(performance)}`}>
                                    {performance.toFixed(1)}%
                                  </span>
                                </td>
                              );
                            })}
                            <td className="px-2 py-1.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${getPerformanceClass(totalReturn)}`}>
                                {totalReturn.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 星期几板块平均溢价弹窗 */}
      {showWeekdayModal && selectedWeekdayData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-4 max-w-5xl max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
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
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* 板块溢价数据表格 */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-semibold mb-3 text-gray-800">📋 板块平均溢价数据表</h4>
                <div className="overflow-x-auto">
                  <table className="w-full bg-white rounded-lg shadow-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700">排名</th>
                        <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700">板块名称</th>
                        <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-700">涨停个股数</th>
                        <th className="px-2 py-1.5 text-right text-xs font-semibold text-gray-700">平均溢价</th>
                        <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-700">表现等级</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWeekdayData.sectorData.map((sector, index) => (
                        <tr key={sector.sectorName} className={`border-t ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                          <td className="px-2 py-1.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              index < 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="font-medium text-gray-900 text-xs">{sector.sectorName}</div>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium ${
                              sector.stockCount >= 5
                                ? 'bg-green-100 text-green-800'
                                : sector.stockCount > 0
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}>
                              {sector.stockCount} 只
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              getPerformanceClass(sector.avgPremium)
                            }`}>
                              {sector.avgPremium.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <span className="text-xl">
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {selectedWeekdayData.sectorData.length}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">活跃板块数</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-600">
                    {selectedWeekdayData.sectorData.reduce((sum, s) => sum + s.stockCount, 0)}
                  </div>
                  <div className="text-xs text-green-700 mt-1">总涨停数</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-600">
                    {selectedWeekdayData.sectorData.length > 0 ? Math.max(...selectedWeekdayData.sectorData.map(s => s.avgPremium)).toFixed(1) : 0}%
                  </div>
                  <div className="text-xs text-purple-700 mt-1">最高溢价</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-orange-600">
                    {selectedWeekdayData.sectorData.length > 0 ? (selectedWeekdayData.sectorData.reduce((sum, s) => sum + s.avgPremium, 0) / selectedWeekdayData.sectorData.length).toFixed(1) : 0}%
                  </div>
                  <div className="text-xs text-orange-700 mt-1">平均溢价</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 日期所有个股溢价弹窗 - 新逻辑：显示板块名称和后续5天平均溢价，左右分栏布局 */}
      {showDateModal && selectedDateData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-[98vw] max-w-[98vw] max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                📈 {(() => {
                  try {
                    return formatDate(selectedDateData.date);
                  } catch (error) {
                    console.warn('[日期弹窗] 标题日期格式化失败:', selectedDateData.date, error);
                    return selectedDateData.date;
                  }
                })()} - 板块后续5天平均溢价
              </h3>
              <button
                onClick={closeDateModal}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 bg-blue-50 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">📊 统计说明</h4>
              <p className="text-blue-700 text-xs">
                共 {selectedDateData.sectorData.length} 个板块（涨停数前5名），展示后续5个交易日的平均溢价走势
              </p>
            </div>

            {/* 左右分栏布局 - v4.8.25优化：调整比例为左侧图表55%，右侧表格45% */}
            <div className="flex-1 flex gap-6 overflow-hidden">
              {/* 左侧：板块溢价趋势图 - v4.8.25优化：增加最小高度确保显示效果 */}
              <div className="w-[55%] bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 flex flex-col min-h-[400px]">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  <span>板块后续5天溢价趋势图</span>
                </h4>
                <div className="flex-1 bg-white rounded-lg p-4 shadow-inner min-h-[300px]">
                  {(() => {
                    // 检查是否有后续数据
                    const dates = Object.keys(selectedDateData.sectorData[0]?.avgPremiumByDay || {});
                    if (dates.length === 0) {
                      return (
                        <div className="h-full flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <p className="text-sm">📊 暂无后续交易日数据</p>
                            <p className="text-xs mt-2">该日期之后没有可用的交易数据</p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={dates.map((date, index) => {
                            const dataPoint: any = { date: formatDate(date).slice(5) || `T+${index + 1}` };
                            selectedDateData.sectorData.forEach(sector => {
                              dataPoint[sector.sectorName] = sector.avgPremiumByDay[date] || 0;
                            });
                            return dataPoint;
                          })}
                          margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        stroke="#9ca3af"
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        stroke="#9ca3af"
                        label={{ value: '平均溢价（%）', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value: any, name: string) => [`${value}%`, name]}
                        labelStyle={{ fontWeight: 'bold', color: '#1f2937' }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                        iconType="line"
                      />
                      {selectedDateData.sectorData.map((sector, index) => {
                        const colors = [
                          '#10b981', // 绿色 (第1名)
                          '#3b82f6', // 蓝色 (第2名)
                          '#f59e0b', // 金色 (第3名)
                          '#8b5cf6', // 紫色 (第4名)
                          '#ec4899', // 粉色 (第5名)
                        ];
                        return (
                          <Line
                            key={sector.sectorName}
                            type="monotone"
                            dataKey={sector.sectorName}
                            stroke={colors[index]}
                            strokeWidth={3}
                            dot={{ fill: colors[index], strokeWidth: 2, r: 5 }}
                            activeDot={{ r: 7 }}
                            name={sector.sectorName}
                            label={(props: any) => {
                              // v4.8.25新增：为每天的最高点标注板块名称
                              // 找出当天所有板块中的最高值
                              const dateIndex = props.index;
                              const currentDate = dates[dateIndex];
                              if (!currentDate) return null;
                              
                              // 计算当天所有板块的溢价
                              const dayValues = selectedDateData.sectorData.map(s => ({
                                name: s.sectorName,
                                value: s.avgPremiumByDay[currentDate] || 0
                              }));
                              
                              // 找到最大值及对应的板块
                              const maxItem = dayValues.reduce((max, item) => 
                                item.value > max.value ? item : max
                              , dayValues[0]);
                              
                              // 只在该板块是最高值时显示标签
                              if (maxItem.name === sector.sectorName && maxItem.value > 0) {
                                return (
                                  <text
                                    x={props.x}
                                    y={props.y - 15}
                                    fill={colors[index]}
                                    fontSize={11}
                                    fontWeight="bold"
                                    textAnchor="middle"
                                  >
                                    {sector.sectorName}
                                  </text>
                                );
                              }
                              return null;
                            }}
                          />
                        );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  );
                  })()}
                </div>
                <p className="text-xs text-gray-600 mt-3 text-center">
                  💡 数据说明：展示前5名板块后续5个交易日的平均溢价变化趋势
                </p>
              </div>

              {/* 右侧：板块溢价数据表格 - v4.8.25优化：调整宽度为45% */}
              <div className="w-[45%] overflow-auto pr-2">
                {(() => {
                  const dates = Object.keys(selectedDateData.sectorData[0]?.avgPremiumByDay || {});
                  if (dates.length === 0) {
                    return (
                      <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                        <div className="text-center p-6">
                          <p className="text-sm font-medium mb-2">📋 当日板块概览</p>
                          <div className="text-xs text-left space-y-2 mt-4">
                            {selectedDateData.sectorData.map((sector, index) => (
                              <div key={sector.sectorName} className="flex items-center justify-between bg-white p-2 rounded border">
                                <span className="font-semibold">{index + 1}. {sector.sectorName}</span>
                                <span className="text-gray-600">{sector.stockCount} 只</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-white border-b-2">
                          <tr>
                            <th className="px-2 py-1.5 text-left text-2xs font-semibold text-gray-700">排名</th>
                            <th className="px-2 py-1.5 text-left text-2xs font-semibold text-gray-700">板块名称</th>
                            <th className="px-2 py-1.5 text-center text-2xs font-semibold text-gray-700">个股数</th>
                            {dates.map((date, index) => {
                          let formattedDate = '';
                          try {
                            const formatted = formatDate(date);
                            formattedDate = formatted ? formatted.slice(5) : `T+${index + 1}`;
                          } catch (error) {
                            formattedDate = `T+${index + 1}`;
                          }
                          return (
                            <th key={date} className="px-2 py-1.5 text-center text-2xs font-semibold text-gray-700">
                              {formattedDate}
                            </th>
                          );
                        })}
                        <th className="px-2 py-1.5 text-center text-2xs font-semibold text-gray-700">总和</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDateData.sectorData.map((sector, index) => (
                        <tr key={sector.sectorName} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-primary-50`}>
                          <td className="px-2 py-1.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg' :
                              index === 1 ? 'bg-gradient-to-r from-blue-300 to-blue-400 text-white shadow-md' :
                              index === 2 ? 'bg-gradient-to-r from-yellow-300 to-yellow-400 text-white shadow-md' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-2 py-1.5 font-semibold text-sm text-gray-900">{sector.sectorName}</td>
                          <td className="px-2 py-1.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              sector.stockCount >= 5 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {sector.stockCount}
                            </span>
                          </td>
                          {Object.entries(sector.avgPremiumByDay).map(([date, avgPremium]) => (
                            <td key={date} className="px-2 py-1.5 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getPerformanceColorClass(avgPremium)}`}>
                                {avgPremium.toFixed(1)}%
                              </span>
                            </td>
                          ))}
                          <td className="px-2 py-1.5 text-center">
                            <span className={`px-2.5 py-1 rounded text-sm font-semibold ${getPerformanceColorClass(sector.total5DayPremium || 0)}`}>
                              {(sector.total5DayPremium || 0).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 涨停数弹窗 - 按板块分组显示个股溢价 */}
      {showStockCountModal && selectedStockCountData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-2 w-auto min-w-[95vw] max-w-[98vw] max-h-[95vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-1.5 pb-1.5 border-b border-gray-200">
              <h3 className="text-xs font-bold text-gray-900">
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
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-1 flex justify-between items-center">
              <div className="text-[9px] text-gray-600">
                共 {selectedStockCountData.sectorData
                  .filter(sector => {
                    // ≥5家模式：过滤≥5家的板块，且强制过滤"其他"和"ST板块"
                    if (showOnly5PlusInStockCountModal) {
                      if (sector.sectorName === '其他' || sector.sectorName === 'ST板块') {
                        return false; // 强制过滤
                      }
                      return sector.stocks.length >= 5;
                    }
                    // 显示全部模式：显示所有板块（包括"其他"和"ST板块"）
                    return true;
                  })
                  .reduce((total, sector) => total + sector.stocks.length, 0)} 只涨停个股，按板块分组显示
              </div>
              <button
                onClick={() => setShowOnly5PlusInStockCountModal(!showOnly5PlusInStockCountModal)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors ${
                  showOnly5PlusInStockCountModal
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                {showOnly5PlusInStockCountModal ? '显示全部板块' : '只显示≥5家板块'}
              </button>
            </div>

            {/* 按板块分组显示 - 3-4列网格布局，极致压缩 */}
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-1 max-h-[85vh] overflow-y-auto">
              {selectedStockCountData.sectorData
                .filter(sector => {
                  // ≥5家模式：过滤≥5家的板块，且强制过滤"其他"和"ST板块"
                  if (showOnly5PlusInStockCountModal) {
                    if (sector.sectorName === '其他' || sector.sectorName === 'ST板块') {
                      return false; // 强制过滤
                    }
                    return sector.stocks.length >= 5;
                  }
                  // 显示全部模式：显示所有板块（包括"其他"和"ST板块"）
                  return true;
                })
                .sort((a, b) => {
                  // 排序逻辑：其他和ST板块排在最后
                  const aIsSpecial = a.sectorName === '其他' || a.sectorName === 'ST板块';
                  const bIsSpecial = b.sectorName === '其他' || b.sectorName === 'ST板块';
                  if (aIsSpecial && !bIsSpecial) return 1;  // a排后面
                  if (!aIsSpecial && bIsSpecial) return -1; // b排后面
                  return 0; // 保持原有顺序
                })
                .map((sector, sectorIndex) => {
                  // 获取该板块的5日期范围 - 修复：使用dates数组确保顺序正确
                  const currentDateIndex = dates.indexOf(selectedStockCountData.date);
                  const followUpDates = currentDateIndex !== -1 ? dates.slice(currentDateIndex + 1, currentDateIndex + 6) : [];

                  return (
                    <div key={sector.sectorName} className="bg-white rounded border border-gray-200 shadow-sm p-1">
                      <div className="flex items-center justify-between mb-0.5 pb-0.5 border-b border-gray-100">
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0 mr-1">
                          <h4 className="text-[9px] font-semibold text-gray-900 truncate">
                            {sector.sectorName} <span className="text-gray-500">({sector.stocks.length})</span>
                          </h4>
                          {(() => {
                            // v4.8.19修改：涨停数弹窗显示板块成交额，前2名用红色高亮
                            const sectorAmount = sevenDaysData?.[selectedStockCountData.date]?.sectorAmounts?.[sector.sectorName];
                            if (sectorAmount && sectorAmount > 0) {
                              // 获取该板块的成交额排名
                              const rank = getSectorAmountRank(selectedStockCountData.date, sector.sectorName);

                              // 根据排名选择颜色
                              let colorClass = 'bg-stock-orange-100 text-stock-orange-800'; // 默认浅橙色 #FCFCE5
                              if (rank === 1) {
                                colorClass = 'bg-stock-orange-600 text-white font-semibold'; // 第1名：深橙色 #E9573F
                              } else if (rank === 2) {
                                colorClass = 'bg-stock-orange-400 text-white font-medium'; // 第2名：中橙色 #F4A261
                              }

                              return (
                                <div
                                  className={`text-[8px] px-1 py-0.5 rounded inline-block ${colorClass} self-start`}
                                  title={`板块成交额: ${sectorAmount}亿元${rank ? ` (第${rank}名)` : ''}`}
                                >
                                  {sectorAmount}亿
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // 传入排序后的stocks数组,确保分时图顺序与表格一致
                              const followUpDataMap: Record<string, Record<string, number>> = {};
                              sector.stocks.forEach(stock => {
                                followUpDataMap[stock.code] = stock.followUpData;
                              });
                              const sortedStocks = getSortedStocksForSector(sector.stocks, followUpDataMap, sectorModalSortMode);
                              handleOpenMinuteModal(sector.sectorName, selectedStockCountData.date, sortedStocks);
                            }}
                            className="px-1 py-0.5 rounded text-[7px] font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                          >
                            📊M
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // 传入排序后的stocks数组,确保K线图顺序与表格一致
                              const followUpDataMap: Record<string, Record<string, number>> = {};
                              sector.stocks.forEach(stock => {
                                followUpDataMap[stock.code] = stock.followUpData;
                              });
                              const sortedStocks = getSortedStocksForSector(sector.stocks, followUpDataMap, sectorModalSortMode);
                              handleOpenKlineModal(sector.sectorName, selectedStockCountData.date, sortedStocks);
                            }}
                            className="px-1 py-0.5 rounded text-[7px] font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          >
                            📈K
                          </button>
                          <div className={`px-1 py-0.5 rounded text-[8px] font-medium ${
                            getPerformanceClass(sector.avgPremium)
                          }`}>
                            {sector.avgPremium.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {/* v4.8.5微调：溢价徽章稍微放大，与日期弹窗一致 */}
                      <table className="w-full border-collapse table-fixed">
                        <thead className="bg-blue-50">
                          <tr className="border-b border-blue-100">
                            <th className="px-0.5 py-1 text-left text-[10px] font-semibold text-gray-700 w-[16%]">名称</th>
                            <th className="px-0.5 py-1 text-center text-[10px] font-semibold text-gray-700 w-[9%]">状态</th>
                            <th className="px-0.5 py-1 text-center text-[10px] font-semibold text-gray-700 w-[8%]">额</th>
                            {followUpDates.map((date, index) => {
                              const formattedDate = formatDate(date).slice(5);
                              return (
                                <th key={date} className="px-0.5 py-1 text-center text-[10px] font-semibold text-gray-700 w-[11%]">
                                  {formattedDate}
                                </th>
                              );
                            })}
                            <th className="px-0.5 py-1 text-center text-[10px] font-semibold text-gray-700 w-[9%]">5日</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            // 构建正确格式的 followUpData
                            const followUpDataMap: Record<string, Record<string, number>> = {};
                            sector.stocks.forEach(stock => {
                              followUpDataMap[stock.code] = stock.followUpData;
                            });
                            return getSortedStocksForSector(sector.stocks, followUpDataMap, sectorModalSortMode);
                          })().map((stock, stockIndex) => (
                            <tr key={stock.code} className={`border-b border-gray-50 ${stockIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50 transition-colors`}>
                              <td className="px-0.5 py-0.5">
                                <div
                                  className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline text-[11px] whitespace-nowrap truncate"
                                  onClick={() => handleStockClick(stock.name, stock.code)}
                                  title={`${stock.name} (${stock.code})`}
                                >
                                  {stock.name}
                                </div>
                              </td>
                              <td className="px-0.5 py-0.5 text-center">
                                <span className={`inline-block px-1 py-0.5 rounded text-[9px] font-bold whitespace-nowrap ${
                                  stock.td_type.includes('3') || stock.td_type.includes('4') || stock.td_type.includes('5') || stock.td_type.includes('6') || stock.td_type.includes('7') || stock.td_type.includes('8') || stock.td_type.includes('9') || stock.td_type.includes('10') ? 'bg-red-100 text-red-700' :
                                  stock.td_type.includes('2') ? 'bg-orange-100 text-orange-700' :
                                  'bg-gray-200 text-gray-700'
                                }`}>
                                  {stock.td_type.replace('首板', '1').replace('首', '1').replace('连板', '').replace('板', '')}
                                </span>
                              </td>
                              <td className="px-0.5 py-0.5 text-center">
                                {(() => {
                                  // v4.8.19新增：涨停数弹窗个股成交额前2名红色高亮
                                  if (!stock.amount || stock.amount === 0) {
                                    return <span className="text-[9px] text-gray-700">-</span>;
                                  }

                                  // 获取该个股在当前板块内的成交额排名
                                  const rank = getStockAmountRankInSector(sector.stocks, stock.code);

                                  // 根据排名选择颜色
                                  let colorClass = 'text-[9px] text-gray-700'; // 默认灰色
                                  if (rank === 1) {
                                    colorClass = 'text-[9px] px-1 py-0.5 rounded bg-stock-orange-600 text-white font-semibold'; // 第1名：深橙色 #E9573F
                                  } else if (rank === 2) {
                                    colorClass = 'text-[9px] px-1 py-0.5 rounded bg-stock-orange-400 text-white font-medium'; // 第2名：中橙色 #F4A261
                                  }

                                  return (
                                    <span
                                      className={colorClass}
                                      title={rank ? `板块内成交额排名: 第${rank}名` : ''}
                                    >
                                      {stock.amount.toFixed(1)}
                                    </span>
                                  );
                                })()}
                              </td>
                              {followUpDates.map(date => {
                                const performance = stock.followUpData?.[date] || 0;
                                return (
                                  <td key={date} className="px-0.5 py-0.5 text-center">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium whitespace-nowrap ${getPerformanceColorClass(performance)}`}>
                                      {performance > 0 ? `+${performance.toFixed(1)}` : performance.toFixed(1)}
                                    </span>
                                  </td>
                                );
                              })}
                              <td className="px-0.5 py-0.5 text-center">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap ${getPerformanceColorClass(stock.totalReturn || 0)}`}>
                                  {(stock.totalReturn || 0) > 0 ? `+${(stock.totalReturn || 0).toFixed(1)}` : (stock.totalReturn || 0).toFixed(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
      )}

      {/* 板块强度排序弹窗 - 更新为7天，左右分栏布局 */}
      {showSectorRankingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-[98vw] max-w-[98vw] max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                🏆 板块7天涨停总数排行 (前5名)
              </h3>
              <button
                onClick={closeSectorRankingModal}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 最近7天概况 */}
            <div className="mb-4 bg-blue-50 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">📊 统计说明</h4>
              <p className="text-blue-700 text-xs">
                统计最近7个交易日各板块涨停总数，按总数降序排列，显示前5名最活跃板块
              </p>
              {dates.length >= 7 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-blue-600 font-medium text-xs">统计日期:</span>
                  {dates.map(date => {
                    try {
                      return (
                        <span key={date} className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-2xs">
                          {formatDate(date).slice(5)}
                        </span>
                      );
                    } catch (error) {
                      return (
                        <span key={date} className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-2xs">
                          {date}
                        </span>
                      );
                    }
                  })}
                </div>
              )}
            </div>

            {/* 左右分栏布局 */}
            <div className="flex-1 flex gap-6 overflow-hidden">
              {/* 左侧：板块涨停家数趋势图 */}
              <div className="w-3/5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 flex flex-col">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  <span>板块7天涨停趋势图</span>
                </h4>
                <div className="flex-1 bg-white rounded-lg p-4 shadow-inner">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={(() => {
                        // 构建图表数据：每个日期作为一行，每个板块作为一列
                        return dates.map(date => {
                          const dataPoint: any = { date: formatDate(date).slice(5) };
                          getSectorStrengthRanking.forEach(sector => {
                            const dayData = sector.dailyBreakdown.find(d => d.date === date);
                            dataPoint[sector.name] = dayData ? dayData.count : 0;
                          });
                          return dataPoint;
                        });
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        stroke="#9ca3af"
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        stroke="#9ca3af"
                        label={{ value: '涨停数（只）', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value: any, name: string) => [`${value}只`, name]}
                        labelStyle={{ fontWeight: 'bold', color: '#1f2937' }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                        iconType="line"
                      />
                      {getSectorStrengthRanking.map((sector, index) => {
                        // v4.8.25优化：精致且区分度高的配色方案
                        const colors = [
                          '#dc2626', // 深红色 (第1名) - 醒目热烈
                          '#059669', // 翠绿色 (第2名) - 清新活力
                          '#2563eb', // 深蓝色 (第3名) - 稳重专业
                          '#7c3aed', // 深紫色 (第4名) - 优雅神秘
                          '#d97706', // 深金色 (第5名) - 温暖尊贵
                        ];

                        // 找到该板块的最高点
                        const chartData = dates.map(date => {
                          const dataPoint: any = { date: formatDate(date).slice(5) };
                          getSectorStrengthRanking.forEach(s => {
                            const dayData = s.dailyBreakdown.find(d => d.date === date);
                            dataPoint[s.name] = dayData ? dayData.count : 0;
                          });
                          return dataPoint;
                        });

                        const maxValue = Math.max(...sector.dailyBreakdown.map(d => d.count));
                        const maxIndex = sector.dailyBreakdown.findIndex(d => d.count === maxValue);

                        return (
                          <Line
                            key={sector.name}
                            type="monotone"
                            dataKey={sector.name}
                            stroke={colors[index]}
                            strokeWidth={3}
                            dot={{ fill: colors[index], strokeWidth: 2, r: 5 }}
                            activeDot={{ r: 7 }}
                            name={sector.name}
                            label={(props: any) => {
                              // 只在最高点显示标签
                              if (props.index === maxIndex && maxValue > 0) {
                                return (
                                  <text
                                    x={props.x}
                                    y={props.y - 10}
                                    fill={colors[index]}
                                    fontSize={11}
                                    fontWeight="bold"
                                    textAnchor="middle"
                                  >
                                    {sector.name}
                                  </text>
                                );
                              }
                              return null;
                            }}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-600 mt-3 text-center">
                  💡 数据说明：展示前5名板块近7天涨停家数变化趋势
                </p>
              </div>

              {/* 右侧：板块排行列表 */}
              <div className="w-2/5 space-y-3 overflow-y-auto pr-2">
              {getSectorStrengthRanking.map((sector, index) => (
                <div
                  key={sector.name}
                  className="bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => handleRankingBadgeClick(sector.name)}
                >
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg' :
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white shadow-md' :
                          index === 2 ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white shadow-md' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{sector.name}</h4>
                          <div className="text-xs text-gray-500">
                            最近7天累计涨停数
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-sm ${
                          index === 0 ? 'bg-red-100 text-red-700' :
                          index === 1 ? 'bg-orange-100 text-orange-700' :
                          index === 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {sector.totalLimitUpCount} 只
                        </div>
                      </div>
                    </div>

                    {/* 7天详细分解 - 使用更紧凑的网格 */}
                    <div className="grid grid-cols-7 gap-1.5 mt-2 bg-gray-50 rounded-lg p-2">
                      {sector.dailyBreakdown.map((day, dayIndex) => {
                        let formattedDate = '';
                        try {
                          formattedDate = formatDate(day.date).slice(5);
                        } catch (error) {
                          formattedDate = day.date;
                        }

                        return (
                          <div key={day.date} className="text-center bg-white rounded p-1 border">
                            <div className="text-[10px] text-gray-500 mb-0.5">{formattedDate}</div>
                            <div className={`text-sm font-semibold ${
                              day.count >= 10 ? 'text-red-600' :
                              day.count >= 5 ? 'text-orange-600' :
                              day.count > 0 ? 'text-blue-600' : 'text-gray-400'
                            }`}>
                              {day.count}
                            </div>
                            <div className="text-[10px] text-gray-400">只</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>

            {getSectorStrengthRanking.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-lg">暂无数据</p>
                <p className="text-sm">最近7天没有足够的涨停数据</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7天涨停阶梯弹窗 - 横向日期表格布局 */}
      {show7DayLadderModal && selected7DayLadderData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-4 max-w-[95vw] max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                🪜 {selected7DayLadderData.sectorName} - 7天涨停个股阶梯
              </h3>
              <button
                onClick={close7DayLadderModal}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-3 text-2xs text-gray-600">
              点击任意日期列查看该日个股后续5天溢价详情
            </div>

            {/* 横向日期表格 */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    {selected7DayLadderData.dailyBreakdown.map((day, index) => (
                      <th
                        key={day.date}
                        className="border border-gray-300 px-2 py-2 min-w-[120px] cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => {
                          const dayData = sevenDaysData?.[day.date];
                          if (dayData) {
                            const followUpData = dayData.followUpData[selected7DayLadderData.sectorName] || {};
                            handleSectorClick(day.date, selected7DayLadderData.sectorName, day.stocks, followUpData);
                          }
                        }}
                      >
                        <div className="text-sm font-semibold text-gray-900">
                          {formatDate(day.date).slice(5)}
                        </div>
                        <div className="text-2xs text-gray-500 mt-0.5">
                          {new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short' })}
                        </div>
                        <div className={`mt-1 text-xs font-medium ${
                          day.stocks.length >= 10 ? 'text-red-600' :
                          day.stocks.length >= 5 ? 'text-orange-600' :
                          'text-blue-600'
                        }`}>
                          ({day.stocks.length}只)
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {selected7DayLadderData.dailyBreakdown.map((day, dayIndex) => {
                      // v4.8.25修复：使用真实API数据，按状态优先、涨停时间次要排序
                      const sortedStocks = day.stocks
                        .map(stock => ({
                          ...stock,
                          boardCount: getBoardWeight(stock.td_type) // 使用真实API数据
                        }))
                        .sort((a, b) => {
                          // 首要条件：按板数降序排序（高板在上）
                          if (b.boardCount !== a.boardCount) {
                            return b.boardCount - a.boardCount;
                          }
                          
                          // 次要条件：板数相同时，按涨停时间排序（越早越在前）
                          const aTime = a.limitUpTime || '23:59';
                          const bTime = b.limitUpTime || '23:59';
                          return aTime.localeCompare(bTime); // 时间升序，早的在前
                        });

                      return (
                        <td
                          key={day.date}
                          className="border border-gray-300 px-2 py-2 align-top"
                        >
                          <div className="space-y-1">
                            {sortedStocks.map((stock, stockIndex) => (
                              <div
                                key={stock.code}
                                className="flex items-center justify-between text-2xs bg-white border border-gray-200 rounded px-1.5 py-0.5 hover:border-blue-300 hover:bg-blue-50"
                              >
                                <button
                                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline truncate flex-1 text-left"
                                  onClick={() => handleStockClick(stock.name, stock.code)}
                                >
                                  {stock.name.length > 6 ? stock.name.slice(0, 6) : stock.name}
                                </button>
                                <span className={`text-[10px] ml-1 font-medium ${
                                  stock.boardCount >= 3 ? 'text-red-600' :
                                  stock.boardCount === 2 ? 'text-orange-600' :
                                  'text-gray-500'
                                }`}>
                                  {stock.td_type}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-2xs text-gray-500 text-center">
              💡 提示：点击日期表头可查看该日板块详情（含溢价曲线图和K线功能） | 点击个股名称可查看K线图
            </div>
          </div>
        </div>
      )}

      {/* 日期列详情弹窗 - 显示该日个股后续5天溢价 */}
      {showDateColumnDetail && selectedDateColumnData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60]">
          <div className="bg-white rounded-xl p-4 w-auto max-w-[85vw] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                📊 {formatDate(selectedDateColumnData.date)} - 个股后续5天溢价详情
              </h3>
              <button
                onClick={closeDateColumnDetail}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-2 text-2xs text-gray-600">
              共 {selectedDateColumnData.stocks.length} 只个股，按5日累计溢价排序
            </div>

            <div>
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white border-b-2">
                  <tr>
                    <th className="px-1 py-1.5 text-left text-2xs font-semibold text-gray-700 w-8">#</th>
                    <th className="px-1 py-1.5 text-left text-2xs font-semibold text-gray-700">股票</th>
                    <th className="px-1 py-1.5 text-center text-2xs font-semibold text-gray-700 w-12">状态</th>
                    {(() => {
                      // 使用dates数组确保日期正确排序
                      const currentDateIndex = dates.indexOf(selectedDateColumnData.date);
                      const followUpDates = currentDateIndex !== -1 ? dates.slice(currentDateIndex + 1, currentDateIndex + 6) : [];
                      return followUpDates.map((followDate) => {
                        const formattedDate = formatDate(followDate).slice(5);
                        return (
                          <th key={followDate} className="px-1 py-1.5 text-center text-2xs font-semibold text-gray-700 w-16">
                            {formattedDate}
                          </th>
                        );
                      });
                    })()}
                    <th className="px-1 py-1.5 text-center text-2xs font-semibold text-gray-700 w-16">累计</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedStocksForSector(selectedDateColumnData.stocks, selectedDateColumnData.followUpData, sectorModalSortMode).map((stock, index) => {
                    // 使用dates数组确保日期正确排序
                    const currentDateIndex = dates.indexOf(selectedDateColumnData.date);
                    const followUpDates = currentDateIndex !== -1 ? dates.slice(currentDateIndex + 1, currentDateIndex + 6) : [];
                    const totalReturn = Object.values(selectedDateColumnData.followUpData[stock.code] || {}).reduce((sum, val) => sum + val, 0);
                    return (
                      <tr key={stock.code} className="border-b hover:bg-primary-50 transition">
                        <td className="px-1 py-1.5 text-2xs text-gray-400">#{index + 1}</td>
                        <td className="px-1 py-1.5">
                          <button
                            className="text-primary-600 hover:text-primary-700 font-medium hover:underline text-xs"
                            onClick={() => handleStockClick(stock.name, stock.code)}
                          >
                            {stock.name}
                          </button>
                          <span className="text-2xs text-gray-400 ml-1">({stock.code})</span>
                        </td>
                        <td className="px-1 py-1.5 text-center">
                          <span className={`text-2xs font-medium ${
                            stock.td_type.includes('3') || stock.td_type.includes('4') || stock.td_type.includes('5') || stock.td_type.includes('6') || stock.td_type.includes('7') || stock.td_type.includes('8') || stock.td_type.includes('9') || stock.td_type.includes('10') ? 'text-red-600' :
                            stock.td_type.includes('2') ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {stock.td_type.replace('连板', '板')}
                          </span>
                        </td>
                        {followUpDates.slice(0, 5).map((followDate, dayIndex) => {
                          const performance = selectedDateColumnData.followUpData[stock.code]?.[followDate] || 0;
                          return (
                            <td key={followDate || `day-${dayIndex}`} className="px-1 py-1.5 text-center">
                              <span className={`px-1 py-0.5 rounded text-2xs font-medium ${getPerformanceClass(performance)}`}>
                                {performance.toFixed(1)}%
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-1 py-1.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${getPerformanceClass(totalReturn)}`}>
                            {totalReturn.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 个股分时+K线左右分屏弹窗 */}
      {showModal && selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[70]">
          <div className="bg-white rounded-xl p-4 max-w-6xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedStock.name} ({selectedStock.code}) 今日分时 & K线图
              </h3>
              <button
                onClick={closeModal}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 分屏布局: 左侧分时图50%, 右侧K线图50% */}
            <div className="grid grid-cols-2 gap-4">
              {/* 左侧: 分时图 */}
              <div className="border-r pr-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs mr-2">📊 今日分时</span>
                </h4>
                <img
                  src={`http://image.sinajs.cn/newchart/min/n/${getStockCodeFormat(selectedStock.code)}.gif`}
                  alt={`${selectedStock.name}分时图`}
                  className="w-full h-auto rounded-lg shadow-md"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjlmOWY5Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWIhuaXtuWbvuWKoOi9veWksei0pTwvdGV4dD4KPC9zdmc+';
                  }}
                />
              </div>

              {/* 右侧: K线图 */}
              <div className="pl-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs mr-2">📈 日K线图</span>
                </h4>
                <img
                  src={`http://image.sinajs.cn/newchart/daily/${getStockCodeFormat(selectedStock.code)}.gif`}
                  alt={`${selectedStock.name}K线图`}
                  className="w-full h-auto rounded-lg shadow-md"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjlmOWY5Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPktcdTdFRkZcdTU2RkVcdTUyMDBcdThGN0RcdTUxMTZcdTUwNjdcdTU5MzQ8L3RleHQ+Cjwvc3ZnPg==';
                  }}
                />
              </div>
            </div>

            <p className="text-2xs text-gray-500 mt-3 text-center">
              数据来源: 新浪财经 | 点击空白区域关闭
            </p>
          </div>
        </div>
      )}

      {/* 独立K线弹窗 - 批量展示板块个股K线 */}
      {showKlineModal && klineModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[90]">
          <div className="bg-white rounded-xl p-4 w-[98vw] h-[95vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                📈 {klineModalData.sectorName} - K线图批量展示 ({formatDate(klineModalData.date)})
              </h3>
              <button
                onClick={closeKlineModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-3 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                共 {klineModalData.stocks.length} 只个股，每页显示12只
              </div>
              {klineModalData.stocks.length > 12 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setKlineModalPage(Math.max(0, klineModalPage - 1))}
                    disabled={klineModalPage === 0}
                    className="px-3 py-1.5 rounded text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    ← 上一页
                  </button>
                  <span className="text-sm text-gray-700 font-medium">
                    第 {klineModalPage + 1} / {Math.ceil(klineModalData.stocks.length / 12)} 页
                  </span>
                  <button
                    onClick={() => setKlineModalPage(Math.min(Math.ceil(klineModalData.stocks.length / 12) - 1, klineModalPage + 1))}
                    disabled={klineModalPage >= Math.ceil(klineModalData.stocks.length / 12) - 1}
                    className="px-3 py-1.5 rounded text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    下一页 →
                  </button>
                </div>
              )}
            </div>

            {/* K线图网格 - 4x3布局，充分利用空间 */}
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-4 p-2">
                {klineModalData.stocks
                  .slice(klineModalPage * 12, (klineModalPage + 1) * 12)
                  .map((stock) => (
                    <div key={stock.code} className="bg-gray-50 rounded-lg p-3 border-2 border-gray-200 hover:border-blue-400 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <button
                          className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors truncate flex-1 text-left"
                          onClick={() => handleStockClick(stock.name, stock.code)}
                          title={`${stock.name} (${stock.code})`}
                        >
                          {stock.name}
                        </button>
                        <span className={`text-xs ml-2 px-2 py-0.5 rounded font-semibold whitespace-nowrap ${
                          stock.td_type.includes('3') || stock.td_type.includes('4') || stock.td_type.includes('5') || stock.td_type.includes('6') || stock.td_type.includes('7') || stock.td_type.includes('8') || stock.td_type.includes('9') || stock.td_type.includes('10') ? 'bg-red-100 text-red-700' :
                          stock.td_type.includes('2') ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {stock.td_type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {stock.code}
                      </div>
                      <img
                        src={`http://image.sinajs.cn/newchart/daily/${getStockCodeFormat(stock.code)}.gif`}
                        alt={`${stock.name}K线图`}
                        className="w-full h-auto rounded border border-gray-300"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjlmOWY5Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+S+e6v+WbvuWKoOi9veWけ+ihjTwvdGV4dD4KPC9zdmc+';
                        }}
                      />
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500 text-center">
              💡 点击个股名称可查看单独K线图 | 使用上下翻页浏览更多个股
            </div>
          </div>
        </div>
      )}

      {/* 独立分时图弹窗 - 批量展示板块个股分时图 */}
      {showMinuteModal && minuteModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[90]">
          <div className="bg-white rounded-xl p-4 w-[98vw] h-[95vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                📊 {minuteModalData.sectorName} - 分时图批量展示 ({formatDate(minuteModalData.date)})
              </h3>
              <button
                onClick={closeMinuteModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-3 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                共 {minuteModalData.stocks.length} 只个股，每页显示12只
              </div>
              {minuteModalData.stocks.length > 12 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMinuteModalPage(Math.max(0, minuteModalPage - 1))}
                    disabled={minuteModalPage === 0}
                    className="px-3 py-1.5 rounded text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    ← 上一页
                  </button>
                  <span className="text-sm text-gray-700 font-medium">
                    第 {minuteModalPage + 1} / {Math.ceil(minuteModalData.stocks.length / 12)} 页
                  </span>
                  <button
                    onClick={() => setMinuteModalPage(Math.min(Math.ceil(minuteModalData.stocks.length / 12) - 1, minuteModalPage + 1))}
                    disabled={minuteModalPage >= Math.ceil(minuteModalData.stocks.length / 12) - 1}
                    className="px-3 py-1.5 rounded text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    下一页 →
                  </button>
                </div>
              )}
            </div>

            {/* 分时图网格 - 4x3布局，充分利用空间 */}
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-4 p-2">
                {minuteModalData.stocks
                  .slice(minuteModalPage * 12, (minuteModalPage + 1) * 12)
                  .map((stock) => (
                    <div key={stock.code} className="bg-gray-50 rounded-lg p-3 border-2 border-gray-200 hover:border-green-400 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <button
                          className="text-sm font-bold text-gray-900 hover:text-green-600 transition-colors truncate flex-1 text-left"
                          onClick={() => handleStockClick(stock.name, stock.code)}
                          title={`${stock.name} (${stock.code})`}
                        >
                          {stock.name}
                        </button>
                        <span className={`text-xs ml-2 px-2 py-0.5 rounded font-semibold whitespace-nowrap ${
                          stock.td_type.includes('3') || stock.td_type.includes('4') || stock.td_type.includes('5') || stock.td_type.includes('6') || stock.td_type.includes('7') || stock.td_type.includes('8') || stock.td_type.includes('9') || stock.td_type.includes('10') ? 'bg-red-100 text-red-700' :
                          stock.td_type.includes('2') ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {stock.td_type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {stock.code}
                      </div>
                      <img
                        src={`http://image.sinajs.cn/newchart/min/n/${getStockCodeFormat(stock.code)}.gif`}
                        alt={`${stock.name}分时图`}
                        className="w-full h-auto rounded border border-gray-300"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjlmOWY5Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5YiG5pe25Zu+5Yqg6L295aSx6LSlPC90ZXh0Pgo8L3N2Zz4=';
                        }}
                      />
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500 text-center">
              💡 点击个股名称可查看单独图表 | 使用上下翻页浏览更多个股
            </div>
          </div>
        </div>
      )}

      {/* 页面标题和控制 - 添加Top 5排行榜徽章 */}
      <div className="max-w-full mx-auto mb-4">
        <div className="flex justify-between items-center bg-white rounded-lg shadow-sm p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">📈 宇硕板块节奏</h1>

            {/* Top 5 排行榜徽章 */}
            {getSectorStrengthRanking.length > 0 && (
              <div className="flex items-center gap-1.5">
                {getSectorStrengthRanking.map((sector, index) => (
                  <button
                    key={sector.name}
                    onClick={() => handleRankingBadgeClick(sector.name)}
                    className={`px-2 py-1 text-xs font-medium rounded border transition-all duration-150 hover:scale-105 ${
                      index === 0 ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100' :
                      index === 1 ? 'bg-gray-50 border-gray-300 text-gray-800 hover:bg-gray-100' :
                      index === 2 ? 'bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100' :
                      'bg-primary-50 border-primary-200 text-primary-800 hover:bg-primary-100'
                    }`}
                  >
                    <span className="font-semibold">#{index + 1}</span>
                    <span className="mx-1">·</span>
                    <span>{sector.name}</span>
                    <span className="ml-1 opacity-75">({sector.totalLimitUpCount})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* 全局排序模式切换 */}
            <button
              onClick={() => setSectorModalSortMode(sectorModalSortMode === 'board' ? 'return' : 'board')}
              className="px-2 py-1 rounded text-xs font-medium transition-colors bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200"
            >
              {sectorModalSortMode === 'board' ? '🔢 连板排序' : '📈 涨幅排序'}
            </button>

            {/* 板块筛选开关 */}
            <label className="flex items-center gap-1.5 text-xs">
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

            {/* 板块7天涨停排行按钮 */}
            <button
              onClick={() => setShowSectorRankingModal(true)}
              disabled={loading || !sevenDaysData}
              className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              🏆 7天涨停排行
            </button>

            {/* 刷新按钮 */}
            <button
              onClick={fetch7DaysData}
              disabled={loading}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '刷新中...' : '🔄 刷新数据'}
            </button>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="max-w-full mx-auto mb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* 7天时间轴主内容 - 应用紧凑样式 */}
      {sevenDaysData && dates.length > 0 && (
        <div className="max-w-full mx-auto">
          {/* 时间轴网格 */}
          <div className="grid grid-cols-7 gap-2">
            {dates.map((date) => {
              const dayData = sevenDaysData[date];
              const sectors = processedTimelineData[date] || [];

              return (
                <div key={date} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* 日期头部 - 紧凑样式 */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2 text-center">
                    <div
                      className="text-xs font-medium cursor-pointer hover:bg-white/10 rounded px-1.5 py-0.5 transition-colors"
                      onClick={() => handleDateClick(date)}
                    >
                      {formatDate(date).slice(5)} {/* MM-DD格式 */}
                    </div>
                    <div className="text-2xs opacity-90 mt-0.5">
                      {new Date(date).toLocaleDateString('zh-CN', { weekday: 'short' })}
                    </div>
                    <div
                      className="text-2xs mt-1 bg-white/20 rounded px-1.5 py-0.5 cursor-pointer hover:bg-white/30 transition-colors"
                      onClick={() => handleStockCountClick(date)}
                    >
                      {dayData?.stats.total_stocks || 0} 只涨停
                    </div>
                  </div>

                  {/* 板块列表 - 紧凑样式 */}
                  <div className="p-2 space-y-1.5 max-h-96 overflow-y-auto">
                    {sectors.length === 0 ? (
                      <div className="text-center text-gray-500 py-3 text-xs">
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
                            className="border border-gray-200 rounded p-2 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all"
                            onClick={() => handleSectorClick(date, sector.name, sector.stocks, sector.followUpData)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-xs truncate hover:text-blue-600 transition-colors">
                                  {sector.name}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <div className={`text-2xs px-1.5 py-0.5 rounded inline-block ${
                                    sector.count >= 5 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {sector.count}个
                                  </div>
                                  {(() => {
                                    // v4.8.19修改：显示板块成交额，前2名用红色高亮
                                    const sectorAmount = sevenDaysData[date]?.sectorAmounts?.[sector.name];
                                    if (sectorAmount && sectorAmount > 0) {
                                      // 获取该板块的成交额排名
                                      const rank = getSectorAmountRank(date, sector.name);

                                      // 根据排名选择颜色
                                      let colorClass = 'bg-stock-orange-100 text-stock-orange-800'; // 默认浅橙色 #FCFCE5
                                      if (rank === 1) {
                                        colorClass = 'bg-stock-orange-600 text-white font-semibold'; // 第1名：深橙色 #E9573F
                                      } else if (rank === 2) {
                                        colorClass = 'bg-stock-orange-400 text-white font-medium'; // 第2名：中橙色 #F4A261
                                      }

                                      return (
                                        <div
                                          className={`text-2xs px-1.5 py-0.5 rounded inline-block ${colorClass}`}
                                          title={`成交额: ${sectorAmount}亿元${rank ? ` (第${rank}名)` : ''}`}
                                        >
                                          {sectorAmount}亿
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-2xs text-gray-400">溢价</div>
                                <div className={`text-xs px-1.5 py-0.5 rounded font-medium ${
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

          {/* 使用说明 - 紧凑样式 */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h3 className="text-blue-800 font-medium mb-2 text-sm">💡 使用说明</h3>
            <ul className="text-blue-700 text-xs space-y-0.5">
              <li>• 按最近7个交易日排列，显示每日涨停板块及数量和平均溢价</li>
              <li>• <span className="font-semibold">点击日期头部</span>: 显示涨停数前5名板块及后续5天平均溢价</li>
              <li>• <span className="font-semibold">点击板块名称</span>: 查看该板块个股5天溢价图表和详情（含K线批量查看）</li>
              <li>• <span className="font-semibold">点击排行徽章</span>: 查看该板块7天涨停个股阶梯，点击日期可查看完整板块详情</li>
              <li>• <span className="font-semibold">点击涨停数</span>: 按板块分组显示当天所有涨停个股，每个板块标题有📈K按钮可批量查看K线</li>
              <li>• <span className="font-semibold">排序模式</span>: 右上角可切换"连板排序"或"涨幅排序"，影响所有个股列表和K线显示顺序</li>
              <li>• 点击"7天涨停排行"查看板块强度排名（Top 5）</li>
              <li>• 点击股票名称可查看单独K线图</li>
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
          className="fixed inset-0 z-[55]"
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
      {show7DayLadderModal && (
        <div
          className="fixed inset-0 z-40"
          onClick={close7DayLadderModal}
        />
      )}
      {showDateColumnDetail && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={closeDateColumnDetail}
        />
      )}
    </div>
  );
}