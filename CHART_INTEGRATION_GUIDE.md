# 📊 Stock Premium Chart Integration Guide

## Overview

This guide shows how to integrate the new `StockPremiumChart` component into your stock tracking application to display 5-day premium trends for individual stocks.

---

## 📁 Files Created

1. **`src/components/StockPremiumChart.tsx`** - Main chart component
2. **`src/lib/chartHelpers.ts`** - Data transformation utilities

---

## 🎯 Integration Steps

### Step 1: Import the Components

Add these imports to your `src/app/page.tsx`:

```typescript
import StockPremiumChart, { SectorAverageTrend } from '@/components/StockPremiumChart';
import {
  transformSectorStocksToChartData,
  calculateSectorAverageTrend,
  sortStocksByTotalReturn,
  calculateSectorStats
} from '@/lib/chartHelpers';
```

---

### Step 2: Replace Existing Chart in Sector Modal

Find the sector modal chart section (around line 382-458) and replace it with:

```tsx
{/* 板块个股溢价趋势图表 - 使用新组件 */}
<div className="mb-6 bg-gray-50 rounded-lg p-4">
  <StockPremiumChart
    data={transformSectorStocksToChartData(
      selectedSectorData.stocks,
      selectedSectorData.followUpData,
      10 // 显示前10只个股
    )}
    config={{
      height: 280,
      showLegend: true,
      showGrid: true,
      maxStocks: 10
    }}
    title="📈 个股5天溢价趋势对比"
  />
</div>
```

---

### Step 3: Add Sector Average Chart (Optional)

You can also add a sector average trend chart below the individual stock chart:

```tsx
{/* 板块平均溢价趋势 */}
<div className="mb-6 bg-gray-50 rounded-lg p-4">
  <SectorAverageTrend
    sectorName={selectedSectorData.name}
    averageData={calculateSectorAverageTrend(selectedSectorData.followUpData)}
    config={{
      height: 240,
      showGrid: true
    }}
  />
</div>
```

---

### Step 4: Add Sector Statistics Card (Optional Enhancement)

Add sector statistics below the chart for better insights:

```tsx
{/* 板块统计数据 */}
{(() => {
  const stats = calculateSectorStats(selectedSectorData.followUpData);
  return (
    <div className="mb-6 grid grid-cols-3 gap-4">
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-sm text-gray-600 mb-1">盈利个股比例</div>
        <div className={`text-2xl font-bold ${
          stats.profitRatio >= 60 ? 'text-green-600' :
          stats.profitRatio >= 40 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {stats.profitRatio.toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {stats.profitableStocks}/{stats.totalStocks} 只盈利
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-sm text-gray-600 mb-1">板块平均收益</div>
        <div className={`text-2xl font-bold ${
          stats.avgTotalReturn >= 0 ? 'text-red-600' : 'text-green-600'
        }`}>
          {stats.avgTotalReturn >= 0 ? '+' : ''}{stats.avgTotalReturn.toFixed(2)}%
        </div>
        <div className="text-xs text-gray-500 mt-1">5日累计</div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-sm text-gray-600 mb-1">收益区间</div>
        <div className="text-lg font-bold text-gray-800">
          {stats.minReturn.toFixed(1)}% ~ {stats.maxReturn.toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500 mt-1">最低至最高</div>
      </div>
    </div>
  );
})()}
```

---

## 🎨 Chart Features

### Main Features:
- ✅ **Multi-line chart** displaying up to 10 stocks
- ✅ **Color-coded lines** with automatic color assignment
- ✅ **Interactive tooltips** showing exact premium values
- ✅ **Legend** with stock names
- ✅ **Responsive design** adapts to container size
- ✅ **Professional styling** matching app design

### Configuration Options:

```typescript
config?: {
  width?: number | string;      // Default: '100%'
  height?: number;               // Default: 300
  showLegend?: boolean;          // Default: true
  showGrid?: boolean;            // Default: true
  colors?: string[];             // Custom color palette
  maxStocks?: number;            // Default: 10
}
```

---

## 📊 Usage Examples

### Example 1: Basic Chart
```tsx
<StockPremiumChart
  data={chartData}
  title="个股溢价趋势"
/>
```

### Example 2: Custom Configuration
```tsx
<StockPremiumChart
  data={chartData}
  config={{
    height: 400,
    showLegend: true,
    showGrid: true,
    maxStocks: 15,
    colors: ['#2563eb', '#dc2626', '#16a34a'] // Custom colors
  }}
  title="前15只个股表现"
/>
```

### Example 3: Sector Average Trend
```tsx
<SectorAverageTrend
  sectorName="人工智能"
  averageData={[
    { date: '2025-09-26', avgPremium: 5.2, stockCount: 12 },
    { date: '2025-09-27', avgPremium: 3.8, stockCount: 12 },
    { date: '2025-09-30', avgPremium: 2.1, stockCount: 11 },
  ]}
  config={{ height: 250 }}
