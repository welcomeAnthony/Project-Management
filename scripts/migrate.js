const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  try {
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'portfolio_management'}`);
    console.log(`Database ${process.env.DB_NAME || 'portfolio_management'} created or already exists`);
    
    // Close connection and reconnect to the specific database
    await connection.end();
    
    // Reconnect with the specific database
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'portfolio_management'
    });

    // Create portfolios table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS portfolios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        total_value DECIMAL(15, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name)
      )
    `);

    // Create portfolio_items table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS portfolio_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        portfolio_id INT NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type ENUM('stock', 'bond', 'cash', 'crypto', 'etf', 'mutual_fund', 'other') NOT NULL,
        quantity DECIMAL(15, 6) NOT NULL,
        purchase_price DECIMAL(15, 2) NOT NULL,
        current_price DECIMAL(15, 2),
        purchase_date DATE NOT NULL,
        sector VARCHAR(100),
        currency VARCHAR(3) DEFAULT 'USD',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
        INDEX idx_portfolio_symbol (portfolio_id, symbol),
        INDEX idx_type (type),
        INDEX idx_symbol (symbol)
      )
    `);

    // Create portfolio_performance table for historical tracking
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS portfolio_performance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        portfolio_id INT NOT NULL,
        date DATE NOT NULL,
        total_value DECIMAL(15, 2) NOT NULL,
        daily_change DECIMAL(15, 2) DEFAULT 0.00,
        daily_change_percent DECIMAL(5, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
        UNIQUE KEY unique_portfolio_date (portfolio_id, date),
        INDEX idx_portfolio_date (portfolio_id, date)
      )
    `);

    // Create price_history table for asset price tracking
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS price_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        symbol VARCHAR(20) NOT NULL,
        date DATE NOT NULL,
        price DECIMAL(15, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_symbol_date (symbol, date),
        INDEX idx_symbol_date (symbol, date)
      )
    `);

    // Create transactions table for recording all portfolio transactions
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        portfolio_id INT NOT NULL,
        portfolio_item_id INT,
        transaction_type ENUM('buy', 'sell', 'dividend', 'split', 'transfer', 'fee', 'deposit', 'withdrawal') NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        asset_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(15, 6) NOT NULL,
        price_per_unit DECIMAL(15, 2) NOT NULL,
        total_amount DECIMAL(15, 2) NOT NULL,
        fees DECIMAL(15, 2) DEFAULT 0.00,
        transaction_date DATE NOT NULL,
        description TEXT,
        reference_number VARCHAR(100),
        status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
        FOREIGN KEY (portfolio_item_id) REFERENCES portfolio_items(id) ON DELETE SET NULL,
        INDEX idx_portfolio_id (portfolio_id),
        INDEX idx_symbol (symbol),
        INDEX idx_transaction_type (transaction_type),
        INDEX idx_transaction_date (transaction_date),
        INDEX idx_status (status)
      )
    `);

    // Insert sample data
    console.log('Inserting sample data...');
    
    // Sample portfolio
    const [portfolioResult] = await dbConnection.execute(`
      INSERT IGNORE INTO portfolios (name, description, total_value) 
      VALUES ('My Investment Portfolio', 'Diversified investment portfolio with stocks, bonds, and cash', 50000.00)
    `);

    if (portfolioResult.affectedRows > 0 || portfolioResult.insertId) {
      const portfolioId = portfolioResult.insertId || 1;

      // Sample portfolio items
      await dbConnection.execute(`
        INSERT IGNORE INTO portfolio_items 
        (portfolio_id, symbol, name, type, quantity, purchase_price, current_price, purchase_date, sector, currency) 
        VALUES 
        (?, 'AAPL', 'Apple Inc.', 'stock', 50, 150.00, 175.50, '2024-01-15', 'Technology', 'USD'),
        (?, 'GOOGL', 'Alphabet Inc.', 'stock', 25, 2800.00, 2950.75, '2024-02-01', 'Technology', 'USD'),
        (?, 'MSFT', 'Microsoft Corporation', 'stock', 40, 350.00, 380.25, '2024-01-20', 'Technology', 'USD'),
        (?, 'TSLA', 'Tesla Inc.', 'stock', 20, 220.00, 245.80, '2024-02-10', 'Automotive', 'USD'),
        (?, 'BND', 'Vanguard Total Bond Market ETF', 'etf', 100, 80.00, 82.15, '2024-01-10', 'Bonds', 'USD'),
        (?, 'CASH', 'Cash Holdings', 'cash', 5000, 1.00, 1.00, '2024-01-01', 'Cash', 'USD')
      `, [portfolioId, portfolioId, portfolioId, portfolioId, portfolioId, portfolioId]);

      // Sample price history for last 30 days
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        await dbConnection.execute(`
          INSERT IGNORE INTO price_history (symbol, date, price) VALUES 
          ('AAPL', ?, ?),
          ('GOOGL', ?, ?),
          ('MSFT', ?, ?),
          ('TSLA', ?, ?),
          ('BND', ?, ?)
        `, [
          dateStr, 175.50 + (Math.random() - 0.5) * 10,
          dateStr, 2950.75 + (Math.random() - 0.5) * 100,
          dateStr, 380.25 + (Math.random() - 0.5) * 20,
          dateStr, 245.80 + (Math.random() - 0.5) * 15,
          dateStr, 82.15 + (Math.random() - 0.5) * 2
        ]);
      }

      // Sample portfolio performance data
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const totalValue = 50000 + (Math.random() - 0.5) * 5000;
        const dailyChange = (Math.random() - 0.5) * 1000;
        const dailyChangePercent = (dailyChange / totalValue) * 100;
        
        await dbConnection.execute(`
          INSERT IGNORE INTO portfolio_performance (portfolio_id, date, total_value, daily_change, daily_change_percent) 
          VALUES (?, ?, ?, ?, ?)
        `, [portfolioId, dateStr, totalValue, dailyChange, dailyChangePercent]);
      }
    }

    console.log('Database migration completed successfully!');
    await dbConnection.end();
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  createDatabase().catch(console.error);
}

module.exports = { createDatabase };
