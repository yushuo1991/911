'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, BarChart3, Download, RefreshCw } from 'lucide-react';
import { TrackingData, StockPerformance } from '@/types/stock';
import { 
  formatTradingDate, 
  getBoardClass, 
  getCategoryEmoji, 
  getPerformanceClass, 
  formatPercentage,
  getTodayString,
  isValidDate 
} from '@/lib/utils';

interface StockTrackerProps {
  initialDate?: string;
}

const StockTracker: React.FC<StockTrackerProps> = ({ initialDate }) => {
  const [selectedDate, setSelectedDate] = useState(initialDate || getTodayString());
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (date: string) => {
    if (!isValidDate(date)) {
      setError('请选择有效的日期');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/stocks?date=${date}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
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

  useEffect(() => {
    fetchData(selectedDate);
  }, []);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleQuery = () => {
    fetchData(selectedDate);
  };

  const handleDownload = () => {
    if (data) {
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `涨停板数据_${data.date}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderStockItem = (stock: StockPerformance, tradingDays: string[]) => (
    <div key={stock.code} className="card p-4 hover:shadow-md transition-shadow">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
        {/* 股票信息 */}
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{stock.name}</span>
          <span className="text-sm text-gray-500">{stock.code}</span>
        </div>

        {/* 板位标识 */}
        <div className="flex justify-center lg:justify-start">
          <span className={`${getBoardClass(stock.td_type)} px-3 py-1 rounded-full text-sm font-medium`}>
            {stock.td_type}
          </span>
        </div>

        {/* 5日表现 */}
        <div className="grid grid-cols-5 gap-2">
          {tradingDays.map((day) => {
            const pctChange = stock.performance[day] || 0;
            return (
              <div 
                key={day}
                className={`p-2 rounded text-center text-sm font-medium ${getPerformanceClass(pctChange)}`}
              >
                <div className="text-xs text-gray-600 mb-1">
                  {formatTradingDate(day)}
                </div>
                <div>{formatPercentage(pctChange)}</div>
              </div>
            );
          })}
        </div>

        {/* 总收益 */}
        <div className="flex justify-center lg:justify-end">
          <div className={`px-3 py-2 rounded-lg text-center font-semibold ${getPerformanceClass(stock.total_return)}`}>
            {formatPercentage(stock.total_return)}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCategory = (category: string, stocks: StockPerformance[]) => (
    <div key={category} className="card overflow-hidden animate-slide-in">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">
            {getCategoryEmoji(category)} {category}
          </span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
            {stocks.length}只
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3 bg-gray-50">
        {stocks.map((stock) => renderStockItem(stock, data?.trading_days || []))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* 头部 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            涨停板跟踪系统
          </h1>
          <p className="text-gray-600">
            跟踪涨停股票后续5个交易日表现，按板位排序展示
          </p>
        </div>

        {/* 日期选择器 */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">选择查询日期:</label>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              max={getTodayString()}
            />
            <button
              onClick={handleQuery}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              {loading ? '查询中...' : '查询'}
            </button>
            {data && (
              <button
                onClick={handleDownload}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载数据
              </button>
            )}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="card p-4 mb-8 border-l-4 border-red-500 bg-red-50">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">正在获取数据...</p>
            </div>
          </div>
        )}

        {/* 数据展示 */}
        {data && !loading && (
          <div className="animate-fade-in">
            {/* 统计汇总 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {data.stats.total_stocks}
                </div>
                <div className="text-gray-600">涨停个股总数</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {data.stats.category_count}
                </div>
                <div className="text-gray-600">涨停原因分类</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {data.stats.profit_ratio}%
                </div>
                <div className="text-gray-600">5日内盈利比例</div>
              </div>
            </div>

            {/* 表头说明 */}
            <div className="card p-4 mb-6 bg-blue-50">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 text-sm font-medium text-gray-700">
                <div>股票信息</div>
                <div className="text-center lg:text-left">板位</div>
                <div className="text-center">后续5日表现</div>
                <div className="text-center lg:text-right">总收益</div>
              </div>
            </div>

            {/* 分类展示 */}
            <div className="space-y-8">
              {Object.entries(data.categories).map(([category, stocks]) =>
                renderCategory(category, stocks)
              )}
            </div>

            {/* 页脚 */}
            <div className="card p-4 mt-8 text-center text-sm text-gray-600">
              <p className="mb-2">
                报告生成时间: {new Date().toLocaleString('zh-CN')}
              </p>
              <p>
                数据来源: 龙虎榜API + Tushare | 排序规则: 板位高的在上面 | 
                {' '}
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  上涨
                </span>
                {' '}
                <span className="inline-flex items-center gap-1">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  下跌
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockTracker;