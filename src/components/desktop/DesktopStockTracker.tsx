'use client';

import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import {
  SevenDaysData,
  DayData,
  SectorSummary,
  StockPerformance,
  HighBoardStockTracker,
  LifecyclePoint,
  SectorHeightFilters
} from '@/types/stock';
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

  // 新增：7天板块高度弹窗状态
  const [showSectorHeightModal, setShowSectorHeightModal] = useState(false);

  // v4.8.31新增：15天数据加载标志（避免重复加载）
  const has15DaysDataLoaded = useRef(false);

  // v4.8.30新增：板块高度走势过滤器状态
  const [sectorHeightFilters, setSectorHeightFilters] = useState<SectorHeightFilters>({
    minBoardNum: 4,  // 默认显示≥4板
    selectedSectors: null  // v4.8.31修改：支持多板块（默认显示全部板块）
  });

  // v4.8.31新增：控制是否显示虚线（断板部分）及溢价标签
  const [showDashedLines, setShowDashedLines] = useState(true);

  // v4.8.31新增：控制叠加模式（可以选择多个板块）
  // v4.8.31修改：默认开启叠加模式，方便用户直接进行多板块对比
  const [overlayMode, setOverlayMode] = useState(true);


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

    // 前端缓存检查（localStorage）
    const cacheKey = `stock-7days-${range}-${getTodayString()}`;
    const CACHE_TTL = 5 * 60 * 1000; // 5分钟

    try {
      // 尝试从localStorage读取缓存
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const { data, dates: cachedDates, timestamp } = JSON.parse(cachedData);
        const age = Date.now() - timestamp;

        // 5分钟内复用缓存
        if (age < CACHE_TTL) {
          console.log(`[前端缓存] 命中缓存，缓存时间: ${Math.round(age / 1000)}秒前`);
          setSevenDaysData(data);
          setDates(cachedDates);
          setDateRange(range);
          setLoading(false);
          return;
        } else {
          console.log(`[前端缓存] 缓存已过期，重新获取数据`);
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (cacheError) {
      console.warn('[前端缓存] 读取缓存失败:', cacheError);
      // 缓存读取失败不影响正常流程，继续执行
    }

    try {
      const endDate = getTodayString();
      // v4.8.31优化：使用后端统一处理，支持range参数（7天或15天）
      const response = await fetch(`/api/stocks?date=${endDate}&mode=7days&range=${range}`);
      const result = await response.json();

      if (result.success) {
        setSevenDaysData(result.data);
        setDates(result.dates || []);
        setDateRange(range);

        // 存储到localStorage
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: result.data,
            dates: result.dates || [],
            timestamp: Date.now()
          }));
          console.log(`[前端缓存] ${range}天数据已缓存${result.cached ? '（来自后端缓存）' : ''}`);
        } catch (cacheError) {
          console.warn('[前端缓存] 存储缓存失败:', cacheError);
        }
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
    // v4.8.31修改：默认加载15天数据，而不是7天
    fetch7DaysData(15);
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
        // v4.29.6修复：使用getBoardWeight函数正确解析连板数（修复连板股票丢失bug）
        const boardNum = getBoardWeight(stock.td_type);

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

  // 打开15天板块高度弹窗
  const handleOpenSectorHeightModal = () => {
    // 直接打开弹窗，使用当前已有数据
    setShowSectorHeightModal(true);

    // v4.8.31优化：只在首次打开且数据不足15天时加载，避免重复刷新
    if (dates.length < 15 && !has15DaysDataLoaded.current) {
      console.log(`[15天板块高度] 当前有${dates.length}天数据，首次加载至15天`);
      has15DaysDataLoaded.current = true; // 标记为已加载
      // 不等待加载完成，让用户先看到现有数据
      fetch7DaysData(15).catch(err => {
        console.error('[15天板块高度] 后台加载失败:', err);
        has15DaysDataLoaded.current = false; // 加载失败，重置标志
      });
    }
  };

  // 关闭7天板块高度弹窗
  const closeSectorHeightModal = () => {
    setShowSectorHeightModal(false);
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

  // v4.8.30重构：从板块维度改为个股维度追踪
  // v4.8.31修复：拆分为未筛选版本（用于Legend）和筛选版本（用于图表）
  const getAllHighBoardStockTrackers = useMemo(() => {
    if (!sevenDaysData || !dates || dates.length === 0) return [];

    // Step 1: 收集所有高板股的首次4板日期和峰值信息
    const stockInfoMap = new Map<string, {
      stockCode: string;
      stockName: string;
      sectorName: string;
      firstHighBoardDate: string;  // 首次达到≥4板的日期
      peakBoardNum: number;
      peakDate: string;
    }>();

    dates.forEach(date => {
      const dayData = sevenDaysData[date];
      if (!dayData) return;

      Object.entries(dayData.categories).forEach(([sectorName, stocks]) => {
        // 排除"其他"和"ST板块"
        if (sectorName === '其他' || sectorName === 'ST板块') return;

        stocks.forEach(stock => {
          const boardNum = getBoardWeight(stock.td_type);

          // 只追踪≥4板的股票
          if (boardNum < 4) return;

          const key = stock.code;
          const existing = stockInfoMap.get(key);

          if (!existing) {
            // 首次出现，记录首次4板日期
            stockInfoMap.set(key, {
              stockCode: stock.code,
              stockName: stock.name,
              sectorName: sectorName,
              firstHighBoardDate: date,  // 首次≥4板的日期
              peakBoardNum: boardNum,
              peakDate: date
            });
          } else {
            // 更新峰值记录（如果当前板位更高）
            if (boardNum > existing.peakBoardNum) {
              existing.peakBoardNum = boardNum;
              existing.peakDate = date;
            }
          }
        });
      });
    });

    // Step 2: 为每只股票构建生命周期追踪数据（从首次4板开始）
    const trackers: HighBoardStockTracker[] = [];

    stockInfoMap.forEach((stockInfo) => {
      const { stockCode, stockName, sectorName, firstHighBoardDate, peakBoardNum, peakDate } = stockInfo;

      const lifecycle: LifecyclePoint[] = [];

      // 从首次4板日期开始追踪（而不是峰值日）
      const startDateIndex = dates.indexOf(firstHighBoardDate);
      if (startDateIndex === -1) return;

      let lastBoardNum = 0;
      let brokenCount = 0;
      const MAX_BROKEN_DAYS = 15; // v4.8.31修改：延长断板后追踪时间从5天到15天
      let lastRelativePosition = 0; // v4.8.31新增：追踪前一天的相对位置，用于虚线累积计算

      for (let i = startDateIndex; i < dates.length; i++) {
        const currentDate = dates[i];
        const dayData = sevenDaysData[currentDate];
        if (!dayData) break;

        // 检查股票是否在当天的涨停列表中
        const sectorStocks = dayData.categories[sectorName] || [];
        const stockInList = sectorStocks.find(s => s.code === stockCode);

        if (stockInList) {
          // 股票在涨停列表中 → 连续涨停
          const currentBoardNum = getBoardWeight(stockInList.td_type);

          lifecycle.push({
            date: currentDate,
            type: 'continuous',
            boardNum: currentBoardNum,
            isLatest: true,
            td_type: stockInList.td_type  // v4.8.31新增：保存td_type字段
          });

          lastBoardNum = currentBoardNum;
          lastRelativePosition = currentBoardNum; // v4.8.31新增：更新相对位置为当前板位
          brokenCount = 0;

        } else {
          // 股票不在涨停列表中 → 断板

          if (brokenCount >= MAX_BROKEN_DAYS) {
            lifecycle.push({
              date: currentDate,
              type: 'terminated',
              terminationReason: 'max_duration'
            });
            break;
          }

          // v4.8.31优化：从多个可能的基准日获取涨跌幅数据
          // 原逻辑只从峰值日/首次4板日获取，但followUpData只有后续5天
          // 新逻辑：遍历所有可能的基准日，找到包含目标日期的followUpData
          let changePercent: number | undefined = undefined;

          // 尝试1：从峰值日或首次4板日获取
          const baseDayData = sevenDaysData[peakDate] || sevenDaysData[firstHighBoardDate];
          const sectorFollowUpData = baseDayData?.followUpData[sectorName];
          const stockFollowUpData = sectorFollowUpData?.[stockCode];
          changePercent = stockFollowUpData?.[currentDate];

          // 尝试2：如果未找到，遍历所有已加载的日期，寻找包含目标日期的followUpData
          if (changePercent === undefined) {
            for (const baseDate of dates) {
              const dayData = sevenDaysData[baseDate];
              if (!dayData) continue;

              const sectorData = dayData.followUpData[sectorName];
              if (!sectorData) continue;

              const stockData = sectorData[stockCode];
              if (!stockData) continue;

              const foundChangePercent = stockData[currentDate];
              if (foundChangePercent !== undefined) {
                changePercent = foundChangePercent;
                console.log(`[15天板块高度] 从${baseDate}的followUpData找到${stockCode}在${currentDate}的涨跌幅: ${changePercent}%`);
                break;
              }
            }
          }

          if (changePercent !== undefined) {
            // v4.8.31修复：虚线累积计算 - 基于前一天的相对位置累加（而非一直用lastBoardNum）
            // 断板第1天：lastRelativePosition = lastBoardNum（连板终点）
            // 断板第2天：lastRelativePosition = 断板第1天位置
            // 断板第3天：lastRelativePosition = 断板第2天位置
            // 这样正溢价会越来越高，负溢价会越来越低
            const relativeBoardPosition = lastRelativePosition + (changePercent / 10);

            lifecycle.push({
              date: currentDate,
              type: 'broken',
              changePercent: changePercent,
              relativeBoardPosition: relativeBoardPosition
            });

            lastRelativePosition = relativeBoardPosition; // v4.8.31新增：更新相对位置为当前位置
            brokenCount++;
          } else {
            lifecycle.push({
              date: currentDate,
              type: 'terminated',
              terminationReason: 'data_unavailable'
            });
            break;
          }
        }
      }

      // 清理isLatest标记
      let lastContinuousIndex = -1;
      for (let i = lifecycle.length - 1; i >= 0; i--) {
        if (lifecycle[i].type === 'continuous') {
          lastContinuousIndex = i;
          break;
        }
      }
      lifecycle.forEach((point, idx) => {
        if (point.type === 'continuous') {
          point.isLatest = (idx === lastContinuousIndex);
        }
      });

      trackers.push({
        stockCode,
        stockName,
        sectorName,
        peakBoardNum,
        peakDate,
        lifecycle
      });
    });

    // Step 3: 排序（峰值板位降序 → 峰值日期升序 → 股票名称）
    trackers.sort((a, b) => {
      if (b.peakBoardNum !== a.peakBoardNum) {
        return b.peakBoardNum - a.peakBoardNum;
      }
      if (a.peakDate !== b.peakDate) {
        return a.peakDate.localeCompare(b.peakDate);
      }
      return a.stockName.localeCompare(b.stockName);
    });

    return trackers;
  }, [sevenDaysData, dates]);

  // v4.8.31新增：筛选后的高板股trackers（用于图表显示）
  const getHighBoardStockTrackers = useMemo(() => {
    let filteredTrackers = getAllHighBoardStockTrackers;

    // 板位过滤
    if (sectorHeightFilters.minBoardNum !== null) {
      filteredTrackers = filteredTrackers.filter(
        t => t.peakBoardNum >= sectorHeightFilters.minBoardNum!
      );
    }

    // 板块过滤 - v4.8.31修改：支持多板块选择
    if (sectorHeightFilters.selectedSectors !== null && sectorHeightFilters.selectedSectors.length > 0) {
      filteredTrackers = filteredTrackers.filter(
        t => sectorHeightFilters.selectedSectors!.includes(t.sectorName)
      );
    }

    return filteredTrackers;
  }, [getAllHighBoardStockTrackers, sectorHeightFilters]);

  // v4.8.30新增：获取所有板块名称（用于板块过滤器选项）
  const getAllSectorNames = useMemo(() => {
    if (!sevenDaysData || !dates) return [];

    const sectorSet = new Set<string>();

    dates.forEach(date => {
      const dayData = sevenDaysData[date];
      if (dayData && dayData.categories) {
        Object.keys(dayData.categories).forEach(sectorName => {
          // 排除"其他"和"ST板块"
          if (sectorName !== '其他' && sectorName !== 'ST板块') {
            sectorSet.add(sectorName);
          }
        });
      }
    });

    return Array.from(sectorSet).sort();
  }, [sevenDaysData, dates]);

  // v4.8.31新增：全局板块颜色映射（确保筛选前后颜色一致）
  const sectorColorMap = useMemo(() => {
    const colors = [
      '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
    ];

    const colorMap = new Map<string, string>();
    // v4.8.31修复：基于未筛选的getAllHighBoardStockTrackers创建颜色映射，确保颜色固定
    const allUniqueSectors = Array.from(new Set(getAllHighBoardStockTrackers.map(t => t.sectorName)));
    allUniqueSectors.sort(); // 排序确保一致性
    allUniqueSectors.forEach((sector, index) => {
      colorMap.set(sector, colors[index % colors.length]);
    });

    return colorMap;
  }, [getAllHighBoardStockTrackers]);

  // v4.8.30新增：性能优化 - 限制最大显示数量
  const MAX_DISPLAY_STOCKS = 30;
  const displayTrackers = useMemo(() => {
    if (getHighBoardStockTrackers.length <= MAX_DISPLAY_STOCKS) {
      return getHighBoardStockTrackers;
    }
    // 显示前30只，提示用户使用过滤器
    return getHighBoardStockTrackers.slice(0, MAX_DISPLAY_STOCKS);
  }, [getHighBoardStockTrackers]);

  // v4.8.31新增：计算Y轴最大值（用于生成连续刻度）
  const yAxisMaxValue = useMemo(() => {
    if (displayTrackers.length === 0) return 10;

    // 找到所有数据点的最大值（包括连板和断板）
    let max = 0;
    displayTrackers.forEach(tracker => {
      tracker.lifecycle.forEach(point => {
        if (point.type === 'continuous' && point.boardNum) {
          max = Math.max(max, point.boardNum);
        } else if (point.type === 'broken' && point.relativeBoardPosition) {
          max = Math.max(max, point.relativeBoardPosition);
        }
      });
    });

    // 向上取整到最近的整数，并加1作为缓冲
    return Math.ceil(max) + 1;
  }, [displayTrackers]);

  // v4.8.30新增：准备Recharts图表数据（个股维度）
  const prepareChartData = useMemo(() => {
    const chartData: any[] = [];

    dates.forEach((date, dateIndex) => {
      const dataPoint: any = {
        date: formatDate(date).slice(5), // MM-DD格式
        fullDate: date
      };

      displayTrackers.forEach(tracker => {
        const key = `${tracker.sectorName}_${tracker.stockName}`;
        const lifecyclePoint = tracker.lifecycle.find(lc => lc.date === date);

        if (!lifecyclePoint) {
          // 该股票在这个日期还未开始追踪
          dataPoint[`${key}_solid`] = null;
          dataPoint[`${key}_dashed`] = null;
        } else if (lifecyclePoint.type === 'continuous') {
          // 连续涨停 → 实线
          dataPoint[`${key}_solid`] = lifecyclePoint.boardNum;

          // v4.8.31修复：检查前一天是否断板，如果是则设置虚线终点连接到当前板位
          const prevDate = dates[dateIndex - 1];
          if (prevDate) {
            const prevPoint = tracker.lifecycle.find(lc => lc.date === prevDate);
            if (prevPoint && prevPoint.type === 'broken') {
              // 前一天断板，当前天涨停，设置虚线终点连接到当前板位
              dataPoint[`${key}_dashed`] = lifecyclePoint.boardNum;
            }
          }

          // v4.8.31修复：检查下一天是否断板，如果是则设置虚线起点
          const nextDate = dates[dateIndex + 1];
          if (nextDate) {
            const nextPoint = tracker.lifecycle.find(lc => lc.date === nextDate);
            if (nextPoint && nextPoint.type === 'broken') {
              // 下一天断板，设置虚线起点为当前板位
              dataPoint[`${key}_dashed`] = lifecyclePoint.boardNum;
            } else if (!dataPoint[`${key}_dashed`]) {
              // 如果没有设置虚线值（前一天不是断板），则设为null
              dataPoint[`${key}_dashed`] = null;
            }
          } else if (!dataPoint[`${key}_dashed`]) {
            dataPoint[`${key}_dashed`] = null;
          }
        } else if (lifecyclePoint.type === 'broken') {
          // 断板 → 虚线（使用累积计算后的相对位置）
          dataPoint[`${key}_solid`] = null;
          dataPoint[`${key}_dashed`] = lifecyclePoint.relativeBoardPosition;
        } else {
          // 终止 → null
          dataPoint[`${key}_solid`] = null;
          dataPoint[`${key}_dashed`] = null;
        }
      });

      chartData.push(dataPoint);
    });

    return chartData;
  }, [displayTrackers, dates]);


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
      {/* 7天板块高度弹窗 - 新增 */}
      {showSectorHeightModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          {/* v4.8.31优化：弹窗接近全屏，高度自适应，不需要滚动 */}
          <div className="bg-white rounded-xl p-4 w-[98vw] max-w-[98vw] h-[96vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-base font-bold text-gray-900">
                📊 近15天板块高度走势（最高板≥4）
              </h3>
              <button
                onClick={closeSectorHeightModal}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            {/* v4.8.31优化：板位过滤器区域（紧凑显示） */}
            <div className="mb-2 flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-700">板位过滤：</label>
                <select
                  value={sectorHeightFilters.minBoardNum ?? 'all'}
                  onChange={(e) => {
                    const value = e.target.value === 'all' ? null : parseInt(e.target.value);
                    setSectorHeightFilters(prev => ({ ...prev, minBoardNum: value }));
                  }}
                  className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">全部</option>
                  <option value="4">≥4板</option>
                  <option value="5">≥5板</option>
                  <option value="6">≥6板</option>
                  <option value="7">≥7板</option>
                  <option value="8">≥8板</option>
                </select>
              </div>

              <button
                onClick={() => setShowDashedLines(!showDashedLines)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  showDashedLines
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                {showDashedLines ? '隐藏断板数据' : '显示断板数据'}
              </button>

              <button
                onClick={() => setOverlayMode(!overlayMode)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  overlayMode
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
                title="开启后可以同时选择多个板块进行对比"
              >
                {overlayMode ? '叠加模式' : '单选模式'}
              </button>

              <div className="ml-auto text-xs text-gray-600">
                共追踪 <span className="font-bold text-blue-600">{getHighBoardStockTrackers.length}</span> 只高板股
              </div>
            </div>

            {/* v4.8.31优化：超量提示（紧凑显示） */}
            {getHighBoardStockTrackers.length > MAX_DISPLAY_STOCKS && (
              <div className="mb-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-800 flex-shrink-0">
                <strong>💡 提示：</strong>共有 <strong>{getHighBoardStockTrackers.length}</strong> 只股票，当前显示前 <strong>{MAX_DISPLAY_STOCKS}</strong> 只。请使用板位或板块过滤器缩小范围。
              </div>
            )}

            {/* v4.8.31优化：图表区域 - 使用flex-1自动填充剩余空间，无需手动设置高度 */}
            <div className="flex-1 overflow-hidden">
              {displayTrackers.length > 0 ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 h-full flex flex-col">
                  {/* v4.8.31优化：图表使用100%高度自适应 */}
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={prepareChartData}
                      margin={{ top: 40, right: 100, bottom: 30, left: 80 }}
                    >
                      {/* v4.8.31优化：网格背景增强为清晰的方格网格 */}
                      {/* v4.8.31修改：增强横线可见性，方便查看板块高度 */}
                      <CartesianGrid
                        stroke="#6b7280"
                        strokeWidth={1}
                        horizontal={true}
                        vertical={true}
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        label={{ value: '日期', position: 'insideBottom', offset: -10, fontSize: 12 }}
                      />
                      {/* v4.8.31优化：Y轴使用连续整数刻度，方便对位置 */}
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11 }}
                        domain={[0, yAxisMaxValue]}
                        ticks={Array.from({ length: yAxisMaxValue + 1 }, (_, i) => i)}
                        label={{
                          value: '板位高度 / 相对坐标',
                          angle: -90,
                          position: 'insideLeft',
                          style: { fontSize: 12, fontWeight: 'bold' }
                        }}
                      />
                      <Legend
                        wrapperStyle={{
                          paddingTop: '15px',
                          fontSize: '11px',
                          maxHeight: '120px',
                          overflowY: 'auto',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '8px',
                          display: 'flex',
                          justifyContent: 'center'  // v4.8.31修复：使用flex布局居中
                        }}
                        iconType="line"
                        content={(props: any) => {
                          // v4.8.31修复：Legend显示所有可选板块（未筛选），确保叠加模式可以选择多个板块
                          const allUniqueSectors = Array.from(new Set(getAllHighBoardStockTrackers.map((t: any) => t.sectorName)));
                          allUniqueSectors.sort(); // 排序保持一致性

                          return (
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px',
                              justifyContent: 'center',
                              alignItems: 'center',
                              width: '100%'
                            }}>
                              {allUniqueSectors.map((sector: string) => {
                                const color = sectorColorMap.get(sector) || '#ef4444';
                                // v4.8.31修改：支持多板块选择
                                const isSelected = sectorHeightFilters.selectedSectors?.includes(sector) || false;

                                return (
                                  <div
                                    key={sector}
                                    onClick={() => {
                                      // v4.8.31新增：叠加模式支持多选
                                      if (overlayMode) {
                                        // 叠加模式：可以选择多个板块
                                        const currentSectors = sectorHeightFilters.selectedSectors || [];
                                        if (isSelected) {
                                          // 已选中，移除该板块
                                          const newSectors = currentSectors.filter(s => s !== sector);
                                          setSectorHeightFilters(prev => ({
                                            ...prev,
                                            selectedSectors: newSectors.length > 0 ? newSectors : null
                                          }));
                                        } else {
                                          // 未选中，添加该板块
                                          setSectorHeightFilters(prev => ({
                                            ...prev,
                                            selectedSectors: [...currentSectors, sector]
                                          }));
                                        }
                                      } else {
                                        // 单选模式：只显示一个板块
                                        if (isSelected) {
                                          // 如果已选中，则取消选择（显示全部）
                                          setSectorHeightFilters(prev => ({ ...prev, selectedSectors: null }));
                                        } else {
                                          // 选中该板块
                                          setSectorHeightFilters(prev => ({ ...prev, selectedSectors: [sector] }));
                                        }
                                      }
                                    }}
                                    style={{
                                      display: 'inline-flex',  // v4.8.31修复：使用inline-flex避免占满整行
                                      alignItems: 'center',
                                      gap: '4px',
                                      cursor: 'pointer',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      backgroundColor: isSelected ? color : 'transparent',
                                      color: isSelected ? '#fff' : '#374151',
                                      border: `1px solid ${color}`,
                                      fontWeight: isSelected ? 'bold' : 'normal',
                                      transition: 'all 0.2s',
                                      fontSize: '11px',
                                      whiteSpace: 'nowrap'  // 防止换行
                                    }}
                                    onMouseEnter={(e: any) => {
                                      if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = color + '20';
                                      }
                                    }}
                                    onMouseLeave={(e: any) => {
                                      if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: '16px',
                                        height: '2px',
                                        backgroundColor: color,
                                        display: 'inline-block'
                                      }}
                                    />
                                    <span>{sector}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: '11px', maxHeight: '400px', overflowY: 'auto' }}
                        content={(props: any) => {
                          if (!props.active || !props.payload || props.payload.length === 0) {
                            return null;
                          }

                          // v4.8.31修复：使用 payload 中的 fullDate 而不是 label（短日期）
                          const currentDateShort = props.label; // MM-DD 格式
                          const fullDateEntry = props.payload.find((p: any) => p.payload?.fullDate);
                          const currentDate = fullDateEntry?.payload?.fullDate || currentDateShort; // 完整日期格式

                          // v4.8.31修复：使用Map去重，同一股票只显示一次（优先显示连板状态）
                          const itemsMap = new Map<string, any>();

                          props.payload.forEach((entry: any) => {
                            if (entry.value === null || entry.value === undefined) return;

                            // 从dataKey中提取股票信息
                            const dataKey = entry.dataKey as string;
                            const isDashed = dataKey.endsWith('_dashed');
                            const isSolid = dataKey.endsWith('_solid');

                            if (!isDashed && !isSolid) return;

                            // 提取板块和股票名
                            const keyParts = dataKey.replace('_solid', '').replace('_dashed', '');
                            const tracker = displayTrackers.find(t =>
                              `${t.sectorName}_${t.stockName}` === keyParts
                            );

                            if (!tracker) {
                              return;
                            }

                            // v4.8.31修复：使用完整日期进行匹配
                            const lifecyclePoint = tracker.lifecycle.find(lc => lc.date === currentDate);
                            if (!lifecyclePoint) {
                              return;
                            }

                            let displayText = '';

                            if (lifecyclePoint.type === 'continuous' && lifecyclePoint.td_type) {
                              // 连板：解析td_type
                              const td_type = lifecyclePoint.td_type;
                              const continuousMatch = td_type.match(/^(\d+)连板$/);
                              const multiDayMatch = td_type.match(/^(\d+)天(\d+)板$/);

                              if (continuousMatch) {
                                // X连板
                                displayText = `${tracker.sectorName} ${tracker.stockName}${continuousMatch[1]}`;
                              } else if (multiDayMatch) {
                                // X天Y板
                                displayText = `${tracker.sectorName} ${tracker.stockName}${multiDayMatch[1]}-${multiDayMatch[2]}`;
                              } else {
                                displayText = `${tracker.sectorName} ${tracker.stockName}${entry.value}板`;
                              }
                            } else if (lifecyclePoint.type === 'broken' && lifecyclePoint.changePercent !== undefined) {
                              // 断板：显示溢价
                              const percent = lifecyclePoint.changePercent;
                              const sign = percent > 0 ? '+' : '';
                              displayText = `${tracker.sectorName} ${tracker.stockName} ${sign}${percent.toFixed(1)}%`;
                            } else if (lifecyclePoint.type === 'continuous') {
                              // 连板但没有td_type，使用板位
                              displayText = `${tracker.sectorName} ${tracker.stockName} ${entry.value}板`;
                            }

                            if (displayText) {
                              // 使用股票唯一key，优先保留solid（连板状态）
                              const stockKey = `${tracker.sectorName}_${tracker.stockName}`;
                              if (!itemsMap.has(stockKey) || isSolid) {
                                itemsMap.set(stockKey, {
                                  color: entry.color,
                                  text: displayText
                                });
                              }
                            }
                          });

                          const items = Array.from(itemsMap.values());

                          return (
                            <div style={{
                              backgroundColor: 'white',
                              border: '1px solid #ccc',
                              padding: '10px',
                              borderRadius: '4px',
                              fontSize: '11px'
                            }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{currentDateShort}</div>
                              {items.length === 0 ? (
                                <div style={{ color: '#999' }}>无数据</div>
                              ) : (
                                items.map((item, index) => (
                                  <div
                                    key={index}
                                    style={{
                                      color: item.color,
                                      marginBottom: '4px',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <span style={{
                                      width: '10px',
                                      height: '10px',
                                      backgroundColor: item.color,
                                      display: 'inline-block',
                                      marginRight: '6px',
                                      borderRadius: '2px'
                                    }} />
                                    {item.text}
                                  </div>
                                ))
                              )}
                            </div>
                          );
                        }}
                      />

                      {/* 为每只股票渲染两条线（实线+虚线） */}
                      {(() => {
                        // v4.8.31优化：使用全局颜色映射，确保筛选前后颜色一致
                        return displayTrackers.map((tracker, index) => {
                          const key = `${tracker.sectorName}_${tracker.stockName}`;
                          const color = sectorColorMap.get(tracker.sectorName) || '#ef4444';

                          return (
                            <Fragment key={tracker.stockCode}>
                              {/* v4.8.31修复：实线和虚线统一使用 left Y轴，确保连接 */}
                              {/* 实线：连续涨停期间 */}
                              <Line
                                yAxisId="left"
                                type="linear"
                                dataKey={`${key}_solid`}
                                stroke={color}
                                strokeWidth={2.5}
                                dot={{ fill: color, r: 4 }}
                                name={`${tracker.sectorName} ${tracker.stockName} 峰值${tracker.peakBoardNum}板`}
                                connectNulls={false}
                                label={(props: any) => {
                                  const { x, y, value, index: dataIndex } = props;
                                  if (value === null || value === undefined) return null;

                                  // 只在最新涨停日显示标记
                                  const currentDate = dates[dataIndex];
                                  const lifecyclePoint = tracker.lifecycle.find(lc => lc.date === currentDate);

                                  if (lifecyclePoint?.type === 'continuous' && lifecyclePoint.isLatest && lifecyclePoint.td_type) {
                                    // v4.8.31修复：直接从lifecyclePoint.td_type读取
                                    const td_type = lifecyclePoint.td_type;

                                    // 解析 td_type 字段
                                    // 匹配 "X连板" 格式
                                    const continuousMatch = td_type.match(/^(\d+)连板$/);
                                    // 匹配 "X天Y板" 格式
                                    const multiDayMatch = td_type.match(/^(\d+)天(\d+)板$/);

                                    let labelText = '';
                                    if (continuousMatch) {
                                      // X连板 → 显示"股票名X"
                                      const boardNum = continuousMatch[1];
                                      labelText = `${tracker.sectorName} ${tracker.stockName}${boardNum}`;
                                    } else if (multiDayMatch) {
                                      // X天Y板 → 显示"股票名X-Y"
                                      const days = multiDayMatch[1];
                                      const boards = multiDayMatch[2];
                                      labelText = `${tracker.sectorName} ${tracker.stockName}${days}-${boards}`;
                                    } else {
                                      // 兜底：使用当前板位
                                      labelText = `${tracker.sectorName} ${tracker.stockName}${value}`;
                                    }

                                    return (
                                      <text
                                        x={x}
                                        y={y - 15}
                                        textAnchor="middle"
                                        fill={color}
                                        fontSize="10"
                                        fontWeight="700"
                                      >
                                        {labelText}
                                      </text>
                                    );
                                  }
                                  return null;
                                }}
                              />

                              {/* 虚线：断板后 - 根据showDashedLines状态控制显示 */}
                              {showDashedLines && (
                                <Line
                                  yAxisId="left"
                                  type="linear"
                                  dataKey={`${key}_dashed`}
                                  stroke={color}
                                  strokeWidth={2}
                                  strokeDasharray="5 5"
                                  strokeOpacity={0.5}
                                  dot={{ fill: color, r: 3, fillOpacity: 0.5 }}
                                  name={`${tracker.sectorName} ${tracker.stockName} 虚线`}
                                  connectNulls={false}
                                  label={(props: any) => {
                                    const { x, y, value, index: dataIndex } = props;
                                    if (value === null || value === undefined) return null;

                                    const currentDate = dates[dataIndex];
                                    const lifecyclePoint = tracker.lifecycle.find(lc => lc.date === currentDate);

                                    if (lifecyclePoint?.type === 'broken' && lifecyclePoint.changePercent !== undefined) {
                                      const changePercent = lifecyclePoint.changePercent;
                                      return (
                                        <text
                                          x={x}
                                          y={y - 8}
                                          textAnchor="middle"
                                          fill="#6b7280"
                                          fontSize="9"
                                          fontWeight="600"
                                        >
                                          {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                                        </text>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                              )}
                            </Fragment>
                          );
                        });
                      })()}
                    </LineChart>
                  </ResponsiveContainer>
                  </div>

                  {/* v4.8.31优化：说明文字紧凑显示，不占用过多空间 */}
                  <div className="mt-2 bg-blue-50 rounded-lg p-1.5 border border-blue-200 flex-shrink-0">
                    <div className="text-blue-700 text-[10px] flex flex-wrap gap-x-3">
                      <span>• <strong>实线</strong>：连续涨停（Y=板位）</span>
                      <span>• <strong>虚线</strong>：断板后（Y=相对位置，±10%=±1）</span>
                      <span>• <strong>峰值标记</strong>：板块 个股 板位</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-3">📊</div>
                  <p className="text-base font-semibold">暂无数据</p>
                  <p className="text-xs mt-1">15天内没有符合过滤条件的高板股</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

            {/* 7天板块高度按钮 - 新增 */}
            <button
              type="button"
              onClick={handleOpenSectorHeightModal}
              disabled={loading || !sevenDaysData}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              📊 15天板块高度
            </button>

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
                                {stock.td_type}
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
      {showSectorHeightModal && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeSectorHeightModal}
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