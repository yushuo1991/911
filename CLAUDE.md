# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**涨停板跟踪系统 (Stock Limit-Up Tracking System)** - A Next.js 14 stock analysis application that tracks Chinese A-share stocks hitting daily limit-up (涨停板), analyzes sector momentum over 7 trading days, and displays stock performance with premium charts. Deployed via Docker with MySQL backend.

## Development Commands

### Core Commands
```bash
# Development
npm run dev              # Start development server (port 3000)

# Production Build
npm run build            # Next.js production build
npm run start            # Start production server

# Code Quality
npm run lint             # ESLint check
npm run type-check       # TypeScript type checking (tsc --noEmit)
```

### Docker Deployment
```bash
# Build and deploy
docker compose build --no-cache
docker compose up -d

# Check status
docker ps
docker logs stock-tracker

# Restart
docker compose restart
```

### Database Operations
```bash
# Connect to MySQL container
docker exec -it mysql mysql -u stock_user -p stock_tracker

# Backup database
docker exec mysql mysqldump -u root -p stock_tracker > backup.sql
```

## Architecture

### Frontend Architecture
- **Framework**: Next.js 14 (App Router, React Server Components)
- **Styling**: Tailwind CSS with custom stock color system
- **UI Pattern**: Multi-modal complex data visualization
  - 7-day timeline grid layout (7 columns, one per trading day)
  - Sector cards with stock lists, sorted by board count or return
  - Multiple z-indexed modals (弹窗系统):
    - Sector detail modal (z-60): Shows stock ladder with 5-day premium chart
    - Stock count modal (z-50): Groups all limit-up stocks by sector
    - K-line/minute chart modals (z-90): Batch displays of stock charts (12 per page)
    - 7-day ladder modal: Horizontal date table showing sector momentum

### Backend Architecture
- **API Routes**: Next.js API routes (`/api/stocks`, `/api/cron`)
- **Data Sources**:
  1. **Primary**: `apphis.longhuvip.com/w1/api/index.php` - Limit-up stock data
  2. **Secondary**: Tushare Pro API - Stock daily data (pct_chg) and trading calendar
  3. **Fallback**: Mock data generation if APIs fail
- **Caching Strategy** (Multi-layer):
  1. Memory cache (StockDataCache class) - 24h for stock data, 5min for 7-day data
  2. MySQL database cache (`stock_cache`, `stock_performance_cache`, `seven_days_cache` tables)
  3. Rate limiting (700 requests/min to Tushare API with exponential backoff)

### Data Flow
```
User Request → API Route → Check Memory Cache → Check DB Cache →
External API (limit-up stocks) → Tushare API (daily returns) →
Process & Cache → Return JSON → React Client → Modal/Chart Display
```

### Key Data Structures

**Stock Performance**:
```typescript
interface StockPerformance {
  name: string;           // 股票名称
  code: string;           // 股票代码
  td_type: string;        // 板数 ("首板", "2连板", "3连板"...)
  performance: Record<string, number>;  // 每日涨跌幅 { "2025-10-15": 5.2, ... }
  total_return: number;   // 5日累计溢价
  amount?: number;        // 成交额（亿元）
  limitUpTime?: string;   // 涨停时间 (HH:MM)
}
```

**7-Day Data Structure**:
```typescript
Record<string, {  // Key: date (YYYY-MM-DD)
  date: string;
  categories: Record<string, StockPerformance[]>;  // 按板块分组
  stats: { total_stocks: number; category_count: number; profit_ratio: number; };
  followUpData: Record<string, Record<string, Record<string, number>>>;  // 后续5日表现
  sectorAmounts: Record<string, number>;  // 板块成交额汇总（亿元）
}>
```

## Important Implementation Details

### Custom Color System
Tailwind config defines custom stock colors:
- **Red系** (`stock-red-100` to `stock-red-600`): Upward movement (涨), based on #da4453
- **Green系** (`stock-green-100` to `stock-green-500`): Downward movement (跌), based on #37bc9b
- **Orange系** (`stock-orange-100/400/600`): Transaction volume highlighting
  - `bg-stock-orange-600` (#E9573F): Top 1 volume (深橙色)
  - `bg-stock-orange-400` (#FC6E51): Top 2 volume (中橙色)
  - `bg-stock-orange-100` (#FCFCE5): Default background (浅橙色)

### Trading Day Calendar
- Uses Tushare `trade_cal` API to fetch real trading days (excludes weekends and holidays)
- Implemented in `src/lib/enhanced-trading-calendar.ts`
- Functions: `get7TradingDaysFromCalendar()`, `getValidTradingDays(baseDate, days)`
- Cached for 4 hours to avoid API limits

### Sorting Logic (v4.8.24)
Stocks are sorted by:
1. **Primary**: Board count (高板优先) - Weight function: `getBoardWeight(td_type)`
   - "10连板+" → 10, "9连板" → 9, ..., "首板" → 1
2. **Secondary**: Limit-up time (涨停时间) - Earlier = Higher priority
   - Compare `limitUpTime` strings (HH:MM format)

Global sort mode toggle: `sectorModalSortMode` ('board' | 'return')

### Performance Optimization
- **Lazy loading**: Images use `loading="lazy"` and base64 placeholder on error
- **Pagination**: Chart modals show 12 stocks per page
- **Skeleton screen**: Displays during initial data load
- **API batching**: `getBatchStockDaily()` batches multiple stock/date queries to Tushare

### Database Schema
Key tables:
- `stock_cache`: Caches limit-up stock lists by date
- `stock_performance_cache`: Caches individual stock daily returns
- `seven_days_cache`: Caches entire 7-day data structure (JSON)
- Managed by `src/lib/database.ts` → `stockDatabase` singleton

## Environment Variables

Required in `.env`:
```bash
# Tushare API (mandatory for real data)
TUSHARE_TOKEN=your_tushare_token_here

# MySQL Database
MYSQL_HOST=mysql
MYSQL_DATABASE=stock_tracker
MYSQL_USER=stock_user
MYSQL_PASSWORD=StockTracker2024!

# Application
NODE_ENV=production
PORT=3000
```

## Common Development Patterns

### Adding a New Modal
1. Add state: `const [showMyModal, setShowMyModal] = useState(false);`
2. Add modal data state: `const [myModalData, setMyModalData] = useState<MyDataType | null>(null);`
3. Create modal JSX with proper z-index (z-50, z-60, z-90 for highest priority)
4. Add backdrop click handler: `<div className="fixed inset-0 z-XX" onClick={closeMyModal} />`

### Fetching Stock Data
Always use the multi-layer cache pattern:
```typescript
// 1. Check memory cache
const cached = stockCache.get(stockCode, tradingDays);
if (cached) return cached;

// 2. Check database cache
const dbCached = await stockDatabase.getCachedStockPerformance(...);
if (dbCached) {
  stockCache.set(stockCode, tradingDays, dbCached);
  return dbCached;
}

// 3. Fetch from Tushare API
const data = await getTushareStockDaily(...);
// 4. Cache results
await stockDatabase.cacheStockPerformance(...);
stockCache.set(stockCode, tradingDays, data);
```

### Working with Trading Days
Never hardcode date calculations. Always use:
```typescript
import { get7TradingDaysFromCalendar, getValidTradingDays } from '@/lib/enhanced-trading-calendar';

// Get 7 trading days ending on date
const sevenDays = await get7TradingDaysFromCalendar(endDate);

// Get next 5 trading days after baseDate
const followUpDays = await getValidTradingDays(baseDate, 5);
```

## Known Issues & Quirks

1. **Browser caching**: 7-day data uses aggressive no-cache headers due to stale cache issues (v4.8.9 fix)
2. **API rate limits**: Tushare has 800/min limit; code uses 700/min buffer with exponential backoff
3. **Stock code format**: Different APIs use different formats:
   - Limit-up API: `000001`, `600000`
   - Tushare API: `000001.SZ`, `600000.SH`
   - Sina charts: `sz000001`, `sh600000`
   - Use conversion functions: `convertStockCodeForTushare()`, `getStockCodeFormat()`
4. **Date format**: External APIs use YYYYMMDD, internal code uses YYYY-MM-DD
5. **Board type inconsistency**: API returns "首板", "2连板", "3连板"; code normalizes to "1", "2板", "3板"

## Testing Checklist

Before deploying:
- [ ] Run `npm run type-check` - Must pass with no errors
- [ ] Run `npm run lint` - Must pass with no warnings
- [ ] Test 7-day data display with real trading days (check for holiday handling)
- [ ] Test all modal interactions (sector, stock count, K-line, minute chart)
- [ ] Verify color highlighting (top 2 volume, board count colors)
- [ ] Check sorting modes (连板排序 vs 涨幅排序)
- [ ] Test pagination in chart modals
- [ ] Verify database cache persistence across restarts

## Deployment Process

1. **Local testing**: `npm run build && npm run start`
2. **Git commit**: Always tag stable versions (e.g., `v4.8.24-stable-20251015`)
3. **Backup current version**: Use backup scripts in project root
4. **Deploy to server**:
   ```bash
   ssh root@yushuo.click
   cd /www/wwwroot/stock-tracker
   git pull origin main
   docker compose build --no-cache
   docker compose up -d
   ```
5. **Verify deployment**: Check logs and test frontend at `https://bk.yushuo.click`

## Version History

Current version: **v4.8.24** (2025-10-15)
- Custom orange color system for volume highlighting
- 7-day trading calendar with holiday exclusion
- Multi-modal UI with batch K-line/minute chart display
- Tushare API integration for real trading data

See `CLAUDE.md` in project root for detailed version history and backup info.
