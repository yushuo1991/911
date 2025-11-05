# Premium Financial Dashboard Design Specification
## Stock Tracker System (宇硕板块节奏)

**Version:** 2.0 Premium
**Date:** 2025-09-30
**Framework:** Next.js 14 + TypeScript + Tailwind CSS
**Design Philosophy:** High-end financial dashboard with information density optimization

---

## 1. DESIGN PHILOSOPHY

### Core Principles
- **Premium & Professional**: High-end financial aesthetic for serious traders
- **Information Dense**: Display more data without visual clutter
- **Performance-First**: Optimize for quick scanning and decision-making
- **Clean & Modern**: Contemporary design with sophisticated typography
- **Accessibility**: Maintain readability at reduced sizes

---

## 2. COLOR PALETTE

### Primary Colors (Financial Blue)
```css
--primary-50:  #f0f9ff   /* Light background */
--primary-100: #e0f2fe   /* Hover states */
--primary-500: #3b82f6   /* Main blue */
--primary-600: #2563eb   /* Interactive elements */
--primary-700: #1d4ed8   /* Active states */
--primary-800: #1e40af   /* Deep emphasis */
```

### Performance Colors (Stock Market)
```css
/* Red (Rising) - Based on #da4453 */
--stock-red-100: #fdf2f4   /* Micro rise */
--stock-red-200: #fce7ea   /* Small rise */
--stock-red-300: #f8b6c1   /* Medium rise */
--stock-red-400: #f28a9a   /* Large rise */
--stock-red-500: #ec5f73   /* Very large rise */
--stock-red-600: #da4453   /* Limit up */

/* Green (Falling) - Based on #37bc9b */
--stock-green-100: #f0fdf9  /* Micro fall */
--stock-green-200: #dcfcf0  /* Small fall */
--stock-green-300: #86efcf  /* Medium fall */
--stock-green-400: #5dd5b0  /* Large fall */
--stock-green-500: #37bc9b  /* Very large fall */

/* Dark (Limit Down) */
--stock-dark: #434a54      /* Limit down */
```

### Neutral Colors (Backgrounds & Text)
```css
--gray-50:  #f9fafb   /* Page background */
--gray-100: #f3f4f6   /* Card backgrounds */
--gray-200: #e5e7eb   /* Borders */
--gray-300: #d1d5db   /* Dividers */
--gray-500: #6b7280   /* Secondary text */
--gray-700: #374151   /* Body text */
--gray-900: #111827   /* Headings */
```

### Semantic Colors
```css
--success-50:  #f0fdf4
--success-500: #22c55e
--success-700: #15803d

--warning-50:  #fffbeb
--warning-500: #f59e0b
--warning-700: #b45309

--danger-50:  #fef2f2
--danger-500: #ef4444
--danger-700: #b91c1c
```

---

## 3. TYPOGRAPHY SYSTEM

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
             "PingFang SC", "Microsoft YaHei", sans-serif;
