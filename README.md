# Portfolio Management API

A comprehensive REST API for managing financial portfolios with real-time stock data integration.

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)

## ✨ Features

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

### 🔒 Security & Performance
- Rate limiting (100 requests per 15 minutes)
- Input validation on all endpoints
- SQL injection protection
- Security headers with Helmet.js
- CORS configuration
- Error handling and logging

### 🎯 Additional Features
- Automated data collection with schedulers
- Database backup functionality
- Swagger API documentation
- Performance analytics
- Data export capabilities

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Project-Management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   npm run db:migrate
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the API**
   - API: http://localhost:3000
   - Documentation: http://localhost:3000/api-docs
   - Health Check: http://localhost:3000/health

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Environment Setup

Create a `.env` file in the root directory:

```properties
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=portfolio_management

# Server Configuration
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key-here
BCRYPT_ROUNDS=100

# Rate Limiting
RATE_LIMIT_WINDOW=1
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Setup

1. Create the MySQL database:
   ```sql
   CREATE DATABASE portfolio_management;
   ```

2. Run migrations:
   ```bash
   npm run db:migrate
   ```

3. (Optional) Insert sample data:
   ```bash
   node scripts/insertMockData.js
   ```

## ⚙️ Configuration

### Available Scripts

- `npm start` - Start production server with scheduler
- `npm run dev` - Start development server with nodemon
- `npm test` - Run Jest tests
- `npm run test:automation` - Run automation tests
- `npm run db:migrate` - Run database migrations
- `npm run scheduler` - Start background scheduler only

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 3306 |
| `DB_USER` | Database username | root |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | portfolio_management |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `JWT_SECRET` | JWT secret key | - |
| `BCRYPT_ROUNDS` | Bcrypt rounds | 100 |
| `RATE_LIMIT_WINDOW` | Rate limit window (minutes) | 1 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## 📚 API Documentation

### Interactive Documentation

The API provides comprehensive interactive documentation using Swagger/OpenAPI 3.0:

- **Swagger UI**: http://localhost:3000/api-docs
- **Interactive Testing**: Try endpoints directly from the documentation
- **Schema Validation**: All request/response formats are documented
- **Real-time Examples**: Live examples for all endpoints

### API Response Format

All API responses follow a consistent structure:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {...},           // Response data (varies by endpoint)
  "count": 10,            // Number of items (for list endpoints)
  "timestamp": "2025-07-30T12:00:00.000Z"
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2025-07-30T12:00:00.000Z"
}
```

### Validation Error Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Name is required",
      "value": "invalid_input"
    }
  ],
  "timestamp": "2025-07-30T12:00:00.000Z"
}
```

### Health & Status

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/health` | API health check | System status and uptime |

### Portfolio Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/portfolios` | Get all portfolios | - |
| `GET` | `/api/portfolios/:id` | Get portfolio by ID | - |
| `POST` | `/api/portfolios` | Create new portfolio | `{name, description}` |
| `PUT` | `/api/portfolios/:id` | Update portfolio | `{name?, description?}` |
| `DELETE` | `/api/portfolios/:id` | Delete portfolio | - |
| `GET` | `/api/portfolios/:id/performance` | Get portfolio performance analytics | - |
| `GET` | `/api/portfolios/:id/summary` | Get portfolio summary with totals | - |

### Portfolio Items Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/portfolios/:id/items` | Get all items in a portfolio | - |
| `GET` | `/api/items/:id` | Get specific portfolio item | - |
| `POST` | `/api/items` | Add new item to portfolio | `{portfolio_id, symbol, name, type, quantity, purchase_price, sector?}` |
| `PUT` | `/api/items/:id` | Update portfolio item | `{symbol?, name?, quantity?, purchase_price?, current_price?, sector?}` |
| `DELETE` | `/api/items/:id` | Remove item from portfolio | - |

### Stock Data Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| `GET` | `/api/top-stocks` | Get top stocks for today | `?date=YYYY-MM-DD` |
| `GET` | `/api/top-stocks/latest` | Get latest top stocks data | - |
| `GET` | `/api/top-stocks/sectors` | Get all available sectors | - |
| `GET` | `/api/top-stocks/sector/:sector` | Get stocks by sector | - |
| `GET` | `/api/top-stocks/symbol/:symbol` | Get historical data for stock | - |
| `GET` | `/api/top-stocks/symbols` | Get all available stock symbols | - |
| `GET` | `/api/top-stocks/statistics` | Get market statistics | - |
| `GET` | `/api/top-stocks/chart/:symbol` | Get chart data for visualization | `?period=1d|5d|1mo|3mo|6mo|1y` |
| `GET` | `/api/top-stocks/export` | Export stock data to JSON | `?date=YYYY-MM-DD&format=json` |

