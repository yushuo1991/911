# Premium Design Quick Reference
## Stock Tracker - Tailwind Class Patterns

This is a quick reference guide for developers implementing the premium design. Copy and paste these patterns directly into your components.

---

## COMMON COMPONENTS

### 1. Page Header
```tsx
<header className="bg-white shadow-sm rounded-lg p-3">
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
    {/* Title */}
    <h1 className="text-xl md:text-2xl font-bold text-gray-900">
      📈 宇硕板块节奏
    </h1>

    {/* Right side: Rankings + Controls */}
    <div className="flex items-center gap-2 flex-wrap">
      {/* Top 5 Rankings */}
      <div className="flex gap-1.5">
        <button className="px-2 py-1 text-xs font-medium rounded border
                           bg-amber-50 border-amber-300 text-amber-800
                           hover:bg-amber-100 transition">
          #1 · 消费 (28)
        </button>
        {/* More rankings... */}
      </div>

      {/* Filter toggle */}
      <button className="px-2 py-1 text-xs font-medium rounded border
                         bg-white text-gray-700 border-gray-300
                         hover:bg-gray-50 transition">
        筛选
      </button>

      {/* Refresh button */}
      <button className="px-3 py-1.5 text-xs font-medium rounded
                         bg-primary-600 text-white hover:bg-primary-700
                         transition">
        🔄 刷新数据
      </button>
    </div>
  </div>
</header>
```

### 2. Calendar Grid
```tsx
<div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
  {dates.map(date => (
    <div key={date} className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Content */}
    </div>
  ))}
</div>
```

### 3. Date Header (Calendar Column)
```tsx
<div className="bg-gradient-to-r from-primary-600 to-primary-700
                text-white p-2 text-center">
  {/* Date - Clickable */}
  <div className="text-xs font-medium cursor-pointer
                  hover:bg-white/10 rounded px-1.5 py-0.5 transition"
       onClick={() => handleDateClick(date)}>
    {formatDate(date).slice(5)}
  </div>

  {/* Weekday */}
  <div className="text-2xs opacity-90 mt-0.5">
    {weekday}
  </div>

  {/* Stock count - Clickable */}
  <div className="text-2xs bg-white/20 hover:bg-white/30 rounded
                  px-1.5 py-0.5 mt-1 cursor-pointer transition"
       onClick={() => handleStockCountClick(date)}>
    {totalStocks}只涨停
  </div>
</div>
```

### 4. Sector Card (Calendar Column Item)
```tsx
<div className="border border-gray-200 rounded p-2 cursor-pointer
                hover:bg-gray-50 hover:border-primary-300
                transition-all duration-150"
     onClick={() => handleSectorClick(sector)}>
  <div className="flex justify-between items-center gap-2">
    {/* Left: Sector info */}
    <div className="flex-1 min-w-0">
      <div className="text-xs font-medium text-gray-900 truncate">
        {sectorName}
      </div>
      <div className="text-2xs text-gray-500 mt-0.5">
        {count}个涨停
      </div>
    </div>

    {/* Right: Performance */}
    <div className="text-right shrink-0">
      <div className="text-2xs text-gray-400">溢价</div>
      <div className={`text-xs font-semibold ${getPerformanceClass(avgPremium)}`}>
        {avgPremium.toFixed(1)}%
      </div>
    </div>
  </div>
</div>
```

---

## BUTTONS

### Primary Button
```tsx
<button className="px-3 py-1.5 text-xs font-medium
                   bg-primary-600 text-white rounded
                   hover:bg-primary-700
                   transition-colors duration-150">
  刷新数据
</button>
```

### Secondary Button
```tsx
<button className="px-3 py-1.5 text-xs font-medium
                   bg-white text-gray-700 rounded border border-gray-300
                   hover:bg-gray-50 hover:border-gray-400
                   transition-colors duration-150">
  筛选
</button>
```