font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
```

### Type Scale (Information Dense)
```css
/* Reduced from default for information density */
.text-2xs:   0.625rem (10px)  /* Line height: 0.875rem (14px) */
.text-xs:    0.75rem  (12px)  /* Line height: 1rem (16px) */
.text-sm:    0.875rem (14px)  /* Line height: 1.25rem (20px) */
.text-base:  1rem     (16px)  /* Line height: 1.5rem (24px) */
.text-lg:    1.125rem (18px)  /* Line height: 1.75rem (28px) */
.text-xl:    1.25rem  (20px)  /* Line height: 1.75rem (28px) */
.text-2xl:   1.5rem   (24px)  /* Line height: 2rem (32px) */
```

### Font Weights
```css
.font-normal:   400  /* Body text */
.font-medium:   500  /* Emphasis */
.font-semibold: 600  /* Subheadings */
.font-bold:     700  /* Headings, important data */
```

### Usage Guidelines

**Page Title**: `text-xl md:text-2xl font-bold text-gray-900`
**Section Headers**: `text-base md:text-lg font-semibold text-gray-800`
**Card Titles**: `text-sm font-semibold text-gray-900`
**Body Text**: `text-xs md:text-sm text-gray-700`
**Labels**: `text-2xs md:text-xs text-gray-500`
**Numbers (Emphasis)**: `text-sm font-semibold text-gray-900`
**Performance Data**: `text-xs font-medium` + color classes

---

## 4. SPACING SYSTEM

### Base Unit: 0.25rem (4px)

```css
/* Premium compact spacing for information density */
.p-0:   0px     (0)
.p-0.5: 2px     (0.125rem)
.p-1:   4px     (0.25rem)
.p-1.5: 6px     (0.375rem)
.p-2:   8px     (0.5rem)
.p-2.5: 10px    (0.625rem)
.p-3:   12px    (0.75rem)
.p-4:   16px    (1rem)
.p-5:   20px    (1.25rem)
.p-6:   24px    (1.5rem)
```

### Component Spacing Guidelines

**Card Padding**: `p-3` (12px) - Compact but breathable
**Modal Padding**: `p-4 md:p-6` (16-24px) - Slightly more spacious
**Section Gaps**: `gap-2 md:gap-3` (8-12px)
**Item Spacing**: `space-y-1.5 md:space-y-2` (6-8px)
**Grid Gaps**: `gap-2` (8px) for dense layouts
**Button Padding**: `px-3 py-1.5` (12px × 6px)

---

## 5. LAYOUT STRUCTURE

### Page Structure
```
┌─────────────────────────────────────────────────────────┐
│ HEADER (bg-white shadow-sm p-3)                         │
│ ┌─────────────────┐           ┌────────────────────┐   │
│ │ Title + Icon    │           │ Top 5 Rankings     │   │
│ └─────────────────┘           └────────────────────┘   │
└─────────────────────────────────────────────────────────┘
│                                                          │
│ MAIN CONTENT (bg-gray-50 p-3)                           │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 7-Day Calendar Grid (grid-cols-7 gap-2)          │   │
│ │ ┌────┬────┬────┬────┬────┬────┬────┐            │   │
│ │ │D1  │D2  │D3  │D4  │D5  │D6  │D7  │            │   │
│ │ ├────┼────┼────┼────┼────┼────┼────┤            │   │
│ │ │Sec │Sec │Sec │Sec │Sec │Sec │Sec │            │   │
│ │ │Sec │Sec │Sec │Sec │Sec │Sec │Sec │            │   │
│ │ └────┴────┴────┴────┴────┴────┴────┘            │   │
│ └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Header Layout
```html
<!-- Compact header with title and rankings side-by-side -->
<header class="bg-white shadow-sm rounded-lg p-3">
  <div class="flex justify-between items-center gap-4">
    <!-- Left: Title -->
    <div class="flex items-center gap-2">
      <h1 class="text-xl font-bold text-gray-900">
        📈 宇硕板块节奏
      </h1>
    </div>

    <!-- Right: Top 5 Rankings + Controls -->
    <div class="flex items-center gap-2">
      <!-- Top 5 compact badges -->
      <div class="flex gap-1.5">
        {top5Rankings.map(sector => (
          <button class="px-2 py-1 text-xs rounded bg-primary-50
                         hover:bg-primary-100 border border-primary-200">
            {sector.name} · {sector.count}
          </button>
        ))}
      </div>

      <!-- Filter toggle -->
      <button class="text-xs px-2 py-1 rounded border">
        筛选
      </button>

      <!-- Refresh button -->
      <button class="text-xs px-2 py-1 rounded bg-primary-600 text-white">
        刷新
      </button>
    </div>
  </div>
</header>
```

### Calendar Grid Layout
```html
<!-- 7-day timeline grid -->
<div class="grid grid-cols-7 gap-2">
  {dates.map(date => (
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <!-- Date header: compact -->
      <div class="bg-gradient-to-r from-primary-600 to-primary-700
                  text-white p-2 text-center">
        <div class="text-xs font-medium cursor-pointer">
          {formatDate(date).slice(5)}
        </div>
        <div class="text-2xs opacity-90">{weekday}</div>
        <div class="text-2xs bg-white/20 rounded px-1.5 py-0.5 mt-1">
          {totalStocks}只
        </div>
      </div>

      <!-- Sectors list: compact cards -->
      <div class="p-2 space-y-1.5 max-h-96 overflow-y-auto">
        {sectors.map(sector => (
          <div class="border rounded p-2 cursor-pointer
                      hover:bg-gray-50 hover:border-primary-300">
            <div class="flex justify-between items-center">
              <div class="flex-1">
                <div class="text-xs font-medium text-gray-900">
                  {sector.name}
                </div>
                <div class="text-2xs text-gray-500 mt-0.5">
                  {sector.count}个
                </div>
              </div>
              <div class="text-right">
                <div class="text-2xs text-gray-500">溢价</div>
                <div class="text-xs font-medium {colorClass}">
                  {avgPremium}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
```

---

## 6. COMPONENT PATTERNS

### A. Date Header Card (Calendar Column)

**Current Issues**: Too large, wastes space
**New Design**: Compact, information-dense

```html
<!-- PREMIUM COMPACT VERSION -->
<div class="bg-gradient-to-r from-primary-600 to-primary-700
            text-white p-2 text-center">
  <!-- Date: Clickable -->
  <div class="text-xs font-medium cursor-pointer
              hover:bg-white/10 rounded px-1.5 py-0.5 transition">
    {MM-DD}
  </div>

  <!-- Weekday: Small, subtle -->
  <div class="text-2xs opacity-90 mt-0.5">
    {周一}
  </div>

  <!-- Stock count: Interactive badge -->
  <div class="text-2xs bg-white/20 hover:bg-white/30 rounded
              px-1.5 py-0.5 mt-1 cursor-pointer transition">
    {totalStocks}只
  </div>
</div>

<!-- Tailwind Classes -->
bg-gradient-to-r from-primary-600 to-primary-700
text-white p-2 text-center

text-xs font-medium cursor-pointer
hover:bg-white/10 rounded px-1.5 py-0.5 transition

text-2xs opacity-90 mt-0.5

text-2xs bg-white/20 hover:bg-white/30 rounded
px-1.5 py-0.5 mt-1 cursor-pointer transition
```

### B. Sector Card (Calendar Column Item)

**Current Issues**: Too much padding, large fonts
**New Design**: Tight spacing, smaller fonts, clean hover

