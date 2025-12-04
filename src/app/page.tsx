'use client';

import { useIsMobile } from '@/hooks/useMediaQuery';
import { useStockData } from '@/hooks/useStockData';
import MobileStockView from '@/components/mobile/MobileStockView';
import MobileSectorModal from '@/components/mobile/MobileSectorModal';
import MobileMultiBoardModal from '@/components/mobile/MobileMultiBoardModal';
import MobileKlineModal from '@/components/mobile/MobileKlineModal';
import MobileMinuteModal from '@/components/mobile/MobileMinuteModal';
import Mobile7DayRankingModal from '@/components/mobile/Mobile7DayRankingModal';
import MobileSector7DayLadderModal from '@/components/mobile/MobileSector7DayLadderModal';
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

  const [show7DayRankingModal, setShow7DayRankingModal] = useState(false);

  const [showSector7DayLadderModal, setShowSector7DayLadderModal] = useState(false);
  const [sector7DayLadderData, setSector7DayLadderData] = useState<{
    sectorName: string;
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

    // v4.29.4诊断：详细分析所有板块
    console.log(`[诊断v4.29.4] 日期: ${date}`);
    console.log(`[诊断] 所有板块:`, Object.keys(dayData.categories));

    // 统计被排除的板块
    const excludedSectorStocks: any[] = [];
    const includedSectorStocks: any[] = [];

    Object.entries(dayData.categories).forEach(([sectorName, stocks]) => {
      const isExcluded = sectorName === '其他' || sectorName === 'ST板块';
      console.log(`[诊断] 板块"${sectorName}" (${isExcluded ? '❌排除' : '✓包含'}): ${stocks.length}只股票`);
      stocks.forEach(s => {
        const boardNum = getBoardWeight(s.td_type);
        const stockInfo = { name: s.name, td_type: s.td_type, boardNum, sector: sectorName };
        if (isExcluded) {
          excludedSectorStocks.push(stockInfo);
        } else {
          includedSectorStocks.push(stockInfo);
        }
      });
    });

    console.log(`[诊断] 排除板块中的股票: ${excludedSectorStocks.length}只`, excludedSectorStocks.filter(s => s.boardNum >= 2));
    console.log(`[诊断] 包含板块中的股票: ${includedSectorStocks.length}只`);

    // 收集所有2板及以上的个股（过滤ST和其他板块）
    const allStocks: any[] = [];
    const filteredStocks: any[] = []; // 诊断：boardNum<2被过滤掉的股票
    Object.entries(dayData.categories)
      .filter(([sectorName]) => sectorName !== '其他' && sectorName !== 'ST板块')
      .forEach(([sectorName, stocks]) => {
        stocks.forEach(stock => {
          const boardNum = getBoardWeight(stock.td_type);
          // v4.29.4：增强诊断，显示td_type和解析出的boardNum
          if (stock.td_type.includes('连板') || stock.td_type.includes('天')) {
            console.log(`[诊断] ${stock.name} (${sectorName}): "${stock.td_type}" => boardNum=${boardNum}`);
          }

          if (boardNum >= 2) {
            const followUpData = dayData.followUpData[sectorName]?.[stock.code] || {};
            const total_return = Object.values(followUpData).reduce((sum, val) => sum + val, 0);

            allStocks.push({
              ...stock,
              sectorName,
              boardNum,
              globalAmountRank: null, // 可以计算全局排名
              performance: followUpData, // 修复：使用performance字段名
              total_return,
            });
          } else {
            filteredStocks.push({ name: stock.name, td_type: stock.td_type, boardNum });
          }
        });
      });

    console.log(`[诊断] 通过筛选的股票数量: ${allStocks.length}`);
    console.log(`[诊断] boardNum<2被过滤:`, filteredStocks);
    console.log(`[诊断] 通过筛选的股票详情:`, allStocks.map(s => ({
      name: s.name,
      td_type: s.td_type,
      boardNum: s.boardNum,
      sector: s.sectorName
    })));

    // v4.29.4：统计连板股票
    const lianbanStocks = allStocks.filter(s => s.td_type.includes('连板'));
    const tianbanStocks = allStocks.filter(s => s.td_type.includes('天') && s.td_type.includes('板'));
    console.log(`[诊断总结] 连板股票: ${lianbanStocks.length}只, X天Y板股票: ${tianbanStocks.length}只`);

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
        on7DayRanking={() => setShow7DayRankingModal(true)}
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

      {/* 7天排行弹窗 */}
      {sevenDaysData && (
        <Mobile7DayRankingModal
          isOpen={show7DayRankingModal}
          onClose={() => setShow7DayRankingModal(false)}
          sevenDaysData={sevenDaysData}
          dates={dates}
          onSectorClick={(sectorName) => {
            setSector7DayLadderData({ sectorName });
            setShowSector7DayLadderModal(true);
          }}
        />
      )}

      {/* 板块7天历史梯队弹窗 */}
      {sector7DayLadderData && sevenDaysData && (
        <MobileSector7DayLadderModal
          isOpen={showSector7DayLadderModal}
          onClose={() => setShowSector7DayLadderModal(false)}
          sectorName={sector7DayLadderData.sectorName}
          sevenDaysData={sevenDaysData}
          dates={dates}
          onDateClick={(sectorName, date, stocks) => {
            // 关闭7天梯队弹窗
            setShowSector7DayLadderModal(false);

            // 获取完整的板块数据并打开板块详情弹窗
            const dayData = sevenDaysData[date];
            if (dayData && dayData.categories[sectorName]) {
              const fullStocks = dayData.categories[sectorName];
              const followUpData = dayData.followUpData[sectorName] || {};
              handleSectorClick(sectorName, date, fullStocks, followUpData);
            }
          }}
        />
      )}
    </>
  );
}
