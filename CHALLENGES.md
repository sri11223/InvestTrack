# Technical Document — Key Challenges & Solutions

**Project**: InvestTrack — Dynamic Portfolio Dashboard  
**Author**: Sri Krishna  
**Date**: March 2026  
**Stack**: Next.js 14 · React 18 · TypeScript 5 · Tailwind CSS 3.4 · Node.js · Express 4

---

## 1. Overview

This document describes the key technical challenges encountered while building the InvestTrack Dynamic Portfolio Dashboard and the engineering decisions made to solve them. The application fetches live stock data from Yahoo Finance and Google Finance — neither of which provides a free, public API — and presents it in a responsive, real-time dashboard.

---

## 2. Challenge: No Official Financial APIs

### Problem

The most significant challenge was data sourcing. The case study requires:
- **CMP (Current Market Price)** from Yahoo Finance
- **P/E Ratio and Latest Earnings** from Google Finance

However, both Yahoo and Google have deprecated their public finance APIs. All remaining access is unofficial and subject to breaking changes.

### Solution: Dual-Source Strategy with Fallback Chain

I implemented two independent data fetching services:

**Yahoo Finance (`yahooFinance.ts`)**:
- Uses the `yahoo-finance2` npm package — a community-maintained library that reverse-engineers Yahoo's internal undocumented API endpoints
- Provides reliable real-time quotes (`quote()` method) with CMP, day change, volume
- Also used for **historical OHLCV chart data** for the stock chart widget via Yahoo's `v8/finance/chart` endpoint (called directly via axios since the library doesn't expose chart functionality in v2)
- Batch processing with concurrency limit of 5 and 200ms delay between batches

**Google Finance (`googleFinance.ts`)**:
- Custom HTML scraper built with `axios` + `cheerio`
- Fetches `https://www.google.com/finance/quote/{SYMBOL}:NSE` and parses the DOM
- Extracts CMP (via `data-last-price` attribute), P/E ratio, earnings, market cap, 52-week high/low
- Multiple extraction strategies: attribute-based → class-based → regex fallback → graceful null
- Batch processing with concurrency limit of 3 and 500ms delay (more conservative to avoid IP blocking)

**Fallback Chain** (in `routes/stocks.ts`):
```
CMP: Yahoo Finance (primary) → Google Finance (fallback) → 0
P/E: Google Finance only → null
Earnings: Google Finance only → null
```

Both services are called **in parallel** via `Promise.all` for maximum performance.

### Lessons Learned
- DOM scraping is inherently fragile; using multiple extraction strategies (attribute, class, regex) increases resilience
- Unofficial libraries can break with upstream changes; pinning versions and testing periodically is essential
- Having a fallback chain prevents total failure when one source is down

---

## 3. Challenge: Rate Limiting & IP Blocking

### Problem

With 17 stocks in the portfolio and a 15-second refresh interval, the backend makes 34+ HTTP requests per cycle (17 to Yahoo + 17 to Google). At this rate, both services can throttle or block the server's IP.

### Solution: Multi-Layer Caching + Batching

**Server-Side Caching (`cache.ts`)**:
- Used `node-cache` for in-memory caching with configurable TTL
- Quotes: 30-second TTL (short because CMP needs to be relatively fresh)
- Fundamentals: 300-second (5 minute) TTL (P/E and earnings change infrequently)
- Cache keys are scoped per stock (`quote:HDFCBANK.NS`, `fundamentals:HDFCBANK`)
- Cache hit/miss statistics available at `/api/stocks/cache-stats` for monitoring

**Concurrency-Controlled Batching**:
- `getBatchQuotes()`: processes 5 symbols at a time, with 200ms inter-batch delay
- `getBatchFundamentals()`: processes 3 symbols at a time, with 500ms inter-batch delay
- `Promise.allSettled` ensures one failure doesn't cascade to the entire batch

**Client-Side Rate Limiting**:
- `express-rate-limit` restricts the API to 100 requests per 60-second window per IP
- Configurable via environment variables

**Result**: In practice, most 15-second refresh cycles hit the cache and make zero external calls. Only the first call and cache-expired calls hit Yahoo/Google.

---

## 4. Challenge: ESM Module Compatibility

### Problem

`yahoo-finance2` v2 is an ESM-only package (`"type": "module"`). Mixing ESM imports with CommonJS in a TypeScript backend leads to cryptic runtime errors:

```
SyntaxError: Cannot use import statement outside a module
ERR_REQUIRE_ESM: require() of ES Module not supported
```

### Solution

