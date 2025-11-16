# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 14-based real-time stock tracking and analysis system for Chinese stock market limit-up stocks (涨停板追踪系统). The system tracks daily limit-up stocks, calculates 7-day performance statistics, and provides interactive data visualization.

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
gh run list --repo yushuo1991/stock-tracker        # View deployment history
gh run watch --repo yushuo1991/stock-tracker       # Monitor current deployment
```

### Server Management (PM2)
```bash
pm2 restart stock-tracker    # Restart application
pm2 logs stock-tracker       # View logs
pm2 status                   # Check status
```

## Architecture & Data Flow

### Core Data Pipeline

1. **Data Fetching** → External API fetches limit-up stock data for a specific date
2. **Trading Calendar** → `enhanced-trading-calendar.ts` determines actual trading days using Tushare API, with fallback to weekend filtering
3. **Performance Calculation** → For each stock, calculate next 5 trading days' performance via Tushare daily price API
4. **7-Day Aggregation** → `unified-data-processor.ts` processes and aggregates 7 trading days of data
5. **Caching** → Three-tier caching: MySQL database (`stock_data`, `stock_performance`, `seven_days_cache` tables), in-memory cache, trading calendar cache (4-hour TTL)
6. **Frontend Display** → `StockTracker.tsx` component renders data with interactive charts

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

**Database Singleton:** `StockDatabase.getInstance()` in `src/lib/database.ts`
- Uses connection pool (20 max connections)
- Batch insert optimization for stock data caching
- Timezone set to +08:00 (Beijing Time)

### API Routes

All API routes follow Next.js 14 App Router convention (`src/app/api/*/route.ts`):

- `/api/stocks` - Primary endpoint for fetching 7-day stock data
- `/api/cron` - Trigger data caching jobs
- `/api/clear-cache` - Clear database caches
- `/api/debug-stock` - Debug individual stock data
- `/api/data-status` - Check data availability status
- `/api/minute-snapshot` - Minute-level snapshots during trading hours
- `/api/scheduler` - Job scheduling management
- `/api/snapshot-scheduler` - Snapshot scheduling

### Trading Calendar Integration

Uses Tushare API (`trade_cal` endpoint) to get accurate trading days:
- API Token stored in `enhanced-trading-calendar.ts` (consider moving to env vars)
- Caches calendar data for 4 hours to minimize API calls
- Rate limiting: max 60 requests/minute
- Fallback: Weekend filtering if API fails
- Key functions:
  - `getValidTradingDays(startDate, count)` - Get N trading days forward
  - `get7TradingDaysFromCalendar(endDate)` - Get 7 trading days backward (respects 16:00 cutoff)
  - `isTradingDay(date)` - Check if specific date is a trading day

### Component Architecture

**Main Components:**
- `StockTracker.tsx` - Primary UI component with state management, data fetching, and event handling
- `StockPremiumChart.tsx` - Interactive Recharts visualization for performance trends

**Data Processing:**
- `UnifiedDataProcessor` class in `unified-data-processor.ts` provides centralized data processing with internal caching
- Ensures consistency between sector click and date click views

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
- `SERVER_HOST` - Server IP address
- `SERVER_USER` - SSH username
- `SERVER_PASSWORD` - SSH password
- `SERVER_PORT` - SSH port (default 22)

**Deployment Time:** ~3-5 minutes

**Workflow File:** `.github/workflows/deploy.yml`

### Server Configuration

**PM2 Configuration** (`ecosystem.config.js`):
- Single instance
- Auto-restart on failure
- Max memory: 1G
- Logs: `./logs/pm2-error.log` and `./logs/pm2-out.log`
- Graceful shutdown: 5s timeout

**Expected Server Paths:**
- `/www/wwwroot/stock-tracker` (primary)
- `~/stock-tracker` (fallback)
- `/home/stock-tracker` (fallback)

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

## Common Issues

### Stock Code Format Errors
- **Symptom:** Stock data not found or API returns errors
- **Cause:** Using 7-digit format (SH/SZ prefixed) instead of 6-digit
- **Fix:** Strip SH/SZ prefixes, ensure 6-digit format with leading zeros

### Time Zone Issues
- **Symptom:** Current day data missing or included incorrectly
- **Cause:** Server timezone mismatch with Beijing Time
- **Fix:** Review `enhanced-trading-calendar.ts:get7TradingDaysFromCalendar()` UTC conversion logic

### Database Connection Failures
- **Symptom:** Cannot read properties of undefined (reading 'execute')
- **Cause:** Database disabled or connection pool not initialized
- **Fix:** Check `DB_DISABLE` env var, verify MySQL connection settings

### Trading Calendar API Rate Limiting
- **Symptom:** "每分钟最多访问该接口" error message
- **Cause:** Exceeded Tushare API rate limit (60 requests/minute)
- **Fix:** System automatically waits and retries, will fallback to weekend filtering if persistent

## Version History Context

- **v4.20.1** (Current) - Complete GitHub Actions auto-deployment, timezone fixes
- **v4.8.26** - Added `limit_up_time` and `amount` fields to database
- **v4.8.24** - Stock code format fixes (7-digit to 6-digit conversion)
- **v4.8.18** - Beijing timezone conversion improvements
- **v4.14** - Stable version with minute-level snapshot feature

## Repository

- **GitHub:** https://github.com/yushuo1991/stock-tracker
- **Server:** ssh root@107.173.154.147
- **Actions:** https://github.com/yushuo1991/stock-tracker/actions
