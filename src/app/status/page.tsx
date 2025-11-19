'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface DataStatus {
  success: boolean;
  timestamp: string;
  server_time: string;
  data: {
    stock_data: {
      latest_update: string;
      latest_date: string;
      total_count: number;
      total_dates: number;
      recent_days: Array<{
        trade_date: string;
        stock_count: number;
        update_time: string;
      }>;
    };
    stock_performance: {
      latest_update: string;
      latest_base_date: string;
      total_count: number;
      total_base_dates: number;
    };
    seven_days_cache: {
      total: number;
      active: number;
      latest_created: string;
      recent_caches: Array<{
        cache_key: string;
        created_at: string;
        expires_at: string;
      }>;
    };
    minute_snapshots: {
      latest_date: string;
      total_count: number;
      total_dates: number;
      recent_snapshots: Array<{
        trade_date: string;
        count: number;
      }>;
    } | null;
  };
}

export default function StatusPage() {
  const [status, setStatus] = useState<DataStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/data-status');
      const data = await response.json();
      if (data.success) {
        setStatus(data);
      } else {
        setError(data.error || '获取数据失败');
      }
    } catch (err: any) {
      setError(err.message || '网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', { 
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDateOnly = (dateString: string) => {
    if (!dateString) return 'N/A';
    return dateString.toString().slice(0, 10);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">错误: {error}</p>
          <button
            onClick={fetchStatus}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">数据更新状态</h1>
            <p className="text-gray-600 mt-1">服务器时间: {status.server_time}</p>
          </div>
          <button
            onClick={fetchStatus}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>

        {/* 股票涨停数据 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
            📈 股票涨停数据
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-gray-600 text-sm">最新更新时间</p>
              <p className="text-lg font-medium text-blue-600">
                {formatDate(status.data.stock_data.latest_update)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">最新交易日期</p>
              <p className="text-lg font-medium text-green-600">
                {formatDateOnly(status.data.stock_data.latest_date)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">总记录数</p>
              <p className="text-lg font-medium text-purple-600">
                {status.data.stock_data.total_count.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">总交易日数</p>
              <p className="text-lg font-medium text-orange-600">
                {status.data.stock_data.total_dates}
              </p>
            </div>
          </div>

          <h3 className="text-md font-semibold text-gray-700 mt-6 mb-3">最近5个交易日数据</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">交易日期</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">股票数量</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">更新时间</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {status.data.stock_data.recent_days.map((day: any) => (
                  <tr key={day.trade_date}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {formatDateOnly(day.trade_date)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {day.stock_count} 只股票
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {formatDate(day.update_time)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 股票表现数据 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
            📊 股票表现数据
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-600 text-sm">最新更新时间</p>
              <p className="text-lg font-medium text-blue-600">
                {formatDate(status.data.stock_performance.latest_update)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">最新基准日期</p>
              <p className="text-lg font-medium text-green-600">
                {formatDateOnly(status.data.stock_performance.latest_base_date)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">总记录数</p>
              <p className="text-lg font-medium text-purple-600">
                {status.data.stock_performance.total_count.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">总基准日数</p>
              <p className="text-lg font-medium text-orange-600">
                {status.data.stock_performance.total_base_dates}
              </p>
            </div>
          </div>
        </div>

        {/* 7天缓存数据 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
            💾 7天数据缓存
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-gray-600 text-sm">总缓存数</p>
              <p className="text-lg font-medium text-blue-600">
                {status.data.seven_days_cache.total}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">有效缓存数</p>
              <p className="text-lg font-medium text-green-600">
                {status.data.seven_days_cache.active}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">最新缓存创建</p>
              <p className="text-lg font-medium text-purple-600">
                {status.data.seven_days_cache.latest_created 
                  ? formatDate(status.data.seven_days_cache.latest_created)
                  : 'N/A'
                }
              </p>
            </div>
          </div>

          {status.data.seven_days_cache.recent_caches.length > 0 && (
            <>
              <h3 className="text-md font-semibold text-gray-700 mt-6 mb-3">最近的缓存记录</h3>
              <div className="space-y-2">
                {status.data.seven_days_cache.recent_caches.map((cache: any, idx: number) => {
                  const isExpired = new Date(cache.expires_at) < new Date();
                  return (
                    <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          创建: {formatDate(cache.created_at)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {isExpired ? '已过期' : '有效'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* 分时图快照 */}
        {status.data.minute_snapshots && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
              📸 分时图快照
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-gray-600 text-sm">最新快照日期</p>
                <p className="text-lg font-medium text-blue-600">
                  {formatDateOnly(status.data.minute_snapshots.latest_date)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">总快照数</p>
                <p className="text-lg font-medium text-green-600">
                  {status.data.minute_snapshots.total_count.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">快照日期数</p>
                <p className="text-lg font-medium text-purple-600">
                  {status.data.minute_snapshots.total_dates}
                </p>
              </div>
            </div>

            {status.data.minute_snapshots.recent_snapshots.length > 0 && (
              <>
                <h3 className="text-md font-semibold text-gray-700 mt-6 mb-3">最近5个快照日期</h3>
                <div className="space-y-2">
                  {status.data.minute_snapshots.recent_snapshots.map((snap: any) => (
                    <div key={snap.trade_date} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {formatDateOnly(snap.trade_date)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {snap.count} 个快照
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


