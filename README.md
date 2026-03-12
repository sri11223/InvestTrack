# InvestTrack — Dynamic Portfolio Dashboard

> A real-time Indian stock portfolio tracking dashboard with live market data, built as a case study for **Octa Byte AI Pvt Ltd**.

![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)
![CI](https://github.com/sri11223/InvestTrack/actions/workflows/ci.yml/badge.svg)

---

## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Getting Started](#getting-started)
6. [API Reference](#api-reference)
7. [Environment Variables](#environment-variables)
8. [Technical Challenges & Solutions](#technical-challenges--solutions)
9. [Performance Optimizations](#performance-optimizations)
10. [Scripts](#scripts)
11. [Folder Structure](#folder-structure)

---

## Introduction

Modern investors need real-time insights into their portfolio performance to make informed decisions — whether to buy, sell, hold, or add to positions. **InvestTrack** is a dynamic web application that displays live portfolio information by fetching data from two independent financial data sources:

- **Yahoo Finance** — for Current Market Price (CMP), day change, and historical chart data
- **Google Finance** — for P/E Ratio, Latest Earnings, and market fundamentals

The dashboard auto-refreshes every 15 seconds, groups stocks by sector with visual summaries, and provides a full suite of trading tools including buy/sell execution, watchlist management, price alerts, and performance analytics.

> **Note**: Neither Yahoo Finance nor Google Finance provides a free public API. This project uses the `yahoo-finance2` unofficial npm library and cheerio-based HTML scraping of Google Finance as documented in the [Technical Challenges](#technical-challenges--solutions) section.

---

## Features

### Core (Case Study Requirements)
- **Portfolio Table** — All required columns: Particulars, Purchase Price, Qty, Investment, Portfolio %, NSE/BSE codes, CMP (live), Present Value, Gain/Loss, P/E Ratio, Latest Earnings
- **Real-time CMP** — Primary: Yahoo Finance via `yahoo-finance2`, Fallback: Google Finance scraping. Auto-refreshes every 15 seconds
- **P/E Ratio & Earnings** — Scraped from Google Finance with `cheerio`, cached for 5 minutes
- **Sector Grouping** — Collapsible sector rows with sector-level Investment, Present Value, and Gain/Loss summaries
- **Green/Red Gain/Loss** — Color-coded throughout the UI (gains in green, losses in red)
- **Dynamic Updates** — CMP, Present Value, and Gain/Loss recalculate automatically on each 15-second refresh cycle

### Extended Features
- **Stock Search** — Search 60+ NSE-listed stocks with keyboard shortcut (`Ctrl+K` / `⌘K`)
- **Buy / Sell Execution** — Execute trades with quantity, price, notes; auto-averages buy price on repeat purchases
- **Trade History** — Complete trade log with timestamps
- **Watchlist** — Add stocks to a personal watchlist with one-click buy action
- **P&L Calculator** — Hypothetical profit/loss calculator for any buy/sell scenario
- **Stock Comparison** — Side-by-side comparison of any two portfolio stocks across 7 metrics
- **Performance Analytics** — Win rate, best/worst performers, sector returns bar chart, return distribution histogram
- **Market Sentiment Gauge** — Fear/Greed indicator calculated from portfolio performance data
- **Price Alerts** — Set above/below price targets; auto-triggers toast notifications when hit
- **Historical Stock Charts** — Real candlestick chart data from Yahoo Finance (1W to 1Y periods)
- **CSV Export** — Download portfolio data as CSV
- **Recommendation Badges** — Automatic Hold / Book Profit / Avg Down labels per stock
- **Top Movers** — Best gainers, worst losers, and today's biggest movers
- **Drag-and-Drop Dashboard** — Reorder and hide/show any widget; layout persisted in localStorage
- **Dark / Light Theme** — Toggle with persistence
- **Lazy Loading** — All secondary widgets code-split with `React.lazy` + Suspense

---

## Tech Stack

| Layer        | Technology                                                    |
|-------------|---------------------------------------------------------------|
| Frontend    | Next.js 14 (App Router), React 18, TypeScript 5              |
| Backend     | Node.js, Express 4, TypeScript (ESM)                         |
| CMP Data    | `yahoo-finance2` (unofficial Yahoo Finance library)           |
| Fundamentals| `cheerio` (Google Finance HTML scraping)                      |
| Charts      | `recharts` (ComposedChart, BarChart, PieChart)                |
| Styling     | Tailwind CSS 3.4 with CSS custom properties for theming       |
| Icons       | Lucide React                                                  |
| HTTP Client | Axios (backend ↔ Google Finance, frontend ↔ backend)         |
| Caching     | `node-cache` (in-memory, configurable TTL)                    |
| Security    | `helmet`, `cors`, `express-rate-limit`                        |
| Logging     | `winston` (structured logging, file + console transports)     |
| Persistence | JSON file storage (`backend/data/`)                           |
| CI/CD       | GitHub Actions (TypeScript check + build on push/PR)          |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (Port 3000)                      │
│  Next.js 14 App Router  │  React 18  │  Tailwind CSS        │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Portfolio │ │  Stock   │ │ Trading  │ │ Analytics│       │
│  │  Table   │ │  Chart   │ │  Modal   │ │ Widgets  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│       │              │            │            │             │
│       └──────────────┴────────────┴────────────┘             │
│                         │ Axios                              │
└─────────────────────────┼────────────────────────────────────┘
                          │ HTTP (JSON)
┌─────────────────────────┼────────────────────────────────────┐
│                  EXPRESS API (Port 8000)                      │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │   Routes   │  │ Middleware  │  │       Services         │ │
│  │ /stocks/*  │  │  helmet     │  │  ┌─────────────────┐  │ │
│  │ /trades/*  │  │  cors       │  │  │  Yahoo Finance  │  │ │
│  │ /health    │  │  rate-limit │  │  │  (CMP + Charts) │  │ │
│  └────────────┘  │  errorHndlr│  │  ├─────────────────┤  │ │
│                  └────────────┘  │  │ Google Finance   │  │ │
│                                  │  │ (P/E, Earnings)  │  │ │
│  ┌────────────┐                  │  ├─────────────────┤  │ │
│  │   Cache    │◄─────────────────│  │  Portfolio Store │  │ │
│  │ (node-cache)│                 │  │  (JSON files)    │  │ │
│  └────────────┘                  │  └─────────────────┘  │ │
│                                  └────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
  ┌──────────────┐              ┌──────────────┐
  │Yahoo Finance │              │Google Finance│
  │ (yahoo-      │              │ (HTML scrape │
  │  finance2)   │              │  via cheerio)│
  └──────────────┘              └──────────────┘
```

### Data Flow

1. **Frontend** calls `GET /api/stocks/portfolio` every 15 seconds
2. **Backend** fetches CMP from **Yahoo Finance** (`yahoo-finance2`) and P/E + Earnings from **Google Finance** (cheerio scraping) **in parallel**
3. Results are **cached** (30s quotes, 5min fundamentals) to minimize external calls
4. **Enriched data** (CMP × Qty = Present Value, Gain/Loss, Portfolio %) is computed server-side
5. Response is grouped by sector with sector-level summaries
6. **Frontend** renders the table, charts, and widgets with color-coded indicators

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9

### 1. Clone the Repository

```bash
git clone https://github.com/sri11223/InvestTrack.git
cd InvestTrack
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env        # Uses sensible defaults — no changes needed for dev
npm install
npm run dev                  # Starts Express API on http://localhost:8000
```

### 3. Frontend Setup (in a new terminal)

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                  # Starts Next.js on http://localhost:3000
```

### 4. Open Dashboard

Navigate to **http://localhost:3000** in your browser. The dashboard will automatically fetch live stock data and begin auto-refreshing.

---

## API Reference

### Stock Data

| Method | Endpoint                        | Description                                  |
|--------|---------------------------------|----------------------------------------------|
| GET    | `/api/health`                   | Health check with uptime                     |
| GET    | `/api/stocks/portfolio`         | Full portfolio — live CMP, P/E, Gain/Loss    |
| GET    | `/api/stocks/quote/:symbol`     | Single stock quote (Yahoo → Google fallback)  |
| GET    | `/api/stocks/fundamentals/:nse` | Single stock P/E & earnings (Google Finance) |
| GET    | `/api/stocks/chart/:symbol`     | Historical OHLCV chart data (Yahoo Finance)  |
| GET    | `/api/stocks/holdings`          | Raw portfolio holdings (no live prices)       |
| GET    | `/api/stocks/cache-stats`       | Cache hit/miss statistics                    |

### Trading

| Method | Endpoint                        | Description                                  |
|--------|---------------------------------|----------------------------------------------|
| GET    | `/api/trades/search?q=`         | Search 60+ NSE stocks by name/code/sector    |
| GET    | `/api/trades/holdings`          | Current holdings with IDs                    |
| POST   | `/api/trades/holdings`          | Add a new holding directly                   |
| PUT    | `/api/trades/holdings/:id`      | Update an existing holding                   |
| DELETE | `/api/trades/holdings/:id`      | Remove a holding                             |
| POST   | `/api/trades/execute`           | Execute a BUY or SELL trade                  |
| GET    | `/api/trades/history`           | Full trade history (newest first)            |
| POST   | `/api/trades/calculate`         | Calculate hypothetical P&L                   |
| GET    | `/api/trades/watchlist`         | Get watchlist items                          |
| POST   | `/api/trades/watchlist`         | Add stock to watchlist                       |
| DELETE | `/api/trades/watchlist/:id`     | Remove stock from watchlist                  |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                  | Default                  | Description                     |
|---------------------------|--------------------------|---------------------------------|
| `PORT`                    | `8000`                   | API server port                 |
| `NODE_ENV`                | `development`            | Environment mode                |
| `CORS_ORIGINS`            | `http://localhost:3000`  | Comma-separated allowed origins |
| `CACHE_TTL_QUOTES`        | `30`                     | Quote cache TTL (seconds)       |
| `CACHE_TTL_FUNDAMENTALS`  | `300`                    | Fundamentals cache TTL (seconds)|
| `RATE_LIMIT_WINDOW_MS`    | `60000`                  | Rate limit window (ms)          |
| `RATE_LIMIT_MAX_REQUESTS` | `100`                    | Max requests per window         |

### Frontend (`frontend/.env.local`)

| Variable              | Default                       | Description           |
|-----------------------|-------------------------------|-----------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api`   | Backend API URL       |

---

## Technical Challenges & Solutions

### Challenge 1: No Official Financial APIs

**Problem**: Neither Yahoo Finance nor Google Finance provides a free, documented, public REST API. Both have been deprecated or restricted over the years.

**Solution — Dual-Source Strategy**:
- **Yahoo Finance (CMP + Charts)**: Used the `yahoo-finance2` npm library — a well-maintained unofficial wrapper that reverse-engineers Yahoo's internal API endpoints. It provides reliable real-time quotes and historical OHLCV chart data.
- **Google Finance (P/E + Earnings)**: Built a custom HTML scraper using `axios` + `cheerio`. The scraper navigates to `google.com/finance/quote/{SYMBOL}:NSE` and extracts fundamental data from the DOM structure (`data-last-price` attributes, `.gyFHrc` key-value rows).
- **Fallback Chain**: If Yahoo fails for a given stock, the system automatically falls back to Google Finance for CMP data, ensuring the dashboard never shows empty prices.

**Fragility Mitigation**: DOM selectors may break if Google changes their page structure. The scraper uses multiple extraction strategies (attribute-based, class-based, regex fallback) and returns `null` gracefully instead of crashing.

### Challenge 2: Rate Limiting & Blocking

**Problem**: Making 17+ parallel HTTP requests to Yahoo/Google per refresh cycle risks getting IP-blocked or rate-limited.

**Solution — Batching with Concurrency Control**:
- Yahoo Finance: Batch size of 5 concurrent requests with 200ms delay between batches
- Google Finance: Batch size of 3 concurrent requests with 500ms delay (more conservative since it's scraping)
- Server-side **in-memory caching** (`node-cache`): Quotes cached 30s, fundamentals cached 5min
- `Promise.allSettled` ensures one stock failure doesn't block the entire batch
- Express `express-rate-limit` protects the backend API from excessive client requests

### Challenge 3: ESM Module Compatibility

**Problem**: `yahoo-finance2` v2 is an ESM-only package. Mixing ESM with CommonJS in a TypeScript Node.js backend causes cryptic import errors.

**Solution**:
- Set `"type": "module"` in `backend/package.json`
- Configure TypeScript with `"module": "Node16"` and `"moduleResolution": "Node16"`
- All local imports use explicit `.js` extensions (e.g., `import { config } from './config/index.js'`)
- Used `tsx` as the development TypeScript runner — it handles ESM seamlessly without a build step

### Challenge 4: Real-Time Updates Without WebSockets

**Problem**: The dashboard needs to show live prices but WebSockets add complexity and aren't strictly needed for 15-second refresh intervals.

**Solution — Polling with Custom Hook**:
- Built a custom `useInterval` hook (following Dan Abramov's pattern) that correctly handles interval lifecycle with React's refs
- The `usePortfolio` hook manages the entire data lifecycle: initial fetch → auto-refresh → error handling → stale data preservation
- Auto-refresh can be toggled on/off; manual refresh is always available
- When a refresh fails, the last successful data is preserved with an error banner overlay — the UI never goes blank

### Challenge 5: Data Accuracy & Disclaimers

**Problem**: Scraped/unofficial data may lag behind or differ from actual exchange prices.

**Solution**:
- Every API response includes a `timestamp` field showing when data was fetched
- The dashboard header shows "Last updated: X seconds ago"
- Footer includes a disclaimer: *"Data sourced from unofficial APIs. May not reflect real-time exchange prices."*
- `null` values are handled gracefully — columns show "—" instead of crashing

### Challenge 6: Performance with 17 Stocks × 2 APIs

**Problem**: Fetching data for 17 stocks from 2 sources on every 15-second cycle could be slow and lead to UI jank.

**Solution — Multi-Layer Optimization**:
- **Server-side caching** eliminates redundant API calls within TTL windows
- **Parallel fetching**: Yahoo and Google batches run simultaneously via `Promise.all`
- **Frontend code splitting**: 9 secondary widgets are lazy-loaded with `React.lazy` + Suspense
- **React.memo** on expensive components (`StockRow`, `SectorGroup`, `PortfolioSummaryCards`)
- **useMemo** for derived calculations (allStocks, currentPrices, stockCodes)
- The initial page load shows a spinner; subsequent refreshes happen silently in the background

### Challenge 7: Data Persistence Without a Database

**Problem**: The case study doesn't require a database, but holdings/trades/watchlist need to survive server restarts.

**Solution — JSON File Storage**:
- `PortfolioStore` singleton reads/writes to `backend/data/{holdings,trades,watchlist}.json`
- Default holdings are seeded on first run (17 stocks across 6 sectors)
- `crypto.randomUUID()` generates unique IDs for holdings, trades, and watchlist items
- No database setup required — just `npm install` and run. This is ideal for the case study scope.
- If production needs arose, the `PortfolioStore` interface could be swapped for a database adapter without changing any route logic.

---

## Performance Optimizations

| Optimization            | Where          | Impact                                           |
|------------------------|----------------|--------------------------------------------------|
| In-memory caching      | Backend        | Eliminates redundant Yahoo/Google calls           |
| Batch + concurrency    | Backend        | Prevents rate limiting and blocking               |
| `Promise.all`          | Backend        | Yahoo + Google fetched in parallel, not serial    |
| `React.lazy` + Suspense| Frontend       | 9 widgets code-split, faster initial page load    |
| `React.memo`           | Frontend       | StockRow, SectorGroup skip unnecessary re-renders |
| `useMemo`              | Frontend       | Derived data recalculated only when portfolio changes |
| `useCallback`          | Frontend       | Stable handler references prevent child re-renders |
| `useRef` guard         | Frontend       | Prevents duplicate concurrent fetches             |
| CSS custom properties  | Frontend       | Theme switching without full re-render            |
| localStorage           | Frontend       | Widget layout and theme persist across sessions   |

---



## Scripts

### Backend

| Script         | Command             | Description                    |
|----------------|---------------------|--------------------------------|
| `npm run dev`  | `tsx watch src/app.ts` | Dev server with hot reload  |
| `npm run build`| `tsc`               | Compile TypeScript to `dist/`  |
| `npm start`    | `node dist/app.js`  | Production server              |

### Frontend

| Script         | Command        | Description                   |
|----------------|----------------|-------------------------------|
| `npm run dev`  | `next dev`     | Dev server with HMR           |
| `npm run build`| `next build`   | Production build              |
| `npm start`    | `next start`   | Production server             |
| `npm run lint` | `next lint`    | ESLint check                  |

---

## Folder Structure

```
InvestTrack/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI pipeline
├── backend/
│   ├── src/
│   │   ├── app.ts                    # Express entry point
│   │   ├── config/
│   │   │   ├── cors.ts               # CORS origin whitelist
│   │   │   └── index.ts              # Environment config loader
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts       # Global error handler + AppError class
│   │   │   └── rateLimiter.ts        # Rate limiting middleware
│   │   ├── routes/
│   │   │   ├── index.ts              # Route aggregator + health check
│   │   │   ├── stocks.ts             # Portfolio, quotes, fundamentals, chart
│   │   │   └── trades.ts             # CRUD, execute, calculator, watchlist
│   │   ├── services/
│   │   │   ├── cache.ts              # node-cache singleton
│   │   │   ├── googleFinance.ts      # Cheerio scraper for P/E & earnings
│   │   │   ├── portfolioStore.ts     # JSON file persistence (holdings/trades/watchlist)
│   │   │   ├── stockSearch.ts        # Local NSE stock search + Google price lookup
│   │   │   └── yahooFinance.ts       # yahoo-finance2 quotes + historical chart data
│   │   ├── types/
│   │   │   └── index.ts              # All backend TypeScript interfaces
│   │   └── utils/
│   │       └── logger.ts             # Winston logger (console + file)
│   ├── data/                          # Runtime JSON storage (auto-seeded)
│   ├── .env.example                   # Environment variable template
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css           # CSS variables, theme system, animations
│   │   │   ├── layout.tsx            # Root layout (ThemeProvider + ToastProvider)
│   │   │   └── page.tsx              # Main dashboard (widgets, modals, lazy loading)
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── MarketSentiment.tsx     # Fear/Greed gauge
│   │   │   │   ├── PerformanceAnalytics.tsx # Win rate, sector returns, distribution
│   │   │   │   ├── PortfolioSummaryCards.tsx# 4 summary metric cards
│   │   │   │   ├── PortfolioTable.tsx      # Main holdings table
│   │   │   │   ├── SectorAllocationChart.tsx# Donut chart by sector
│   │   │   │   ├── SectorGroup.tsx         # Collapsible sector row
│   │   │   │   ├── StockCompare.tsx        # Side-by-side stock comparison
│   │   │   │   ├── StockRow.tsx            # Individual stock row
│   │   │   │   └── TopMovers.tsx           # Best/worst movers + CSV export
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx              # Nav bar + search + refresh toggle
│   │   │   │   └── Footer.tsx              # Disclaimer + data sources
│   │   │   ├── trading/
│   │   │   │   ├── PriceAlerts.tsx         # Set & trigger price alerts
│   │   │   │   ├── StockChart.tsx          # Real historical OHLCV chart
│   │   │   │   ├── StockSearchModal.tsx    # Ctrl+K search overlay
│   │   │   │   ├── TradeCalculator.tsx     # Hypothetical P&L calc
│   │   │   │   ├── TradeHistoryPanel.tsx   # Recent trades list
│   │   │   │   ├── TradeModal.tsx          # Buy/Sell execution modal
│   │   │   │   └── WatchlistPanel.tsx      # Watchlist management
│   │   │   └── ui/
│   │   │       ├── Badge.tsx               # Semantic badges
│   │   │       ├── Card.tsx                # Card container
│   │   │       ├── DraggableWidget.tsx     # Drag-and-drop widget wrapper
│   │   │       ├── ErrorBoundary.tsx       # Error boundary
│   │   │       ├── ErrorDisplay.tsx        # Error state with retry
│   │   │       ├── Spinner.tsx             # Loading spinner
│   │   │       ├── ThemeToggle.tsx         # Dark/light toggle
│   │   │       └── Toast.tsx               # Toast notification system
│   │   ├── constants/index.ts              # API URL, refresh interval, colors
│   │   ├── context/ThemeContext.tsx         # Theme context provider
│   │   ├── hooks/
│   │   │   ├── useDashboardLayout.ts       # Widget drag-and-drop state
│   │   │   ├── useInterval.ts              # Custom interval hook
│   │   │   ├── usePortfolio.ts             # Portfolio data lifecycle
│   │   │   └── useTheme.ts                 # Theme context hook
│   │   ├── services/stockService.ts        # All API client functions
│   │   ├── types/index.ts                  # Frontend TypeScript interfaces
│   │   └── utils/
│   │       ├── api.ts                      # Axios instance with interceptors
│   │       ├── calculations.ts             # Portfolio math helpers
│   │       └── formatters.ts               # Currency, percent, number formatters
│   ├── .env.local.example
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── .gitignore
└── README.md
```

---

## License

This project was developed as a technical case study assignment. It is intended for evaluation purposes and demonstrates full-stack development capabilities with real-time financial data integration. Not intended for production financial trading use.
