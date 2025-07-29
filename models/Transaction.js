const { pool } = require('../config/database');

class Transaction {
  // Get all transactions with optional filtering
  static async findAll(filters = {}) {
    let query = `
      SELECT t.*, 
             p.name as portfolio_name,
             COALESCE(t.asset_name, pi.name, t.symbol) as asset_name
      FROM transactions t
      LEFT JOIN portfolios p ON t.portfolio_id = p.id
      LEFT JOIN portfolio_items pi ON t.portfolio_item_id = pi.id
    `;
    
    const conditions = [];
    const values = [];
    
    if (filters.portfolio_id) {
      conditions.push('t.portfolio_id = ?');
      values.push(filters.portfolio_id);
    }
    
    if (filters.transaction_type) {
      conditions.push('t.transaction_type = ?');
      values.push(filters.transaction_type);
    }
    
    if (filters.symbol) {
      conditions.push('t.symbol = ?');
      values.push(filters.symbol);
    }
    
    if (filters.status) {
      conditions.push('t.status = ?');
      values.push(filters.status);
    }
    
    if (filters.date_from) {
      conditions.push('t.transaction_date >= ?');
      values.push(filters.date_from);
    }
    
    if (filters.date_to) {
      conditions.push('t.transaction_date <= ?');
      values.push(filters.date_to);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';
    
    if (filters.limit) {
      query += ` LIMIT ${parseInt(filters.limit)}`;
      if (filters.offset) {
        query += ` OFFSET ${parseInt(filters.offset)}`;
      }
    }
    
    const [rows] = await pool.execute(query, values);
    return rows;
  }

  // Get transaction by ID
  static async findById(id) {
    const [rows] = await pool.execute(`
      SELECT t.*, 
             p.name as portfolio_name,
             COALESCE(t.asset_name, pi.name, t.symbol) as asset_name
      FROM transactions t
      LEFT JOIN portfolios p ON t.portfolio_id = p.id
      LEFT JOIN portfolio_items pi ON t.portfolio_item_id = pi.id
      WHERE t.id = ?
    `, [id]);
    return rows[0];
  }

  // Get transactions by portfolio ID
  static async findByPortfolioId(portfolioId, limit = null, offset = null) {
    let query = `
      SELECT t.*, 
             p.name as portfolio_name,
             COALESCE(t.asset_name, pi.name, t.symbol) as asset_name
      FROM transactions t
      LEFT JOIN portfolios p ON t.portfolio_id = p.id
      LEFT JOIN portfolio_items pi ON t.portfolio_item_id = pi.id
      WHERE t.portfolio_id = ?
      ORDER BY t.transaction_date DESC, t.created_at DESC
    `;
    
    const values = [portfolioId];
    
    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
      if (offset) {
        query += ` OFFSET ${parseInt(offset)}`;
      }
    }
    
    const [rows] = await pool.execute(query, values);
    return rows;
  }

  // Create new transaction
  static async create(transactionData) {
    const {
      portfolio_id,
      portfolio_item_id,
      transaction_type,
      symbol,
      asset_name,
      quantity,
      price_per_unit,
      total_amount,
      fees,
      transaction_date,
      description,
      reference_number,
      status
    } = transactionData;

    const [result] = await pool.execute(`
      INSERT INTO transactions (
        portfolio_id, portfolio_item_id, transaction_type, symbol, asset_name, 
        quantity, price_per_unit, total_amount, fees, transaction_date, 
        description, reference_number, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      portfolio_id,
      portfolio_item_id || null,
      transaction_type,
      symbol,
      asset_name,
      quantity,
      price_per_unit,
      total_amount,
      fees || 0.00,
      transaction_date,
      description || null,
      reference_number || null,
      status || 'completed'
    ]);

    return this.findById(result.insertId);
  }

  // Update transaction
  static async update(id, transactionData) {
    const {
      transaction_type,
      symbol,
      asset_name,
      quantity,
      price_per_unit,
      total_amount,
      fees,
      transaction_date,
      description,
      reference_number,
      status
    } = transactionData;

    await pool.execute(`
      UPDATE transactions SET 
        transaction_type = ?, symbol = ?, asset_name = ?, quantity = ?, 
        price_per_unit = ?, total_amount = ?, fees = ?, transaction_date = ?, 
        description = ?, reference_number = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      transaction_type,
      symbol,
      asset_name,
      quantity,
      price_per_unit,
      total_amount,
      fees || 0.00,
      transaction_date,
      description || null,
      reference_number || null,
      status || 'completed',
      id
    ]);

