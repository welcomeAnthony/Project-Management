const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Stock:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Stock ID
 *         symbol:
 *           type: string
 *           description: Stock symbol
 *         name:
 *           type: string
 *           description: Stock name
 *         date:
 *           type: string
 *           format: date
 *           description: Date
 *         open_price:
 *           type: number
 *           description: Opening price
 *         close_price:
 *           type: number
 *           description: Closing price
 *         high_price:
 *           type: number
 *           description: High price
 *         low_price:
 *           type: number
 *           description: Low price
 *         volume:
 *           type: integer
 *           description: Trading volume
 *         market_cap:
 *           type: number
 *           description: Market capitalization
 *         pe_ratio:
 *           type: number
 *           description: Price-to-earnings ratio
 *         dividend_yield:
 *           type: number
 *           description: Dividend yield
 *         fifty_two_week_high:
 *           type: number
 *           description: 52-week high price
 *         fifty_two_week_low:
 *           type: number
 *           description: 52-week low price
 *         avg_volume:
 *           type: integer
 *           description: Average volume
 *         beta:
 *           type: number
 *           description: Beta coefficient
 *         eps:
 *           type: number
 *           description: Earnings per share
 *         sector:
 *           type: string
 *           description: Sector
 *         industry:
 *           type: string
 *           description: Industry
 *         currency:
 *           type: string
 *           description: Currency
 *         exchange:
 *           type: string
 *           description: Exchange
 *         rank_position:
 *           type: integer
 *           description: Rank position
 */

/**
 * @swagger
 * /api/stocks:
 *   get:
 *     summary: Get all stocks
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of stocks to return
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for symbol or name
 *     responses:
 *       200:
 *         description: List of stocks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Stock'
 *                 total:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {


  const limit = req.query.limit || 10;
  const search = req.query.search || '';
  
  try {
    // Use regular query instead of prepared statements to avoid MySQL2 issues
    let query = `
      SELECT symbol, name, sector, close_price, currency, updated_at
      FROM top_stocks
    `;
    
    if (search) {
      const escapedSearch = pool.escape(`%${search}%`);
      query += ` WHERE (symbol LIKE ${escapedSearch} OR name LIKE ${escapedSearch})`;
    }
    
    const limitValue = parseInt(limit) || 10;
    query += `
      ORDER BY updated_at DESC
      LIMIT ${limitValue}
    `;
    
    console.log('Executing query:', query);
    
    const [rows] = await pool.query(query);
    
    // Remove duplicates manually in JavaScript to get latest for each symbol
    const uniqueStocks = [];
    const seenSymbols = new Set();
    
    for (const row of rows) {
      if (!seenSymbols.has(row.symbol)) {
        uniqueStocks.push(row);
        seenSymbols.add(row.symbol);
      }
    }
    
    res.json({
      success: true,
      data: uniqueStocks.slice(0, limitValue),
      total: uniqueStocks.length
    });
  } catch (error) {
    console.error('Query failed:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch stocks',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/stocks/{symbol}:
 *   get:
 *     summary: Get stock by symbol
 *     tags: [Stocks]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol
 *     responses:
 *       200:
 *         description: Stock details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Stock'
 *       404:
 *         description: Stock not found
 *       500:
 *         description: Server error
 */
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const query = `
      SELECT * FROM top_stocks 
      WHERE symbol = ? 
      ORDER BY date DESC 
      LIMIT 1
    `;
    
    const [rows] = await pool.execute(query, [symbol]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock',
      error: error.message
    });
  }
});

module.exports = router;
