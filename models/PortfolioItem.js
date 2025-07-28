const { pool } = require('../config/database');

class PortfolioItem {
  // Get all items for a portfolio
  static async findByPortfolioId(portfolioId) {
    const [rows] = await pool.execute(`
      SELECT pi.*,
             (pi.quantity * COALESCE(pi.current_price, pi.purchase_price)) as current_value,
             (pi.quantity * pi.purchase_price) as purchase_value,
             ((COALESCE(pi.current_price, pi.purchase_price) - pi.purchase_price) / pi.purchase_price * 100) as gain_loss_percent,
             (pi.quantity * (COALESCE(pi.current_price, pi.purchase_price) - pi.purchase_price)) as gain_loss_amount
      FROM portfolio_items pi
      WHERE pi.portfolio_id = ?
      ORDER BY (pi.quantity * COALESCE(pi.current_price, pi.purchase_price)) DESC
    `, [portfolioId]);
    return rows;
  }

  // Get item by ID
  static async findById(id) {
    const [rows] = await pool.execute(`
      SELECT pi.*,
             (pi.quantity * COALESCE(pi.current_price, pi.purchase_price)) as current_value,
             (pi.quantity * pi.purchase_price) as purchase_value,
             ((COALESCE(pi.current_price, pi.purchase_price) - pi.purchase_price) / pi.purchase_price * 100) as gain_loss_percent,
             (pi.quantity * (COALESCE(pi.current_price, pi.purchase_price) - pi.purchase_price)) as gain_loss_amount
      FROM portfolio_items pi
      WHERE pi.id = ?
    `, [id]);
    return rows[0];
  }

  // Create new portfolio item
  static async create(itemData) {
    const {
      portfolio_id,
      symbol,
      name,
      type,
      quantity,
      purchase_price,
      current_price,
      purchase_date,
      sector,
      currency
    } = itemData;

    const [result] = await pool.execute(`
      INSERT INTO portfolio_items 
      (portfolio_id, symbol, name, type, quantity, purchase_price, current_price, purchase_date, sector, currency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      portfolio_id,
      symbol.toUpperCase(),
      name,
      type,
      quantity,
      purchase_price,
      current_price || purchase_price,
      purchase_date,
      sector || null,
      currency || 'USD'
    ]);

    // Update portfolio total value
    const Portfolio = require('./Portfolio');
    await Portfolio.updateTotalValue(portfolio_id);

    return this.findById(result.insertId);
  }

  // Update portfolio item
  static async update(id, itemData) {
    // First get the existing item to fill in missing fields
    const existingItem = await this.findById(id);
    if (!existingItem) return null;

    const {
      symbol = existingItem.symbol,
      name = existingItem.name,
      type = existingItem.type,
      quantity = existingItem.quantity,
      purchase_price = existingItem.purchase_price,
      current_price = itemData.current_price !== undefined ? itemData.current_price : existingItem.current_price,
      purchase_date = existingItem.purchase_date,
      sector = itemData.sector !== undefined ? itemData.sector : existingItem.sector,
      currency = existingItem.currency
    } = itemData;

    const [result] = await pool.execute(`
      UPDATE portfolio_items 
      SET symbol = ?, name = ?, type = ?, quantity = ?, purchase_price = ?, 
          current_price = ?, purchase_date = ?, sector = ?, currency = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      symbol.toUpperCase(),
      name,
      type,
      quantity,
      purchase_price,
      current_price || purchase_price,
      purchase_date,
      sector || null,
      currency || 'USD',
      id
    ]);

    if (result.affectedRows > 0) {
      const item = await this.findById(id);
      // Update portfolio total value
      const Portfolio = require('./Portfolio');
      await Portfolio.updateTotalValue(item.portfolio_id);
      return item;
    }
    return null;
  }

  // Delete portfolio item
  static async delete(id) {
    // Get portfolio_id before deletion for updating total value
    const item = await this.findById(id);
    if (!item) return false;

    const [result] = await pool.execute('DELETE FROM portfolio_items WHERE id = ?', [id]);
    
    if (result.affectedRows > 0) {
      // Update portfolio total value
      const Portfolio = require('./Portfolio');
      await Portfolio.updateTotalValue(item.portfolio_id);
      return true;
    }
    return false;
  }

  // Update current prices for all items with a specific symbol
  static async updatePrice(symbol, newPrice) {
    const [result] = await pool.execute(`
      UPDATE portfolio_items 
      SET current_price = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE symbol = ?
    `, [newPrice, symbol.toUpperCase()]);

    // Update all affected portfolios' total values
    if (result.affectedRows > 0) {
      const [portfolios] = await pool.execute(`
        SELECT DISTINCT portfolio_id FROM portfolio_items WHERE symbol = ?
      `, [symbol.toUpperCase()]);

      const Portfolio = require('./Portfolio');
      for (const portfolio of portfolios) {
        await Portfolio.updateTotalValue(portfolio.portfolio_id);
      }
    }

    return result.affectedRows;
  }

  // Get portfolio allocation by type
  static async getAllocationByType(portfolioId) {
    const [rows] = await pool.execute(`
      SELECT type,
             COUNT(*) as count,
             SUM(quantity * COALESCE(current_price, purchase_price)) as total_value,
             (SUM(quantity * COALESCE(current_price, purchase_price)) / 
              (SELECT SUM(quantity * COALESCE(current_price, purchase_price)) 
               FROM portfolio_items WHERE portfolio_id = ?) * 100) as percentage
      FROM portfolio_items
      WHERE portfolio_id = ?
      GROUP BY type
      ORDER BY total_value DESC
    `, [portfolioId, portfolioId]);
    return rows;
  }

  // Get portfolio allocation by sector
  static async getAllocationBySector(portfolioId) {
    const [rows] = await pool.execute(`
      SELECT COALESCE(sector, 'Unknown') as sector,
             COUNT(*) as count,
             SUM(quantity * COALESCE(current_price, purchase_price)) as total_value,
             (SUM(quantity * COALESCE(current_price, purchase_price)) / 
              (SELECT SUM(quantity * COALESCE(current_price, purchase_price)) 
               FROM portfolio_items WHERE portfolio_id = ?) * 100) as percentage
      FROM portfolio_items
      WHERE portfolio_id = ?
      GROUP BY sector
      ORDER BY total_value DESC
    `, [portfolioId, portfolioId]);
    return rows;
  }
}

module.exports = PortfolioItem;
