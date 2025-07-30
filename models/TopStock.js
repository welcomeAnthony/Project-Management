const { pool } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class TopStock {
  // Get all top stocks for a specific date
  static async findByDate(date) {
    const [rows] = await pool.execute(`
      SELECT * FROM top_stocks 
      WHERE date = ? 
      ORDER BY rank_position ASC
    `, [date]);
    return rows;
  }

  // Get latest top stocks data
  static async findLatest() {
    const [rows] = await pool.execute(`
      SELECT * FROM top_stocks 
      WHERE date = (SELECT MAX(date) FROM top_stocks)
      ORDER BY rank_position ASC
    `);
    return rows;
  }

  // Get top stocks for a symbol within date range
  static async findBySymbol(symbol, startDate = null, endDate = null) {
    let query = 'SELECT * FROM top_stocks WHERE symbol = ?';
    const params = [symbol];

    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    } else if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY date DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Get top stocks by sector
  static async findBySector(sector, date = null) {
    let query = 'SELECT * FROM top_stocks WHERE sector = ?';
    const params = [sector];

    if (date) {
      query += ' AND date = ?';
      params.push(date);
    } else {
      query += ' AND date = (SELECT MAX(date) FROM top_stocks)';
    }

    query += ' ORDER BY rank_position ASC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Create or update top stock record
  static async createOrUpdate(stockData) {
    const {
      symbol, name, date, open_price, close_price, high_price, low_price,
      volume, market_cap, pe_ratio, dividend_yield, fifty_two_week_high,
      fifty_two_week_low, avg_volume, beta, eps, sector, industry,
      currency, exchange, rank_position
    } = stockData;

    const [result] = await pool.execute(`
      INSERT INTO top_stocks (
        symbol, name, date, open_price, close_price, high_price, low_price,
        volume, market_cap, pe_ratio, dividend_yield, fifty_two_week_high,
        fifty_two_week_low, avg_volume, beta, eps, sector, industry,
        currency, exchange, rank_position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        open_price = VALUES(open_price),
        close_price = VALUES(close_price),
        high_price = VALUES(high_price),
        low_price = VALUES(low_price),
        volume = VALUES(volume),
        market_cap = VALUES(market_cap),
        pe_ratio = VALUES(pe_ratio),
        dividend_yield = VALUES(dividend_yield),
        fifty_two_week_high = VALUES(fifty_two_week_high),
        fifty_two_week_low = VALUES(fifty_two_week_low),
        avg_volume = VALUES(avg_volume),
        beta = VALUES(beta),
        eps = VALUES(eps),
        sector = VALUES(sector),
        industry = VALUES(industry),
        currency = VALUES(currency),
        exchange = VALUES(exchange),
        rank_position = VALUES(rank_position),
        updated_at = CURRENT_TIMESTAMP
    `, [
      symbol, name, date, open_price, close_price, high_price, low_price,
      volume, market_cap, pe_ratio, dividend_yield, fifty_two_week_high,
      fifty_two_week_low, avg_volume, beta, eps, sector, industry,
      currency, exchange, rank_position
    ]);

    return this.findBySymbolAndDate(symbol, date);
  }

  // Find by symbol and date
  static async findBySymbolAndDate(symbol, date) {
    const [rows] = await pool.execute(`
      SELECT * FROM top_stocks 
      WHERE symbol = ? AND date = ?
    `, [symbol, date]);
    return rows[0];
  }

  // Bulk insert top stocks data
  static async bulkInsert(stocksData) {
    if (!stocksData || stocksData.length === 0) {
      return [];
    }

    const values = stocksData.map(stock => [
      stock.symbol, stock.name, stock.date, stock.open_price, stock.close_price,
      stock.high_price, stock.low_price, stock.volume, stock.market_cap,
      stock.pe_ratio, stock.dividend_yield, stock.fifty_two_week_high,
      stock.fifty_two_week_low, stock.avg_volume, stock.beta, stock.eps,
      stock.sector, stock.industry, stock.currency, stock.exchange, stock.rank_position
    ]);

    const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const flatValues = values.flat();

    await pool.execute(`
      INSERT INTO top_stocks (
        symbol, name, date, open_price, close_price, high_price, low_price,
        volume, market_cap, pe_ratio, dividend_yield, fifty_two_week_high,
        fifty_two_week_low, avg_volume, beta, eps, sector, industry,
        currency, exchange, rank_position
      ) VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        open_price = VALUES(open_price),
        close_price = VALUES(close_price),
        high_price = VALUES(high_price),
        low_price = VALUES(low_price),
        volume = VALUES(volume),
        market_cap = VALUES(market_cap),
        pe_ratio = VALUES(pe_ratio),
        dividend_yield = VALUES(dividend_yield),
        fifty_two_week_high = VALUES(fifty_two_week_high),
        fifty_two_week_low = VALUES(fifty_two_week_low),
        avg_volume = VALUES(avg_volume),
        beta = VALUES(beta),
        eps = VALUES(eps),
        sector = VALUES(sector),
        industry = VALUES(industry),
        currency = VALUES(currency),
        exchange = VALUES(exchange),
        rank_position = VALUES(rank_position),
        updated_at = CURRENT_TIMESTAMP
    `, flatValues);

    return stocksData;
  }

  // Save data to JSON file
  static async saveToJsonFile(data, filename = null) {
    const today = new Date().toISOString().split('T')[0];
    const fileName = filename || `top_stocks_${today}.json`;
    const filePath = path.join(__dirname, '..', 'data', fileName);

    // Ensure data directory exists
    const dataDir = path.dirname(filePath);
    try {
      await fs.access(dataDir);
    } catch (error) {
      await fs.mkdir(dataDir, { recursive: true });
    }

    const jsonData = {
      date: today,
      timestamp: new Date().toISOString(),
      count: data.length,
      stocks: data
    };

    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
    return filePath;
  }

  // Load data from JSON file
  static async loadFromJsonFile(filename) {
    const filePath = path.join(__dirname, '..', 'data', filename);
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      throw new Error(`Failed to load JSON file: ${error.message}`);
    }
  }

  // Get all available symbols
  static async getAvailableSymbols() {
    const [rows] = await pool.execute(`
      SELECT DISTINCT symbol, name, rank_position
      FROM top_stocks 
      WHERE date = (SELECT MAX(date) FROM top_stocks)
      ORDER BY rank_position ASC
    `);
    return rows;
  }

  // Get all available sectors
  static async getSectors() {
    const [rows] = await pool.execute(`
      SELECT DISTINCT sector 
      FROM top_stocks 
      WHERE sector IS NOT NULL 
      ORDER BY sector
    `);
    return rows.map(row => row.sector);
  }

  // Get statistics for a date
  static async getStatistics(date = null) {
    const whereClause = date ? 'WHERE date = ?' : 'WHERE date = (SELECT MAX(date) FROM top_stocks)';
    const params = date ? [date] : [];

    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as total_stocks,
        AVG(close_price) as avg_price,
        MAX(close_price) as max_price,
        MIN(close_price) as min_price,
        AVG(volume) as avg_volume,
        SUM(volume) as total_volume,
        AVG(market_cap) as avg_market_cap,
        COUNT(DISTINCT sector) as sectors_count
      FROM top_stocks 
      ${whereClause}
    `, params);

    return rows[0];
  }

  // Delete old records (keep only last 30 days)
  static async cleanupOldRecords(daysToKeep = 30) {
    const [result] = await pool.execute(`
      DELETE FROM top_stocks 
      WHERE date < DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [daysToKeep]);
    
    return result.affectedRows;
  }
}

module.exports = TopStock;
