import { useState, useCallback } from 'react';
import { StockPerformance, DayData } from '@/types/stock';

/**
 * Modal state management hook
 * Centralizes all modal states and handlers for the stock tracking app
 */
export const useModalState = () => {
  // ===== Stock K-line/Minute Chart Modal =====
  const [showModal, setShowModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{ name: string; code: string } | null>(null);

  // ===== Sector Detail Modal =====
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [selectedSectorData, setSelectedSectorData] = useState<{
    name: string;
    date: string;
    stocks: StockPerformance[];
    followUpData: Record<string, Record<string, number>>;
  } | null>(null);

  // ===== Date Modal (Top 5 Sectors) =====
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDateData, setSelectedDateData] = useState<{
    date: string;
    sectorData: {
      sectorName: string;
      avgPremiumByDay: Record<string, number>;
      stockCount: number;
      total5DayPremium: number;
    }[];
  } | null>(null);

  // ===== Sector Ranking Modal =====
  const [showSectorRankingModal, setShowSectorRankingModal] = useState(false);

  // ===== Weekday Modal (Board Analysis) =====
  const [showWeekdayModal, setShowWeekdayModal] = useState(false);
  const [selectedWeekdayData, setSelectedWeekdayData] = useState<{
    date: string;
    sectorData: { sectorName: string; avgPremium: number; stockCount: number }[];
    chartData?: { date: string; avgPremium: number; stockCount: number }[];
  } | null>(null);

  // ===== Stock Count Modal (All Stocks by Sector) =====
  const [showStockCountModal, setShowStockCountModal] = useState(false);
  const [selectedStockCountData, setSelectedStockCountData] = useState<{
    date: string;
    sectorData: { sectorName: string; stocks: any[]; avgPremium: number }[];
  } | null>(null);

  // ===== 7-Day Ladder Modal =====
  const [show7DayLadderModal, setShow7DayLadderModal] = useState(false);
  const [selected7DayLadderData, setSelected7DayLadderData] = useState<{
    sectorName: string;
    dailyBreakdown: { date: string; stocks: StockPerformance[] }[];
  } | null>(null);

  // ===== Date Column Detail Modal =====
  const [showDateColumnDetail, setShowDateColumnDetail] = useState(false);
  const [selectedDateColumnData, setSelectedDateColumnData] = useState<{
    date: string;
    stocks: StockPerformance[];
    followUpData: Record<string, Record<string, number>>;
  } | null>(null);

  // ===== K-line Batch Modal =====
  const [showKlineModal, setShowKlineModal] = useState(false);
  const [klineModalData, setKlineModalData] = useState<{
    sectorName: string;
    date: string;
    stocks: StockPerformance[];
  } | null>(null);
  const [klineModalPage, setKlineModalPage] = useState(0);

  // ===== Minute Chart Batch Modal =====
  const [showMinuteModal, setShowMinuteModal] = useState(false);
  const [minuteModalData, setMinuteModalData] = useState<{
    sectorName: string;
    date: string;
    stocks: StockPerformance[];
  } | null>(null);
  const [minuteModalPage, setMinuteModalPage] = useState(0);
  const [minuteChartMode, setMinuteChartMode] = useState<'realtime' | 'snapshot'>('realtime');

  // ===== Multi-Board Modal (连板个股梯队) =====
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

  // ===== Single Stock Chart Modal =====
  const [showSingleStockChartModal, setShowSingleStockChartModal] = useState(false);
  const [singleStockChartData, setSingleStockChartData] = useState<{
    name: string;
    code: string;
    date: string;
  } | null>(null);
  const [singleStockChartMode, setSingleStockChartMode] = useState<'kline' | 'minute'>('kline');

  // ===== Handler Functions =====

  // Stock modal handlers
  const handleStockClick = useCallback((stockName: string, stockCode: string) => {
    setSelectedStock({ name: stockName, code: stockCode });
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedStock(null);
  }, []);

  // Sector modal handlers
  const handleSectorClick = useCallback(
    (
      date: string,
      sectorName: string,
      stocks: StockPerformance[],
      followUpData: Record<string, Record<string, number>>
    ) => {
      setSelectedSectorData({ name: sectorName, date, stocks, followUpData });
      setShowSectorModal(true);
    },
    []
  );

  const closeSectorModal = useCallback(() => {
    setShowSectorModal(false);
    setSelectedSectorData(null);
  }, []);

  // Date modal handlers
  const closeDateModal = useCallback(() => {
    setShowDateModal(false);
    setSelectedDateData(null);
  }, []);

  // Sector ranking modal handlers
  const closeSectorRankingModal = useCallback(() => {
    setShowSectorRankingModal(false);
  }, []);

  // Weekday modal handlers
  const closeWeekdayModal = useCallback(() => {
    setShowWeekdayModal(false);
    setSelectedWeekdayData(null);
  }, []);

  // Stock count modal handlers
  const closeStockCountModal = useCallback(() => {
    setShowStockCountModal(false);
    setSelectedStockCountData(null);
  }, []);

  // 7-day ladder modal handlers
  const close7DayLadderModal = useCallback(() => {
    setShow7DayLadderModal(false);
    setSelected7DayLadderData(null);
  }, []);

  // Date column detail modal handlers
  const closeDateColumnDetail = useCallback(() => {
    setShowDateColumnDetail(false);
    setSelectedDateColumnData(null);
  }, []);

  // K-line modal handlers
  const handleOpenKlineModal = useCallback(
    (sectorName: string, date: string, stocks: StockPerformance[]) => {
      setKlineModalData({ sectorName, date, stocks });
      setKlineModalPage(0);
      setShowKlineModal(true);
    },
    []
  );

  const closeKlineModal = useCallback(() => {
    setShowKlineModal(false);
    setKlineModalData(null);
    setKlineModalPage(0);
  }, []);

  // Minute modal handlers
  const handleOpenMinuteModal = useCallback(
    (sectorName: string, date: string, stocks: StockPerformance[]) => {
      setMinuteModalData({ sectorName, date, stocks });
      setMinuteModalPage(0);
      setShowMinuteModal(true);
    },
    []
  );

  const closeMinuteModal = useCallback(() => {
    setShowMinuteModal(false);
    setMinuteModalData(null);
    setMinuteModalPage(0);
  }, []);

  // Multi-board modal handlers
  const closeMultiBoardModal = useCallback(() => {
    setShowMultiBoardModal(false);
    setMultiBoardModalData(null);
  }, []);

  // Single stock chart modal handlers
  const handleOpenSingleStockChart = useCallback((name: string, code: string, date: string) => {
    setSingleStockChartData({ name, code, date });
    setSingleStockChartMode('kline');
    setShowSingleStockChartModal(true);
  }, []);

  const closeSingleStockChartModal = useCallback(() => {
    setShowSingleStockChartModal(false);
    setSingleStockChartData(null);
  }, []);

  return {
    // Stock modal
    showModal,
    selectedStock,
    handleStockClick,
    closeModal,

    // Sector modal
    showSectorModal,
    selectedSectorData,
    handleSectorClick,
    closeSectorModal,
    setSelectedSectorData,
    setShowSectorModal,

    // Date modal
    showDateModal,
    selectedDateData,
    closeDateModal,
    setShowDateModal,
    setSelectedDateData,

    // Sector ranking modal
    showSectorRankingModal,
    closeSectorRankingModal,
    setShowSectorRankingModal,

    // Weekday modal
    showWeekdayModal,
    selectedWeekdayData,
    closeWeekdayModal,
    setShowWeekdayModal,
    setSelectedWeekdayData,

    // Stock count modal
    showStockCountModal,
    selectedStockCountData,
    closeStockCountModal,
    setShowStockCountModal,
    setSelectedStockCountData,

    // 7-day ladder modal
    show7DayLadderModal,
    selected7DayLadderData,
    close7DayLadderModal,
    setShow7DayLadderModal,
    setSelected7DayLadderData,

    // Date column detail modal
    showDateColumnDetail,
    selectedDateColumnData,
    closeDateColumnDetail,
    setShowDateColumnDetail,
    setSelectedDateColumnData,

    // K-line modal
    showKlineModal,
    klineModalData,
    klineModalPage,
    handleOpenKlineModal,
    closeKlineModal,
    setKlineModalPage,

    // Minute modal
    showMinuteModal,
    minuteModalData,
    minuteModalPage,
    minuteChartMode,
    handleOpenMinuteModal,
    closeMinuteModal,
    setMinuteModalPage,
    setMinuteChartMode,

    // Multi-board modal
    showMultiBoardModal,
    multiBoardModalData,
    closeMultiBoardModal,
    setShowMultiBoardModal,
    setMultiBoardModalData,

    // Single stock chart modal
    showSingleStockChartModal,
    singleStockChartData,
    singleStockChartMode,
    handleOpenSingleStockChart,
    closeSingleStockChartModal,
    setSingleStockChartMode,
  };
};