```html
<!-- PREMIUM COMPACT VERSION -->
<div class="border border-gray-200 rounded p-2 cursor-pointer
            hover:bg-gray-50 hover:border-primary-300
            transition-all duration-150">
  <div class="flex justify-between items-center gap-2">
    <!-- Left: Sector info -->
    <div class="flex-1 min-w-0">
      <div class="text-xs font-medium text-gray-900 truncate">
        {sectorName}
      </div>
      <div class="text-2xs text-gray-500 mt-0.5">
        {count}个涨停
      </div>
    </div>

    <!-- Right: Performance -->
    <div class="text-right shrink-0">
      <div class="text-2xs text-gray-400">溢价</div>
      <div class="text-xs font-semibold {performanceColorClass}">
        {avgPremium}%
      </div>
    </div>
  </div>
</div>

<!-- Tailwind Classes -->
border border-gray-200 rounded p-2 cursor-pointer
hover:bg-gray-50 hover:border-primary-300
transition-all duration-150

text-xs font-medium text-gray-900 truncate
text-2xs text-gray-500 mt-0.5
text-2xs text-gray-400
text-xs font-semibold
```

### C. Top 5 Ranking Badges (Header)

**New Feature**: Compact sector strength display

```html
<!-- PREMIUM COMPACT VERSION -->
<div class="flex items-center gap-1.5 flex-wrap">
  {top5Rankings.map((sector, index) => (
    <button
      class="group px-2 py-1 text-xs font-medium rounded
             border transition-all duration-150
             {index === 0 ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100' :
              index === 1 ? 'bg-gray-50 border-gray-300 text-gray-800 hover:bg-gray-100' :
              index === 2 ? 'bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100' :
              'bg-primary-50 border-primary-200 text-primary-800 hover:bg-primary-100'}"
      onClick={() => openRankingModal(sector)}
    >
      <span class="font-semibold">#{index + 1}</span>
      <span class="mx-1">·</span>
      <span>{sector.name}</span>
      <span class="ml-1 opacity-75">({sector.totalCount})</span>
    </button>
  ))}
</div>

<!-- Tailwind Classes -->
/* Medal colors for top 3 */
bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100    /* 1st */
bg-gray-50 border-gray-300 text-gray-800 hover:bg-gray-100        /* 2nd */
bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100 /* 3rd */
bg-primary-50 border-primary-200 text-primary-800 hover:bg-primary-100 /* 4-5 */

px-2 py-1 text-xs font-medium rounded border
transition-all duration-150
```

### D. Modal - Date Click (Stock List)

**Current Issues**: Large padding, big fonts
**New Design**: Table layout, compact rows

```html
<!-- PREMIUM COMPACT VERSION -->
<div class="fixed inset-0 bg-black/60 backdrop-blur-sm
            flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-xl shadow-2xl
              max-w-6xl w-full max-h-[90vh]
              flex flex-col overflow-hidden">

    <!-- Header: Compact -->
    <div class="flex justify-between items-center
                px-4 py-3 border-b border-gray-200">
      <h3 class="text-base font-semibold text-gray-900">
        📈 {formatDate(date)} - 涨停个股溢价分析
      </h3>

      <div class="flex items-center gap-2">
        <!-- Filter toggle -->
        <button class="text-xs px-2 py-1 rounded border">
          {showOnly5Plus ? '显示全部' : '只显≥5家'}
        </button>

        <!-- Close button -->
        <button class="w-7 h-7 rounded-full hover:bg-gray-100">
          ✕
        </button>
      </div>
    </div>

    <!-- Content: Table format for density -->
    <div class="overflow-auto p-4">
      <table class="w-full text-xs">
        <thead class="sticky top-0 bg-white border-b-2">
          <tr>
            <th class="px-2 py-1.5 text-left font-semibold">
              排名
            </th>
            <th class="px-2 py-1.5 text-left font-semibold">
              股票
            </th>
            <th class="px-2 py-1.5 text-left font-semibold">
              板块
            </th>
            <th class="px-2 py-1.5 text-center font-semibold">
              T+1
            </th>
            <th class="px-2 py-1.5 text-center font-semibold">
              T+2
            </th>
            <th class="px-2 py-1.5 text-center font-semibold">
              T+3
            </th>
            <th class="px-2 py-1.5 text-center font-semibold">
              T+4
            </th>
            <th class="px-2 py-1.5 text-center font-semibold">
              T+5
            </th>
            <th class="px-2 py-1.5 text-center font-semibold">
              累计
            </th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, index) => (
            <tr class="border-b hover:bg-primary-50 transition">
              <td class="px-2 py-1.5">
                <span class="text-2xs text-gray-400 font-mono">
                  #{index + 1}
                </span>
              </td>
              <td class="px-2 py-1.5">
                <button class="text-primary-600 hover:text-primary-700
                               font-medium hover:underline">
                  {stock.name}
                </button>
                <span class="text-2xs text-gray-400 ml-1">
                  {stock.code}
                </span>
              </td>
              <td class="px-2 py-1.5">
                <span class="px-1.5 py-0.5 rounded text-2xs
                             bg-primary-50 text-primary-700">
                  {stock.sector}
                </span>
              </td>
              {followUpDates.map(date => (
                <td class="px-2 py-1.5 text-center">
                  <span class="px-1.5 py-0.5 rounded text-2xs
                               font-medium {performanceClass}">
                    {performance}%
                  </span>
                </td>
              ))}
              <td class="px-2 py-1.5 text-center">
                <span class="px-2 py-0.5 rounded text-xs
                             font-semibold {performanceClass}">
                  {totalReturn}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Tailwind Classes -->
fixed inset-0 bg-black/60 backdrop-blur-sm
flex items-center justify-center z-50 p-4

bg-white rounded-xl shadow-2xl
max-w-6xl w-full max-h-[90vh]
flex flex-col overflow-hidden

px-4 py-3 border-b border-gray-200
text-base font-semibold text-gray-900

w-full text-xs
sticky top-0 bg-white border-b-2
px-2 py-1.5 text-left font-semibold

border-b hover:bg-primary-50 transition
```

