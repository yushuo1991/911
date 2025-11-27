'use client';

import { useIsMobile } from '@/hooks/useMediaQuery';
import { useStockData } from '@/hooks/useStockData';
import MobileStockView from '@/components/mobile/MobileStockView';
import MobileSectorModal from '@/components/mobile/MobileSectorModal';
import MobileMultiBoardModal from '@/components/mobile/MobileMultiBoardModal';
import MobileKlineModal from '@/components/mobile/MobileKlineModal';
import MobileMinuteModal from '@/components/mobile/MobileMinuteModal';
import DesktopStockTracker from '@/components/desktop/DesktopStockTracker';
import { StockPerformance } from '@/types/stock';
import { useState } from 'react';
import { getBoardWeight } from '@/lib/utils';

/**
 * 主页面 - 响应式设计
 *
 * 根据屏幕尺寸自动切换：
 * - 移动端 (<768px): MobileStockView
 * - PC端 (≥768px): DesktopStockTracker (原有组件)
 */
export default function Home() {
  const isMobile = useIsMobile();
  const {
    sevenDaysData,
    dates,
    loading,
    error,
    fetch7DaysData,
    handleLoadEarlierData,
    refreshData,
  } = useStockData();

  // 移动端弹窗状态
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [selectedSectorData, setSelectedSectorData] = useState<{
    sectorName: string;
    date: string;
    stocks: StockPerformance[];
    followUpDates: string[];
  } | null>(null);

  const [showMultiBoardModal, setShowMultiBoardModal] = useState(false);
  const [multiBoardData, setMultiBoardData] = useState<{
    date: string;
    stocks: any[];
    followUpDates: string[];
  } | null>(null);

  const [showKlineModal, setShowKlineModal] = useState(false);
  const [klineData, setKlineData] = useState<{
    sectorName: string;
    date: string;
    stocks: StockPerformance[];
  } | null>(null);

  const [showMinuteModal, setShowMinuteModal] = useState(false);
  const [minuteData, setMinuteData] = useState<{
    sectorName: string;
    date: string;
    stocks: StockPerformance[];
    mode: 'realtime' | 'snapshot';
  } | null>(null);

  // 数据加载由 useStockData hook 自动处理，无需手动调用

  // 获取后续5日日期
  const getFollowUpDates = (currentDate: string): string[] => {
    const currentIndex = dates.indexOf(currentDate);
    if (currentIndex === -1) return [];
    return dates.slice(currentIndex + 1, currentIndex + 6);
  };

  // 处理板块点击（移动端）
  const handleSectorClick = (
    sectorName: string,
    date: string,
    stocks: StockPerformance[],
    followUpData: Record<string, Record<string, number>>
  ) => {
    // 将followUpData合并到stocks中
    const enrichedStocks = stocks.map(stock => ({
      ...stock,
      performance: followUpData[stock.code] || {},
      total_return: Object.values(followUpData[stock.code] || {}).reduce((sum, val) => sum + val, 0),
    }));

    setSelectedSectorData({
      sectorName,
      date,
      stocks: enrichedStocks,
      followUpDates: getFollowUpDates(date),
    });
    setShowSectorModal(true);
  };

  // 处理星期点击（连板梯队）
  const handleWeekdayClick = (date: string, weekday: string) => {
    const dayData = sevenDaysData?.[date];
    if (!dayData) return;

    // 收集所有2板及以上的个股
    const allStocks: any[] = [];
    Object.entries(dayData.categories).forEach(([sectorName, stocks]) => {
      stocks.forEach(stock => {
        const boardNum = getBoardWeight(stock.td_type);
        if (boardNum >= 2) {
          const followUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
          const total_return = Object.values(followUpData).reduce((sum, val) => sum + val, 0);

          allStocks.push({
            ...stock,
            sectorName,
            boardNum,
            globalAmountRank: null, // 可以计算全局排名
            followUpData,
            total_return,
          });
        }
      });
    });

    setMultiBoardData({
      date,
      stocks: allStocks,
      followUpDates: getFollowUpDates(date),
    });
    setShowMultiBoardModal(true);
  };

  // 处理K线查看
  const handleViewKline = (sectorName: string, date: string, stocks: StockPerformance[]) => {
    setKlineData({ sectorName, date, stocks });
    setShowKlineModal(true);
  };

  // 处理分时图查看
  const handleViewMinute = (sectorName: string, date: string, stocks: StockPerformance[], mode: 'realtime' | 'snapshot') => {
    setMinuteData({ sectorName, date, stocks, mode });
    setShowMinuteModal(true);
  };

  // PC端直接使用原组件
  if (!isMobile) {
    return <DesktopStockTracker />;
  }

  // 移动端使用新组件
  return (
    <>
      <MobileStockView
        sevenDaysData={sevenDaysData}
        dates={dates}
        loading={loading}
        error={error}
        onLoadMore={handleLoadEarlierData}
        onSectorClick={handleSectorClick}
        onWeekdayClick={handleWeekdayClick}
        onRefresh={refreshData}
        maxDays={30}
      />

      {/* 板块详情弹窗 */}
      {selectedSectorData && (
        <MobileSectorModal
          isOpen={showSectorModal}
          onClose={() => setShowSectorModal(false)}
          sectorName={selectedSectorData.sectorName}
          date={selectedSectorData.date}
          stocks={selectedSectorData.stocks}
          followUpDates={selectedSectorData.followUpDates}
          onStockClick={(stock) => console.log('Stock clicked:', stock)}
          onViewKline={() => {
            handleViewKline(selectedSectorData.sectorName, selectedSectorData.date, selectedSectorData.stocks);
            setShowSectorModal(false);
          }}
          onViewMinute={(mode) => {
            handleViewMinute(selectedSectorData.sectorName, selectedSectorData.date, selectedSectorData.stocks, mode);
            setShowSectorModal(false);
          }}
        />
      )}

      {/* 连板梯队弹窗 */}
      {multiBoardData && (
        <MobileMultiBoardModal
          isOpen={showMultiBoardModal}
          onClose={() => setShowMultiBoardModal(false)}
          date={multiBoardData.date}
          stocks={multiBoardData.stocks}
          followUpDates={multiBoardData.followUpDates}
          onStockClick={(stock) => console.log('Stock clicked:', stock)}
          onViewKline={() => {
            const stocks = multiBoardData.stocks.map(s => ({
              name: s.name,
              code: s.code,
              td_type: s.td_type,
              limitUpTime: s.limitUpTime,
              amount: s.amount,
              performance: {},
              total_return: s.total_return,
            }));
            handleViewKline('连板个股梯队', multiBoardData.date, stocks);
            setShowMultiBoardModal(false);
          }}
          onViewMinute={(mode) => {
            const stocks = multiBoardData.stocks.map(s => ({
              name: s.name,
              code: s.code,
              td_type: s.td_type,
              limitUpTime: s.limitUpTime,
              amount: s.amount,
              performance: {},
              total_return: s.total_return,
            }));
            handleViewMinute('连板个股梯队', multiBoardData.date, stocks, mode);
            setShowMultiBoardModal(false);
          }}
        />
      )}

      {/* K线图弹窗 */}
      {klineData && (
        <MobileKlineModal
          isOpen={showKlineModal}
          onClose={() => setShowKlineModal(false)}
          sectorName={klineData.sectorName}
          date={klineData.date}
          stocks={klineData.stocks}
        />
      )}

      {/* 分时图弹窗 */}
      {minuteData && (
        <MobileMinuteModal
          isOpen={showMinuteModal}
          onClose={() => setShowMinuteModal(false)}
          sectorName={minuteData.sectorName}
          date={minuteData.date}
          stocks={minuteData.stocks}
          mode={minuteData.mode}
        />
      )}
    </>
  );
}