    return this.findById(id);
  }

  // Delete transaction
  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM transactions WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Get transaction statistics for a portfolio
  static async getPortfolioStats(portfolioId, dateFrom = null, dateTo = null) {
    let whereClause = 'WHERE portfolio_id = ?';
    const values = [portfolioId];
    
    if (dateFrom) {
      whereClause += ' AND transaction_date >= ?';
      values.push(dateFrom);
    }
    
    if (dateTo) {
      whereClause += ' AND transaction_date <= ?';
      values.push(dateTo);
    }

    const [rows] = await pool.execute(`
      SELECT 
        transaction_type,
        COUNT(*) as count,
        SUM(total_amount) as total_amount,
        SUM(fees) as total_fees,
        AVG(total_amount) as avg_amount
      FROM transactions 
      ${whereClause}
      GROUP BY transaction_type
      ORDER BY transaction_type
    `, values);

    return rows;
  }

  // Get recent transactions
  static async getRecent(limit = 10, portfolioId = null) {
    let query = `
      SELECT t.*, 
             p.name as portfolio_name,
             COALESCE(t.asset_name, pi.name, t.symbol) as asset_name
      FROM transactions t
      LEFT JOIN portfolios p ON t.portfolio_id = p.id
      LEFT JOIN portfolio_items pi ON t.portfolio_item_id = pi.id
    `;
    
    const values = [];
    
    if (portfolioId) {
      query += ' WHERE t.portfolio_id = ?';
      values.push(portfolioId);
    }
    
    query += ` ORDER BY t.created_at DESC LIMIT ${parseInt(limit)}`;
    
    const [rows] = await pool.execute(query, values);
    return rows;
  }

  // Get transactions summary by symbol
  static async getSymbolSummary(portfolioId, symbol = null) {
    let whereClause = 'WHERE portfolio_id = ?';
    const values = [portfolioId];
    
    if (symbol) {
      whereClause += ' AND symbol = ?';
      values.push(symbol);
    }

    const [rows] = await pool.execute(`
      SELECT 
        symbol,
        asset_name,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN transaction_type = 'buy' THEN quantity ELSE 0 END) as total_bought,
        SUM(CASE WHEN transaction_type = 'sell' THEN quantity ELSE 0 END) as total_sold,
        SUM(CASE WHEN transaction_type = 'buy' THEN total_amount ELSE 0 END) as total_invested,
        SUM(CASE WHEN transaction_type = 'sell' THEN total_amount ELSE 0 END) as total_received,
        SUM(fees) as total_fees
      FROM transactions 
      ${whereClause}
      GROUP BY symbol, asset_name
      ORDER BY total_invested DESC
    `, values);

    return rows;
  }

  // Count total transactions with filters
  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM transactions';
    const conditions = [];
    const values = [];
    
    if (filters.portfolio_id) {
      conditions.push('portfolio_id = ?');
      values.push(filters.portfolio_id);
    }
    
    if (filters.transaction_type) {
      conditions.push('transaction_type = ?');
      values.push(filters.transaction_type);
    }
    
    if (filters.symbol) {
      conditions.push('symbol = ?');
      values.push(filters.symbol);
    }
    
    if (filters.status) {
      conditions.push('status = ?');
      values.push(filters.status);
    }
    
    if (filters.date_from) {
      conditions.push('transaction_date >= ?');
      values.push(filters.date_from);
    }
    
    if (filters.date_to) {
      conditions.push('transaction_date <= ?');
      values.push(filters.date_to);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    const [rows] = await pool.execute(query, values);
    return rows[0].total;
  }
}

module.exports = Transaction;