### E. Modal - Sector Click (Stock Premium Chart)

**Current Issues**: Large layout, inefficient space use
**New Design**: Split view with chart + table

```html
<!-- PREMIUM SPLIT VIEW VERSION -->
<div class="fixed inset-0 bg-black/60 backdrop-blur-sm
            flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-xl shadow-2xl
              max-w-6xl w-full max-h-[90vh]
              flex flex-col overflow-hidden">

    <!-- Header -->
    <div class="flex justify-between items-center
                px-4 py-3 border-b">
      <h3 class="text-base font-semibold">
        📊 {sectorName} - 个股梯队详情
      </h3>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <span>{formatDate(date)}</span>
        <span>·</span>
        <span>{stockCount}只个股</span>
        <button class="w-7 h-7 rounded-full hover:bg-gray-100 ml-2">
          ✕
        </button>
      </div>
    </div>

    <!-- Content: Split layout -->
    <div class="flex-1 overflow-hidden flex">
      <!-- Left: Chart (40%) -->
      <div class="w-2/5 border-r p-4 overflow-auto">
        <h4 class="text-sm font-semibold mb-3">
          📈 5天平均溢价趋势
        </h4>
        <div class="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {/* Chart component */}
          </ResponsiveContainer>
        </div>
      </div>

      <!-- Right: Stock table (60%) -->
      <div class="flex-1 overflow-auto p-4">
        <table class="w-full text-xs">
          <thead class="sticky top-0 bg-white border-b-2">
            <tr>
              <th class="px-2 py-1.5 text-left">#</th>
              <th class="px-2 py-1.5 text-left">股票</th>
              <th class="px-2 py-1.5 text-center">T+1</th>
              <th class="px-2 py-1.5 text-center">T+2</th>
              <th class="px-2 py-1.5 text-center">T+3</th>
              <th class="px-2 py-1.5 text-center">T+4</th>
              <th class="px-2 py-1.5 text-center">T+5</th>
              <th class="px-2 py-1.5 text-center">累计</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, index) => (
              <tr class="border-b hover:bg-primary-50">
                <td class="px-2 py-1.5 text-2xs text-gray-400">
                  #{index + 1}
                </td>
                <td class="px-2 py-1.5">
                  <button class="text-primary-600 hover:underline">
                    {stock.name}
                  </button>
                </td>
                {/* Performance cells */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- Tailwind Classes -->
flex-1 overflow-hidden flex

w-2/5 border-r p-4 overflow-auto      /* Chart column */
flex-1 overflow-auto p-4              /* Table column */

h-64                                   /* Chart height */
```

### F. Modal - Stock Count Click (Sector Grouped)

**Current Issues**: Accordion-style, inefficient
**New Design**: Compact grouped tables

```html
<!-- PREMIUM GROUPED TABLE VERSION -->
<div class="fixed inset-0 bg-black/60 backdrop-blur-sm
            flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-xl shadow-2xl
              max-w-7xl w-full max-h-[90vh]
              flex flex-col overflow-hidden">

    <!-- Header -->
    <div class="px-4 py-3 border-b">
      <div class="flex justify-between items-center">
        <h3 class="text-base font-semibold">
          📊 {formatDate(date)} - 按板块分组
        </h3>
        <div class="flex items-center gap-2">
          <button class="text-xs px-2 py-1 rounded border">
            {filter}
          </button>
          <button class="w-7 h-7 rounded-full hover:bg-gray-100">
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Content: Grouped tables -->
    <div class="overflow-auto p-4 space-y-3">
      {sectorData.map((sector, index) => (
        <div class="bg-gray-50 rounded-lg p-3">
          <!-- Sector header: Compact -->
          <div class="flex justify-between items-center mb-2">
            <h4 class="text-sm font-semibold text-gray-900">
              {sector.name}
              <span class="text-xs text-gray-500 ml-1">
                ({sector.stocks.length}只)
              </span>
            </h4>
            <div class="text-xs font-medium {performanceClass}">
              平均: {sector.avgPremium}%
            </div>
          </div>

          <!-- Table: Ultra-compact -->
          <div class="overflow-x-auto">
            <table class="w-full text-2xs">
              <thead class="bg-white">
                <tr class="border-b">
                  <th class="px-1.5 py-1 text-left min-w-[100px]">
                    股票
                  </th>
                  {dates.map(date => (
                    <th class="px-1 py-1 text-center min-w-[40px]">
                      {date.slice(-2)}
                    </th>
                  ))}
                  <th class="px-1.5 py-1 text-center min-w-[50px]">
                    累计
                  </th>
                </tr>
              </thead>
              <tbody>
                {sector.stocks.map((stock, idx) => (
                  <tr class="border-b {idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                             hover:bg-primary-50">
                    <td class="px-1.5 py-1">
                      <button class="text-primary-600 hover:underline
                                     truncate max-w-[100px]">
                        {stock.name}
                      </button>
                    </td>
                    {dates.map(date => (
                      <td class="px-1 py-1 text-center">
                        <span class="px-1 py-0.5 rounded {performanceClass}">
                          {performance}
                        </span>
                      </td>
                    ))}
                    <td class="px-1.5 py-1 text-center">
                      <span class="px-1.5 py-0.5 rounded font-medium
                                   {performanceClass}">
                        {totalReturn}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>

<!-- Tailwind Classes -->
overflow-auto p-4 space-y-3

bg-gray-50 rounded-lg p-3
text-sm font-semibold text-gray-900
text-xs text-gray-500

w-full text-2xs
px-1.5 py-1 text-left min-w-[100px]
px-1 py-1 text-center min-w-[40px]
```

