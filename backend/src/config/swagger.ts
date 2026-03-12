import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'InvestTrack API',
      version: '1.0.0',
      description:
        'Real-time Indian stock portfolio tracking API. Aggregates live prices from Yahoo Finance and fundamentals from Google Finance. Supports portfolio management, trade execution, watchlist, P&L calculator, and historical chart data.',
      contact: {
        name: 'InvestTrack',
        url: 'https://github.com/sri11223/InvestTrack',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://investtrack-ymot.onrender.com/api',
        description: 'Production (Render)',
      },
      {
        url: 'http://localhost:8000/api',
        description: 'Local Development',
      },
    ],
    tags: [
      { name: 'Health', description: 'Server health check' },
      { name: 'Portfolio', description: 'Portfolio data with live prices and analytics' },
      { name: 'Stocks', description: 'Individual stock quotes, fundamentals, and charts' },
      { name: 'Trades', description: 'Buy/Sell execution and trade history' },
      { name: 'Holdings', description: 'CRUD operations on portfolio holdings' },
      { name: 'Watchlist', description: 'Stock watchlist management' },
      { name: 'Calculator', description: 'P&L trade calculator' },
      { name: 'Search', description: 'NSE stock search' },
    ],
    components: {
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'INVALID_SYMBOL' },
                message: { type: 'string', example: 'Symbol parameter is required' },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        StockHolding: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'h_1' },
            name: { type: 'string', example: 'HDFC Bank' },
            symbol: { type: 'string', example: 'HDFCBANK.NS' },
            nseCode: { type: 'string', example: 'HDFCBANK' },
            bseCode: { type: 'string', example: '500180' },
            sector: { type: 'string', example: 'Banking' },
            purchasePrice: { type: 'number', example: 1550.0 },
            quantity: { type: 'integer', example: 10 },
            purchaseDate: { type: 'string', example: '2024-01-15' },
            notes: { type: 'string', example: 'Long-term hold' },
          },
        },
        PortfolioStock: {
          allOf: [
            { $ref: '#/components/schemas/StockHolding' },
            {
              type: 'object',
              properties: {
                cmp: { type: 'number', example: 1620.5 },
                investment: { type: 'number', example: 15500.0 },
                presentValue: { type: 'number', example: 16205.0 },
                gainLoss: { type: 'number', example: 705.0 },
                gainLossPercent: { type: 'number', example: 4.55 },
                portfolioWeight: { type: 'number', example: 12.5 },
                peRatio: { type: 'number', nullable: true, example: 22.3 },
                latestEarnings: { type: 'string', nullable: true, example: 'Jan 2024' },
                dayChange: { type: 'number', example: 15.2 },
                dayChangePercent: { type: 'number', example: 0.95 },
              },
            },
          ],
        },
        SectorSummary: {
          type: 'object',
          properties: {
            sector: { type: 'string', example: 'Banking' },
            totalInvestment: { type: 'number' },
            totalPresentValue: { type: 'number' },
            gainLoss: { type: 'number' },
            gainLossPercent: { type: 'number' },
            stockCount: { type: 'integer' },
            stocks: {
              type: 'array',
              items: { $ref: '#/components/schemas/PortfolioStock' },
            },
          },
        },
        PortfolioSummary: {
          type: 'object',
          properties: {
            totalInvestment: { type: 'number', example: 125000 },
            totalPresentValue: { type: 'number', example: 132500 },
            totalGainLoss: { type: 'number', example: 7500 },
            totalGainLossPercent: { type: 'number', example: 6.0 },
            sectors: {
              type: 'array',
              items: { $ref: '#/components/schemas/SectorSummary' },
            },
            lastUpdated: { type: 'string', format: 'date-time' },
          },
        },
        StockQuote: {
          type: 'object',
          properties: {
            symbol: { type: 'string', example: 'HDFCBANK.NS' },
            cmp: { type: 'number', example: 1620.5 },
            change: { type: 'number', example: 15.2 },
            changePercent: { type: 'number', example: 0.95 },
            dayHigh: { type: 'number', example: 1635.0 },
            dayLow: { type: 'number', example: 1600.0 },
            volume: { type: 'integer', example: 5432100 },
            lastUpdated: { type: 'string', format: 'date-time' },
          },
        },
        StockFundamentals: {
          type: 'object',
          properties: {
            symbol: { type: 'string', example: 'HDFCBANK' },
            cmp: { type: 'number', nullable: true },
            change: { type: 'number', nullable: true },
            changePercent: { type: 'number', nullable: true },
            peRatio: { type: 'number', nullable: true, example: 22.3 },
            latestEarnings: { type: 'string', nullable: true, example: 'Jan 2024' },
            marketCap: { type: 'string', nullable: true, example: '12.5T INR' },
            weekHigh52: { type: 'number', nullable: true },
            weekLow52: { type: 'number', nullable: true },
            lastUpdated: { type: 'string', format: 'date-time' },
          },
        },
        CandlestickData: {
          type: 'object',
          properties: {
            date: { type: 'string', example: '2024-03-01' },
            open: { type: 'number', example: 1600.0 },
            high: { type: 'number', example: 1635.0 },
            low: { type: 'number', example: 1595.0 },
            close: { type: 'number', example: 1620.5 },
            volume: { type: 'integer', example: 5432100 },
          },
        },
        ChartDataResponse: {
          type: 'object',
          properties: {
            symbol: { type: 'string', example: 'HDFCBANK' },
            period: { type: 'string', enum: ['1W', '1M', '3M', '6M', '1Y'], example: '1M' },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/CandlestickData' },
            },
            lastUpdated: { type: 'string', format: 'date-time' },
          },
        },
        Trade: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 't_1710000000000' },
            holdingId: { type: 'string', example: 'h_1' },
            symbol: { type: 'string', example: 'HDFCBANK.NS' },
            nseCode: { type: 'string', example: 'HDFCBANK' },
            name: { type: 'string', example: 'HDFC Bank' },
            action: { type: 'string', enum: ['BUY', 'SELL'], example: 'BUY' },
            price: { type: 'number', example: 1550.0 },
            quantity: { type: 'integer', example: 10 },
            totalValue: { type: 'number', example: 15500.0 },
            date: { type: 'string', format: 'date-time' },
            notes: { type: 'string', example: 'Bought on dip' },
          },
        },
        TradeRequest: {
          type: 'object',
          required: ['nseCode', 'action', 'price', 'quantity'],
          properties: {
            symbol: { type: 'string', example: 'HDFCBANK.NS' },
            nseCode: { type: 'string', example: 'HDFCBANK' },
            name: { type: 'string', example: 'HDFC Bank' },
            sector: { type: 'string', example: 'Banking' },
            bseCode: { type: 'string', example: '500180' },
            action: { type: 'string', enum: ['BUY', 'SELL'] },
            price: { type: 'number', example: 1550.0 },
            quantity: { type: 'integer', example: 10 },
            notes: { type: 'string' },
          },
        },
        TradeCalculation: {
          type: 'object',
          properties: {
            buyPrice: { type: 'number', example: 1550.0 },
            sellPrice: { type: 'number', example: 1620.0 },
            quantity: { type: 'integer', example: 10 },
            investment: { type: 'number', example: 15500.0 },
            returns: { type: 'number', example: 16200.0 },
            profit: { type: 'number', example: 700.0 },
            profitPercent: { type: 'number', example: 4.52 },
            breakEvenPrice: { type: 'number', example: 1550.0 },
          },
        },
        StockSearchResult: {
          type: 'object',
          properties: {
            symbol: { type: 'string', example: 'HDFCBANK.NS' },
            nseCode: { type: 'string', example: 'HDFCBANK' },
            name: { type: 'string', example: 'HDFC Bank Ltd' },
            sector: { type: 'string', example: 'Banking' },
            exchange: { type: 'string', example: 'NSE' },
            cmp: { type: 'number', nullable: true, example: 1620.5 },
          },
        },
        WatchlistItem: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'w_1710000000000' },
            nseCode: { type: 'string', example: 'HDFCBANK' },
            symbol: { type: 'string', example: 'HDFCBANK.NS' },
            name: { type: 'string', example: 'HDFC Bank' },
            sector: { type: 'string', example: 'Banking' },
            addedAt: { type: 'string', format: 'date-time' },
            targetPrice: { type: 'number', example: 1700.0 },
            notes: { type: 'string' },
          },
        },
        CacheStats: {
          type: 'object',
          properties: {
            keys: { type: 'integer' },
            hits: { type: 'integer' },
            misses: { type: 'integer' },
            ksize: { type: 'integer' },
            vsize: { type: 'integer' },
          },
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'healthy' },
            uptime: { type: 'number', example: 12345.67 },
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string', example: '1.0.0' },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          description: 'Returns server health status, uptime, and version.',
          responses: {
            200: {
              description: 'Server is healthy',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/HealthCheck' },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/stocks/quote/{symbol}': {
        get: {
          tags: ['Stocks'],
          summary: 'Get real-time stock quote',
          description: 'Fetches live price from Yahoo Finance (primary) with Google Finance fallback.',
          parameters: [
            {
              name: 'symbol',
              in: 'path',
              required: true,
              description: 'Stock symbol (e.g. HDFCBANK or HDFCBANK.NS)',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Stock quote data',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/StockQuote' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: 'Invalid symbol',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                },
              },
            },
          },
        },
      },
      '/stocks/fundamentals/{nseCode}': {
        get: {
          tags: ['Stocks'],
          summary: 'Get stock fundamentals',
          description: 'Fetches P/E ratio, earnings, market cap from Google Finance.',
          parameters: [
            {
              name: 'nseCode',
              in: 'path',
              required: true,
              description: 'NSE code (e.g. HDFCBANK)',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Fundamental data',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/StockFundamentals' },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/stocks/portfolio': {
        get: {
          tags: ['Portfolio'],
          summary: 'Get full portfolio with live data',
          description: 'Main dashboard endpoint. Returns all holdings enriched with live CMP (Yahoo), P/E & earnings (Google), gain/loss calculations, and sector groupings.',
          responses: {
            200: {
              description: 'Portfolio summary with sector breakdown',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/PortfolioSummary' },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/stocks/holdings': {
        get: {
          tags: ['Portfolio'],
          summary: 'Get raw holdings data',
          description: 'Returns portfolio holdings without live price enrichment.',
          responses: {
            200: {
              description: 'Holdings list',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/StockHolding' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/stocks/chart/{symbol}': {
        get: {
          tags: ['Stocks'],
          summary: 'Get historical chart data',
          description: 'Returns OHLCV candlestick data from Yahoo Finance for charting.',
          parameters: [
            {
              name: 'symbol',
              in: 'path',
              required: true,
              description: 'Stock symbol (e.g. HDFCBANK)',
              schema: { type: 'string' },
            },
            {
              name: 'period',
              in: 'query',
              required: false,
              description: 'Time period for chart data',
              schema: {
                type: 'string',
                enum: ['1W', '1M', '3M', '6M', '1Y'],
                default: '1M',
              },
            },
          ],
          responses: {
            200: {
              description: 'Historical OHLCV data',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/ChartDataResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: 'Invalid symbol or period',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                },
              },
            },
          },
        },
      },
      '/stocks/cache-stats': {
        get: {
          tags: ['Health'],
          summary: 'Cache statistics',
          description: 'Returns in-memory cache hit/miss statistics for monitoring.',
          responses: {
            200: {
              description: 'Cache stats',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/CacheStats' },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/trades/search': {
        get: {
          tags: ['Search'],
          summary: 'Search NSE stocks',
          description: 'Search stocks by name, NSE code, or BSE code. Returns up to 10 results with live prices.',
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              description: 'Search query (min 1 character)',
              schema: { type: 'string', minLength: 1 },
            },
          ],
          responses: {
            200: {
              description: 'Search results with optional live prices',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/StockSearchResult' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: 'Invalid query',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                },
              },
            },
          },
        },
      },
      '/trades/holdings': {
        get: {
          tags: ['Holdings'],
          summary: 'List all holdings',
          description: 'Returns all portfolio holdings.',
          responses: {
            200: {
              description: 'Holdings list',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/StockHolding' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Holdings'],
          summary: 'Add a new holding',
          description: 'Add a stock holding directly (without executing a trade).',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['nseCode', 'name', 'purchasePrice', 'quantity'],
                  properties: {
                    name: { type: 'string', example: 'HDFC Bank' },
                    symbol: { type: 'string', example: 'HDFCBANK.NS' },
                    nseCode: { type: 'string', example: 'HDFCBANK' },
                    bseCode: { type: 'string', example: '500180' },
                    sector: { type: 'string', example: 'Banking' },
                    purchasePrice: { type: 'number', example: 1550.0 },
                    quantity: { type: 'integer', example: 10 },
                    purchaseDate: { type: 'string', example: '2024-01-15' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Holding created',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/StockHolding' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: 'Missing required fields',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                },
              },
            },
          },
        },
      },
      '/trades/holdings/{id}': {
        put: {
          tags: ['Holdings'],
          summary: 'Update a holding',
          description: 'Update fields of an existing holding by ID.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Holding ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    purchasePrice: { type: 'number' },
                    quantity: { type: 'integer' },
                    sector: { type: 'string' },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Holding updated',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/StockHolding' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            404: {
              description: 'Holding not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Holdings'],
          summary: 'Delete a holding',
          description: 'Remove a holding by ID.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Holding ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Holding deleted',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              deleted: { type: 'boolean', example: true },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            404: {
              description: 'Holding not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                },
              },
            },
          },
        },
      },
      '/trades/execute': {
        post: {
          tags: ['Trades'],
          summary: 'Execute a trade (BUY/SELL)',
          description: 'Execute a buy or sell trade. BUY creates/increases a holding. SELL reduces quantity (must have enough shares).',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TradeRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Trade executed successfully',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              trade: { $ref: '#/components/schemas/Trade' },
                              holding: { $ref: '#/components/schemas/StockHolding' },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: 'Invalid trade parameters',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                },
              },
            },
          },
        },
      },
      '/trades/history': {
        get: {
          tags: ['Trades'],
          summary: 'Get trade history',
          description: 'Returns all executed trades sorted by date.',
          responses: {
            200: {
              description: 'Trade history',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Trade' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/trades/calculate': {
        post: {
          tags: ['Calculator'],
          summary: 'Calculate P&L for a hypothetical trade',
          description: 'Calculate profit/loss, ROI %, and break-even price for a hypothetical trade scenario.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['buyPrice', 'sellPrice', 'quantity'],
                  properties: {
                    buyPrice: { type: 'number', example: 1550.0 },
                    sellPrice: { type: 'number', example: 1620.0 },
                    quantity: { type: 'integer', example: 10 },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Calculation result',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/TradeCalculation' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: 'Invalid parameters',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                },
              },
            },
          },
        },
      },
      '/trades/watchlist': {
        get: {
          tags: ['Watchlist'],
          summary: 'Get watchlist',
          description: 'Returns all stocks on the watchlist.',
          responses: {
            200: {
              description: 'Watchlist items',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/WatchlistItem' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Watchlist'],
          summary: 'Add stock to watchlist',
          description: 'Add a stock to the watchlist with optional target price and notes.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['nseCode', 'name'],
                  properties: {
                    nseCode: { type: 'string', example: 'INFY' },
                    symbol: { type: 'string', example: 'INFY.NS' },
                    name: { type: 'string', example: 'Infosys Ltd' },
                    sector: { type: 'string', example: 'IT' },
                    targetPrice: { type: 'number', example: 1800.0 },
                    notes: { type: 'string', example: 'Watch for earnings dip' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Added to watchlist',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/WatchlistItem' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: 'Missing required fields',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                },
              },
            },
          },
        },
      },
      '/trades/watchlist/{id}': {
        delete: {
          tags: ['Watchlist'],
          summary: 'Remove from watchlist',
          description: 'Remove a stock from the watchlist by ID.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Watchlist item ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Removed from watchlist',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              deleted: { type: 'boolean', example: true },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            404: {
              description: 'Watchlist item not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [], // We define everything inline above
};

export const swaggerSpec = swaggerJsdoc(options);