- Set `"type": "module"` in `backend/package.json` to make the entire backend ESM
- Configured TypeScript with `"module": "Node16"` and `"moduleResolution": "Node16"`
- All local imports use explicit `.js` extensions: `import { config } from './config/index.js'`
- Used `tsx` (TypeScript Execute) as the dev runner — it handles ESM/TypeScript interop seamlessly
- Used `fileURLToPath(import.meta.url)` instead of `__dirname` (which doesn't exist in ESM)

### Lesson Learned
ESM migration in Node.js is an all-or-nothing decision for a project. Once one dependency is ESM-only, the entire import chain must be ESM-compatible.

---

## 5. Challenge: Real-Time Updates Without WebSockets

### Problem

The dashboard needs to show near-real-time prices. WebSockets would be the ideal solution but add significant complexity (socket server, reconnection logic, state sync).

### Solution: Polling with Custom Hooks

Built a custom `useInterval` hook following Dan Abramov's recommended pattern:

```typescript
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

The `usePortfolio` hook orchestrates the entire data lifecycle:
- **Initial fetch**: Shows loading spinner until first data arrives
- **Auto-refresh**: Calls `fetchPortfolio()` every 15 seconds via `useInterval`
- **Toggle**: Users can enable/disable auto-refresh
- **Stale preservation**: If a refresh fails, the last successful data remains displayed with an error banner
- **Duplicate prevention**: A `useRef` flag prevents overlapping fetch calls

### Why Not WebSockets
For a 15-second polling interval with 17 stocks, HTTP polling is perfectly adequate. The overhead is minimal compared to maintaining persistent socket connections. If sub-second updates were needed, WebSockets would be the right choice.

---

## 6. Challenge: Responsive Portfolio Table with 13 Columns

### Problem

The portfolio table has 13 columns (including the newly added Latest Earnings column). On mobile screens, this causes horizontal overflow and poor usability.

### Solution

- Wrapped the table in `overflow-x-auto` with a custom scrollbar
- Set `min-w-[1200px]` on the table itself to prevent column crushing
- Used `font-mono` for numeric columns to maintain visual alignment
- Sector rows use `colSpan={13}` to span the full width as a visual grouper
- Collapsible sectors reduce initial visual noise — users expand sectors they care about

---

## 7. Challenge: Data Persistence Without a Database

### Problem

Holdings, trades, and watchlist data must survive server restarts, but the case study doesn't specifically require a database setup.

### Solution: JSON File Persistence

Created a `PortfolioStore` class that reads/writes to JSON files:

```
backend/data/holdings.json    — current stock holdings
backend/data/trades.json      — trade execution history
backend/data/watchlist.json   — watchlist items
```

- **Seeding**: On first run (empty holdings file), 17 default stocks across 6 sectors are auto-seeded
- **IDs**: `crypto.randomUUID()` generates unique identifiers
- **Atomic writes**: `fs.writeFileSync` ensures complete file writes
- **Singleton pattern**: `portfolioStore` is a module-level singleton, shared across all routes

### Why Not a Database
For a single-user case study with ~20 records, a database adds unnecessary infrastructure. JSON files are:
- Zero-config (no database install needed)
- Human-readable (easy to inspect/debug)
- Git-friendly (can seed defaults from version control)
- Trivially replaceable (the `PortfolioStore` class can be swapped for a MongoDB/PostgreSQL adapter without changing any route code)

---

## 8. Challenge: Theme System Without Full-Page Re-Renders

### Problem

Dark/light theme toggling that causes full-page re-renders creates visible flicker.

### Solution: CSS Custom Properties + Context

- Defined all colors as CSS custom properties: `--bg-primary`, `--text-primary`, `--border`, etc.
- Theme class (`dark` or `light`) is toggled on the root `<html>` element
- CSS variables are scoped to `.dark` and `:root` (light) selectors
- `ThemeContext` stores the current theme and provides a toggle function
- Theme preference is persisted in `localStorage`

**Result**: Theme switching is instantaneous — only CSS variable values change, no React re-renders needed.

---

## 9. Challenge: Drag-and-Drop Without External Libraries

### Problem

The dashboard has 12 widgets that users should be able to reorder. Most drag-and-drop solutions (react-beautiful-dnd, dnd-kit) add significant bundle size.

### Solution: HTML5 Drag and Drop API

Built a custom `useDashboardLayout` hook using the native HTML5 Drag and Drop API:
- `handleDragStart`, `handleDragEnter`, `handleDragEnd` manage the drag lifecycle
- Widget order and visibility are stored in a state array
- Layout is persisted to `localStorage` (key: `investtrack-widget-order`)
- A "Reset Layout" button restores the default configuration

**Result**: Zero additional dependencies, ~60 lines of code, works across all modern browsers.

---

## 10. Summary of Technical Decisions

| Decision | Rationale |
|----------|-----------|
| `yahoo-finance2` for CMP | Most reliable unofficial Yahoo Finance wrapper; active community |
| `cheerio` for Google Finance | Lightweight DOM parsing; no headless browser needed |
| Polling over WebSockets | Simpler; adequate for 15s intervals |
| JSON files over database | Zero-config; appropriate for case study scope |
| `node-cache` over Redis | In-process; no external service needed |
| `tsx` over `ts-node` | Better ESM support; faster startup |
| CSS variables over CSS-in-JS | No runtime cost for theme switching |
| HTML5 DnD over libraries | Zero bundle cost; native browser support |
| `React.lazy` for widgets | Faster initial load; only critical widgets load synchronously |
| `React.memo` on table rows | 17 stocks × 13 columns = 221 cells; memoization prevents unnecessary re-renders |

---

## 11. What I Would Do Differently in Production

1. **Database**: Replace JSON files with PostgreSQL or MongoDB for multi-user support
2. **Authentication**: Add JWT-based auth to protect trade execution endpoints
3. **WebSockets**: Switch from polling to socket-based push for sub-second price updates
4. **Redis**: Replace in-memory cache with Redis for persistence across server restarts
5. **Testing**: Add Jest unit tests for services, React Testing Library for components, and supertest for API endpoints
6. **Monitoring**: Add structured logging to a service like Datadog or CloudWatch
7. **Deployment**: Dockerize both frontend and backend, deploy to Vercel (frontend) + AWS/GCP (backend)
