const { pool } = require('../config/database');

class Portfolio {
  // Get all portfolios
  static async findAll() {
    const [rows] = await pool.execute(`
      SELECT p.*, 
             COUNT(pi.id) as item_count,
             COALESCE(SUM(pi.quantity * COALESCE(pi.current_price, pi.purchase_price)), 0) as calculated_value
      FROM portfolios p
      LEFT JOIN portfolio_items pi ON p.id = pi.portfolio_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    return rows;
  }

  // Get portfolio by ID
  static async findById(id) {
    const [rows] = await pool.execute(`
      SELECT p.*, 
             COUNT(pi.id) as item_count,
             COALESCE(SUM(pi.quantity * COALESCE(pi.current_price, pi.purchase_price)), 0) as calculated_value
      FROM portfolios p
      LEFT JOIN portfolio_items pi ON p.id = pi.portfolio_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [id]);
    return rows[0];
  }

  // Create new portfolio
  static async create(portfolioData) {
    const { name, description } = portfolioData;
    const [result] = await pool.execute(
      'INSERT INTO portfolios (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    return this.findById(result.insertId);
  }

  // Update portfolio
  static async update(id, portfolioData) {
    const { name, description } = portfolioData;
    await pool.execute(
      'UPDATE portfolios SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description || null, id]
    );
    return this.findById(id);
  }

  // Delete portfolio
  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM portfolios WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Get portfolio performance data
  static async getPerformance(id, days = 30) {
    const [rows] = await pool.execute(`
      SELECT date, total_value, daily_change, daily_change_percent
      FROM portfolio_performance
      WHERE portfolio_id = ? 
      ORDER BY date DESC 
      LIMIT ${parseInt(days)}
    `, [id]);
    return rows;
  }

  // Update portfolio total value
  static async updateTotalValue(id) {
    await pool.execute(`
      UPDATE portfolios p
      SET total_value = (
        SELECT COALESCE(SUM(pi.quantity * COALESCE(pi.current_price, pi.purchase_price)), 0)
        FROM portfolio_items pi
        WHERE pi.portfolio_id = p.id
      )
      WHERE p.id = ?
    `, [id]);
  }
}

module.exports = Portfolio;
