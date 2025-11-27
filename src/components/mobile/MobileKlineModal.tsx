'use client';

import { useState, useRef, useEffect } from 'react';
import MobileModal from './MobileModal';
import { StockPerformance } from '@/types/stock';

/**
 * 移动端K线图弹窗
 *
 * 功能：
 * - 分页展示多只股票的K线图
 * - 左右滑动切换股票
 * - 图片懒加载和错误处理
 * - 显示股票基本信息
 */

interface MobileKlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectorName: string;
  date: string;
  stocks: StockPerformance[];
  initialPage?: number;
}

export default function MobileKlineModal({
  isOpen,
  onClose,
  sectorName,
  date,
  stocks,
  initialPage = 0,
}: MobileKlineModalProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // 重置状态当弹窗打开时
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(initialPage);
      setImageLoaded({});
      setImageError({});
    }
  }, [isOpen, initialPage]);

  // 当前股票
  const currentStock = stocks[currentPage];

  // K线图URL（使用新浪财经K线图）
  const getKlineUrl = (stockCode: string): string => {
    const codeFormat = stockCode.startsWith('6') ? `sh${stockCode}` : `sz${stockCode}`;
    return `http://image.sinajs.cn/newchart/daily/n/${codeFormat}.gif?t=${Date.now()}`;
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
    const threshold = 50; // 最小滑动距离

    if (deltaX > threshold && currentPage < stocks.length - 1) {
      // 向左滑动，下一页
      handleNext();
    } else if (deltaX < -threshold && currentPage > 0) {
      // 向右滑动，上一页
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
  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => ({ ...prev, [index]: true }));
    setImageError(prev => ({ ...prev, [index]: false }));
  };

  // 图片加载失败
  const handleImageError = (index: number) => {
    setImageLoaded(prev => ({ ...prev, [index]: false }));
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  if (!currentStock) {
    return null;
  }

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={`K线图 - ${sectorName}`}
      size="large"
      headerActions={
        <div className="text-xs text-gray-600">
          {currentPage + 1} / {stocks.length}
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* 股票信息卡片 */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-200">
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

        {/* K线图区域 */}
        <div
          className="flex-1 flex items-center justify-center bg-white p-4 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 加载中 */}
          {!imageLoaded[currentPage] && !imageError[currentPage] && (
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
              <div className="text-sm text-gray-600">加载K线图中...</div>
            </div>
          )}

          {/* 加载错误 */}
          {imageError[currentPage] && (
            <div className="text-center">
              <div className="text-5xl mb-3">📈</div>
              <div className="text-gray-600 mb-2">K线图加载失败</div>
              <div className="text-xs text-gray-500">可能是网络问题或数据源不可用</div>
            </div>
          )}

          {/* K线图 */}
          <img
            src={getKlineUrl(currentStock.code)}
            alt={`${currentStock.name} K线图`}
            className={`max-w-full max-h-full object-contain ${
              imageLoaded[currentPage] ? 'block' : 'hidden'
            }`}
            onLoad={() => handleImageLoad(currentPage)}
            onError={() => handleImageError(currentPage)}
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
                    index === currentPage ? 'bg-blue-500' : 'bg-gray-300'
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
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 active:bg-blue-700 transition-colors"
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