### G. Modal - Ranking Click (3-Day Breakdown)

**New Feature**: Timeline-style sector performance

```html
<!-- PREMIUM TIMELINE VERSION -->
<div class="fixed inset-0 bg-black/60 backdrop-blur-sm
            flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-xl shadow-2xl
              max-w-4xl w-full max-h-[90vh]
              flex flex-col overflow-hidden">

    <!-- Header -->
    <div class="px-4 py-3 border-b">
      <h3 class="text-base font-semibold">
        🏆 板块3天涨停总数排行 (前5名)
      </h3>
      <p class="text-xs text-gray-500 mt-1">
        统计最近3个交易日各板块涨停总数
      </p>
    </div>

    <!-- Content: Ranking cards -->
    <div class="overflow-auto p-4 space-y-2">
      {rankings.map((sector, index) => (
        <div class="bg-white border-2 rounded-lg p-3
                    hover:border-primary-300 transition">
          <div class="flex justify-between items-center">
            <!-- Left: Rank + Name -->
            <div class="flex items-center gap-3">
              <!-- Medal badge -->
              <div class="w-8 h-8 rounded-full flex items-center
                          justify-center text-sm font-bold
                          {index === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white' :
                           index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                           index === 2 ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white' :
                           'bg-gray-100 text-gray-600'}">
                {index + 1}
              </div>

              <!-- Sector name -->
              <div>
                <h4 class="text-sm font-semibold text-gray-900">
                  {sector.name}
                </h4>
                <p class="text-2xs text-gray-500">
                  3天累计涨停数
                </p>
              </div>
            </div>

            <!-- Right: Total count badge -->
            <div class="px-3 py-1.5 rounded-full font-bold text-sm
                        {index === 0 ? 'bg-red-100 text-red-700' :
                         index === 1 ? 'bg-orange-100 text-orange-700' :
                         index === 2 ? 'bg-yellow-100 text-yellow-700' :
                         'bg-gray-100 text-gray-700'}">
              {sector.totalCount}只
            </div>
          </div>

          <!-- Daily breakdown: 3-column grid -->
          <div class="grid grid-cols-3 gap-2 mt-3
                      bg-gray-50 rounded p-2">
            {sector.dailyBreakdown.map(day => (
              <div class="text-center bg-white rounded p-1.5 border">
                <div class="text-2xs text-gray-500 mb-0.5">
                  {formatDate(day.date).slice(5)}
                </div>
                <div class="text-sm font-semibold
                            {day.count >= 10 ? 'text-red-600' :
                             day.count >= 5 ? 'text-orange-600' :
                             'text-primary-600'}">
                  {day.count}
                </div>
                <div class="text-2xs text-gray-400">
                  只涨停
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
</div>

<!-- Tailwind Classes -->
bg-white border-2 rounded-lg p-3
hover:border-primary-300 transition

w-8 h-8 rounded-full flex items-center
justify-center text-sm font-bold

/* Medal colors */
bg-gradient-to-r from-amber-400 to-amber-500 text-white      /* 1st */
bg-gradient-to-r from-gray-300 to-gray-400 text-white        /* 2nd */
bg-gradient-to-r from-orange-300 to-orange-400 text-white    /* 3rd */
bg-gray-100 text-gray-600                                     /* 4-5 */

grid grid-cols-3 gap-2 mt-3
bg-gray-50 rounded p-2

text-center bg-white rounded p-1.5 border
```

---

## 7. BUTTON STYLES

### Primary Button
```html
<button class="px-3 py-1.5 text-xs font-medium
               bg-primary-600 text-white rounded
               hover:bg-primary-700
               active:bg-primary-800
               transition-colors duration-150">
  刷新数据
</button>
```

### Secondary Button
```html
<button class="px-3 py-1.5 text-xs font-medium
               bg-white text-gray-700 rounded border border-gray-300
               hover:bg-gray-50 hover:border-gray-400
               active:bg-gray-100
               transition-colors duration-150">
  筛选
</button>
```

### Filter Toggle Button
```html
<button class="px-2 py-1 text-xs font-medium rounded
               border transition-colors duration-150
               {isActive ?
                'bg-primary-100 text-primary-700 border-primary-300' :
                'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}">
  {label}
</button>
```

