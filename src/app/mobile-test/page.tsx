'use client';

import { useState } from 'react';
import MobileStockView from '@/components/mobile/MobileStockView';
import MobileModal from '@/components/mobile/MobileModal';
import MobileStockCard from '@/components/mobile/MobileStockCard';
import { SevenDaysData, DayData, StockPerformance } from '@/types/stock';
import { useStockData } from '@/hooks/useStockData';

/**
 * 移动端测试页面
 *
 * 用途：验证移动端组件功能
 * 访问路径：/mobile-test
 */
export default function MobileTestPage() {
  const {
    sevenDaysData,
    dates,
    loading,
    error,
    fetch7DaysData,
    handleLoadEarlierData,
    refreshData,
  } = useStockData();

  const [showSectorModal, setShowSectorModal] = useState(false);
  const [selectedSectorData, setSelectedSectorData] = useState<{
    sectorName: string;
    date: string;
    stocks: StockPerformance[];
  } | null>(null);

  // 初始加载数据
  useState(() => {
    fetch7DaysData();
  });

  // 处理板块点击
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
    });
    setShowSectorModal(true);
  };

  // 处理星期点击
  const handleWeekdayClick = (date: string, weekday: string) => {
    alert(`点击了 ${date} (${weekday})\n功能：查看连板个股梯队`);
  };

  // 获取后续5日日期
  const getFollowUpDates = (currentDate: string): string[] => {
    const currentIndex = dates.indexOf(currentDate);
    if (currentIndex === -1) return [];
    return dates.slice(currentIndex + 1, currentIndex + 6);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部说明 */}
      <div className="bg-blue-600 text-white p-4 text-center">
        <h1 className="text-xl font-bold mb-2">📱 移动端组件测试页面</h1>
        <p className="text-sm opacity-90">
          请使用手机或浏览器开发者工具的移动端模式访问
        </p>
      </div>

      {/* 移动端视图 */}
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
      <MobileModal
        isOpen={showSectorModal}
        onClose={() => setShowSectorModal(false)}
        title={`${selectedSectorData?.sectorName || '板块详情'}`}
        size="large"
      >
        <div className="p-4">
          {selectedSectorData && (
            <>
              {/* 头部统计 */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-2xs text-gray-600">个股数量</div>
                    <div className="text-lg font-bold text-blue-600">
                      {selectedSectorData.stocks.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xs text-gray-600">平均溢价</div>
                    <div className="text-lg font-bold text-green-600">
                      {(selectedSectorData.stocks.reduce((sum, s) => sum + (s.total_return || 0), 0) / selectedSectorData.stocks.length).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-2xs text-gray-600">日期</div>
                    <div className="text-sm font-semibold text-gray-700">
                      {selectedSectorData.date}
                    </div>
                  </div>
                </div>
              </div>

              {/* 个股列表 */}
              <div className="space-y-3">
                {selectedSectorData.stocks.map((stock, index) => (
                  <MobileStockCard
                    key={stock.code}
                    stock={stock}
                    date={selectedSectorData.date}
                    followUpDates={getFollowUpDates(selectedSectorData.date)}
                    showRanking={true}
                    ranking={index + 1}
                    onStockClick={(s) => alert(`点击了 ${s.name} (${s.code})\n功能：查看K线/分时图`)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </MobileModal>

      {/* 底部调试信息 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-2 text-2xs">
        <div className="flex justify-between items-center">
          <div>
            数据: {dates.length}天 | 加载: {loading ? '是' : '否'} | 错误: {error ? '是' : '否'}
          </div>
          <div>
            屏幕: {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '--'}
          </div>
        </div>
      </div>
    </div>
  );
}
