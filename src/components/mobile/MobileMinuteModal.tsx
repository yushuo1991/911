'use client';

import { useState, useRef, useEffect } from 'react';
import MobileModal from './MobileModal';
import { StockPerformance } from '@/types/stock';

/**
 * 移动端分时图弹窗
 *
 * 功能：
 * - 支持实时分时图和历史快照两种模式
 * - 分页展示多只股票
 * - 左右滑动切换股票
 * - 图片懒加载和错误处理
 * - 模式切换（今日分时/当日分时）
 */

interface MobileMinuteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectorName: string;
  date: string;
  stocks: StockPerformance[];
  mode?: 'realtime' | 'snapshot';
  initialPage?: number;
  onModeChange?: (mode: 'realtime' | 'snapshot') => void;
}

export default function MobileMinuteModal({
  isOpen,
  onClose,
  sectorName,
  date,
  stocks,
  mode = 'realtime',
  initialPage = 0,
  onModeChange,
}: MobileMinuteModalProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentMode, setCurrentMode] = useState(mode);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // 重置状态当弹窗打开或模式改变时
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(initialPage);
      setCurrentMode(mode);
      setImageLoaded({});
      setImageError({});
    }
  }, [isOpen, initialPage, mode]);

  // 当前股票
  const currentStock = stocks[currentPage];

  // 分时图URL
  const getMinuteChartUrl = (stockCode: string, chartMode: 'realtime' | 'snapshot'): string => {
    if (chartMode === 'snapshot') {
      // 从数据库读取历史快照
      return `/api/minute-snapshot?date=${date}&code=${stockCode}&t=${Date.now()}`;
    } else {
      // 从新浪API读取实时分时图
      const codeFormat = stockCode.startsWith('6') ? `sh${stockCode}` : `sz${stockCode}`;
      return `http://image.sinajs.cn/newchart/min/n/${codeFormat}.gif?t=${Date.now()}`;
    }
  };

  // 切换模式
  const handleModeChange = (newMode: 'realtime' | 'snapshot') => {
    setCurrentMode(newMode);
    setImageLoaded({});
    setImageError({});
    onModeChange?.(newMode);
  };

  // 处理触摸事件（左右滑动切换）
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const deltaX = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (deltaX > threshold && currentPage < stocks.length - 1) {
      handleNext();
    } else if (deltaX < -threshold && currentPage > 0) {
      handlePrev();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // 上一页
  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 下一页
  const handleNext = () => {
    if (currentPage < stocks.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 图片加载成功
  const handleImageLoad = (key: string) => {
    setImageLoaded(prev => ({ ...prev, [key]: true }));
    setImageError(prev => ({ ...prev, [key]: false }));
  };

  // 图片加载失败
  const handleImageError = (key: string) => {
    setImageLoaded(prev => ({ ...prev, [key]: false }));
    setImageError(prev => ({ ...prev, [key]: true }));
  };

  if (!currentStock) {
    return null;
  }

  const imageKey = `${currentPage}-${currentMode}`;

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={`分时图 - ${sectorName}`}
      size="large"
      headerActions={
        <div className="text-xs text-gray-600">
          {currentPage + 1} / {stocks.length}
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* 股票信息 + 模式切换 */}
        <div className="flex-shrink-0 bg-gradient-to-r from-green-50 to-green-100 p-4 border-b border-gray-200">
          {/* 模式切换按钮 */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => handleModeChange('realtime')}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentMode === 'realtime'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              📊 今日分时
            </button>
            <button
              onClick={() => handleModeChange('snapshot')}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentMode === 'snapshot'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              📷 当日分时
            </button>
          </div>

          {/* 股票信息 */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{currentStock.name}</h3>
              <div className="text-xs text-gray-600 mt-0.5">{currentStock.code}</div>
            </div>
            <div className="text-right">
              <div className={`px-2 py-1 rounded text-xs font-bold ${
                currentStock.td_type?.includes('首板') ? 'bg-blue-100 text-blue-700' :
                currentStock.td_type?.includes('二板') ? 'bg-green-100 text-green-700' :
                currentStock.td_type?.includes('三板') || currentStock.td_type?.includes('四板') ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {currentStock.td_type}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xs text-gray-600">涨停时间</div>
              <div className="text-sm font-semibold text-gray-900 mt-0.5">
                {currentStock.limitUpTime || '--'}
              </div>
            </div>
            <div>
              <div className="text-2xs text-gray-600">成交额</div>
              <div className="text-sm font-semibold text-gray-900 mt-0.5">
                {currentStock.amount ? `${(currentStock.amount / 100000000).toFixed(1)}亿` : '--'}
              </div>
            </div>
            <div>
              <div className="text-2xs text-gray-600">5日溢价</div>
              <div className={`text-sm font-semibold mt-0.5 ${
                (currentStock.total_return || 0) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {currentStock.total_return ? `${currentStock.total_return > 0 ? '+' : ''}${currentStock.total_return.toFixed(1)}%` : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* 分时图区域 */}
        <div
          className="flex-1 flex items-center justify-center bg-white p-4 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 加载中 */}
          {!imageLoaded[imageKey] && !imageError[imageKey] && (
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-3"></div>
              <div className="text-sm text-gray-600">
                加载{currentMode === 'realtime' ? '实时' : '历史'}分时图中...
              </div>
            </div>
          )}

          {/* 加载错误 */}
          {imageError[imageKey] && (
            <div className="text-center">
              <div className="text-5xl mb-3">📊</div>
              <div className="text-gray-600 mb-2">分时图加载失败</div>
              <div className="text-xs text-gray-500">
                {currentMode === 'snapshot'
                  ? '历史快照不存在，请尝试切换到"今日分时"'
                  : '可能是网络问题或数据源不可用'}
              </div>
              {currentMode === 'snapshot' && (
                <button
                  onClick={() => handleModeChange('realtime')}
                  className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                >
                  切换到今日分时
                </button>
              )}
            </div>
          )}

          {/* 分时图 */}
          <img
            src={getMinuteChartUrl(currentStock.code, currentMode)}
            alt={`${currentStock.name} 分时图`}
            className={`max-w-full max-h-full object-contain ${
              imageLoaded[imageKey] ? 'block' : 'hidden'
            }`}
            onLoad={() => handleImageLoad(imageKey)}
            onError={() => handleImageError(imageKey)}
          />
        </div>

        {/* 底部导航 */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between gap-3">
            {/* 上一页按钮 */}
            <button
              onClick={handlePrev}
              disabled={currentPage === 0}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              ← 上一只
            </button>

            {/* 页码指示器 */}
            <div className="flex gap-1">
              {stocks.slice(0, 5).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentPage ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
              {stocks.length > 5 && (
                <div className="text-xs text-gray-500 ml-1">
                  +{stocks.length - 5}
                </div>
              )}
            </div>

            {/* 下一页按钮 */}
            <button
              onClick={handleNext}
              disabled={currentPage === stocks.length - 1}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600 active:bg-green-700 transition-colors"
            >
              下一只 →
            </button>
          </div>

          {/* 提示文字 */}
          <div className="text-center text-2xs text-gray-400 mt-2">
            左右滑动可快速切换
          </div>
        </div>
      </div>
    </MobileModal>
  );
}
