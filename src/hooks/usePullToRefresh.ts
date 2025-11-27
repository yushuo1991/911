import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * 下拉刷新Hook
 *
 * 功能：
 * - 检测下拉手势
 * - 显示刷新指示器
 * - 触发刷新回调
 * - 防止过度拉伸
 */

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number; // 触发刷新的最小距离
  maxPullDistance?: number; // 最大下拉距离
  resistance?: number; // 拉伸阻力系数
}

interface UsePullToRefreshReturn {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  containerRef: React.RefObject<HTMLDivElement>;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPullDistance = 150,
  resistance = 0.5,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const scrollTop = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container || isRefreshing) return;

    scrollTop.current = container.scrollTop;
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container || isRefreshing) return;

    // 只在滚动到顶部时允许下拉
    if (scrollTop.current > 0) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    // 只允许向下拉
    if (deltaY > 0) {
      // 应用阻力系数
      const distance = Math.min(
        deltaY * resistance,
        maxPullDistance
      );

      setPullDistance(distance);
      setIsPulling(distance > 0);

      // 阻止默认滚动行为
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [isRefreshing, resistance, maxPullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (isRefreshing) return;

    if (pullDistance >= threshold) {
      // 触发刷新
      setIsRefreshing(true);
      setIsPulling(false);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // 未达到阈值，回弹
      setIsPulling(false);
      setPullDistance(0);
    }

    startY.current = 0;
    currentY.current = 0;
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  // 重置状态
  useEffect(() => {
    if (!isRefreshing && !isPulling) {
      setPullDistance(0);
    }
  }, [isRefreshing, isPulling]);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
