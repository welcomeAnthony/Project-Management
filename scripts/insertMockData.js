const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertMockData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'portfolio_management'
  });

  try {
    console.log('🌟 5 Star General Portfolio Management - Mock Data Script 🌟');
    console.log('===============================================================');
    
    // 1. Clean existing data (except top_stocks and price_history - API data)
    console.log('🧹 Cleaning existing data...');
    
    // Disable foreign key checks temporarily
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Clear tables in order (due to foreign key constraints)
    // NOTE: Preserving top_stocks and price_history as they contain API data
    await connection.execute('DELETE FROM transactions');
    await connection.execute('DELETE FROM portfolio_performance');
    await connection.execute('DELETE FROM portfolio_items');
    await connection.execute('DELETE FROM portfolios');
    
    // Reset auto increment
    await connection.execute('ALTER TABLE transactions AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE portfolio_performance AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE portfolio_items AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE portfolios AUTO_INCREMENT = 1');
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Data cleanup completed! (Preserved top_stocks and price_history)');

    // 2. Insert Mock Portfolios
    console.log('💼 Creating military-themed portfolios...');
    
    const portfolios = [
      {
        name: 'Elite Strike Force',
        description: 'High-growth aggressive investment portfolio focused on technology and emerging markets'
      },
      {
        name: 'Fortress Defense',
        description: 'Conservative defensive portfolio with bonds, dividend stocks, and stable assets'
      },
      {
        name: 'Tactical Advantage',
        description: 'Balanced portfolio combining growth and income strategies'
      },
      {
        name: 'Strategic Reserve',
        description: 'Long-term wealth preservation with blue-chip stocks and real estate'
      },
      {
        name: 'Special Operations',
        description: 'High-risk, high-reward portfolio with cryptocurrency and growth stocks'
      }
    ];

    const portfolioIds = [];
    for (const portfolio of portfolios) {
      const [result] = await connection.execute(
        'INSERT INTO portfolios (name, description) VALUES (?, ?)',
        [portfolio.name, portfolio.description]
      );
      portfolioIds.push(result.insertId);
      console.log(`  ⚡ Created: ${portfolio.name}`);
    }

    // 3. Insert Portfolio Items using REAL stocks from top_stocks table
    console.log('📈 Adding portfolio items with real top stocks data...');
    
    // Get real stock data from top_stocks table
    const [stocksData] = await connection.execute(`
      SELECT DISTINCT symbol, name, sector, close_price 
      FROM top_stocks 
      WHERE date = (SELECT MAX(date) FROM top_stocks)
      ORDER BY symbol
    `);
    
    console.log(`📊 Found ${stocksData.length} real stocks from top_stocks table`);
    
    const portfolioItems = [
      // Elite Strike Force (Tech-heavy) - Using real tech stocks
      { portfolioIndex: 0, symbol: 'AAPL', quantity: 100, purchasePrice: 150.00, date: '2024-01-15' },
      { portfolioIndex: 0, symbol: 'NVDA', quantity: 50, purchasePrice: 450.00, date: '2024-02-01' },
      { portfolioIndex: 0, symbol: 'MSFT', quantity: 75, purchasePrice: 350.00, date: '2024-01-20' },
      { portfolioIndex: 0, symbol: 'GOOGL', quantity: 30, purchasePrice: 2800.00, date: '2024-02-10' },
      { portfolioIndex: 0, symbol: 'TSLA', quantity: 40, purchasePrice: 220.00, date: '2024-03-01' },

      // Fortress Defense (Conservative) - Mixed with real stocks
      { portfolioIndex: 1, symbol: 'JNJ', quantity: 150, purchasePrice: 160.00, date: '2024-02-01' },
      { portfolioIndex: 1, symbol: 'MSFT', quantity: 100, purchasePrice: 340.00, date: '2024-01-15' },
      { portfolioIndex: 1, symbol: 'UNH', quantity: 80, purchasePrice: 480.00, date: '2024-02-15' },
      { portfolioIndex: 1, symbol: 'CASH', name: 'Cash Holdings', type: 'cash', quantity: 25000, purchasePrice: 1.00, currentPrice: 1.00, sector: 'Cash', date: '2024-01-01' },

      // Tactical Advantage (Balanced) - Real stocks mix
      { portfolioIndex: 2, symbol: 'AMZN', quantity: 60, purchasePrice: 140.00, date: '2024-02-05' },
      { portfolioIndex: 2, symbol: 'META', quantity: 80, purchasePrice: 320.00, date: '2024-02-20' },
      { portfolioIndex: 2, symbol: 'AAPL', quantity: 50, purchasePrice: 160.00, date: '2024-03-01' },
      { portfolioIndex: 2, symbol: 'GOOGL', quantity: 20, purchasePrice: 2900.00, date: '2024-03-10' },

      // Strategic Reserve (Blue-chip) - Real established stocks
      { portfolioIndex: 3, symbol: 'BRK-B', quantity: 50, purchasePrice: 350.00, date: '2024-01-25' },
      { portfolioIndex: 3, symbol: 'JNJ', quantity: 120, purchasePrice: 155.00, date: '2024-02-10' },
      { portfolioIndex: 3, symbol: 'UNH', quantity: 60, purchasePrice: 475.00, date: '2024-02-25' },
      { portfolioIndex: 3, symbol: 'MSFT', quantity: 80, purchasePrice: 360.00, date: '2024-03-05' },

      // Special Operations (High-risk) - Growth and crypto
      { portfolioIndex: 4, symbol: 'TSLA', quantity: 100, purchasePrice: 200.00, date: '2024-01-30' },
      { portfolioIndex: 4, symbol: 'NVDA', quantity: 75, purchasePrice: 400.00, date: '2024-02-05' },
      { portfolioIndex: 4, symbol: 'META', quantity: 60, purchasePrice: 350.00, date: '2024-02-15' },
      { portfolioIndex: 4, symbol: 'BTC', name: 'Bitcoin', type: 'crypto', quantity: 2.5, purchasePrice: 42000.00, currentPrice: 67500.00, sector: 'Cryptocurrency', date: '2024-03-01' },
      { portfolioIndex: 4, symbol: 'ETH', name: 'Ethereum', type: 'crypto', quantity: 15, purchasePrice: 2800.00, currentPrice: 3750.00, sector: 'Cryptocurrency', date: '2024-03-10' }
    ];

    // Create a map of stock data for quick lookup
    const stockMap = {};
    stocksData.forEach(stock => {
      stockMap[stock.symbol] = stock;
    });

    for (const item of portfolioItems) {
      const portfolioId = portfolioIds[item.portfolioIndex];
      let stockInfo = stockMap[item.symbol];
      let name, type, sector, currentPrice;
      
      if (stockInfo) {
        // Use real data from top_stocks
        name = stockInfo.name;
        type = 'stock';
        sector = stockInfo.sector;
        currentPrice = stockInfo.close_price;
      } else {
        // For items not in top_stocks (like crypto or cash)
        name = item.name || item.symbol;
        type = item.type || 'other';
        sector = item.sector || 'Other';
        currentPrice = item.currentPrice || item.purchasePrice * 1.1; // 10% gain default
      }
      
      await connection.execute(`
        INSERT INTO portfolio_items 
        (portfolio_id, symbol, name, type, quantity, purchase_price, current_price, purchase_date, sector, currency)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD')
      `, [portfolioId, item.symbol, name, type, item.quantity, item.purchasePrice, currentPrice, item.date, sector]);
    }
    
    console.log(`✅ Added ${portfolioItems.length} portfolio items using real stock data!`);

    // 4. Skip Historical Price Data (preserved from API)
    console.log('📊 Skipping historical price data generation (preserved from API)...');
    console.log('✅ Using existing price_history data from API!');

    // 5. Generate Portfolio Performance Data
    console.log('📈 Generating portfolio performance data...');
    
    const today = new Date(); // Define today variable for use in performance data
    
    for (let portfolioIndex = 0; portfolioIndex < portfolioIds.length; portfolioIndex++) {
      const portfolioId = portfolioIds[portfolioIndex];
      let baseValue = 50000 + (portfolioIndex * 25000); // Different base values for each portfolio
      
      for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Simulate portfolio growth/decline
        const dailyReturn = (Math.random() - 0.48) * 0.03; // Slight positive bias
        baseValue = baseValue * (1 + dailyReturn);
        const dailyChange = baseValue * dailyReturn;
        const dailyChangePercent = dailyReturn * 100;
        
        await connection.execute(`
          INSERT IGNORE INTO portfolio_performance 
          (portfolio_id, date, total_value, daily_change, daily_change_percent) 
          VALUES (?, ?, ?, ?, ?)
        `, [portfolioId, dateStr, baseValue.toFixed(2), dailyChange.toFixed(2), dailyChangePercent.toFixed(2)]);
      }
    }
    
    console.log('✅ Portfolio performance data generated!');

    // 6. Generate Transaction History using real stocks
    console.log('💰 Creating transaction history with real stocks...');
    
    const transactionTypes = ['buy', 'sell', 'dividend', 'deposit', 'withdrawal'];
    const transactionCount = 50;
    const realStockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'META', 'NVDA', 'JNJ', 'UNH', 'BRK-B'];
    
    for (let i = 0; i < transactionCount; i++) {
      const portfolioId = portfolioIds[Math.floor(Math.random() * portfolioIds.length)];
      const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      
      // Generate random transaction date within last 90 days
      const transactionDate = new Date(today);
      transactionDate.setDate(today.getDate() - Math.floor(Math.random() * 90));
      const dateStr = transactionDate.toISOString().split('T')[0];
      
      let symbol, assetName, quantity, pricePerUnit, totalAmount, fees;
      
      if (transactionType === 'dividend') {
        const dividendStocks = ['AAPL', 'MSFT', 'JNJ', 'UNH'];
        symbol = dividendStocks[Math.floor(Math.random() * dividendStocks.length)];
        assetName = `${symbol} Dividend Payment`;
        quantity = Math.floor(Math.random() * 100) + 10;
        pricePerUnit = (Math.random() * 0.5 + 0.1).toFixed(2); // $0.10 - $0.60 per share
        totalAmount = (quantity * pricePerUnit).toFixed(2);
        fees = 0;
      } else if (transactionType === 'deposit' || transactionType === 'withdrawal') {
        symbol = 'CASH';
        assetName = 'Cash Transfer';
        quantity = 1;
        pricePerUnit = Math.floor(Math.random() * 5000) + 1000;
        totalAmount = pricePerUnit;
        fees = transactionType === 'withdrawal' ? 25.00 : 0;
      } else {
        symbol = realStockSymbols[Math.floor(Math.random() * realStockSymbols.length)];
        assetName = `${symbol} Stock Transaction`;
        quantity = Math.floor(Math.random() * 50) + 1;
        
        // Get approximate current price for the stock (or use default)
        const stockPrices = {
          'AAPL': 180, 'MSFT': 410, 'GOOGL': 3100, 'TSLA': 240, 'AMZN': 160,
          'META': 480, 'NVDA': 850, 'JNJ': 165, 'UNH': 520, 'BRK-B': 380
        };
        
        pricePerUnit = stockPrices[symbol] || 100;
        totalAmount = quantity * pricePerUnit;
        fees = totalAmount * 0.001; // 0.1% fee
      }
      
      await connection.execute(`
        INSERT INTO transactions 
        (portfolio_id, transaction_type, symbol, asset_name, quantity, price_per_unit, total_amount, fees, transaction_date, status, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
      `, [
        portfolioId, 
        transactionType, 
        symbol, 
        assetName, 
        quantity, 
        pricePerUnit, 
        totalAmount, 
        fees, 
        dateStr,
        `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} transaction for ${assetName}`
      ]);
    }
    
    console.log(`✅ Created ${transactionCount} realistic transaction records!`);

    // 7. Update portfolio total values
    console.log('💼 Updating portfolio totals...');
    
    for (const portfolioId of portfolioIds) {
      await connection.execute(`
        UPDATE portfolios 
        SET total_value = (
          SELECT COALESCE(SUM(quantity * COALESCE(current_price, purchase_price)), 0)
          FROM portfolio_items 
          WHERE portfolio_id = ?
        )
        WHERE id = ?
      `, [portfolioId, portfolioId]);
    }
    
    console.log('✅ Portfolio totals updated!');

    console.log('');
    console.log('🎖️  MISSION ACCOMPLISHED! 🎖️');
    console.log('=============================');
    console.log('✅ 5 military-themed portfolios created');
    console.log('✅ 20+ portfolio items using REAL top stocks data');
    console.log('✅ Preserved existing price_history from API');
    console.log('✅ Preserved existing top_stocks data from API');
    console.log('✅ 50 realistic transactions with real stock symbols');
    console.log('✅ Performance tracking data populated');
    console.log('');
    console.log('🌟 Your 5 Star General Portfolio Management System is ready for demo! 🌟');
    console.log('📊 Using real market data from your API integrations!');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Mock data insertion failed:', error);
    throw error;
  }
}

// Export the function but also run it when called directly
module.exports = { insertMockData };

// Run if called directly
if (require.main === module) {
  console.log('⚠️  This script will clear existing data except top_stocks and price_history!');
  console.log('⚠️  API data will be preserved.');
  console.log('');
  console.log('🚀 Starting mock data insertion...');
  console.log('');
  
  insertMockData()
    .then(() => {
      console.log('');
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}
