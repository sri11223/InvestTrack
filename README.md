# InvestTrack — Dynamic Portfolio Dashboard

A production-grade, real-time portfolio tracking dashboard built with **Next.js**, **TypeScript**, **Tailwind CSS**, and **Node.js/Express**. Fetches live stock data from Yahoo Finance (CMP) and Google Finance (P/E Ratio, Earnings).

![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)

---

## Features

- **Real-time CMP** — Fetched via Yahoo Finance (unofficial library), auto-refreshes every 15 seconds
- **P/E Ratio & Earnings** — Scraped from Google Finance with cheerio
- **Sector Grouping** — Stocks grouped by sector with collapsible rows and sector-level summaries
- **Gain/Loss Indicators** — Color-coded green/red with percentage badges
- **Dark/Light Theme** — Toggle between themes, persisted in localStorage
- **Sector Allocation Chart** — Interactive donut chart via Recharts
- **Summary Cards** — Total investment, present value, total gain/loss, today's change
- **Responsive Design** — Adapts across desktop, tablet, and mobile
- **Caching** — Server-side in-memory cache (node-cache) with configurable TTL
- **Rate Limiting** — Express rate limiter to prevent API abuse
- **Error Handling** — Graceful degradation with user-friendly error states

---

## Tech Stack

| Layer      | Technology                                                  |
|------------|-------------------------------------------------------------|
| Frontend   | Next.js 14, React 18, TypeScript 5, Tailwind CSS 3         |
| Backend    | Node.js, Express, TypeScript (ESM)                          |
| Data       | yahoo-finance2 (CMP), cheerio + Google Finance (P/E, EPS)  |
| Charts     | Recharts                                                    |
| Styling    | Tailwind CSS with CSS custom properties (theme support)     |
| Icons      | Lucide React                                                |

---

## Project Structure

```
InvestTrack/
├── backend/                        # Express API server (TypeScript, ESM)
│   ├── src/
│   │   ├── app.ts                  # Express app entry point
│   │   ├── config/                 # Environment & CORS configuration
│   │   ├── data/                   # Portfolio holdings master data
│   │   ├── middleware/             # Error handler, rate limiter
│   │   ├── routes/                 # API route handlers
│   │   ├── services/               # Yahoo Finance, Google Finance, Cache
│   │   ├── types/                  # TypeScript interfaces
│   │   └── utils/                  # Logger utility
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # Next.js dashboard (TypeScript)
│   ├── src/
│   │   ├── app/                    # Next.js App Router (layout, page, CSS)
│   │   ├── components/
│   │   │   ├── ui/                 # Reusable UI primitives (Card, Badge, Spinner...)
│   │   │   ├── layout/             # Header, Footer
│   │   │   └── dashboard/          # Portfolio table, charts, summary cards
│   │   ├── constants/              # App-wide constants
│   │   ├── context/                # React context providers (Theme)
│   │   ├── hooks/                  # Custom hooks (usePortfolio, useInterval, useTheme)
│   │   ├── services/               # API service layer
│   │   ├── types/                  # Frontend TypeScript interfaces
│   │   └── utils/                  # Formatters, calculations, API client
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

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
cp .env.example .env        # Configure environment variables
npm install
npm run dev                  # Starts on http://localhost:8000
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                  # Starts on http://localhost:3000
```

### 4. Open Dashboard

Visit **http://localhost:3000** in your browser.

---

## API Endpoints

| Method | Endpoint                        | Description                           |
|--------|---------------------------------|---------------------------------------|
| GET    | `/api/health`                   | Health check                          |
| GET    | `/api/stocks/portfolio`         | Full portfolio with live CMP & P/E    |
| GET    | `/api/stocks/quote/:symbol`     | Single stock quote (Yahoo Finance)    |
| GET    | `/api/stocks/fundamentals/:nse` | Single stock fundamentals (Google)    |
| GET    | `/api/stocks/holdings`          | Static portfolio holdings              |
| GET    | `/api/stocks/cache-stats`       | Server cache statistics               |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                  | Default                  | Description                     |
|---------------------------|--------------------------|---------------------------------|
| `PORT`                    | `8000`                   | API server port                 |
| `NODE_ENV`                | `development`            | Environment                     |
| `CORS_ORIGINS`            | `http://localhost:3000`  | Comma-separated allowed origins |
| `CACHE_TTL_QUOTES`        | `30`                     | Quote cache TTL (seconds)       |
| `CACHE_TTL_FUNDAMENTALS`  | `300`                    | Fundamentals cache TTL (seconds)|
| `RATE_LIMIT_WINDOW_MS`    | `60000`                  | Rate limit window (ms)          |
| `RATE_LIMIT_MAX_REQUESTS` | `100`                    | Max requests per window         |

### Frontend (`frontend/.env.local`)

| Variable              | Default                       | Description           |
|-----------------------|-------------------------------|-----------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api`   | Backend API base URL  |

---

## Technical Challenges & Solutions

### 1. Unofficial APIs
Yahoo Finance and Google Finance don't offer public APIs. We use a **dual-source strategy**:
- **yahoo-finance2** — Primary source for CMP (Current Market Price) and real-time quotes
- **cheerio** — HTML scraping of Google Finance pages for P/E ratio and earnings (fundamentals)
- **Fallback chain**: If Yahoo Finance fails for a stock, the system falls back to Google Finance CMP

### 2. Rate Limiting & Caching
- Server-side **in-memory caching** (node-cache) with configurable TTL (30s for quotes, 5min for fundamentals)
- **Batch requests** with concurrency limits (5 for Yahoo, 3 for Google) with delays between batches
- **Express rate limiter** to protect the backend from excessive client requests

### 3. Data Accuracy
- Scraped data may vary; the app shows "last updated" timestamps
- Graceful fallbacks: if a scrape fails, `null` is returned instead of crashing
- Footer disclaimer warns users about potential data inaccuracies

### 4. ESM Compatibility
- yahoo-finance2 v2 is ESM-only; the backend uses `"type": "module"` with Node16 module resolution
- **tsx** is used as the TypeScript runner for seamless ESM support in development

### 5. Real-time Updates
- Frontend uses `setInterval` (15-second polling) via a custom `useInterval` hook
- Users can toggle auto-refresh on/off and trigger manual refreshes
- Stale data is preserved when a refresh fails, with an error banner overlay

---

## Scripts

### Backend

| Script       | Command           | Description                |
|--------------|-------------------|----------------------------|
| `npm run dev`| `tsx watch ...`   | Dev server with hot reload |
| `npm run build`| `tsc`           | Compile TypeScript         |
| `npm start`  | `node dist/app.js`| Production server          |

### Frontend

| Script        | Command        | Description                |
|---------------|----------------|----------------------------|
| `npm run dev` | `next dev`     | Dev server with HMR        |
| `npm run build`| `next build`  | Production build           |
| `npm start`   | `next start`   | Production server          |

---

## License

This project is built as a case study / assignment. Not intended for production financial use.
