import { useState, useEffect, useCallback } from 'react';
import { SevenDaysData } from '@/types/stock';
import { getTodayString } from '@/lib/utils';

/**
 * Hook for managing 7-day stock data fetching and pagination
 * Handles data loading, caching, and historical data pagination
 */
export const useStockData = () => {
  const [sevenDaysData, setSevenDaysData] = useState<SevenDaysData | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [dateRange, setDateRange] = useState(7); // Current display range (default 7 days)
  const [currentPage, setCurrentPage] = useState(0); // Current page (0 = latest 7 days)

  /**
   * Fetch 7-day stock data from API
   * Supports fetching multiple 7-day segments for historical data (max 30 days)
   *
   * @param range - Number of days to fetch (7, 14, 21, or 30)
   */
  const fetch7DaysData = useCallback(async (range: number = 7) => {
    setLoading(true);
    setError(null);

    try {
      const endDate = getTodayString();
      // Get base URL for fetch - use window.location.origin in browser, or empty for server-side
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

      // If range <= 7, single API call
      if (range <= 7) {
        const response = await fetch(`${baseUrl}/api/stocks?date=${endDate}&mode=7days`);
        const result = await response.json();

        if (result.success) {
          setSevenDaysData(result.data);
          setDates(result.dates || []);
          setDateRange(range);
        } else {
          setError(result.error || '获取数据失败');
        }
      } else {
        // Batch fetch multiple 7-day segments (max 30 days)
        const allData: SevenDaysData = {};
        const allDates: string[] = [];
        let currentEndDate = endDate;
        const segments = Math.ceil(range / 7);

        for (let i = 0; i < segments; i++) {
          const response = await fetch(`${baseUrl}/api/stocks?date=${currentEndDate}&mode=7days`);
          const result = await response.json();

          if (result.success) {
            // Merge data
            Object.assign(allData, result.data);

            // Merge dates and deduplicate
            result.dates.forEach((date: string) => {
              if (!allDates.includes(date)) {
                allDates.push(date);
              }
            });

            // Calculate next segment's end date (previous day of current segment's first day)
            if (result.dates && result.dates.length > 0) {
              const firstDate = new Date(result.dates[0]);
              firstDate.setDate(firstDate.getDate() - 1);
              currentEndDate = firstDate.toISOString().split('T')[0];
            }
          } else {
            console.warn(`获取第${i + 1}段数据失败:`, result.error);
            break;
          }
        }

        // Sort dates (newest on the right)
        allDates.sort();

        setSevenDaysData(allData);
        setDates(allDates.slice(-range)); // Keep only last 'range' days
        setDateRange(range);
      }
    } catch (err) {
      setError('网络请求失败');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load earlier data (pagination mode)
   * Loads previous 7 days up to a maximum of 30 days total
   */
  const handleLoadEarlierData = useCallback(async () => {
    if (dates.length === 0 || loadingEarlier) return;

    setLoadingEarlier(true);
    setError(null);

    try {
      // Calculate if we need to load more data from API
      const requiredStartIndex = (currentPage + 1) * 7;

      if (requiredStartIndex >= dates.length && dates.length < 30) {
        // Need to load more data
        const earliestDate = dates[0];
        const newEndDate = new Date(earliestDate);
        newEndDate.setDate(newEndDate.getDate() - 1);
        const endDateStr = newEndDate.toISOString().split('T')[0];

        // Get base URL for fetch
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

        // Load earlier 7 days
        const response = await fetch(`${baseUrl}/api/stocks?date=${endDateStr}&mode=7days`);
        const result = await response.json();

        if (result.success) {
          // Merge data
          setSevenDaysData(prev => ({ ...result.data, ...prev }));

          // Merge dates (new dates first)
          const newDates = [
            ...result.dates.filter((d: string) => !dates.includes(d)),
            ...dates
          ];

          // Keep max 30 days
          setDates(newDates.slice(-30));

          // Switch to next page
          setCurrentPage(prev => prev + 1);
        } else {
          setError(result.error || '加载更早数据失败');
        }
      } else if (requiredStartIndex < dates.length) {
        // Data already loaded, just switch page
        setCurrentPage(prev => prev + 1);
      }
    } catch (err) {
      setError('加载更早数据失败');
      console.error('Load earlier error:', err);
    } finally {
      setLoadingEarlier(false);
    }
  }, [dates, loadingEarlier, currentPage]);

  /**
   * Load newer data (go back to newer pages)
   */
  const handleLoadNewer = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  /**
   * Refresh current data
   */
  const refreshData = useCallback(async () => {
    await fetch7DaysData(dateRange);
  }, [dateRange, fetch7DaysData]);

  // Initial data fetch on mount
  useEffect(() => {
    fetch7DaysData(7);
  }, [fetch7DaysData]);

  return {
    // State
    sevenDaysData,
    dates,
    loading,
    error,
    loadingEarlier,
    dateRange,
    currentPage,

    // Actions
    fetch7DaysData,
    handleLoadEarlierData,
    handleLoadNewer,
    refreshData,
    setCurrentPage,
    setError,
  };
};
