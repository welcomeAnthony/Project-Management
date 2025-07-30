const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Portfolio Management API',
      version: '1.0.0',
      description: `
        A comprehensive REST API for managing financial portfolios with real-time stock data integration.
        
        ## 🚀 Features
        
        ### 📊 Portfolio Management
        - Create and manage multiple portfolios
        - Add/remove/update portfolio items (stocks, bonds, cash, etc.)
        - Track portfolio performance over time
        - View allocation breakdowns by type and sector
        - Portfolio summary with gain/loss calculations
        
        ### 📈 Real-Time Stock Data
        - Integration with Yahoo Finance API
        - Daily top stocks data collection
        - Stock price updates and historical data
        - Sector-based stock filtering
        - Market statistics and analytics
        
        ### 💼 Transaction Management
        - Record buy/sell transactions
        - Track transaction history
        - Portfolio item management through transactions
        
        ### 🔍 Market Data
        - Real-time stock quotes
        - Stock symbol search
        - Historical price data
        - Chart data for visualization
        
        ## 🛠️ Getting Started
        1. **Health Check**: Use GET /health to verify API status
        2. **Create Portfolio**: Use POST /api/portfolios to create a new portfolio
        3. **Add Items**: Use POST /api/items to add stocks/assets to your portfolio
        4. **Track Performance**: Use GET /api/portfolios/{id}/performance for analytics
        5. **Monitor Stocks**: Use /api/top-stocks endpoints for market insights
        
        ## 🔒 Security & Rate Limiting
        - Rate limiting: 100 requests per 15 minutes per IP
        - Input validation on all endpoints
        - SQL injection protection with parameterized queries
        - Security headers with Helmet.js
        - CORS configuration for cross-origin requests
        
        ## 📊 Response Format
        All API responses follow a consistent format:
        \`\`\`json
        {
          "success": true|false,
          "message": "Description of the result",
          "data": {...}, // Response data
          "count": 10,   // For list endpoints
          "timestamp": "ISO date string"
        }
        \`\`\`
        
        ## 🧪 Testing
        Use the automation test script: \`npm run test:automation\`
      `,
      contact: {
        name: 'Portfolio Management API Team',
        email: 'support@portfoliomanagement.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.portfoliomanagement.com',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'API health and status checks'
      },
      {
        name: 'Portfolios',
        description: 'Portfolio management operations - create, read, update, delete portfolios'
      },
      {
        name: 'Portfolio Items',
        description: 'Portfolio items management - stocks, bonds, and other assets within portfolios'
      },
      {
        name: 'Transactions',
        description: 'Transaction recording and management - buy/sell operations'
      },
      {
        name: 'Top Stocks',
        description: 'Market data for top performing stocks with filtering and analytics'
      },
      {
        name: 'Market Data',
        description: 'Real-time stock quotes, search, and historical data'
      },
      {
        name: 'Stock Operations',
        description: 'Stock price updates and management operations'
      }
    ],
    components: {
      schemas: {
        Portfolio: {
          type: 'object',
          required: ['name'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique portfolio identifier',
              example: 1
            },
            name: {
              type: 'string',
              description: 'Portfolio name',
              example: 'My Investment Portfolio'
            },
            description: {
              type: 'string',
              description: 'Portfolio description',
              example: 'Long-term investment strategy focused on growth stocks'
            },
            calculated_value: {
              type: 'number',
              format: 'decimal',
              description: 'Current total value of the portfolio',
              example: 25000.50
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        PortfolioItem: {
          type: 'object',
          required: ['portfolio_id', 'symbol', 'name', 'type', 'quantity', 'purchase_price'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique item identifier',
              example: 1
            },
            portfolio_id: {
              type: 'integer',
              description: 'Portfolio ID this item belongs to',
              example: 1
            },
            symbol: {
              type: 'string',
              description: 'Stock/asset symbol',
              example: 'AAPL'
            },
            name: {
              type: 'string',
              description: 'Asset name',
              example: 'Apple Inc.'
            },
            type: {
              type: 'string',
              enum: ['stock', 'bond', 'cash', 'etf', 'crypto', 'other'],
              description: 'Type of asset',
              example: 'stock'
            },
            quantity: {
              type: 'number',
              format: 'decimal',
              description: 'Number of shares/units',
              example: 100
            },
            purchase_price: {
              type: 'number',
              format: 'decimal',
              description: 'Purchase price per unit',
              example: 150.25
            },
            current_price: {
              type: 'number',
              format: 'decimal',
              description: 'Current market price per unit',
              example: 175.50
            },
            sector: {
              type: 'string',
              description: 'Industry sector',
              example: 'Technology'
            }
          }
        },
        TopStock: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier',
              example: 1
            },
            symbol: {
              type: 'string',
              description: 'Stock symbol',
              example: 'AAPL'
            },
            name: {
              type: 'string',
              description: 'Company name',
              example: 'Apple Inc.'
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Date of the stock data',
              example: '2025-07-30'
            },
            open_price: {
              type: 'number',
              format: 'decimal',
              description: 'Opening price',
              example: 170.25
            },
            close_price: {
              type: 'number',
              format: 'decimal',
              description: 'Closing price',
              example: 175.50
            },
            high_price: {
              type: 'number',
              format: 'decimal',
              description: 'Highest price of the day',
              example: 176.80
            },
            low_price: {
              type: 'number',
              format: 'decimal',
              description: 'Lowest price of the day',
              example: 169.90
            },
            volume: {
              type: 'integer',
              description: 'Trading volume',
              example: 50000000
            },
            market_cap: {
              type: 'number',
              format: 'decimal',
              description: 'Market capitalization',
              example: 2500000000000
            },
            pe_ratio: {
              type: 'number',
              format: 'decimal',
              description: 'Price-to-earnings ratio',
              example: 25.6
            },
            sector: {
              type: 'string',
              description: 'Industry sector',
              example: 'Technology'
            },
            change_percent: {
              type: 'number',
              format: 'decimal',
              description: 'Daily percentage change',
              example: 3.1
            }
          }
        },
        Transaction: {
          type: 'object',
          required: ['portfolio_item_id', 'type', 'quantity', 'price'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique transaction identifier',
              example: 1
            },
            portfolio_item_id: {
              type: 'integer',
              description: 'Portfolio item ID',
              example: 1
            },
            type: {
              type: 'string',
              enum: ['buy', 'sell'],
              description: 'Transaction type',
              example: 'buy'
            },
            quantity: {
              type: 'number',
              format: 'decimal',
              description: 'Number of shares/units',
              example: 50
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Price per unit',
              example: 150.25
            },
            total_amount: {
              type: 'number',
              format: 'decimal',
              description: 'Total transaction amount',
              example: 7512.50
            },
            transaction_date: {
              type: 'string',
              format: 'date-time',
              description: 'Transaction timestamp'
            },
            notes: {
              type: 'string',
              description: 'Optional transaction notes',
              example: 'Dollar-cost averaging purchase'
            }
          }
        },
        StockQuote: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock symbol',
              example: 'AAPL'
            },
            name: {
              type: 'string',
              description: 'Company name',
              example: 'Apple Inc.'
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Current stock price',
              example: 175.50
            },
            change: {
              type: 'number',
              format: 'decimal',
              description: 'Price change',
              example: 5.25
            },
            changePercent: {
              type: 'number',
              format: 'decimal',
              description: 'Percentage change',
              example: 3.1
            },
            volume: {
              type: 'integer',
              description: 'Trading volume',
              example: 50000000
            },
            marketCap: {
              type: 'number',
              format: 'decimal',
              description: 'Market capitalization',
              example: 2500000000000
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful',
              example: true
            },
            message: {
              type: 'string',
              description: 'Human-readable message',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Response data (varies by endpoint)'
            },
            count: {
              type: 'integer',
              description: 'Number of items returned (for list endpoints)',
              example: 10
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Response timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message describing what went wrong'
            },
            error: {
              type: 'string',
              example: 'ERROR_CODE'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp'
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Validation failed'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'name'
                  },
                  message: {
                    type: 'string',
                    example: 'Name is required'
                  },
                  value: {
                    type: 'string',
                    example: 'Invalid input value'
                  }
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      },
      responses: {
        Success: {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse'
              }
            }
          }
        },
        Created: {
          description: 'Resource created successfully',
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
                          id: {
                            type: 'integer',
                            description: 'ID of the created resource'
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        BadRequest: {
          description: 'Bad request - validation error or malformed request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Error' },
                  {
                    type: 'object',
                    properties: {
                      message: {
                        example: 'Resource not found'
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        InternalError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Error' },
                  {
                    type: 'object',
                    properties: {
                      message: {
                        example: 'Internal server error occurred'
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Error' },
                  {
                    type: 'object',
                    properties: {
                      message: {
                        example: 'Rate limit exceeded. Please try again later.'
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized access',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Error' },
                  {
                    type: 'object',
                    properties: {
                      message: {
                        example: 'Unauthorized access'
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      parameters: {
        PortfolioId: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Portfolio ID',
          schema: {
            type: 'integer',
            minimum: 1
          },
          example: 1
        },
        ItemId: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Portfolio Item ID',
          schema: {
            type: 'integer',
            minimum: 1
          },
          example: 1
        },
        TransactionId: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Transaction ID',
          schema: {
            type: 'integer',
            minimum: 1
          },
          example: 1
        },
        StockSymbol: {
          name: 'symbol',
          in: 'path',
          required: true,
          description: 'Stock symbol (e.g., AAPL, GOOGL)',
          schema: {
            type: 'string',
            pattern: '^[A-Z]{1,5}$'
          },
          example: 'AAPL'
        },
        Sector: {
          name: 'sector',
          in: 'path',
          required: true,
          description: 'Industry sector name',
          schema: {
            type: 'string'
          },
          example: 'Technology'
        },
        DateQuery: {
          name: 'date',
          in: 'query',
          required: false,
          description: 'Date filter (YYYY-MM-DD format)',
          schema: {
            type: 'string',
            format: 'date'
          },
          example: '2025-07-30'
        },
        SearchQuery: {
          name: 'query',
          in: 'path',
          required: true,
          description: 'Search query string',
          schema: {
            type: 'string',
            minLength: 1
          },
          example: 'Apple'
        }
      }
    }
  },
  apis: [
    './routes/*.js',
    './models/*.js',
    './controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
};

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions
};