### Icon Button (Close)
```html
<button class="w-7 h-7 flex items-center justify-center
               rounded-full text-gray-500
               hover:bg-gray-100 hover:text-gray-700
               transition-colors duration-150">
  ✕
</button>
```

---

## 8. PERFORMANCE DATA DISPLAY

### Performance Badge (Stock Returns)
```html
<!-- Size: text-2xs for T+1 to T+5, text-xs for cumulative -->
<span class="px-1.5 py-0.5 rounded text-2xs font-medium
             {performanceColorClass}">
  {value}%
</span>

<!-- Cumulative (larger emphasis) -->
<span class="px-2 py-0.5 rounded text-xs font-semibold
             {performanceColorClass}">
  {totalReturn}%
</span>
```

### Performance Color Classes (From utils.ts)
```typescript
// Use existing getPerformanceClass() function
// Returns complete Tailwind class strings based on value:

// Positive (Red family):
numValue >= 9.5:  'bg-stock-red-600 text-white font-bold'     /* Limit up */
numValue >= 7:    'bg-stock-red-500 text-white font-semibold'  /* Large rise */
numValue >= 5:    'bg-stock-red-400 text-white font-medium'    /* Med-large rise */
numValue >= 3:    'bg-stock-red-300 text-red-900 font-medium'  /* Medium rise */
numValue >= 1:    'bg-stock-red-200 text-red-800 font-medium'  /* Small rise */
numValue > 0:     'bg-stock-red-100 text-red-700 font-medium'  /* Micro rise */

// Zero:
numValue === 0:   'bg-slate-100 text-slate-600 font-medium'    /* Flat */

// Negative (Green/Dark family):
numValue <= -9.5: 'bg-stock-dark text-white font-bold'         /* Limit down */
numValue <= -7:   'bg-stock-green-500 text-white font-semibold' /* Large fall */
numValue <= -5:   'bg-stock-green-400 text-white font-medium'   /* Med-large fall */
numValue <= -3:   'bg-stock-green-300 text-green-900 font-medium' /* Medium fall */
numValue <= -1:   'bg-stock-green-200 text-green-800 font-medium' /* Small fall */
numValue < 0:     'bg-stock-green-100 text-green-700 font-medium' /* Micro fall */
```

---

## 9. TABLE STYLES

### Compact Table Pattern
```html
<table class="w-full text-xs">
  <thead class="sticky top-0 bg-white border-b-2 border-gray-200">
    <tr>
      <th class="px-2 py-1.5 text-left text-2xs font-semibold
                 text-gray-700 uppercase tracking-wide">
        Header
      </th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-b border-gray-200
               hover:bg-primary-50 transition-colors">
      <td class="px-2 py-1.5">
        Cell content
      </td>
    </tr>
  </tbody>
</table>

<!-- Ultra-compact table (for grouped modals) -->
<table class="w-full text-2xs">
  <thead class="bg-white">
    <tr class="border-b">
      <th class="px-1.5 py-1 text-left min-w-[100px]">
        Header
      </th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-b {zebraStripe} hover:bg-primary-50">
      <td class="px-1.5 py-1">
        Cell
      </td>
    </tr>
  </tbody>
</table>
```

### Zebra Striping
```html
{stocks.map((stock, index) => (
  <tr class="border-b
             {index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
             hover:bg-primary-50">
    ...
  </tr>
))}
```

### Sticky Headers
```css
.sticky-header {
  @apply sticky top-0 bg-white border-b-2 z-10;
}
```

---

## 10. MODAL PATTERNS

### Base Modal Structure
```html
<!-- Overlay with backdrop blur -->
<div class="fixed inset-0 bg-black/60 backdrop-blur-sm
            flex items-center justify-center z-50 p-4"
     onClick={closeModal}>

  <!-- Modal container -->
  <div class="bg-white rounded-xl shadow-2xl
              max-w-{size} w-full max-h-[90vh]
              flex flex-col overflow-hidden"
       onClick={stopPropagation}>

    <!-- Header: Fixed -->
    <div class="px-4 py-3 border-b border-gray-200 shrink-0">
      <div class="flex justify-between items-center">
        <h3 class="text-base font-semibold text-gray-900">
          {title}
        </h3>
        <button class="w-7 h-7 rounded-full hover:bg-gray-100"
                onClick={closeModal}>
          ✕
        </button>
      </div>
    </div>

    <!-- Content: Scrollable -->
    <div class="flex-1 overflow-auto p-4">
      {content}
    </div>

    <!-- Footer (optional): Fixed -->
    <div class="px-4 py-3 border-t border-gray-200 shrink-0">
      {footer}
    </div>
  </div>
</div>
```

### Modal Sizes
```css
max-w-md:   28rem (448px)   /* Small modal */
max-w-lg:   32rem (512px)   /* Medium modal */
max-w-2xl:  42rem (672px)   /* Large modal */
max-w-4xl:  56rem (896px)   /* XL modal */
max-w-6xl:  72rem (1152px)  /* 2XL modal - tables */
max-w-7xl:  80rem (1280px)  /* 3XL modal - wide tables */
```

