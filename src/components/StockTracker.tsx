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

  const renderStockItem = (stock: StockPerformance, tradingDays: string[]) => (
    <div key={stock.code} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 hover:border-blue-200">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
        {/* 股票信息 */}
        <div className="flex flex-col space-y-1">
          <span className="font-bold text-gray-900 text-lg">{stock.name}</span>
          <span className="text-sm text-gray-500 font-mono">{stock.code}</span>
        </div>

        {/* 板位标识 */}
        <div className="flex justify-center lg:justify-start">
          <span className={`${getBoardClass(stock.td_type)} px-4 py-2 rounded-full text-sm font-bold shadow-sm`}>
            {stock.td_type}
          </span>
        </div>

        {/* 5日表现 - 不显示日期 */}
        <div className="grid grid-cols-5 gap-3">
          {tradingDays.map((day, index) => {
            const pctChange = stock.performance[day] || 0;
            return (
              <div 
                key={day}
                className={`p-3 rounded-lg text-center text-sm transition-all duration-200 hover:scale-105 ${getPerformanceClass(pctChange)}`}
              >
                <div className="font-semibold">{formatPercentage(pctChange)}</div>
              </div>
            );
          })}
        </div>

        {/* 总收益 */}
        <div className="flex justify-center lg:justify-end">
          <div className={`px-4 py-3 rounded-xl text-center font-bold text-lg shadow-sm ${getPerformanceClass(stock.total_return)}`}>
            {formatPercentage(stock.total_return)}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCategory = (category: string, stocks: StockPerformance[]) => (
    <div key={category} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-slide-in">
      {/* 分类头部 */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-8 py-6">
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold">
            {getCategoryEmoji(category)} {category}
          </span>
          <span className="bg-white/25 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
            {stocks.length}只股票
          </span>
        </div>
      </div>

      {/* 日期头部 */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-4 border-b border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
          <div className="text-sm font-semibold text-gray-600">股票信息</div>
          <div className="text-sm font-semibold text-gray-600 text-center lg:text-left">板位等级</div>
          
          {/* 交易日期标题 */}
          <div className="grid grid-cols-5 gap-3">
            {(data?.trading_days || []).map((day, index) => (
              <div key={day} className="text-center">
                <div className="text-xs font-semibold text-gray-500 mb-1">T+{index + 1}</div>
                <div className="text-xs text-gray-600 font-mono">{formatTradingDate(day)}</div>
              </div>
            ))}
          </div>
          
          <div className="text-sm font-semibold text-gray-600 text-center lg:text-right">累计收益</div>
        </div>
      </div>

      {/* 股票列表 */}
      <div className="p-6 space-y-4 bg-gray-50/30">
        {stocks.map((stock) => renderStockItem(stock, data?.trading_days || []))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 max-w-7xl py-8">
        {/* 头部 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            涨停板跟踪系统
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            实时跟踪涨停股票后续5个交易日表现，基于真实市场数据进行深度分析
          </p>
        </div>

        {/* 日期选择器 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-12">
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
            {/* 统计汇总 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="group bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-lg border border-red-200/50 p-8 text-center hover:shadow-xl transition-all duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-extrabold text-red-600 mb-2">
                  {data.stats.total_stocks}
                </div>
                <div className="text-gray-700 font-medium">涨停个股总数</div>
              </div>
              
              <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg border border-blue-200/50 p-8 text-center hover:shadow-xl transition-all duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-extrabold text-blue-600 mb-2">
                  {data.stats.category_count}
                </div>
                <div className="text-gray-700 font-medium">涨停原因分类</div>
              </div>
              
              <div className="group bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg border border-green-200/50 p-8 text-center hover:shadow-xl transition-all duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <TrendingDown className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-extrabold text-green-600 mb-2">
                  {data.stats.profit_ratio}%
                </div>
                <div className="text-gray-700 font-medium">5日内盈利比例</div>
              </div>
            </div>

            {/* 功能说明 */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-blue-200/30 p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">💡</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800">数据说明</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-700">股票基本信息</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="font-medium text-gray-700">板位等级排序</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-700">5日真实表现</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="font-medium text-gray-700">累计收益统计</span>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-white/40 rounded-xl border border-blue-200/20">
                <p className="text-sm text-gray-600 text-center">
                  📊 基于Tushare真实API数据 | 🎯 板位越高表示连续涨停天数越多 | 🌈 颜色深浅反映涨跌幅大小
                </p>
              </div>
            </div>

            {/* 分类展示 */}
            <div className="space-y-12">
              {Object.entries(data.categories).map(([category, stocks]) =>
                renderCategory(category, stocks)
              )}
            </div>

            {/* 页脚 */}
            <div className="mt-16 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl shadow-sm border border-gray-200/50 p-8 text-center">
              <div className="max-w-4xl mx-auto">
                <p className="text-sm text-gray-600 mb-4">
                  📅 报告生成时间: {new Date().toLocaleString('zh-CN')}
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>龙虎榜API</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span>Tushare数据</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span>板位排序</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-8 text-sm">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full">
                    <TrendingUp className="w-4 h-4" />
                    上涨显红色
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                    <TrendingDown className="w-4 h-4" />
                    下跌显绿色
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockTracker;