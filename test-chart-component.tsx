/**
 * ====================================================================
 * CHART COMPONENT TEST FILE
 * ====================================================================
 *
 * Use this file to test the StockPremiumChart component with sample data.
 * Copy this into a test page to verify the chart renders correctly.
 */

'use client';

import { useState } from 'react';
import StockPremiumChart, { SectorAverageTrend } from '@/components/StockPremiumChart';
import { StockPremiumData } from '@/components/StockPremiumChart';
import {
  transformSectorStocksToChartData,
  calculateSectorAverageTrend,
  calculateSectorStats
} from '@/lib/chartHelpers';

// Sample data for testing
const sampleStockData: StockPremiumData[] = [
  {
    stockCode: '600519',
    stockName: '贵州茅台',
    premiums: [
      { date: '2025-09-26', premium: 5.2 },
      { date: '2025-09-27', premium: 3.8 },
      { date: '2025-09-30', premium: 2.1 },
      { date: '2025-10-01', premium: 4.5 },
      { date: '2025-10-02', premium: 6.2 },
    ],
    totalReturn: 21.8
  },
  {
    stockCode: '000858',
    stockName: '五粮液',
    premiums: [
      { date: '2025-09-26', premium: 4.1 },
      { date: '2025-09-27', premium: 2.5 },
      { date: '2025-09-30', premium: 1.8 },
      { date: '2025-10-01', premium: 3.2 },
      { date: '2025-10-02', premium: 5.1 },
    ],
    totalReturn: 16.7
  },
  {
    stockCode: '300750',
    stockName: '宁德时代',
    premiums: [
      { date: '2025-09-26', premium: 7.5 },
      { date: '2025-09-27', premium: 5.2 },
      { date: '2025-09-30', premium: 3.8 },
      { date: '2025-10-01', premium: 6.1 },
      { date: '2025-10-02', premium: 8.3 },
    ],
    totalReturn: 30.9
  },
  {
    stockCode: '601888',
    stockName: '中国中免',
    premiums: [
      { date: '2025-09-26', premium: -2.1 },
      { date: '2025-09-27', premium: -1.5 },
      { date: '2025-09-30', premium: 0.8 },
      { date: '2025-10-01', premium: 1.2 },
      { date: '2025-10-02', premium: 2.5 },
    ],
    totalReturn: 0.9
  },
  {
    stockCode: '002594',
    stockName: '比亚迪',
    premiums: [
      { date: '2025-09-26', premium: 6.8 },
      { date: '2025-09-27', premium: 4.5 },
      { date: '2025-09-30', premium: 2.9 },
      { date: '2025-10-01', premium: 5.3 },
      { date: '2025-10-02', premium: 7.1 },
    ],
    totalReturn: 26.6
  },
];

const sampleAverageData = [
  { date: '2025-09-26', avgPremium: 5.3, stockCount: 12 },
  { date: '2025-09-27', avgPremium: 3.8, stockCount: 12 },
  { date: '2025-09-30', avgPremium: 2.5, stockCount: 11 },
  { date: '2025-10-01', avgPremium: 4.2, stockCount: 11 },
  { date: '2025-10-02', avgPremium: 6.1, stockCount: 12 },
];

/**
 * Test Component
 */
export default function ChartTestPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          📊 Chart Component Test Page
        </h1>

        {/* Test 1: Basic Chart */}
        <div className="mb-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Test 1: Basic Individual Stock Chart
          </h2>
          <StockPremiumChart
            data={sampleStockData}
            title="个股5天溢价趋势"
          />
        </div>

        {/* Test 2: Compact Chart (Top 3) */}
        <div className="mb-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Test 2: Top 3 Stocks Only
          </h2>
          <StockPremiumChart
            data={sampleStockData}
            config={{
              height: 250,
              maxStocks: 3,
              showLegend: true
            }}
            title="前3强个股"
          />
        </div>

        {/* Test 3: Without Legend */}
        <div className="mb-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Test 3: Without Legend (Cleaner)
          </h2>
          <StockPremiumChart
            data={sampleStockData}
            config={{
              height: 280,
              showLegend: false,
              maxStocks: 10
            }}
            title="无图例版本"
          />
        </div>

        {/* Test 4: Sector Average */}
        <div className="mb-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Test 4: Sector Average Trend
          </h2>
          <SectorAverageTrend
            sectorName="新能源汽车"
            averageData={sampleAverageData}
            config={{
              height: 260
            }}
          />
        </div>

        {/* Test 5: Two Column Layout */}
        <div className="mb-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Test 5: Two Column Layout
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <StockPremiumChart
                data={sampleStockData}
                config={{
                  height: 240,
                  showLegend: false,
                  maxStocks: 5
                }}
                title="个股趋势"
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <SectorAverageTrend
                sectorName="板块"
                averageData={sampleAverageData}
                config={{
                  height: 240
                }}
              />
            </div>
          </div>
        </div>

        {/* Test 6: Custom Colors */}
        <div className="mb-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Test 6: Custom Color Scheme
          </h2>
          <StockPremiumChart
            data={sampleStockData}
            config={{
              height: 300,
              colors: ['#da4453', '#37bc9b', '#434a54', '#4a89dc', '#967adc'],
              maxStocks: 5
            }}
            title="自定义配色"
          />
        </div>

        {/* Test 7: Tall Chart for Details */}
        <div className="mb-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Test 7: Tall Chart (400px)
          </h2>
          <StockPremiumChart
            data={sampleStockData}
            config={{
              height: 400,
              showLegend: true,
              showGrid: true
            }}
            title="高清详细图表"
          />
        </div>

        {/* Test 8: Modal Integration Example */}
        <div className="mb-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Test 8: Modal Integration
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            打开模拟板块弹窗
          </button>
        </div>

        {/* Test Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-5xl max-h-[90vh] overflow-auto shadow-2xl">
              <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <h3 className="text-xl font-bold">新能源汽车 - 测试弹窗</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              {/* Stats Cards */}
              <div className="mb-6 grid grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-blue-700 mb-1">个股数量</div>
                  <div className="text-xl font-bold text-blue-900">5</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-green-700 mb-1">盈利率</div>
                  <div className="text-xl font-bold text-green-900">80%</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-purple-700 mb-1">平均收益</div>
                  <div className="text-xl font-bold text-red-700">+19.4%</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-orange-700 mb-1">收益区间</div>
                  <div className="text-sm font-bold text-orange-900">0.9 ~ 30.9%</div>
                </div>
              </div>

              {/* Charts */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <StockPremiumChart
                  data={sampleStockData}
                  config={{
                    height: 280,
                    showLegend: true,
                    maxStocks: 10
                  }}
                  title="📈 个股5天溢价趋势对比"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <SectorAverageTrend
                  sectorName="新能源汽车"
                  averageData={sampleAverageData}
                  config={{
                    height: 240
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-blue-800 font-semibold mb-3">✅ Testing Checklist</h3>
          <ul className="text-blue-700 text-sm space-y-2">
            <li>✓ Verify all 8 test charts render correctly</li>
            <li>✓ Hover over lines to see tooltips</li>
            <li>✓ Check legend shows stock names</li>
            <li>✓ Test modal integration (button above)</li>
            <li>✓ Verify colors are distinct and readable</li>
            <li>✓ Check responsive behavior (resize window)</li>
            <li>✓ Verify positive values show in red, negative in green</li>
            <li>✓ Test different configurations work as expected</li>
          </ul>
        </div>
      </div>

      {/* Click outside to close modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowModal(false)}
        />
      )}
    </div>
  );
}