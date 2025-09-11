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
    // 日期改变时自动获取数据
    fetchData(date);
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

  // 紧凑型股票项渲染 - 适合多板块对比
  const renderCompactStockItem = (stock: StockPerformance, tradingDays: string[]) => (
    <div key={stock.code} className="grid grid-cols-12 gap-2 py-2 px-3 hover:bg-blue-50/30 transition-colors border-b border-gray-100/50 last:border-b-0">
      {/* 股票信息 - 2列 */}
      <div className="col-span-2 flex flex-col justify-center">
        <div className="font-semibold text-xs text-gray-900 truncate" title={stock.name}>{stock.name}</div>
        <div className="text-xs text-gray-500 font-mono">{stock.code}</div>
      </div>

      {/* 板位 - 1列 */}
      <div className="col-span-1 flex items-center justify-center">
        <span className={`${getBoardClass(stock.td_type)} px-2 py-1 rounded text-xs font-bold`}>
          {stock.td_type.replace('连板', '').replace('板', '')}
        </span>
      </div>

      {/* 5日表现 - 7列 */}
      <div className="col-span-7 grid grid-cols-5 gap-1">
        {tradingDays.map((day, index) => {
          const pctChange = stock.performance[day] || 0;
          return (
            <div 
              key={day}
              className={`px-1 py-1 rounded text-center text-xs font-medium ${getPerformanceClass(pctChange)}`}
              title={`${formatTradingDate(day)}: ${formatPercentage(pctChange)}`}
            >
              {formatPercentage(pctChange)}
            </div>
          );
        })}
      </div>

      {/* 总收益 - 2列 */}
      <div className="col-span-2 flex items-center justify-end">
        <div className={`px-2 py-1 rounded text-xs font-bold ${getPerformanceClass(stock.total_return)}`}>
          {formatPercentage(stock.total_return)}
        </div>
      </div>
    </div>
  );

  // 紧凑型分类渲染 - 优化空间利用
  const renderCompactCategory = (category: string, stocks: StockPerformance[]) => (
    <div key={category} className="bg-white rounded-lg shadow-md border border-gray-200/50 overflow-hidden">
      {/* 简化分类头部 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold">
            {getCategoryEmoji(category)} {category}
          </span>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-1 rounded text-xs font-semibold">
              {stocks.length}只
            </span>
            <div className="text-xs">
              {stocks.filter(s => s.total_return > 0).length}↗/{stocks.filter(s => s.total_return < 0).length}↘
            </div>
          </div>
        </div>
      </div>

      {/* 紧凑表头 */}
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600">
          <div className="col-span-2">股票信息</div>
          <div className="col-span-1 text-center">板位</div>
          <div className="col-span-7 grid grid-cols-5 gap-1">
            {(data?.trading_days || []).map((day, index) => (
              <div key={day} className="text-center">
                <div>T+{index + 1}</div>
                <div className="text-xs text-gray-500">{formatTradingDate(day).slice(-5)}</div>
              </div>
            ))}
          </div>
          <div className="col-span-2 text-right">累计</div>
        </div>
      </div>

      {/* 紧凑股票列表 */}
      <div className="bg-white">
        {stocks.map((stock) => renderCompactStockItem(stock, data?.trading_days || []))}
      </div>
    </div>
  );

  // 多板块对比视图
  const renderMultiCategoryComparison = () => {
    if (!data || data.stats.total_stocks === 0) return null;

    const categories = Object.entries(data.categories);
    const halfIndex = Math.ceil(categories.length / 2);
    const leftCategories = categories.slice(0, halfIndex);
    const rightCategories = categories.slice(halfIndex);

    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 左侧板块 */}
        <div className="space-y-4">
          {leftCategories.map(([category, stocks]) => 
            renderCompactCategory(category, stocks)
          )}
        </div>
        
        {/* 右侧板块 */}
        <div className="space-y-4">
          {rightCategories.map(([category, stocks]) => 
            renderCompactCategory(category, stocks)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 max-w-7xl py-8">
        {/* 紧凑头部 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              涨停板跟踪系统
            </h1>
          </div>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            多板块对比 | 真实数据 | 5日表现跟踪
          </p>
        </div>

        {/* 紧凑日期选择器 */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200/50 p-4 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <label className="text-sm font-medium text-gray-700">选择查询日期:</label>
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  max={getTodayString()}
                />
                {loading && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleQuery}
                disabled={loading}
                className="btn-primary flex items-center gap-2 min-w-[100px]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    查询中...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    手动刷新
                  </>
                )}
              </button>
              
              {data && data.stats.total_stocks > 0 && (
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
          
          {/* 实时状态显示 */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-blue-500 animate-pulse' : error ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span>
                {loading ? '正在获取数据...' : error ? '数据获取失败' : '数据已更新'}
              </span>
            </div>
            <div>
              自动获取: 选择日期后自动查询
            </div>
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

        {/* 空数据提示 */}
        {data && !loading && data.stats.total_stocks === 0 && (
          <div className="card p-8 text-center">
            <div className="text-gray-400 mb-4">
              <BarChart3 className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无涨停数据</h3>
            <p className="text-gray-500">
              {selectedDate} 当日暂无涨停个股数据，请选择其他交易日期查询
            </p>
            <p className="text-sm text-gray-400 mt-2">
              * 系统仅显示真实数据，不展示模拟或虚假信息
            </p>
          </div>
        )}

        {/* 数据展示 */}
        {data && !loading && data.stats.total_stocks > 0 && (
          <div className="animate-fade-in">
            {/* 紧凑统计汇总 */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200/50 p-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-red-600">{data.stats.total_stocks}</div>
                    <div className="text-xs text-gray-600">涨停个股</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-blue-600">{data.stats.category_count}</div>
                    <div className="text-xs text-gray-600">板块分类</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">{data.stats.profit_ratio}%</div>
                    <div className="text-xs text-gray-600">盈利比例</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-600">{selectedDate}</div>
                    <div className="text-xs text-gray-600">查询日期</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 紧凑说明条 */}
            <div className="bg-blue-50 rounded-lg border border-blue-200/50 p-3 mb-6">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-4">
                  <span>📊 真实API数据</span>
                  <span>🎯 板位高→低排序</span>
                  <span>🌈 颜色=涨跌强度</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-red-100 text-red-600 rounded">↗上涨红色</span>
                  <span className="px-2 py-1 bg-green-100 text-green-600 rounded">↘下跌绿色</span>
                </div>
              </div>
            </div>

            {/* 多板块对比展示 */}
            {renderMultiCategoryComparison()}

            {/* 紧凑页脚 */}
            <div className="mt-8 bg-gray-50 rounded-lg p-3 text-center border-t border-gray-200">
              <div className="text-xs text-gray-500">
                📅 {new Date().toLocaleString('zh-CN')} | 📊 龙虎榜+Tushare数据 | 🎯 多板块对比视图
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockTracker;