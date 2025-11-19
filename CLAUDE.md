# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 14-based real-time stock tracking and analysis system for Chinese stock market limit-up stocks (涨停板追踪系统). Tracks daily limit-up stocks, calculates 7-day performance statistics, and provides interactive data visualization with sector analysis and multi-board stock ladder views.

**Tech Stack:** Next.js 14, React 18, TypeScript, MySQL, Tailwind CSS, Recharts

## Common Commands

### Development
```bash
npm install              # Install dependencies
npm run dev              # Start dev server at http://localhost:3000
npm run build            # Production build
npm start                # Start production server
npm run type-check       # TypeScript type checking (no emit)
```

### Deployment
```bash
git add . && git commit -m "message" && git push   # Auto-deploy via GitHub Actions
gh run list --repo yushuo1991/bkyushuo --limit 5   # View deployment history
gh run watch --repo yushuo1991/bkyushuo            # Monitor current deployment
```

### Server Management (PM2)
```bash
pm2 restart stock-tracker    # Restart application
pm2 logs stock-tracker       # View logs
pm2 status                   # Check status
pm2 flush                    # Clear logs
```

### Troubleshooting
```bash
# Clear database cache
curl http://localhost:3000/api/clear-cache

# Check disk space on server
ssh root@107.173.154.147 "df -h"

# Clean server disk space
ssh root@107.173.154.147 "cd /www/wwwroot/stock-tracker && rm -rf node_modules .next backup && npm cache clean --force"
```

## Architecture & Data Flow

### Core Data Pipeline

1. **Data Fetching** → External API fetches limit-up stock data for a specific date
2. **Trading Calendar** → `enhanced-trading-calendar.ts` determines actual trading days using Tushare API with 4-hour cache, fallback to weekend filtering
3. **Performance Calculation** → Calculate next 5 trading days' performance via Tushare daily price API for each stock
4. **7-Day Aggregation** → `unified-data-processor.ts` processes and aggregates 7 trading days of data with internal caching
5. **Three-Tier Caching** → MySQL database (`stock_data`, `stock_performance`, `seven_days_cache` tables), in-memory cache, trading calendar cache
6. **Frontend Display** → `page.tsx` (StockTracker component) renders data with interactive charts and modals

### Critical Time Logic (Beijing Time)

The system handles timezone conversions carefully:
- **Trading hours:** 09:30-15:00 Beijing Time
- **Data inclusion cutoff:** 16:00 Beijing Time (stock data processing needs ~1 hour after market close)
- Before 16:00: 7-day data excludes current day
- After 16:00: 7-day data includes current day
- Implementation in `enhanced-trading-calendar.ts:get7TradingDaysFromCalendar()`

### Stock Code Format

**CRITICAL:** Stock codes are stored and processed as 6-digit strings:
- Shanghai stocks: `600xxx`
- Shenzhen stocks: `000xxx`, `002xxx`, `300xxx`
- **Never** use 7-digit format (SH/SZ prefix format like `SH600000`)
- When fetching from external APIs, convert to 6-digit format immediately
- See `src/app/api/debug-stock/route.ts` for stock code handling examples

### Database Schema

**Key Tables:**
- `stock_data`: Daily limit-up stocks with fields: stock_code, stock_name, sector_name, td_type, trade_date, limit_up_time, amount
- `stock_performance`: Stock performance data with fields: stock_code, base_date, performance_date, pct_change
- `seven_days_cache`: Cached 7-day aggregated data (JSON, expires after 2 hours)
- `minute_chart_snapshots`: Historical minute chart snapshots

**Database Singleton:** `StockDatabase.getInstance()` in `src/lib/database.ts`
- Uses connection pool (20 max connections)
- Batch insert optimization for stock data caching
- Timezone set to +08:00 (Beijing Time)
- Auto-upgrade pattern: checks and adds columns without breaking startup

### API Routes

All API routes follow Next.js 14 App Router convention (`src/app/api/*/route.ts`):

- `/api/stocks` - Primary endpoint for fetching 7-day stock data (supports `mode=7days` parameter)
- `/api/cron` - Trigger data caching jobs
- `/api/clear-cache` - Clear database caches (returns JSON with success status)
- `/api/debug-stock` - Debug individual stock data
- `/api/data-status` - Check data availability status
- `/api/minute-snapshot` - Minute-level snapshots during trading hours (GET/POST)
- `/api/scheduler` - Job scheduling management
- `/api/snapshot-scheduler` - Snapshot scheduling
- `/api/health` - Health check endpoint

### Trading Calendar Integration

Uses Tushare API (`trade_cal` endpoint) to get accurate trading days:
- API Token stored in `enhanced-trading-calendar.ts` (hardcoded, consider moving to env vars)
- Caches calendar data for 4 hours to minimize API calls
- Rate limiting: max 60 requests/minute
- **Query range:** count * 5 days minimum, at least 30 days (to handle holidays)
- Fallback: Weekend filtering if API fails
- Key functions:
  - `getValidTradingDays(startDate, count)` - Get N trading days forward
  - `get7TradingDaysFromCalendar(endDate)` - Get 7 trading days backward (respects 16:00 cutoff)
  - `isTradingDay(date)` - Check if specific date is a trading day

### Component Architecture

**Main Component:**
- `src/app/page.tsx` - Primary UI component (3000+ lines) with:
  - State management for multiple modals (sector, date, multi-board, K-line, minute chart)
  - Data fetching and caching logic
  - Event handlers for sector/date/weekday clicks
  - Interactive charts using Recharts
  - Historical data loading (up to 30 days)

**Data Processing:**
- `UnifiedDataProcessor` class in `unified-data-processor.ts`:
  - Provides centralized data processing with internal caching
  - Ensures consistency between sector click and date click views
  - Handles stock performance calculations and aggregations

**Chart Components:**
- `StockPremiumChart.tsx` - Interactive Recharts visualization for performance trends
- Inline chart implementations in page.tsx for various modals

## Key Features

### 1. Historical Data Loading
- Default: 7 days
- Hover on left edge → "← 加载更早" button appears
- Click to load 7 more days (max 30 days total)
- Dynamic grid layout adjustment

### 2. Multi-Board Stock Ladder (连板个股梯队)
- Click weekday text (周一, 周二, etc.) to view
- Shows 2-board+ stocks only
- Left panel: 5-day average premium trend chart
- Right panel: Detailed table with board count, sector, global amount ranking
- Sorting: Board count descending → Limit-up time ascending

### 3. Minute Chart Modes
- "📊 今日分时" (realtime) - Live data from Sina API
- "📷 当日分时" (snapshot) - Historical snapshots from database
- Fallback error handling with friendly SVG placeholders

## Deployment System

### Automated Deployment (Primary Method)

Every `git push` to `main` branch triggers GitHub Actions workflow:
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (`npm ci`)
4. Build project (`npm run build`)
5. SSH to server and deploy
6. Restart PM2 process

**GitHub Secrets Required:**
- `SERVER_HOST` - 107.173.154.147
- `SERVER_USER` - root
- `SERVER_PASSWORD` - SSH password
- `SERVER_PORT` - 22 (default)

**Deployment Time:** ~3-5 minutes

**Common Deployment Issues:**
- **Disk space full:** Run cleanup script (`清理服务器磁盘空间.sh`)
- **Trading calendar query insufficient:** Check `enhanced-trading-calendar.ts` query range (should be count * 5, min 30 days)
- **Build timeout:** Clear `.next` and `node_modules` on server

### Server Configuration

**PM2 Configuration** (`ecosystem.config.js`):
- Single instance
- Auto-restart on failure
- Max memory: 1G
- Logs: `./logs/pm2-error.log` and `./logs/pm2-out.log`
- Graceful shutdown: 5s timeout

**Server Paths:**
- `/www/wwwroot/stock-tracker` (primary)
- `~/stock-tracker` (fallback)
- `/home/stock-tracker` (fallback)

**Access URL:** http://bk.yushuo.click

## Environment Variables

Required in `.env.local` (not committed):