### Toggle Button (Active State)
```tsx
<button className={`px-2 py-1 text-xs font-medium rounded border
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-primary-100 text-primary-700 border-primary-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
  {label}
</button>
```

### Icon Button (Close)
```tsx
<button className="w-7 h-7 flex items-center justify-center
                   rounded-full text-gray-500
                   hover:bg-gray-100 hover:text-gray-700
                   transition-colors duration-150"
        onClick={closeModal}>
  ✕
</button>
```

### Ranking Badge (Top 5)
```tsx
{/* 1st place - Gold */}
<button className="px-2 py-1 text-xs font-medium rounded border
                   bg-amber-50 border-amber-300 text-amber-800
                   hover:bg-amber-100 transition">
  #1 · 消费 (28)
</button>

{/* 2nd place - Silver */}
<button className="px-2 py-1 text-xs font-medium rounded border
                   bg-gray-50 border-gray-300 text-gray-800
                   hover:bg-gray-100 transition">
  #2 · 医药 (24)
</button>

{/* 3rd place - Bronze */}
<button className="px-2 py-1 text-xs font-medium rounded border
                   bg-orange-50 border-orange-300 text-orange-800
                   hover:bg-orange-100 transition">
  #3 · 科技 (19)
</button>

{/* 4-5th place - Blue */}
<button className="px-2 py-1 text-xs font-medium rounded border
                   bg-primary-50 border-primary-200 text-primary-800
                   hover:bg-primary-100 transition">
  #4 · 新能源 (15)
</button>
```

---

## MODALS

### Base Modal Structure
```tsx
{showModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm
                  flex items-center justify-center z-50 p-4"
       onClick={closeModal}>
    <div className="bg-white rounded-xl shadow-2xl
                    max-w-4xl w-full max-h-[90vh]
                    flex flex-col overflow-hidden"
         onClick={(e) => e.stopPropagation()}>

      {/* Header */}
      <div className="flex justify-between items-center
                      px-4 py-3 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">
          Modal Title
        </h3>
        <button className="w-7 h-7 rounded-full hover:bg-gray-100"
                onClick={closeModal}>
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {content}
      </div>
    </div>
  </div>
)}
```

### Date Modal (Table Layout)
```tsx
{/* Header with filter */}
<div className="flex justify-between items-center
                px-4 py-3 border-b border-gray-200">
  <h3 className="text-base font-semibold text-gray-900">
    📈 {formatDate(date)} - 涨停个股溢价分析
  </h3>

  <div className="flex items-center gap-2">
    <button className={`text-xs px-2 py-1 rounded border transition
                        ${showOnly5Plus
                          ? 'bg-primary-100 text-primary-700 border-primary-300'
                          : 'bg-white text-gray-700 border-gray-300'}`}
            onClick={() => setShowOnly5Plus(!showOnly5Plus)}>
      {showOnly5Plus ? '显示全部' : '只显≥5家'}
    </button>
    <button className="w-7 h-7 rounded-full hover:bg-gray-100"
            onClick={closeModal}>
      ✕
    </button>
  </div>
</div>

