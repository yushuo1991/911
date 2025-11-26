'use client';

import { useState, useEffect, useMemo } from 'react';
import { SevenDaysData, DayData, SectorSummary, StockPerformance } from '@/types/stock';
import { getPerformanceClass, getPerformanceColorClass, getTodayString, formatDate, getBoardWeight } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
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

// 获取分时图URL（根据模式返回实时或快照）
function getMinuteChartUrl(stockCode: string, mode: 'realtime' | 'snapshot', date?: string): string {
  if (mode === 'snapshot' && date) {
    // 从数据库读取历史快照 - 添加时间戳防止缓存
    return `/api/minute-snapshot?date=${date}&code=${stockCode}&t=${Date.now()}`;
  } else {
    // 从新浪API读取实时分时图 - 添加时间戳防止缓存
    const codeFormat = getStockCodeFormat(stockCode);
    return `http://image.sinajs.cn/newchart/min/n/${codeFormat}.gif?t=${Date.now()}`;
  }
}

export default function Home() {
  const [sevenDaysData, setSevenDaysData] = useState<SevenDaysData | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoadEarlier, setShowLoadEarlier] = useState(false); // 新增：控制"加载更早数据"按钮显示
  const [loadingEarlier, setLoadingEarlier] = useState(false); // 新增：加载更早数据的loading状态
  const [dateRange, setDateRange] = useState(7); // 新增：当前显示的日期范围（默认7天）
  const [currentPage, setCurrentPage] = useState(0); // 新增：当前显示的页码（0=最新7天，1=次新7天，以此类推）
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
  // 新增：分时图显示模式（realtime=今日分时，snapshot=当日分时）
  const [minuteChartMode, setMinuteChartMode] = useState<'realtime' | 'snapshot'>('realtime');
  // 新增：连板个股梯队弹窗状态
  const [showMultiBoardModal, setShowMultiBoardModal] = useState(false);
  const [multiBoardModalData, setMultiBoardModalData] = useState<{
    date: string;
    stocks: Array<{
      name: string;
      code: string;
      td_type: string;
      boardNum: number;
      sectorName: string;
      amount: number;
      limitUpTime: string;
      globalAmountRank: number | null;
      followUpData: Record<string, number>;
    }>;
  } | null>(null);

  // 新增：单个个股图表查看弹窗状态
  const [showSingleStockChartModal, setShowSingleStockChartModal] = useState(false);
  const [singleStockChartData, setSingleStockChartData] = useState<{
    name: string;
    code: string;
    date: string;
  } | null>(null);
  const [singleStockChartMode, setSingleStockChartMode] = useState<'kline' | 'minute'>('kline');

  // 新增：星期模态框筛选和排序状态
  const [showOnly10PlusInMultiBoardModal, setShowOnly10PlusInMultiBoardModal] = useState(false);
  const [multiBoardModalSortMode, setMultiBoardModalSortMode] = useState<'board' | 'return'>('board');


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

  // 新增：获取全局成交额排名
  const getGlobalStockAmountRank = (date: string, stockCode: string): number | null => {
    const dayData = sevenDaysData?.[date];
    if (!dayData) return null;

    // 收集所有板块的所有个股
    const allStocks: StockPerformance[] = [];
    Object.values(dayData.categories).forEach(stocks => {
      allStocks.push(...stocks);
    });

    // 按成交额降序排序
    const stocksWithAmount = allStocks
      .filter(s => s.amount && s.amount > 0)
      .sort((a, b) => (b.amount || 0) - (a.amount || 0));

    // 找到当前个股的排名
    const rank = stocksWithAmount.findIndex(s => s.code === stockCode);
    return rank !== -1 ? rank + 1 : null;
  };

  const fetch7DaysData = async (range: number = 7) => {
    setLoading(true);
    setError(null);

    try {
      const endDate = getTodayString();
      // 如果range > 7，需要批量获取多个7天数据段
      if (range <= 7) {
        const response = await fetch(`/api/stocks?date=${endDate}&mode=7days`);
        const result = await response.json();

        if (result.success) {
          setSevenDaysData(result.data);
          setDates(result.dates || []);
          setDateRange(range);
        } else {
          setError(result.error || '获取数据失败');
        }
      } else {
        // 批量获取多个7天数据段（最多30天）
        const allData: SevenDaysData = {};
        const allDates: string[] = [];
        let currentEndDate = endDate;
        const segments = Math.ceil(range / 7);

        for (let i = 0; i < segments; i++) {
          const response = await fetch(`/api/stocks?date=${currentEndDate}&mode=7days`);
          const result = await response.json();

          if (result.success) {
            // 合并数据
            Object.assign(allData, result.data);
            // 合并日期并去重
            result.dates.forEach((date: string) => {
              if (!allDates.includes(date)) {
                allDates.push(date);
              }
            });

            // 计算下一个段的结束日期（当前段的第一天的前一天）
            if (result.dates && result.dates.length > 0) {
              const firstDate = new Date(result.dates[0]);
              firstDate.setDate(firstDate.getDate() - 1);
              currentEndDate = firstDate.toISOString().split('T')[0];
            }
          } else {
            console.warn(`获取第${i+1}段数据失败:`, result.error);
            break;
          }
        }

        // 按日期排序（最新的在最右边）
        allDates.sort();

        setSevenDaysData(allData);
        setDates(allDates.slice(-range)); // 只保留最后range天
        setDateRange(range);
      }
    } catch (err) {
      setError('网络请求失败');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 新增：加载更早的数据（修改为分页模式）
  const handleLoadEarlierData = async () => {
    if (dates.length === 0 || loadingEarlier) return;

    setLoadingEarlier(true);
    setError(null);

    try {
      // 计算是否需要从API加载更多数据
      const requiredStartIndex = (currentPage + 1) * 7;

      if (requiredStartIndex >= dates.length && dates.length < 30) {
        // 需要加载更多数据
        const earliestDate = dates[0];
        const newEndDate = new Date(earliestDate);
        newEndDate.setDate(newEndDate.getDate() - 1);
        const endDateStr = newEndDate.toISOString().split('T')[0];

        // 加载更早的7天
        const response = await fetch(`/api/stocks?date=${endDateStr}&mode=7days`);
        const result = await response.json();

        if (result.success) {
          // 合并数据
          setSevenDaysData(prev => ({...result.data, ...prev}));
          // 合并日期（新日期在前）
          const newDates = [...result.dates.filter((d: string) => !dates.includes(d)), ...dates];
          // 保留最多30天
          setDates(newDates.slice(-30));
          // 切换到下一页
          setCurrentPage(prev => prev + 1);
        } else {
          setError(result.error || '加载更早数据失败');
        }
      } else if (requiredStartIndex < dates.length) {
        // 已有数据，直接切换页码
        setCurrentPage(prev => prev + 1);
      }
    } catch (err) {
      setError('加载更早数据失败');
      console.error('Load earlier error:', err);
    } finally {
      setLoadingEarlier(false);
      setShowLoadEarlier(false); // 加载完成后隐藏按钮
    }
  };

  // 新增：加载更新的数据（回到更新的页面）
  const handleLoadNewer = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  useEffect(() => {
    fetch7DaysData(7);
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

  // 新增：处理星期几点击 - 显示当天连板个股梯队（2板+）
  const handleWeekdayStocksClick = (date: string) => {
    const dayData = sevenDaysData?.[date];
    if (!dayData || !dates) return;

    // 找到当前日期在dates数组中的位置
    const currentDateIndex = dates.indexOf(date);
    if (currentDateIndex === -1) return;

    // 获取次日起5个交易日
    const next5Days = dates.slice(currentDateIndex + 1, currentDateIndex + 6);

    // 收集所有板块的所有连板个股（2板+）
    const multiBoardStocks: Array<{
      name: string;
      code: string;
      td_type: string;
      boardNum: number;
      sectorName: string;
      amount: number;
      limitUpTime: string;
      globalAmountRank: number | null;
      followUpData: Record<string, number>;
    }> = [];

    Object.entries(dayData.categories).forEach(([sectorName, stocks]) => {
      stocks.forEach(stock => {
        // 解析连板数
        const boardMatch = stock.td_type.match(/(\d+)板/);
        const boardNum = boardMatch ? parseInt(boardMatch[1]) : 1;

        // 只收集2板及以上的个股，并且过滤ST个股
        if (boardNum >= 2 && !stock.name.toUpperCase().includes('ST')) {
          // 计算该股票的后续5天表现
          const followUpData: Record<string, number> = {};
          next5Days.forEach(nextDate => {
            // 从基准日期的followUpData中获取该股票在后续日期的表现
            if (dayData.followUpData && dayData.followUpData[sectorName]) {
              const stockFollowUp = dayData.followUpData[sectorName][stock.code];
              if (stockFollowUp && stockFollowUp[nextDate] !== undefined) {
                followUpData[nextDate] = stockFollowUp[nextDate];
              }
            }
          });

          // 获取全局成交额排名
          const globalRank = getGlobalStockAmountRank(date, stock.code);

          multiBoardStocks.push({
            name: stock.name,
            code: stock.code,
            td_type: stock.td_type,
            boardNum: boardNum,
            sectorName: sectorName,
            amount: stock.amount || 0,
            limitUpTime: stock.limitUpTime || '',
            globalAmountRank: globalRank,
            followUpData: followUpData
          });
        }
      });
    });

    // 排序：连板数降序 → 同板数按涨停时间升序
    multiBoardStocks.sort((a, b) => {
      if (a.boardNum !== b.boardNum) {
        return b.boardNum - a.boardNum; // 连板数降序
      }
      // 同板数按涨停时间升序（早涨停的在前）
      if (a.limitUpTime && b.limitUpTime) {
        return a.limitUpTime.localeCompare(b.limitUpTime);
      }
      return 0;
    });

    setMultiBoardModalData({
      date: date,
      stocks: multiBoardStocks
    });
    setShowMultiBoardModal(true);
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
      return;
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
      const followUpDataMap = dayData.followUpData[sectorName] || {};

      // v4.21.4修复：使用统一的排序函数，支持连板排序和涨幅排序切换
      const sortedStocks = getSortedStocksForSector(stocks, followUpDataMap, sectorModalSortMode);

      const sectorStocks = sortedStocks.map(stock => {
        const followUpData = followUpDataMap[stock.code] || {};
        const totalReturn = Object.values(followUpData).reduce((sum, val) => sum + val, 0);
        return {
          ...stock,
          followUpData,
          totalReturn
        };
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
      // v4.21.4修复：添加连板排序，确保个股按连板数降序+涨停时间升序排列
      const rawStocks = (dayData && dayData.categories[sectorName]) ? dayData.categories[sectorName] : [];
      const followUpData = (dayData && dayData.followUpData[sectorName]) || {};
      const sortedStocks = rawStocks.length > 0 ? getSortedStocksForSector(rawStocks, followUpData, sectorModalSortMode) : [];

      dailyBreakdown.push({
        date,
        stocks: sortedStocks
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

  const closeMultiBoardModal = () => {
    setShowMultiBoardModal(false);
    setMultiBoardModalData(null);
  };

  // 打开单个个股图表弹窗
  const handleOpenSingleStockChart = (name: string, code: string, date: string) => {
    setSingleStockChartData({ name, code, date });
    setSingleStockChartMode('kline'); // 默认显示K线
    setShowSingleStockChartModal(true);
  };

  // 关闭单个个股图表弹窗
  const closeSingleStockChartModal = () => {
    setShowSingleStockChartModal(false);
    setSingleStockChartData(null);
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

  // 计算当前页显示的日期（始终显示7天）
  const displayDates = useMemo(() => {
    if (dates.length === 0) return [];

    // 计算起始索引（从后往前数，因为dates数组是从旧到新排列）
    const startIndex = dates.length - 1 - currentPage * 7;
    const endIndex = Math.max(startIndex - 6, 0);

    // 提取当前页的7天（或更少，如果不足7天）
    // 从左到右：旧→新，最新日期在最右边
    return dates.slice(endIndex, startIndex + 1);
  }, [dates, currentPage]);

  // 处理7天数据，按日期生成板块汇总
  const processedTimelineData = useMemo(() => {
    if (!sevenDaysData || !displayDates) return {};

    const result: Record<string, SectorSummary[]> = {};

    displayDates.forEach(date => {
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
  }, [sevenDaysData, displayDates, onlyLimitUp5Plus]);

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
        // v4.8.25增强：确保时间字段存在且为有效字符串
        const aTime = (a.limitUpTime && String(a.limitUpTime).trim()) || '23:59'; // 默认最晚时间
        const bTime = (b.limitUpTime && String(b.limitUpTime).trim()) || '23:59';

        // 如果两个时间都是默认值，按股票名称排序保证稳定性
        if (aTime === '23:59' && bTime === '23:59') {
          return a.name.localeCompare(b.name, 'zh-CN');
        }

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

  // 新增：用于星期模态框的个股排序
  const getSortedStocksForMultiBoard = (
    stocks: Array<{
      name: string;
      code: string;
      td_type: string;
      boardNum: number;
      sectorName: string;
      amount: number;
      limitUpTime: string;
      globalAmountRank: number | null;
      followUpData: Record<string, number>;
    }>,
    sortMode: 'board' | 'return' = 'board'
  ) => {
    return [...stocks].sort((a, b) => {
      if (sortMode === 'board') {
        // 按连板数降序，同板数按涨停时间升序
        if (a.boardNum !== b.boardNum) {
          return b.boardNum - a.boardNum; // 连板数降序
        }
        // 同板数按涨停时间升序（早涨停的在前）
        const aTime = (a.limitUpTime && String(a.limitUpTime).trim()) || '23:59';
        const bTime = (b.limitUpTime && String(b.limitUpTime).trim()) || '23:59';
        if (aTime === '23:59' && bTime === '23:59') {
          return a.name.localeCompare(b.name, 'zh-CN');
        }
        return aTime.localeCompare(bTime);
      } else {
        // 按累计收益排序
        const aTotalReturn = Object.values(a.followUpData).reduce((sum, val) => sum + val, 0);
        const bTotalReturn = Object.values(b.followUpData).reduce((sum, val) => sum + val, 0);
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
                    setMinuteChartMode('realtime');
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
                    setMinuteChartMode('snapshot');
                    handleOpenMinuteModal(selectedSectorData.name, selectedSectorData.date, sortedStocks);
                  }}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                >
                  📷 当日分时
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
                                {stock.td_type}
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

            {/* 左右分栏布局 */}
            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
              {/* 左侧：板块溢价趋势图 */}
              <div className="w-3/5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 flex flex-col min-h-0">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  <span>板块后续5天溢价趋势图</span>
                </h4>
                <div className="flex-1 bg-white rounded-lg p-4 shadow-inner min-h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={(() => {
                        // 构建图表数据：每个日期作为一行，每个板块作为一列
                        const dates = Object.keys(selectedDateData.sectorData[0]?.avgPremiumByDay || {});
                        return dates.map((date, index) => {
                          const dataPoint: any = { date: formatDate(date).slice(5) || `T+${index + 1}` };
                          selectedDateData.sectorData.forEach(sector => {
                            dataPoint[sector.sectorName] = sector.avgPremiumByDay[date] || 0;
                          });
                          return dataPoint;
                        });
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
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
                      {(() => {
                        // 使用高对比度颜色，确保区分明确 (移到循环外部)
                        const colors = [
                          '#ef4444', // 鲜红色 (第1名) - Bright red
                          '#3b82f6', // 鲜蓝色 (第2名) - Bright blue
                          '#10b981', // 鲜绿色 (第3名) - Bright green
                          '#f59e0b', // 鲜橙色 (第4名) - Bright orange
                          '#8b5cf6', // 鲜紫色 (第5名) - Bright purple
                        ];

                        return selectedDateData.sectorData.map((sector, index) => (
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
                              // 只在峰值点显示板块名称标签
                              if (!props || !props.x || !props.y || props.index === undefined) return null;
                              
                              // 获取当前日期的数据
                              const chartData = (() => {
                                const dates = Object.keys(selectedDateData.sectorData[0]?.avgPremiumByDay || {});
                                return dates.map((date, index) => {
                                  const dataPoint: any = { date: formatDate(date).slice(5) || `T+${index + 1}` };
                                  selectedDateData.sectorData.forEach(s => {
                                    dataPoint[s.sectorName] = s.avgPremiumByDay[date] || 0;
                                  });
                                  return dataPoint;
                                });
                              })();
                              
                              const currentData = chartData[props.index];
                              if (!currentData) return null;
                              
                              // 找出当前日期的最大溢价值
                              let maxValue = -Infinity;
                              let maxSectorNames: string[] = [];
                              selectedDateData.sectorData.forEach(s => {
                                const value = currentData[s.sectorName] || 0;
                                if (value > maxValue) {
                                  maxValue = value;
                                  maxSectorNames = [s.sectorName];
                                } else if (value === maxValue && value !== 0) {
                                  maxSectorNames.push(s.sectorName);
                                }
                              });
                              
                              // 只在当前板块是峰值板块时显示标签
                              if (maxSectorNames.includes(sector.sectorName) && maxValue !== -Infinity) {
                                return (
                                  <text
                                    x={props.x}
                                    y={props.y - 10}
                                    textAnchor="middle"
                                    fill={colors[index]}
                                    fontSize={11}
                                    fontWeight="bold"
                                  >
                                    {sector.sectorName}
                                  </text>
                                );
                              }
                              
                              return null;
                            }}
                          />
                        ));
                      })()}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-600 mt-3 text-center">
                  💡 数据说明：展示前5名板块后续5个交易日的平均溢价变化趋势
                </p>
              </div>

              {/* 右侧：板块溢价数据表格 */}
              <div className="w-2/5 overflow-auto pr-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-white border-b-2">
                      <tr>
                        <th className="px-2 py-1.5 text-left text-2xs font-semibold text-gray-700">排名</th>
                        <th className="px-2 py-1.5 text-left text-2xs font-semibold text-gray-700">板块名称</th>
                        <th className="px-2 py-1.5 text-center text-2xs font-semibold text-gray-700">个股数</th>
                        {Object.keys(selectedDateData.sectorData[0]?.avgPremiumByDay || {}).map((date, index) => {
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
                                  {stock.td_type}
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
                      {(() => {
                        // 使用高对比度颜色，确保区分明确 (移到循环外部)
                        const colors = [
                          '#ef4444', // 鲜红色 (第1名) - Bright red
                          '#3b82f6', // 鲜蓝色 (第2名) - Bright blue
                          '#10b981', // 鲜绿色 (第3名) - Bright green
                          '#f59e0b', // 鲜橙色 (第4名) - Bright orange
                          '#8b5cf6', // 鲜紫色 (第5名) - Bright purple
                        ];

                        return getSectorStrengthRanking.map((sector, index) => {
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
                                // 只在峰值点显示板块名称标签
                                if (!props || !props.x || !props.y || props.index === undefined) return null;
                                
                                // 获取当前日期的数据
                                const chartData = dates.map(date => {
                                  const dataPoint: any = { date: formatDate(date).slice(5) };
                                  getSectorStrengthRanking.forEach(s => {
                                    const dayData = s.dailyBreakdown.find(d => d.date === date);
                                    dataPoint[s.name] = dayData ? dayData.count : 0;
                                  });
                                  return dataPoint;
                                });
                                
                                const currentData = chartData[props.index];
                                if (!currentData) return null;
                                
                                // 找出当前日期的最大值
                                let maxValue = 0;
                                let maxSectorNames: string[] = [];
                                getSectorStrengthRanking.forEach(s => {
                                  const value = currentData[s.name] || 0;
                                  if (value > maxValue) {
                                    maxValue = value;
                                    maxSectorNames = [s.name];
                                  } else if (value === maxValue && value > 0) {
                                    maxSectorNames.push(s.name);
                                  }
                                });
                                
                                // 只在当前板块是峰值板块时显示标签
                                if (maxSectorNames.includes(sector.name) && props.value > 0) {
                                  return (
                                    <text
                                      x={props.x}
                                      y={props.y - 10}
                                      textAnchor="middle"
                                      fill={colors[index]}
                                      fontSize={11}
                                      fontWeight="bold"
                                    >
                                      {sector.name}
                                    </text>
                                  );
                                }
                                
                                return null;
                              }}
                            />
                          );
                        });
                      })()}
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
                      // v4.21.4修复：stocks已在handleRankingBadgeClick中排序（按连板数+涨停时间），这里只添加boardCount用于显示
                      const stocksWithBoardCount = day.stocks.map(stock => ({
                        ...stock,
                        boardCount: getBoardWeight(stock.td_type)
                      }));

                      return (
                        <td
                          key={day.date}
                          className="border border-gray-300 px-2 py-2 align-top"
                        >
                          <div className="space-y-1">
                            {stocksWithBoardCount.map((stock, stockIndex) => (
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
                            {stock.td_type}
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[100]">
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
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-gray-900">
                  {minuteChartMode === 'realtime' ? '📊' : '📷'} {minuteModalData.sectorName} - {minuteChartMode === 'realtime' ? '今日' : '当日'}分时图 ({formatDate(minuteModalData.date)})
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMinuteChartMode('realtime')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      minuteChartMode === 'realtime' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📊 今日分时
                  </button>
                  <button
                    onClick={() => setMinuteChartMode('snapshot')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      minuteChartMode === 'snapshot' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📷 当日分时
                  </button>
                </div>
              </div>
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
                        key={`${stock.code}-${minuteChartMode}`}
                        src={getMinuteChartUrl(stock.code, minuteChartMode, minuteModalData.date)}
                        alt={`${stock.name}${minuteChartMode === 'realtime' ? '实时' : '历史'}分时图`}
                        className="w-full h-auto rounded border border-gray-300"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (minuteChartMode === 'snapshot') {
                            // 当日分时快照失败 - 显示友好提示
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmVmM2M3Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI0MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2Y1OTcwYiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuKaoO+4jyDlvZPml6Xlv6vnhafjvIzml6DmlbA8L3RleHQ+CiAgPHRleHQgeD0iNTAlIiB5PSI2MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuivt+WIh+aNouWIsOKAnOS7iuaXpeWIhuaXtuKAneiOt+WPluWbvueJhzwvdGV4dD4KPC9zdmc+';
                            target.title = `${stock.name} 当日分时快照不可用，请切换到"今日分时"查看实时数据`;
                          } else {
                            // 实时分时图失败
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjlmOWY5Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5YiG5pe25Zu+5Yqg6L295aSx6LSkPC90ZXh0Pjwvc3ZnPg==';
                          }
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
              onClick={() => fetch7DaysData(7)}
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
      {sevenDaysData && displayDates.length > 0 && (
        <div className="max-w-full mx-auto">
          {/* 时间轴网格 - 始终显示7列 */}
          <div className="grid grid-cols-7 gap-2 relative">
            {/* 加载更早数据触发区域 - 仅在最左侧显示 */}
            {dates.length < 30 && (
              <div
                className="absolute left-0 top-0 bottom-0 w-8 z-10 cursor-pointer"
                onMouseEnter={() => setShowLoadEarlier(true)}
                onMouseLeave={() => !loadingEarlier && setShowLoadEarlier(false)}
              >
                {showLoadEarlier && (
                  <div className="h-full flex items-center justify-center">
                    <button
                      onClick={handleLoadEarlierData}
                      disabled={loadingEarlier}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-3 rounded-l-lg shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-1"
                      title="加载更早的7天数据"
                    >
                      {loadingEarlier ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span className="text-2xs">加载中</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg">←</span>
                          <span className="text-2xs writing-mode-vertical">加载更早</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {displayDates.map((date, index) => {
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
                    <div
                      className="text-2xs opacity-90 mt-0.5 cursor-pointer hover:bg-white/10 rounded px-1.5 py-0.5 transition-colors"
                      onClick={() => handleWeekdayStocksClick(date)}
                      title="点击查看当天连板个股梯队"
                    >
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
              <li>• <span className="font-semibold bg-blue-100 px-1 rounded">新功能</span> <span className="font-semibold">鼠标悬停最左侧边缘</span>: 显示"← 加载更早"按钮，点击可加载更早7天数据（最多保留1个月）</li>
              <li>• <span className="font-semibold bg-green-100 px-1 rounded">新功能</span> <span className="font-semibold">点击星期几</span>: 显示当天连板个股梯队（2板+），含溢价图表和成交额全局排名</li>
              <li>• <span className="font-semibold">点击日期头部</span>: 显示涨停数前5名板块及后续5天平均溢价</li>
              <li>• <span className="font-semibold">点击板块名称</span>: 查看该板块个股5天溢价图表和详情（含K线批量查看）</li>
              <li>• <span className="font-semibold">点击排行徽章</span>: 查看该板块7天涨停个股阶梯，点击日期可查看完整板块详情</li>
              <li>• <span className="font-semibold">点击涨停数</span>: 按板块分组显示当天所有涨停个股，每个板块标题有📈K按钮可批量查看K线</li>
              <li>• <span className="font-semibold">排序模式</span>: 右上角可切换"连板排序"或"涨幅排序"，影响所有个股列表和K线显示顺序</li>
              <li>• <span className="font-semibold bg-yellow-100 px-1 rounded">分时图说明</span>: "📊今日分时"显示实时数据，"📷当日分时"显示历史快照（需数据库支持，如无快照会显示提示）</li>
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

      {/* 连板个股梯队弹窗 - 新增 */}
      {showMultiBoardModal && multiBoardModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60]">
          <div className="bg-white rounded-xl p-4 max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* 弹窗头部 */}
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                📊 连板个股梯队 ({formatDate(multiBoardModalData.date)})
              </h3>
              <button
                onClick={closeMultiBoardModal}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 功能按钮区域 */}
            <div className="mb-2 flex justify-between items-center">
              <div className="text-2xs text-gray-600">
                共 {multiBoardModalData.stocks.length} 只连板个股（2板及以上，已过滤ST），按{multiBoardModalSortMode === 'board' ? '连板数' : '5日累计溢价'}排序
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const sortedStocks = getSortedStocksForMultiBoard(multiBoardModalData.stocks, multiBoardModalSortMode);
                    // 转换为 StockPerformance[] 格式
                    const convertedStocks: StockPerformance[] = sortedStocks.map(s => ({
                      name: s.name,
                      code: s.code,
                      td_type: s.td_type,
                      limitUpTime: s.limitUpTime,
                      amount: s.amount,
                      performance: {},
                      total_return: 0
                    }));
                    setMinuteChartMode('realtime');
                    handleOpenMinuteModal('连板个股梯队', multiBoardModalData.date, convertedStocks);
                  }}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
                >
                  📊 今日分时
                </button>
                <button
                  onClick={() => {
                    const sortedStocks = getSortedStocksForMultiBoard(multiBoardModalData.stocks, multiBoardModalSortMode);
                    const convertedStocks: StockPerformance[] = sortedStocks.map(s => ({
                      name: s.name,
                      code: s.code,
                      td_type: s.td_type,
                      limitUpTime: s.limitUpTime,
                      amount: s.amount,
                      performance: {},
                      total_return: 0
                    }));
                    setMinuteChartMode('snapshot');
                    handleOpenMinuteModal('连板个股梯队', multiBoardModalData.date, convertedStocks);
                  }}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                >
                  📷 当日分时
                </button>
                <button
                  onClick={() => {
                    const sortedStocks = getSortedStocksForMultiBoard(multiBoardModalData.stocks, multiBoardModalSortMode);
                    const convertedStocks: StockPerformance[] = sortedStocks.map(s => ({
                      name: s.name,
                      code: s.code,
                      td_type: s.td_type,
                      limitUpTime: s.limitUpTime,
                      amount: s.amount,
                      performance: {},
                      total_return: 0
                    }));
                    handleOpenKlineModal('连板个股梯队', multiBoardModalData.date, convertedStocks);
                  }}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                >
                  📈 显示K线
                </button>
                <button
                  onClick={() => setShowOnly10PlusInMultiBoardModal(!showOnly10PlusInMultiBoardModal)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    showOnly10PlusInMultiBoardModal
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  {showOnly10PlusInMultiBoardModal ? '显示全部个股' : '显示涨幅>10%'}
                </button>
              </div>
            </div>

            {/* 分屏布局：左侧图表40%，右侧表格60% */}
            <div className="flex-1 flex gap-4 overflow-hidden">
              {/* 左侧：图表 */}
              <div className="w-2/5 border-r pr-4 overflow-auto">
                <h4 className="text-sm font-semibold mb-3 text-gray-800">📈 个股5天溢价趋势</h4>
                <div className="h-64">
                  {(() => {
                    // 准备图表数据 - 转换为 StockPremiumChart 需要的格式
                    const currentDateIndex = dates.indexOf(multiBoardModalData.date);
                    const next5Days = dates.slice(currentDateIndex + 1, currentDateIndex + 6);

                    if (next5Days.length === 0) {
                      return (
                        <div className="text-center text-gray-500 py-8">
                          暂无后续交易日数据
                        </div>
                      );
                    }

                    // 转换 multiBoardModalData.stocks 为 StockPerformance[] 格式
                    const convertedStocks: StockPerformance[] = getSortedStocksForMultiBoard(multiBoardModalData.stocks, multiBoardModalSortMode)
                      .filter(stock => {
                        if (!showOnly10PlusInMultiBoardModal) return true;
                        const totalReturn = Object.values(stock.followUpData).reduce((sum, val) => sum + val, 0);
                        return totalReturn > 10;
                      })
                      .map(s => ({
                        name: s.name,
                        code: s.code,
                        td_type: s.td_type,
                        limitUpTime: s.limitUpTime,
                        amount: s.amount,
                        performance: {},
                        total_return: 0
                      }));

                    // 构建 followUpData 格式
                    const followUpData: Record<string, Record<string, number>> = {};
                    multiBoardModalData.stocks.forEach(stock => {
                      followUpData[stock.code] = stock.followUpData;
                    });

                    return (
                      <StockPremiumChart
                        data={transformSectorStocksToChartData(
                          convertedStocks,
                          followUpData,
                          50,
                          next5Days
                        )}
                        config={{ height: 256, maxStocks: 50, showDailyMax: true }}
                      />
                    );
                  })()}
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
                      <th className="px-2 py-1.5 text-left text-2xs font-semibold text-gray-700">板块</th>
                      <th className="px-2 py-1.5 text-center text-2xs font-semibold text-gray-700">成交额</th>
                      {(() => {
                        const currentDateIndex = dates.indexOf(multiBoardModalData.date);
                        const next5Days = dates.slice(currentDateIndex + 1, currentDateIndex + 6);
                        return next5Days.map((followDate) => {
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
                    {/* 板块平均行 */}
                    <tr className="border-b bg-blue-50">
                      <th colSpan={5} className="px-2 py-1 text-right text-2xs text-blue-700">板块平均:</th>
                      {(() => {
                        const currentDateIndex = dates.indexOf(multiBoardModalData.date);
                        const next5Days = dates.slice(currentDateIndex + 1, currentDateIndex + 6);
                        return next5Days.map((followDate) => {
                          let totalPremium = 0;
                          let validCount = 0;
                          multiBoardModalData.stocks.forEach(stock => {
                            const performance = stock.followUpData[followDate];
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
                            multiBoardModalData.stocks.forEach(stock => {
                              const stockTotal = Object.values(stock.followUpData).reduce((sum, val) => sum + val, 0);
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
                    {getSortedStocksForMultiBoard(multiBoardModalData.stocks, multiBoardModalSortMode)
                      .filter(stock => {
                        if (!showOnly10PlusInMultiBoardModal) return true;
                        const totalReturn = Object.values(stock.followUpData).reduce((sum, val) => sum + val, 0);
                        return totalReturn > 10;
                      })
                      .map((stock, index) => {
                        const currentDateIndex = dates.indexOf(multiBoardModalData.date);
                        const next5Days = dates.slice(currentDateIndex + 1, currentDateIndex + 6);
                        const totalReturn = Object.values(stock.followUpData).reduce((sum, val) => sum + val, 0);
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
                                stock.boardNum >= 5 ? 'text-red-600' :
                                stock.boardNum >= 3 ? 'text-orange-600' :
                                'text-blue-600'
                              }`}>
                                {stock.boardNum}板
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-2xs text-gray-700">{stock.sectorName}</td>
                            <td className="px-2 py-1.5 text-center">
                              {(() => {
                                if (!stock.amount || stock.amount === 0) {
                                  return <span className="text-2xs text-gray-700">-</span>;
                                }

                                // 显示全局排名
                                let colorClass = 'text-2xs text-gray-700';
                                if (stock.globalAmountRank === 1) {
                                  colorClass = 'text-2xs px-1.5 py-0.5 rounded bg-stock-orange-600 text-white font-semibold';
                                } else if (stock.globalAmountRank === 2) {
                                  colorClass = 'text-2xs px-1.5 py-0.5 rounded bg-stock-orange-400 text-white font-medium';
                                }

                                return (
                                  <div className="flex flex-col items-center">
                                    <span className={colorClass}>
                                      {stock.amount.toFixed(2)}亿
                                    </span>
                                    {stock.globalAmountRank && stock.globalAmountRank <= 10 && (
                                      <span className="text-2xs text-gray-500">
                                        #{stock.globalAmountRank}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                            {next5Days.slice(0, 5).map((followDate, dayIndex) => {
                              const performance = stock.followUpData[followDate] || 0;
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

      {/* 单个个股图表查看弹窗 */}
      {showSingleStockChartModal && singleStockChartData && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[95]">
          <div className="bg-white rounded-xl p-6 w-[90vw] max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* 弹窗头部 */}
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {singleStockChartData.name} ({singleStockChartData.code})
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(singleStockChartData.date)}
                </p>
              </div>
              <button
                onClick={closeSingleStockChartModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            {/* 切换按钮 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSingleStockChartMode('kline')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  singleStockChartMode === 'kline'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📊 显示K线
              </button>
              <button
                onClick={() => setSingleStockChartMode('minute')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  singleStockChartMode === 'minute'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📈 显示分时
              </button>
            </div>

            {/* 图表显示区域 */}
            <div className="flex-1 overflow-auto flex justify-center items-center bg-gray-50 rounded-lg p-4">
              {singleStockChartMode === 'kline' ? (
                <img
                  src={`http://image.sinajs.cn/newchart/daily/${getStockCodeFormat(singleStockChartData.code)}.gif`}
                  alt={`${singleStockChartData.name}K线图`}
                  className="max-w-full h-auto rounded border border-gray-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjlmOWY5Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+S+e6v+WbvuWKoOi9veWけ+ihjTwvdGV4dD4KPC9zdmc+';
                  }}
                />
              ) : (
                <img
                  src={getMinuteChartUrl(singleStockChartData.code, 'snapshot', singleStockChartData.date)}
                  alt={`${singleStockChartData.name}分时图`}
                  className="max-w-full h-auto rounded border border-gray-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTUwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjlmOWY5Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5YiG5pe255Wq5Yqg6L295aSx6LSlPC90ZXh0Pgo8L3N2Zz4=';
                  }}
                />
              )}
            </div>

            {/* 底部提示 */}
            <div className="mt-4 text-xs text-gray-600 text-center">
              💡 点击按钮切换K线图或分时图 | 点击背景关闭
            </div>
          </div>
        </div>
      )}

      {/* 点击弹窗外部关闭 */}
      {showModal && (
        <div
          className="fixed inset-0 z-[95]"
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
      {showMultiBoardModal && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={closeMultiBoardModal}
        />
      )}
      {showSingleStockChartModal && (
        <div
          className="fixed inset-0 z-[90]"
          onClick={closeSingleStockChartModal}
        />
      )}
    </div>
  );
}