'use client';

import { useState, useEffect } from 'react';

// 简化的类型定义
interface StockData {
  name: string;
  code: string;
  premium: number;
  boardLevel?: number;
}

interface SectorData {
  sectorName: string;
  stocks: StockData[];
  avgPremium: number;
  count: number;
}

interface DayData {
  date: string;
  sectors: SectorData[];
  totalStocks: number;
}

export default function Home() {
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<SectorData | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 获取数据
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stocks?date=2025-09-26&mode=7days');
      const result = await response.json();

      if (result.success) {
        // 简化数据处理
        const processedData: DayData[] = result.dates?.map((date: string) => {
          const dayData = result.data[date];
          const sectors: SectorData[] = Object.entries(dayData.categories || {}).map(([sectorName, stocks]) => ({
            sectorName,
            stocks: (stocks as any[]).map(stock => ({
              name: stock.name,
              code: stock.code,
              premium: stock.premium || 0,
              boardLevel: stock.boardLevel
            })),
            avgPremium: (stocks as any[]).reduce((sum, stock) => sum + (stock.premium || 0), 0) / (stocks as any[]).length,
            count: (stocks as any[]).length
          }));

          return {
            date,
            sectors: sectors.filter(s => s.count >= 5), // 只显示5支以上的板块
            totalStocks: sectors.reduce((sum, s) => sum + s.count, 0)
          };
        }) || [];

        setData(processedData);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      console.error('请求失败:', err);
      setError('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 处理板块点击
  const handleSectorClick = (sector: SectorData) => {
    setSelectedSector(sector);
    setShowModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
    setSelectedSector(null);
  };

  // 获取涨跌颜色类
  const getColorClass = (value: number) => {
    if (value > 0) return 'text-up';
    if (value < 0) return 'text-down';
    return 'text-gray-600';
  };

  // 获取背景颜色类
  const getBgColorClass = (value: number) => {
    if (value > 0) return 'bg-up';
    if (value < 0) return 'bg-down';
    return 'bg-gray-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">❌ {error}</p>
          <button
            onClick={fetchData}
            className="btn-primary"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          📊 股票板块追踪系统
        </h1>

        {/* 数据概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{data.length}</div>
            <div className="text-gray-600">交易日数</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.reduce((sum, day) => sum + day.sectors.length, 0)}
            </div>
            <div className="text-gray-600">总板块数</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {data.reduce((sum, day) => sum + day.totalStocks, 0)}
            </div>
            <div className="text-gray-600">总个股数</div>
          </div>
        </div>

        {/* 每日数据 */}
        <div className="space-y-6">
          {data.map((dayData) => (
            <div key={dayData.date} className="card p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                📅 {dayData.date} ({dayData.sectors.length} 个板块, {dayData.totalStocks} 只个股)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {dayData.sectors
                  .sort((a, b) => b.avgPremium - a.avgPremium) // 按平均溢价排序
                  .map((sector) => (
                  <div
                    key={sector.sectorName}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSectorClick(sector)}
                  >
                    <div className="font-medium text-gray-800 mb-2">
                      {sector.sectorName}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      个股数: {sector.count}
                    </div>
                    <div className={`text-sm font-medium ${getColorClass(sector.avgPremium)}`}>
                      平均溢价: {sector.avgPremium.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 板块详情模态框 */}
        {showModal && selectedSector && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold">
                  📊 {selectedSector.sectorName} - 个股详情
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="mb-4 text-sm text-gray-600">
                  共 {selectedSector.stocks.length} 只个股，平均溢价 {selectedSector.avgPremium.toFixed(2)}%
                </div>

                <div className="space-y-2">
                  {selectedSector.stocks
                    .sort((a, b) => b.premium - a.premium) // 按溢价排序
                    .map((stock, index) => (
                    <div
                      key={stock.code}
                      className={`p-3 rounded-lg border ${getBgColorClass(stock.premium)}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{stock.name}</span>
                          <span className="text-sm text-gray-500 ml-2">({stock.code})</span>
                        </div>
                        <div className={`font-medium ${getColorClass(stock.premium)}`}>
                          {stock.premium.toFixed(2)}%
                          {stock.boardLevel && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {stock.boardLevel}板
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}