{/* Table content */}
<div className="overflow-auto p-4">
  <table className="w-full text-xs">
    <thead className="sticky top-0 bg-white border-b-2 border-gray-200">
      <tr>
        <th className="px-2 py-1.5 text-left text-2xs font-semibold
                       text-gray-700 uppercase tracking-wide">
          排名
        </th>
        <th className="px-2 py-1.5 text-left text-2xs font-semibold
                       text-gray-700 uppercase tracking-wide">
          股票
        </th>
        {/* More headers... */}
      </tr>
    </thead>
    <tbody>
      {stocks.map((stock, index) => (
        <tr key={stock.code}
            className="border-b border-gray-200
                       hover:bg-primary-50 transition-colors">
          <td className="px-2 py-1.5">
            <span className="text-2xs text-gray-400 font-mono">
              #{index + 1}
            </span>
          </td>
          {/* More cells... */}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Sector Modal (Split View: Chart + Table)
```tsx
<div className="flex-1 overflow-hidden flex flex-col md:flex-row">
  {/* Left: Chart (40%) */}
  <div className="w-full md:w-2/5 border-b md:border-b-0 md:border-r
                  border-gray-200 p-4 overflow-auto">
    <h4 className="text-sm font-semibold text-gray-800 mb-3">
      📈 5天平均溢价趋势
    </h4>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        {/* Chart component */}
      </ResponsiveContainer>
    </div>
  </div>

  {/* Right: Table (60%) */}
  <div className="flex-1 overflow-auto p-4">
    <table className="w-full text-xs">
      {/* Table content */}
    </table>
  </div>
</div>
```

### Stock Count Modal (Grouped Tables)
```tsx
<div className="overflow-auto p-4 space-y-3">
  {sectorData.map((sector) => (
    <div key={sector.name}
         className="bg-gray-50 rounded-lg p-3">
      {/* Sector header */}
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-semibold text-gray-900">
          {sector.name}
          <span className="text-xs text-gray-500 ml-1">
            ({sector.stocks.length}只)
          </span>
        </h4>
        <div className={`text-xs font-medium ${getPerformanceClass(sector.avgPremium)}`}>
          平均: {sector.avgPremium.toFixed(1)}%
        </div>
      </div>

      {/* Ultra-compact table */}
      <div className="overflow-x-auto">
        <table className="w-full text-2xs">
          <thead className="bg-white">
            <tr className="border-b border-gray-200">
              <th className="px-1.5 py-1 text-left min-w-[100px]">
                股票
              </th>
              {dates.map(date => (
                <th key={date}
                    className="px-1 py-1 text-center min-w-[40px]">
                  {date.slice(-2)}
                </th>
              ))}
              <th className="px-1.5 py-1 text-center min-w-[50px]">
                累计
              </th>
            </tr>
          </thead>
          <tbody>
            {sector.stocks.map((stock, idx) => (
              <tr key={stock.code}
                  className={`border-b border-gray-200
                              ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                              hover:bg-primary-50 transition`}>
                {/* Table cells... */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ))}
</div>
```

### Ranking Modal (Timeline View)
```tsx
<div className="overflow-auto p-4 space-y-2">
  {rankings.map((sector, index) => (
    <div key={sector.name}
         className="bg-white border-2 border-gray-200 rounded-lg p-3
                    hover:border-primary-300 transition">
      <div className="flex justify-between items-center">
        {/* Left: Rank + Name */}
        <div className="flex items-center gap-3">
          {/* Medal badge */}
          <div className={`w-8 h-8 rounded-full flex items-center
                          justify-center text-sm font-bold
                          ${index === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white' :
                            index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                            index === 2 ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white' :
                            'bg-gray-100 text-gray-600'}`}>
            {index + 1}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              {sector.name}
            </h4>
            <p className="text-2xs text-gray-500">
              3天累计涨停数
            </p>
          </div>
        </div>

        {/* Right: Total count */}
        <div className={`px-3 py-1.5 rounded-full font-bold text-sm
                        ${index === 0 ? 'bg-red-100 text-red-700' :
                          index === 1 ? 'bg-orange-100 text-orange-700' :
                          index === 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'}`}>
          {sector.totalCount}只
        </div>
      </div>

      {/* Daily breakdown */}
      <div className="grid grid-cols-3 gap-2 mt-3
                      bg-gray-50 rounded p-2">
        {sector.dailyBreakdown.map(day => (
          <div key={day.date}
               className="text-center bg-white rounded p-1.5 border">
            <div className="text-2xs text-gray-500 mb-0.5">
              {formatDate(day.date).slice(5)}
            </div>
            <div className={`text-sm font-semibold
                            ${day.count >= 10 ? 'text-red-600' :
                              day.count >= 5 ? 'text-orange-600' :
                              'text-primary-600'}`}>
              {day.count}
            </div>
            <div className="text-2xs text-gray-400">
              只涨停
            </div>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
```

---

## TABLES

### Standard Compact Table
```tsx
<table className="w-full text-xs">
  <thead className="sticky top-0 bg-white border-b-2 border-gray-200">
    <tr>
      <th className="px-2 py-1.5 text-left text-2xs font-semibold
                     text-gray-700 uppercase tracking-wide">
        Header
      </th>
    </tr>
  </thead>
  <tbody>
    {data.map((item, index) => (
      <tr key={item.id}
          className="border-b border-gray-200
                     hover:bg-primary-50 transition-colors">
        <td className="px-2 py-1.5">
          Cell content
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Ultra-Compact Table (for grouped views)
```tsx
<table className="w-full text-2xs">
  <thead className="bg-white">
    <tr className="border-b border-gray-200">
      <th className="px-1.5 py-1 text-left min-w-[100px]">
        Header
      </th>
    </tr>
  </thead>
  <tbody>
    {data.map((item, idx) => (
      <tr key={item.id}
          className={`border-b border-gray-200
                      ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      hover:bg-primary-50 transition`}>
        <td className="px-1.5 py-1">
          Cell
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Table Cell - Stock Name (Clickable)
```tsx
<td className="px-2 py-1.5">
  <button className="text-primary-600 hover:text-primary-700
                     font-medium hover:underline"
          onClick={() => handleStockClick(stock)}>
    {stock.name}
  </button>
  <span className="text-2xs text-gray-400 ml-1">
    {stock.code}
  </span>
</td>
```

### Table Cell - Performance Badge
```tsx
<td className="px-2 py-1.5 text-center">
  <span className={`px-1.5 py-0.5 rounded text-2xs font-medium
                    ${getPerformanceClass(performance)}`}>
    {performance > 0 ? '+' : ''}{performance.toFixed(1)}%
  </span>
</td>
```

### Table Cell - Sector Tag
```tsx
<td className="px-2 py-1.5">
  <span className="px-1.5 py-0.5 rounded text-2xs
                   bg-primary-50 text-primary-700">
    {sectorName}
  </span>
</td>
```

---

## PERFORMANCE BADGES

### Small Badge (T+1 to T+5)
```tsx
<span className={`px-1.5 py-0.5 rounded text-2xs font-medium
                  ${getPerformanceClass(value)}`}>
  {value.toFixed(1)}%
</span>
```

### Large Badge (Cumulative)
```tsx
<span className={`px-2 py-0.5 rounded text-xs font-semibold
                  ${getPerformanceClass(totalReturn)}`}>
  {totalReturn > 0 ? '+' : ''}{totalReturn.toFixed(1)}%
</span>
```

### Count Badge (Stock Count)
```tsx
<span className={`inline-flex items-center px-2.5 py-0.5
                  rounded-full text-xs font-medium
                  ${count >= 5
                    ? 'bg-green-100 text-green-800'
                    : count > 0
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'}`}>
  {count}只
</span>
```

---

## LOADING STATES

### Spinner
```tsx
<div className="flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-8 w-8
                  border-2 border-primary-600 border-t-transparent">
  </div>
</div>
```

### Full Page Loading
```tsx
<div className="min-h-screen bg-gray-50
                flex items-center justify-center">
  <div className="text-center">
    <div className="animate-spin rounded-full h-12 w-12
                    border-b-2 border-primary-600 mx-auto mb-4">
    </div>
    <p className="text-gray-600 text-sm">正在获取7天数据...</p>
    <p className="text-gray-500 text-xs mt-2">这可能需要几分钟时间</p>
  </div>
</div>
```

### Skeleton Loader (Cards)
```tsx
<div className="bg-white rounded-lg p-3 animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
</div>
```

---

## EMPTY STATES

### No Data
```tsx
<div className="text-center py-8 text-gray-500">
  <div className="text-4xl mb-4">📊</div>
  <p className="text-base font-medium">暂无数据</p>
  <p className="text-xs mt-2">没有符合条件的板块</p>
</div>
```

### Error State
```tsx
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <div className="text-red-500 text-xl">⚠</div>
    <div>
      <h4 className="text-sm font-semibold text-red-800 mb-1">
        加载失败
      </h4>
      <p className="text-xs text-red-700">
        {errorMessage}
      </p>
    </div>
  </div>
</div>
```

---

## UTILITY PATTERNS

### Truncate Text
```tsx
<div className="text-xs font-medium text-gray-900 truncate max-w-[120px]">
  {longText}
</div>
```

### Hover Scale
```tsx
<button className="hover:scale-105 transition-transform duration-200">
  Button
</button>
```

### Subtle Shadow on Hover
```tsx
<div className="shadow-sm hover:shadow-md transition-shadow duration-200">
  Card
</div>
```

### Gradient Background
```tsx
<div className="bg-gradient-to-r from-primary-600 to-primary-700">
  Content
</div>
```

### Backdrop Blur (Modal Overlay)
```tsx
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm">
  Modal overlay
</div>
```

---

## RESPONSIVE PATTERNS

### Show/Hide on Breakpoints
```tsx
{/* Hidden on mobile, shown on tablet+ */}
<div className="hidden md:flex">
  Content
</div>

{/* Shown on mobile, hidden on tablet+ */}
<div className="flex md:hidden">
  Content
</div>
```

### Responsive Grid Columns
```tsx
<div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
  {items.map(...)}
</div>
```

### Responsive Text Sizes
```tsx
<h1 className="text-lg md:text-xl lg:text-2xl font-bold">
  Title
</h1>

<p className="text-xs md:text-sm text-gray-700">
  Body text
</p>
```

### Responsive Flex Direction
```tsx
<div className="flex flex-col md:flex-row gap-3">
  <div>Left</div>
  <div>Right</div>
</div>
```

---

## COLOR UTILITIES

### Text Colors
```css
text-gray-400    /* Labels, subtle */
text-gray-500    /* Secondary text */
text-gray-700    /* Body text */
text-gray-900    /* Headings */

text-primary-600 /* Links, interactive */
text-primary-700 /* Link hover */
```

### Background Colors
```css
bg-white         /* Cards */
bg-gray-50       /* Page background */
bg-gray-100      /* Subtle backgrounds */

bg-primary-50    /* Hover backgrounds */
bg-primary-600   /* Primary buttons */
bg-primary-700   /* Button hover */
```

### Border Colors
```css
border-gray-200  /* Default borders */
border-gray-300  /* Emphasis borders */
border-primary-300 /* Hover borders */
```

---

## SPACING REFERENCE

```css
/* Padding */
p-1    = 4px
p-1.5  = 6px
p-2    = 8px
p-2.5  = 10px
p-3    = 12px
p-4    = 16px

/* Gaps */
gap-1.5  = 6px
gap-2    = 8px
gap-3    = 12px

/* Margins */
mt-0.5  = 2px
mt-1    = 4px
mt-2    = 8px
mt-3    = 12px
```

---

## TIPS & BEST PRACTICES

1. **Always use getPerformanceClass()** for stock performance colors
2. **Use text-2xs** for dates and labels
3. **Use text-xs** for most body text
4. **Use text-sm** for headers and emphasis
5. **Keep padding tight**: p-2 or p-3 for most cards
6. **Consistent gaps**: gap-2 for tight layouts, gap-3 for breathable layouts
7. **Hover states**: Always add transition-colors or transition-all
8. **Sticky headers**: Use sticky top-0 for table headers
9. **Truncate long text**: Use truncate class with max-w-[size]
10. **Responsive first**: Start with mobile, add md: and lg: breakpoints

---

**End of Quick Reference**