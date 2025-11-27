'use client';

import { useState, useEffect } from 'react';
import { SevenDaysData } from '@/types/stock';
import { MobileStockViewProps } from '@/types/mobile';
import MobileDayCard from './MobileDayCard';
import MobileTrendPanel from './MobileTrendPanel';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

/**
 * 移动端股票数据垂直时间轴视图（完整版-带下拉刷新）
 */
export default function MobileStockView({
  sevenDaysData,
  dates,
  loading,
  error,
  onLoadMore,
  onSectorClick,
  onWeekdayClick,
  onRefresh,
  maxDays = 30,
}: MobileStockViewProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(
    new Set(dates.length > 0 ? [dates[0]] : [])
  );
  const [showLoadEarlier, setShowLoadEarlier] = useState(false);
  const [showTrendPanel, setShowTrendPanel] = useState(false); // 控制趋势面板显示

  // 下拉刷新
  const {
    isPulling,
    isRefreshing,
    pullDistance,
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = usePullToRefresh({
    onRefresh: async () => {
      await onRefresh?.();
    },
    threshold: 80,
    maxPullDistance: 120,
    resistance: 0.6,
  });

  useEffect(() => {
    if (dates.length > 0 && !expandedDates.has(dates[0])) {
      setExpandedDates(new Set([dates[0]]));
    }
  }, [dates]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      setShowLoadEarlier(container.scrollTop < 50);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggle = (date: string, expanded: boolean) => {
    const newExpanded = new Set(expandedDates);
    if (expanded) newExpanded.add(date);
    else newExpanded.delete(date);
    setExpandedDates(newExpanded);
  };

  const expandAll = () => setExpandedDates(new Set(dates));
  const collapseAll = () => setExpandedDates(new Set());
  const handleLoadEarlier = () => {
    if (!loading && dates.length < maxDays) onLoadMore?.();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">涨停板追踪</h1>
            <div className="text-xs text-gray-500 mt-0.5">
              {dates.length > 0 ? `最近${dates.length}天` : '暂无数据'}
            </div>
          </div>
          <button onClick={onRefresh} disabled={loading || isRefreshing}
            className="px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
            {loading || isRefreshing ? '加载中...' : '刷新'}
          </button>
        </div>
        <div className="px-4 pb-2 flex items-center gap-2">
          <button
            onClick={() => setShowTrendPanel(!showTrendPanel)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              showTrendPanel
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
            }`}
          >
            {showTrendPanel ? '▼ 收起趋势' : '📊 数据趋势'}
          </button>
          <button onClick={expandAll} className="flex-1 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 active:bg-gray-300 transition-colors">
            ▼ 全部展开
          </button>
          <button onClick={collapseAll} className="flex-1 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 active:bg-gray-300 transition-colors">
            ▶ 全部折叠
          </button>
        </div>
        {showLoadEarlier && dates.length < maxDays && (
          <div className="px-4 pb-2">
            <button onClick={handleLoadEarlier} disabled={loading}
              className="w-full px-3 py-2 text-sm font-medium bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 active:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">
              {loading ? '加载中...' : '← 加载更早数据'}
            </button>
          </div>
        )}
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3 relative"
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {(isPulling || isRefreshing) && (
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 ease-out z-20"
            style={{ height: isPulling ? `${pullDistance}px` : isRefreshing ? '60px' : '0px', opacity: isPulling || isRefreshing ? 1 : 0 }}>
            <div className="flex flex-col items-center">
              {isRefreshing ? (
                <>
                  <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="text-xs text-blue-600 mt-2 font-medium">刷新中...</div>
                </>
              ) : (
                <>
                  <div className={`text-2xl transition-transform ${pullDistance >= 80 ? 'rotate-180' : ''}`}>↓</div>
                  <div className="text-xs text-gray-600 mt-1">{pullDistance >= 80 ? '松开刷新' : '下拉刷新'}</div>
                </>
              )}
            </div>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <span className="text-lg">⚠️</span>
              <div>
                <div className="font-semibold">加载失败</div>
                <div className="text-sm mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}
        {loading && dates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <div className="text-gray-600 font-medium">正在加载数据...</div>
          </div>
        )}
        {!loading && dates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <div className="text-lg font-semibold text-gray-600">暂无数据</div>
            <div className="text-sm text-gray-500 mt-2">无法获取涨停数据，请稍后重试</div>
          </div>
        )}
        {dates.length > 0 && (
          <div className="space-y-3">
            {/* 数据趋势面板（可展开/收起） */}
            {showTrendPanel && (
              <div className="bg-gradient-to-b from-blue-50 to-white rounded-lg p-4 border-2 border-blue-200 shadow-md">
                <MobileTrendPanel sevenDaysData={sevenDaysData} dates={dates} />
              </div>
            )}

            {/* 日期卡片列表 */}
            {dates.map((date) => {
              const dayData = sevenDaysData?.[date];
              if (!dayData) return null;
              return (
                <MobileDayCard key={date} date={date} dayData={dayData}
                  isExpanded={expandedDates.has(date)} onToggle={handleToggle}
                  onSectorClick={onSectorClick} onWeekdayClick={onWeekdayClick} />
              );
            })}
          </div>
        )}
        {dates.length > 0 && (
          <div className="mt-6 mb-4 text-center">
            {dates.length >= maxDays ? (
              <div className="text-sm text-gray-500">已显示最多{maxDays}天数据</div>
            ) : (
              <button onClick={handleLoadEarlier} disabled={loading}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed">
                {loading ? '加载中...' : '加载更早数据 ↑'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
