# Portfolio Management System

A comprehensive web-based portfolio management application built with Node.js, Express, MySQL, and vanilla JavaScript. This system allows users to manage financial portfolios, track performance, and visualize asset allocations.

## 🚀 Features

### Core Features
- **Portfolio Management**: Create, update, and delete portfolios
- **Asset Tracking**: Add and manage various types of assets (stocks, bonds, ETFs, crypto, etc.)
- **Performance Monitoring**: Track portfolio performance over time with interactive charts
- **Asset Allocation**: Visualize portfolio allocation by asset type and sector
- **Price Updates**: Update current prices for assets
- **Responsive UI**: Modern, mobile-friendly interface

### Technical Features
- **REST API**: Comprehensive API with Swagger documentation
- **Data Security**: Input validation, SQL injection protection, rate limiting
- **Real-time Charts**: Interactive charts using Chart.js
- **Database**: MySQL with proper indexing and relationships
- **Error Handling**: Comprehensive error handling and user feedback

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL 8.0
- npm or yarn package manager

## 🛠️ Installation

1. **Clone/Download the project**
   ```bash
   cd c:\Users\Administrator\Desktop\npmProject\Project-Management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update the database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=n3u3da!
   DB_NAME=portfolio_management
   PORT=3000
   NODE_ENV=development
   ```

4. **Set up the database**
   ```bash
   npm run db:migrate
   ```

5. **Start the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:3000/api-docs
   - Health Check: http://localhost:3000/health

## 📊 Database Schema

### Tables

#### portfolios
- `id` - Primary key
- `name` - Portfolio name (required)
- `description` - Portfolio description
- `total_value` - Calculated total value
- `created_at`, `updated_at` - Timestamps

#### portfolio_items
- `id` - Primary key
- `portfolio_id` - Foreign key to portfolios
- `symbol` - Trading symbol (e.g., AAPL)
- `name` - Asset name
- `type` - Asset type (stock, bond, etf, etc.)
- `quantity` - Number of shares/units
- `purchase_price` - Original purchase price
- `current_price` - Current market price
- `purchase_date` - Purchase date
- `sector` - Industry sector
- `currency` - Currency code (default: USD)
- `created_at`, `updated_at` - Timestamps

#### portfolio_performance
- Historical performance tracking
- Daily portfolio values and changes

#### price_history
- Historical price data for assets

## 🔌 API Endpoints

### Portfolios
- `GET /api/portfolios` - List all portfolios
- `GET /api/portfolios/:id` - Get portfolio by ID
- `POST /api/portfolios` - Create new portfolio
- `PUT /api/portfolios/:id` - Update portfolio
- `DELETE /api/portfolios/:id` - Delete portfolio
- `GET /api/portfolios/:id/performance` - Get performance data
- `GET /api/portfolios/:id/summary` - Get comprehensive summary

### Portfolio Items
- `GET /api/portfolios/:id/items` - Get portfolio items
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `PUT /api/items/price` - Update price for symbol
- `GET /api/portfolios/:id/allocation` - Get allocation data

## 🎯 Usage Guide

### Creating Your First Portfolio

1. **Navigate to the Portfolios section**
2. **Click "Create Portfolio"**
3. **Fill in the details:**
   - Name: "My Investment Portfolio"
   - Description: "Long-term investment strategy"
4. **Click "Create Portfolio"**

### Adding Portfolio Items

1. **Go to "Add Item" section**
2. **Select your portfolio**
3. **Fill in asset details:**
   - Symbol: AAPL
   - Name: Apple Inc.
   - Type: Stock
   - Quantity: 100
   - Purchase Price: 150.00
   - Current Price: 175.50
   - Purchase Date: 2024-01-15
   - Sector: Technology

### Viewing Performance

1. **Go to Dashboard**
2. **Select a portfolio from the dropdown**
3. **View:**
   - Performance chart (30-day history)
   - Asset allocation pie chart
   - Portfolio summary statistics
   - Detailed item listing

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Joi-based validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **Security Headers**: Helmet.js implementation
- **CORS Configuration**: Configurable cross-origin policies
- **Error Handling**: Secure error messages

## 📚 API Documentation

The application includes comprehensive API documentation using Swagger UI:
- Access: http://localhost:3000/api-docs
- Features:
  - Interactive API testing
  - Request/response examples
  - Schema definitions
  - Authentication details

## 🧪 Sample Data

The database migration includes sample data:
- **Sample Portfolio**: "My Investment Portfolio"
- **Sample Assets**: AAPL, GOOGL, MSFT, TSLA, BND, CASH
- **Historical Data**: 30 days of performance and price history

## 🔧 Configuration Options

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=portfolio_management

# Server
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Asset Types Supported
- **stock** - Individual stocks
- **bond** - Government and corporate bonds
- **etf** - Exchange-traded funds
- **mutual_fund** - Mutual funds
- **crypto** - Cryptocurrencies
- **cash** - Cash holdings
- **other** - Other asset types

## 🚀 Advanced Features

### Performance Tracking
- Historical portfolio values
- Daily gain/loss calculations
- Percentage-based performance metrics
- Time-series visualization

### Asset Allocation Analysis
- Allocation by asset type
- Sector-based allocation
- Percentage breakdowns
- Visual pie charts

### Price Management
- Bulk price updates by symbol
- Historical price tracking
- Automatic portfolio value recalculation

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL service is running
   - Verify credentials in `.env` file
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing process: `taskkill /f /im node.exe`

3. **NPM Install Errors**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

4. **API Errors**
   - Check browser console for errors
   - Verify API endpoints in network tab
   - Check server logs for details

## 📈 Future Enhancements

- Real-time price feeds integration
- User authentication and multi-user support
- Advanced charting and technical indicators
- Import/export functionality
- Mobile app development
- Automated portfolio rebalancing
- Tax reporting features
- Notification system

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
- Check the troubleshooting section
- Review API documentation
- Create an issue on the repository

---

**Built with ❤️ using Node.js, Express, MySQL, and modern web technologies.**