### Modal Animations
```css
/* Add to globals.css */
@layer utilities {
  .modal-enter {
    animation: modalEnter 0.2s ease-out;
  }

  .modal-leave {
    animation: modalLeave 0.15s ease-in;
  }
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes modalLeave {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

---

## 11. RESPONSIVE DESIGN

### Breakpoints
```css
sm:  640px   /* Small tablets */
md:  768px   /* Tablets */
lg:  1024px  /* Laptops */
xl:  1280px  /* Desktops */
2xl: 1536px  /* Large desktops */
```

### Mobile Optimizations (< 768px)

**Header**: Stack vertically, hide top 5
```html
<header class="flex flex-col md:flex-row gap-2 md:gap-4">
  <h1 class="text-lg md:text-xl">Title</h1>
  <div class="hidden md:flex">Top 5 Rankings</div>
  <div class="flex gap-2">Buttons</div>
</header>
```

**Calendar Grid**: 3 columns on mobile
```html
<div class="grid grid-cols-3 md:grid-cols-7 gap-2">
  {dates.map(...)}
</div>
```

**Modals**: Full-width on mobile
```html
<div class="max-w-full md:max-w-4xl w-full">
  Modal content
</div>
```

**Tables**: Horizontal scroll
```html
<div class="overflow-x-auto">
  <table class="min-w-full">
    ...
  </table>
</div>
```

### Tablet Optimizations (768px - 1024px)

**Calendar Grid**: 5 columns
```html
<div class="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
  {dates.map(...)}
</div>
```

**Typography**: Slightly larger
```html
<h1 class="text-lg md:text-xl lg:text-2xl">Title</h1>
<p class="text-xs md:text-sm">Body text</p>
```

---

## 12. ANIMATION & TRANSITIONS

### Hover Transitions
```css
/* Smooth color transitions */
transition-colors duration-150

/* Scale on hover */
hover:scale-105 transition-transform duration-200

/* Combined */
transition-all duration-150
```

### Loading States
```html
<!-- Spinner -->
<div class="animate-spin rounded-full h-8 w-8
            border-2 border-primary-600 border-t-transparent">
</div>

<!-- Pulse skeleton -->
<div class="animate-pulse bg-gray-200 rounded h-4 w-full">
</div>
```

### Fade In Animation
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

---

## 13. ACCESSIBILITY

### Focus States
```css
focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
```

### Contrast Ratios
- Text: Minimum 4.5:1 (AA standard)
- Large text: Minimum 3:1
- UI components: Minimum 3:1

### Keyboard Navigation
```html
<!-- All interactive elements must be keyboard accessible -->
<button tabIndex={0} onKeyDown={handleKeyDown}>
  Button
</button>
```

### Screen Reader Support
```html
<button aria-label="Close modal">
  ✕
</button>