/>
```

---

## 🔄 Data Transformation

### Transform Sector Data to Chart Format:

```typescript
const chartData = transformSectorStocksToChartData(
  stocks,                    // StockPerformance[]
  followUpData,             // Record<string, Record<string, number>>
  10                        // maxStocks
);
```

### Calculate Sector Average:

```typescript
const avgTrendData = calculateSectorAverageTrend(followUpData);
```

### Sort Stocks by Performance:

```typescript
const sortedStocks = sortStocksByTotalReturn(stocks, followUpData);
```

---

## 🎯 Complete Integration Example

Here's a complete example of the updated sector modal:

```tsx
{showSectorModal && selectedSectorData && (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
    <div className="bg-white rounded-xl p-6 max-w-5xl max-h-[90vh] overflow-auto shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">
          📊 {selectedSectorData.name} - 个股梯队详情 ({formatDate(selectedSectorData.date)})
        </h3>
        <button
          onClick={closeSectorModal}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Stats Summary */}
      {(() => {
        const stats = calculateSectorStats(selectedSectorData.followUpData);
        return (
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-xs text-blue-700 mb-1">个股数量</div>
              <div className="text-xl font-bold text-blue-900">{stats.totalStocks}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-xs text-green-700 mb-1">盈利比例</div>
              <div className="text-xl font-bold text-green-900">{stats.profitRatio}%</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-xs text-purple-700 mb-1">平均收益</div>
              <div className="text-xl font-bold text-purple-900">
                {stats.avgTotalReturn >= 0 ? '+' : ''}{stats.avgTotalReturn.toFixed(2)}%
              </div>
            </div>
          </div>
        );
      })()}

      {/* Individual Stock Chart */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <StockPremiumChart
          data={transformSectorStocksToChartData(
            selectedSectorData.stocks,
            selectedSectorData.followUpData,
            10
          )}
          config={{
            height: 280,
            showLegend: true,
            showGrid: true,
            maxStocks: 10
          }}
          title="📈 个股5天溢价趋势对比"
        />
      </div>

      {/* Sector Average Chart */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <SectorAverageTrend
          sectorName={selectedSectorData.name}
          averageData={calculateSectorAverageTrend(selectedSectorData.followUpData)}
          config={{
            height: 240,
            showGrid: true
          }}
        />
      </div>

      {/* Stock List Table */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortStocksByTotalReturn(
          selectedSectorData.stocks,
          selectedSectorData.followUpData
        ).map((stock, index) => {
          const followUpDates = Object.keys(stock.followUpValues).sort();
          return (
            <div key={stock.code} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
              {/* Stock card content - keep existing implementation */}
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}
```

---

## 🎨 Styling Notes

### Colors Used:
- **Primary line**: `#2563eb` (Blue)
- **Secondary lines**: `#dc2626` (Red), `#16a34a` (Green), etc.
- **Grid**: Light gray (`#e5e7eb`)
- **Positive values**: Red text (`text-red-600`)
- **Negative values**: Green text (`text-green-600`)

### Responsive Behavior:
- Chart automatically adjusts to container width
- Minimum height: 240px
- Default height: 300px
- Mobile-friendly tooltip positioning

---

## 🔧 Troubleshooting

### Issue: Chart not displaying
**Solution**: Ensure Recharts is installed:
```bash
npm install recharts
```

### Issue: Date formatting errors
**Solution**: The chart handles date errors gracefully. Check console warnings.

### Issue: Too many lines cluttering the chart
**Solution**: Reduce `maxStocks` in config:
```typescript
config={{ maxStocks: 5 }}
```

---

## 📚 API Reference

### `StockPremiumChart`
Main chart component for displaying individual stock premium trends.

**Props:**
- `data: StockPremiumData[]` - Array of stock premium data
- `config?: Partial<ChartConfig>` - Optional configuration
- `title?: string` - Optional chart title

### `SectorAverageTrend`
Simplified chart for sector average trends.

**Props:**
- `sectorName: string` - Sector name
- `averageData: Array<{date, avgPremium, stockCount}>` - Average trend data
- `config?: Partial<ChartConfig>` - Optional configuration

### Helper Functions

#### `transformSectorStocksToChartData()`
Transforms stock data to chart-ready format.

#### `calculateSectorAverageTrend()`
Calculates sector average premium over time.

#### `sortStocksByTotalReturn()`
Sorts stocks by cumulative return.

#### `calculateSectorStats()`
Calculates comprehensive sector statistics.

---

## ✅ Next Steps

1. Import components into `page.tsx`
2. Replace existing chart in sector modal
3. Test with real data
4. Customize colors if needed
5. Add sector statistics cards
6. Deploy and verify

---

## 📝 Notes

- Charts are fully responsive and mobile-friendly
- Tooltips show exact premium values on hover
- Legend is scrollable for many stocks
- Colors automatically cycle for unlimited stocks
- Compatible with existing Recharts ^3.2.1

---

**Created**: 2025-09-30
**Version**: 1.0.0
**Status**: Ready for integration