### Transaction Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/transactions` | Get all transactions | - |
| `GET` | `/api/transactions/:id` | Get specific transaction | - |
| `POST` | `/api/transactions` | Record new transaction | `{portfolio_item_id, type, quantity, price, notes?}` |
| `PUT` | `/api/transactions/:id` | Update transaction | `{type?, quantity?, price?, notes?}` |
| `DELETE` | `/api/transactions/:id` | Delete transaction | - |

### Market Data Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| `GET` | `/api/market/quote/:symbol` | Get real-time stock quote | - |
| `GET` | `/api/market/search/:query` | Search for stocks by name/symbol | - |
| `GET` | `/api/market/historical/:symbol` | Get historical price data | `?period=1d|5d|1mo|3mo|6mo|1y&interval=1m|5m|1h|1d` |

### Stock Management Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `PUT` | `/api/stocks/update-prices` | Update current prices for all stocks | - |
| `GET` | `/api/stocks/sectors` | Get sector performance summary | - |
| `POST` | `/api/stocks/bulk-update` | Bulk update stock prices | `{symbols: [string]}` |

### Example Requests

#### Create Portfolio
```bash
curl -X POST http://localhost:3000/api/portfolios \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Investment Portfolio",
    "description": "Long-term investment strategy"
  }'
```

#### Add Portfolio Item
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio_id": 1,
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "type": "stock",
    "quantity": 10,
    "purchase_price": 150.00
  }'
```

#### Get Latest Top Stocks
```bash
curl http://localhost:3000/api/top-stocks/latest
```

## 🧪 Testing

### Automated Testing

Run the automation test suite:
```bash
npm run test:automation
```

This will test all major API endpoints and provide a comprehensive report.

### Manual Testing

Individual API endpoint tests are available:
- `test-api.js` - General API testing
- `test-api-top-stocks.js` - Stock-specific testing
- `test-historical-api.js` - Historical data testing

### Unit Testing

Run Jest unit tests:
```bash
npm test
```

## 📁 Project Structure

```
Project-Management/
├── config/
│   ├── database.js          # Database configuration
│   └── swagger.js           # API documentation setup
├── controllers/
│   ├── portfolioController.js
│   ├── portfolioItemController.js
│   ├── topStockController.js
│   └── transactionController.js
├── middleware/
│   ├── security.js          # Security middleware
│   └── validation.js        # Input validation
├── models/
│   ├── Portfolio.js
│   ├── PortfolioItem.js
│   ├── TopStock.js
│   └── Transaction.js
├── routes/
│   ├── portfolios.js
│   ├── portfolioItems.js
│   ├── topStocks.js
│   ├── transactions.js
│   ├── market.js
│   └── stocks.js
├── scripts/
│   ├── migrate.js           # Database migrations
│   ├── scheduler.js         # Background tasks
│   ├── backupDatabase.js    # Database backup
│   └── insertMockData.js    # Sample data
├── public/
│   ├── index.html          # Web interface
│   ├── css/
│   └── js/
├── backups/                # Database backups
├── data/                   # Stock data files
├── test-automation.js      # Automated testing
└── server.js              # Main application file
```

## 🛠️ Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL2** - Database driver
- **Yahoo Finance API** - Stock data
- **Swagger** - API documentation

### Security & Middleware
- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Express Rate Limit** - Rate limiting
- **Express Validator** - Input validation
- **Joi** - Schema validation

### Development & Testing
- **Nodemon** - Development server
- **Jest** - Unit testing
- **Supertest** - API testing
- **Axios** - HTTP client
- **Concurrently** - Process management

### Utilities
- **Node-cron** - Task scheduling
- **Bcrypt** - Password hashing
- **Date-fns** - Date manipulation
- **Chart.js** - Data visualization

## 🔄 Background Services

### Stock Data Scheduler
Automatically collects top stocks data daily:
```bash
npm run scheduler
```

### Database Backup
Automated database backups:
```bash
node scripts/backupDatabase.js
```

## 🌐 Web Interface

The API includes a web interface accessible at:
- Main Dashboard: http://localhost:3000/index.html
- Top Stocks: http://localhost:3000/top-stocks.html
- Transactions: http://localhost:3000/transactions.html

## 📊 Data Management

### Stock Data Collection
- Daily collection of top performing stocks
- Yahoo Finance API integration
- Automatic price updates
- Historical data tracking

### Portfolio Analytics
- Performance calculations
- Allocation breakdowns
- Gain/loss tracking
- Summary statistics

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **API Endpoints Not Working**
   - Check server is running on correct port
   - Verify API documentation at `/api-docs`
   - Run health check: `/health`

3. **Stock Data Not Updating**
   - Check Yahoo Finance API availability
   - Verify scheduler is running
   - Check network connectivity

### Logs and Debugging

- Server logs are displayed in console
- Error details available in API responses
- Use `/health` endpoint to verify system status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api-docs`
- Review the troubleshooting section above

---

**Built with ❤️ for modern portfolio management**