<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h3 id="modal-title">Modal Title</h3>
</div>
```

---

## 14. IMPLEMENTATION CHECKLIST

### Phase 1: Layout & Typography
- [ ] Update header layout (title + top 5 rankings)
- [ ] Reduce font sizes across all components
- [ ] Optimize spacing (padding, margins, gaps)
- [ ] Implement compact calendar grid
- [ ] Update sector card designs

### Phase 2: Modals
- [ ] Redesign Date Click Modal (table layout)
- [ ] Redesign Sector Click Modal (split view)
- [ ] Redesign Stock Count Modal (grouped tables)
- [ ] Implement Ranking Modal (timeline view)

### Phase 3: Components
- [ ] Update button styles (smaller, cleaner)
- [ ] Optimize table layouts (sticky headers, zebra)
- [ ] Implement performance badges (compact)
- [ ] Add hover states and transitions

### Phase 4: Responsive
- [ ] Mobile layout (3-column grid)
- [ ] Tablet layout (5-column grid)
- [ ] Modal responsive behavior
- [ ] Touch-friendly interactions

### Phase 5: Polish
- [ ] Add loading states
- [ ] Implement animations
- [ ] Test accessibility
- [ ] Performance optimization

---

## 15. CODE PATTERNS

### Class Name Patterns

**Container**:
```typescript
const containerClasses = cn(
  "max-w-7xl mx-auto px-3 py-3"
);
```

**Card**:
```typescript
const cardClasses = cn(
  "bg-white rounded-lg shadow-sm border border-gray-200",
  "hover:shadow-md hover:border-gray-300",
  "transition-all duration-150"
);
```

**Button**:
```typescript
const buttonClasses = cn(
  "px-3 py-1.5 text-xs font-medium rounded",
  "transition-colors duration-150",
  variant === 'primary'
    ? "bg-primary-600 text-white hover:bg-primary-700"
    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
);
```

### Conditional Classes
```typescript
const getPerformanceClass = (value: number) => {
  return cn(
    "px-1.5 py-0.5 rounded text-2xs font-medium",
    value >= 9.5 && "bg-stock-red-600 text-white",
    value >= 5 && value < 9.5 && "bg-stock-red-400 text-white",
    value > 0 && value < 5 && "bg-stock-red-200 text-red-800",
    value === 0 && "bg-slate-100 text-slate-600",
    value < 0 && value > -5 && "bg-stock-green-200 text-green-800",
    value <= -5 && "bg-stock-green-500 text-white"
  );
};
```

---

## 16. PERFORMANCE OPTIMIZATIONS

### CSS Optimization
- Use Tailwind's purge/content feature
- Minimize custom CSS
- Use CSS Grid over Flexbox for complex layouts
- Avoid deep nesting

### Component Optimization
- Use React.memo for expensive components
- Implement virtualization for long lists
- Lazy load modals
- Debounce filter inputs

### Image Optimization
- Use lazy loading: `loading="lazy"`
- Provide fallback images
- Optimize image sizes

---

## 17. DESIGN TOKENS (Summary)

```typescript
// design-tokens.ts
export const tokens = {
  colors: {
    primary: {
      50: '#f0f9ff',
      600: '#2563eb',
      700: '#1d4ed8',
    },
    stockRed: {
      100: '#fdf2f4',
      600: '#da4453',
    },
    stockGreen: {
      100: '#f0fdf9',
      500: '#37bc9b',
    },
    stockDark: '#434a54',
  },

  typography: {
    sizes: {
      '2xs': '0.625rem',
      'xs': '0.75rem',
      'sm': '0.875rem',
      'base': '1rem',
      'lg': '1.125rem',
      'xl': '1.25rem',
      '2xl': '1.5rem',
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  spacing: {
    compact: {
      xs: '0.25rem',   // 4px
      sm: '0.5rem',    // 8px
      md: '0.75rem',   // 12px
      lg: '1rem',      // 16px
      xl: '1.5rem',    // 24px
    },
  },

  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
};
```

---

## 18. VISUAL EXAMPLES (ASCII Art)

### Header Layout
```
┌───────────────────────────────────────────────────────────────┐
│ 📈 宇硕板块节奏                  [#1 消费] [#2 医药] [#3...]   │
│                                  [筛选] [🏆 3天] [🔄 刷新]     │
└───────────────────────────────────────────────────────────────┘
```

### Calendar Grid (7 days)
```
┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│ 01-15  │ 01-16  │ 01-17  │ 01-18  │ 01-19  │ 01-22  │ 01-23  │
│  周一  │  周二  │  周三  │  周四  │  周五  │  周一  │  周二  │
│ 45只   │ 52只   │ 38只   │ 61只   │ 47只   │ 39只   │ 55只   │
├────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ 消费 8 │ 医药10 │ 科技 5 │ 医药12 │ 消费 9 │ 科技 7 │ 消费11 │
│  +5.2% │ +6.1%  │ +3.8%  │ +7.3%  │ +4.9%  │ +5.4%  │ +6.7%  │
├────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ 科技 6 │ 消费 8 │ 医药 7 │ 消费 9 │ 科技 6 │ 医药 8 │ 科技 9 │
│  +4.5% │ +5.3%  │ +5.0%  │ +6.2%  │ +3.7%  │ +6.0%  │ +5.8%  │
└────────┴────────┴────────┴────────┴────────┴────────┴────────┘
```

### Date Modal (Table View)
```
┌─────────────────────────────────────────────────────────────┐
│ 📈 2025-01-18 - 涨停个股溢价分析               [只显≥5家] [✕]│
├─────────────────────────────────────────────────────────────┤
│ #  │ 股票       │ 板块 │ T+1  │ T+2  │ T+3  │ T+4  │ T+5  │ 累计 │
├────┼───────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ 1  │ 贵州茅台   │ 消费 │ +2.5 │ +1.8 │ +3.2 │ -0.5 │ +1.0 │ +8.0 │
│ 2  │ 迈瑞医疗   │ 医药 │ +1.9 │ +2.3 │ +1.5 │ +0.8 │ +0.9 │ +7.4 │
│ 3  │ 宁德时代   │ 科技 │ +3.1 │ -0.5 │ +2.0 │ +1.2 │ +1.0 │ +6.8 │
└────┴───────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
```

### Sector Modal (Split View)
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 消费板块 - 个股梯队详情        2025-01-18 · 8只个股  [✕]│
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│  📈 5天平均溢价趋势   │  #  │ 股票     │ T+1│T+2│T+3│T+4│T+5│
│                      │ ────┼─────────┼────┼───┼───┼───┼───┤
│  Chart Area          │  1  │ 贵州茅台 │2.5 │1.8│3.2│0.5│1.0│
│  (Line Chart)        │  2  │ 五粮液   │1.9 │2.1│1.7│1.2│0.8│
│                      │  3  │ 伊利股份 │1.5 │1.0│2.0│0.9│1.1│
│                      │ ... │ ...      │... │...│...│...│...│
│                      │                                      │
└──────────────────────┴──────────────────────────────────────┘
    40% width              60% width
```

---

## 19. FINAL NOTES

### Key Design Principles
1. **Information Density**: More data, less space
2. **Hierarchy**: Clear visual hierarchy through size and weight
3. **Consistency**: Reusable patterns across all components
4. **Performance**: Fast, smooth, responsive
5. **Accessibility**: Readable at all sizes, keyboard navigable

### Next Steps
1. Review this specification with development team
2. Create design mockups in Figma (optional)
3. Implement components incrementally
4. Test on multiple devices and screen sizes
5. Gather user feedback and iterate

### Maintenance
- Update this document as design evolves
- Keep design tokens synchronized with code
- Document any new patterns or components
- Review accessibility regularly

---

**End of Design Specification**