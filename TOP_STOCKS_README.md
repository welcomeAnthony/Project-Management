# Top Stocks Feature Documentation

## Overview

The Top Stocks feature allows you to fetch, store, and display the top 10 most popular stocks data using Yahoo Finance API. The data is stored in both MySQL database and JSON files for easy access and backup.

## Database Table Structure

### `top_stocks` Table

```sql
CREATE TABLE top_stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    open_price DECIMAL(15, 4),
    close_price DECIMAL(15, 4),
    high_price DECIMAL(15, 4),
    low_price DECIMAL(15, 4),
    volume BIGINT,
    market_cap DECIMAL(20, 2),
    pe_ratio DECIMAL(10, 2),
    dividend_yield DECIMAL(5, 4),
    fifty_two_week_high DECIMAL(15, 4),
    fifty_two_week_low DECIMAL(15, 4),
    avg_volume BIGINT,
    beta DECIMAL(8, 4),
    eps DECIMAL(10, 4),
    sector VARCHAR(100),
    industry VARCHAR(100),
    currency VARCHAR(3) DEFAULT 'USD',
    exchange VARCHAR(50),
    rank_position TINYINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_symbol_date (symbol, date),
    INDEX idx_date (date),
    INDEX idx_symbol (symbol),
    INDEX idx_rank (rank_position),
    INDEX idx_sector (sector)
);
```

## API Endpoints

### GET /api/top-stocks
Get top stocks data for a specific date (defaults to today)

**Query Parameters:**
- `date` (optional): Date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "date": "2025-07-29",
  "count": 10,
  "data": [...]
}
```

### GET /api/top-stocks/latest
Get the latest top stocks data

### POST /api/top-stocks/fetch
Fetch fresh data from Yahoo Finance API and save to database and JSON file

### GET /api/top-stocks/sectors
Get all available sectors

### GET /api/top-stocks/sector/:sector
Get top stocks filtered by sector

### GET /api/top-stocks/symbol/:symbol
Get historical data for a specific stock symbol

**Query Parameters:**
- `startDate` (optional): Start date for range
- `endDate` (optional): End date for range

### GET /api/top-stocks/statistics
Get statistics for the top stocks data

### GET /api/top-stocks/export
Export top stocks data to JSON file

### DELETE /api/top-stocks/cleanup
Clean up old records (keeps last 30 days by default)

**Query Parameters:**
- `daysToKeep` (optional): Number of days to keep (default: 30)

## Files Structure

```
models/
├── TopStock.js                 # Top Stock model with database operations

controllers/
├── topStockController.js       # API endpoints controller

routes/
├── topStocks.js               # API routes definitions

scripts/
├── topStockScheduler.js       # Automated data fetching scheduler
├── testTopStocks.js           # Test script for manual data fetch
└── migrate.js                 # Updated with top_stocks table

public/
├── top-stocks.html            # Frontend interface
└── test-api-top-stocks.js     # API testing script

data/
└── top_stocks_YYYY-MM-DD.json # JSON export files
```

## Automated Scheduling

The system includes automated scheduling that:

- Fetches data at market open (9:30 AM EST) on weekdays
- Fetches data at market close (4:30 PM EST) on weekdays  
- Performs weekly cleanup (2:00 AM EST) on Sundays
- In development mode: Fetches data every 5 minutes for testing

## Usage Examples

### Fetch Data Manually
```javascript
// Run one-time fetch
node scripts/testTopStocks.js

// Test all API endpoints
node test-api-top-stocks.js
```

### Database Migration
```bash
npm run db:migrate
```

### Start Server with Scheduler
```bash
npm start
```

## JSON File Format

```json
{
  "date": "2025-07-29",
  "timestamp": "2025-07-29T13:27:41.865Z",
  "count": 10,
  "stocks": [
    {
      "symbol": "AAPL",
      "name": "Apple",
      "date": "2025-07-29",
      "open_price": 214.03,
      "close_price": 214.05,
      "high_price": 214.845,
      "low_price": 213.06,
      "volume": 36504158,
      "market_cap": 3197008084992,
      "pe_ratio": 33.34112,
      "dividend_yield": 0.49,
      "fifty_two_week_high": 260.1,
      "fifty_two_week_low": 169.21,
      "avg_volume": 45568860,
      "beta": 1.199,
      "eps": 6.42,
      "sector": "Technology",
      "industry": "Consumer Electronics",
      "currency": "USD",
      "exchange": "NMS",
      "rank_position": 1
    }
  ]
}
```

## Frontend Features

The `top-stocks.html` page provides:

- 📊 Real-time display of top 10 stocks
- 🔄 Refresh data functionality
- 📈 Fetch fresh data from Yahoo Finance
- 💾 Export to JSON
- 🏢 Filter by sector
- 📋 Statistics dashboard
- 📱 Responsive design

## Configuration

### Top 10 Stocks List
The default list of stocks can be modified in `topStockController.js` and `topStockScheduler.js`:

```javascript
const topSymbols = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 
  'TSLA', 'META', 'BRK-B', 'UNH', 'JNJ'
];
```

### Scheduler Times
Modify the cron schedules in `topStockScheduler.js`:

```javascript
// Market open (9:30 AM EST)
cron.schedule('30 9 * * 1-5', async () => { ... });

// Market close (4:30 PM EST)
cron.schedule('30 16 * * 1-5', async () => { ... });
```

## Error Handling

The system includes comprehensive error handling:
- Database connection errors
- Yahoo Finance API rate limiting
- Missing data graceful fallbacks
- Network timeout handling
- Invalid date format validation

## Performance Considerations

- Uses connection pooling for database operations
- Implements rate limiting for Yahoo Finance API calls
- Bulk insert operations for efficiency
- Automatic cleanup of old records
- Indexed database fields for fast queries

## Dependencies

- `yahoo-finance2`: Yahoo Finance API integration
- `mysql2`: Database connectivity
- `node-cron`: Automated scheduling
- `express`: Web server framework
- `fs/promises`: File system operations

## Troubleshooting

### Common Issues

1. **Yahoo Finance API Errors**
   - Check internet connection
   - Verify Yahoo Finance service status
   - Review rate limiting settings

2. **Database Connection Issues**
   - Verify MySQL server is running
   - Check database credentials in `.env`
   - Ensure database exists

3. **Scheduling Not Working**
   - Check system timezone settings
   - Verify cron expressions
   - Review scheduler logs

### Logs

Monitor logs for:
- `Starting scheduled top stocks data fetch...`
- `Saved X stocks to database`
- `Saved stocks data to JSON file`
- Error messages from Yahoo Finance API

## Security Notes

- API rate limiting implemented
- Input validation on all endpoints
- SQL injection prevention with prepared statements
- CORS configuration for cross-origin requests
- Helmet.js security headers

## Future Enhancements

Potential improvements:
- Historical data comparison charts
- Stock price alerts
- Portfolio integration
- Real-time price updates via WebSocket
- Technical indicators calculation
- Multiple market support (NASDAQ, NYSE, etc.)

## License

This feature is part of the Portfolio Management System and follows the same MIT license.