```env
# Database
DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=stock_tracker
DB_DISABLE=false              # Set to 'true' to disable database

# Optional
NEXT_PUBLIC_APP_VERSION=4.20.1
```

## Important Development Notes

### When Working with Stock Data

1. **Always use 6-digit stock codes** - Never use 7-digit format
2. **Respect trading calendar** - Use `enhanced-trading-calendar.ts` functions, don't assume weekday = trading day
3. **Handle Beijing Time correctly** - Server may be in different timezone, always convert properly
4. **Check data availability** - Stocks may have incomplete data, always validate before calculations
5. **Cache aggressively** - External API calls are rate-limited, leverage MySQL and in-memory caches

### When Adding New Modal/Popup Features

Follow the existing pattern in `page.tsx`:
1. Add state variables (e.g., `showXModal`, `xModalData`)
2. Create handler function (e.g., `handleXClick`)
3. Create close function (e.g., `closeXModal`)
4. Add modal UI with backdrop overlay (z-index layering)
5. Add backdrop click handler for closing

### Database Upgrade Pattern

When adding new fields to existing tables, follow the pattern in `database.ts:upgradeDatabase()`:
1. Check if column exists using `SHOW COLUMNS`
2. Add column with `ALTER TABLE` if missing
3. Don't throw errors on failure (prevents system startup issues)
4. Log all upgrade steps

### API Error Handling

External API calls (Tushare, limit-up data source) can fail:
- Always implement timeout control (typically 15 seconds)
- Provide fallback mechanisms (e.g., weekend filtering if trading calendar API fails)
- Use try-catch blocks and return null/empty data on failure
- Log detailed error information for debugging

### Performance Optimization

- **Batch Database Operations:** Use bulk inserts instead of individual queries (see `cacheStockData()`)
- **Trading Calendar Cache:** 4-hour TTL reduces API calls significantly
- **7-Day Data Cache:** 2-hour database cache for complete 7-day datasets
- **Connection Pooling:** 20 max connections with proper timeout settings
- **UnifiedDataProcessor Internal Cache:** Prevents redundant calculations

## Common Issues

### Page Stuck on "正在加载7天数据..."
- **Symptom:** Frontend shows loading spinner indefinitely
- **Common Causes:**
  1. Trading calendar query range insufficient (only found 3-4 trading days)
  2. API timeout (> 30 seconds)
  3. Database connection issues
- **Fix:**
  - Check PM2 logs: `pm2 logs stock-tracker --lines 50`
  - Ensure `enhanced-trading-calendar.ts` line 158 uses `Math.max(count * 5, 30)`
  - Clear cache: `curl http://localhost:3000/api/clear-cache`
  - Restart: `pm2 restart stock-tracker`

### Trading Calendar Query Insufficient
- **Symptom:** Log shows "查询范围不足，仅找到X个交易日"
- **Cause:** Query range too small, holidays not accounted for
- **Fix:** In `enhanced-trading-calendar.ts`, ensure query range is `count * 5` minimum, at least 30 days

### Disk Space Full on Server
- **Symptom:** "No space left on device" in deployment logs
- **Fix:** Run cleanup commands:
  ```bash
  ssh root@107.173.154.147 "
    cd /www/wwwroot/stock-tracker
    rm -rf node_modules .next backup
    npm cache clean --force
    git gc --aggressive --prune=now
    pm2 flush
  "
  ```

### Stock Code Format Errors
- **Symptom:** Stock data not found or API returns errors
- **Cause:** Using 7-digit format (SH/SZ prefixed) instead of 6-digit
- **Fix:** Strip SH/SZ prefixes, ensure 6-digit format with leading zeros

### Database Connection Failures
- **Symptom:** Cannot read properties of undefined (reading 'execute')
- **Cause:** Database disabled or connection pool not initialized
- **Fix:** Check `DB_DISABLE` env var, verify MySQL connection settings

## Repository

- **GitHub:** https://github.com/yushuo1991/bkyushuo
- **Server:** ssh root@107.173.154.147
- **Actions:** https://github.com/yushuo1991/bkyushuo/actions
- **Access URL:** http://bk.yushuo.click
