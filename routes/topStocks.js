const express = require('express');
const router = express.Router();
const TopStockController = require('../controllers/topStockController');
const { validateDateQuery } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     TopStock:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier
 *         symbol:
 *           type: string
 *           description: Stock symbol
 *         name:
 *           type: string
 *           description: Company name
 *         date:
 *           type: string
 *           format: date
 *           description: Date of the stock data
 *         open_price:
 *           type: number
 *           format: decimal
 *           description: Opening price
 *         close_price:
 *           type: number
 *           format: decimal
 *           description: Closing price
 *         high_price:
 *           type: number
 *           format: decimal
 *           description: Highest price of the day
 *         low_price:
 *           type: number
 *           format: decimal
 *           description: Lowest price of the day
 *         volume:
 *           type: integer
 *           description: Trading volume
 *         market_cap:
 *           type: number
 *           format: decimal
 *           description: Market capitalization
 *         pe_ratio:
 *           type: number
 *           format: decimal
 *           description: Price-to-earnings ratio
 *         dividend_yield:
 *           type: number
 *           format: decimal
 *           description: Dividend yield percentage
 *         fifty_two_week_high:
 *           type: number
 *           format: decimal
 *           description: 52-week high price
 *         fifty_two_week_low:
 *           type: number
 *           format: decimal
 *           description: 52-week low price
 *         avg_volume:
 *           type: integer
 *           description: Average trading volume
 *         beta:
 *           type: number
 *           format: decimal
 *           description: Beta coefficient
 *         eps:
 *           type: number
 *           format: decimal
 *           description: Earnings per share
 *         sector:
 *           type: string
 *           description: Industry sector
 *         industry:
 *           type: string
 *           description: Specific industry
 *         currency:
 *           type: string
 *           description: Currency code
 *         exchange:
 *           type: string
 *           description: Stock exchange
 *         rank_position:
 *           type: integer
 *           description: Ranking position (1-10)
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Record creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Record last update timestamp
 */

/**
 * @swagger
 * /api/top-stocks:
 *   get:
 *     summary: Get top stocks data
 *     tags: [TopStocks]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for which to retrieve data (YYYY-MM-DD). Defaults to today.
 *     responses:
 *       200:
 *         description: Top stocks data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 date:
 *                   type: string
 *                   format: date
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TopStock'
 *       500:
 *         description: Server error
 */
router.get('/', TopStockController.getTopStocks);

/**
 * @swagger
 * /api/top-stocks/latest:
 *   get:
 *     summary: Get latest top stocks data
 *     tags: [TopStocks]
 *     responses:
 *       200:
 *         description: Latest top stocks data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TopStock'
 */
router.get('/latest', TopStockController.getLatestTopStocks);

/**
 * @swagger
 * /api/top-stocks/symbols:
 *   get:
 *     summary: Get all available stock symbols
 *     tags: [TopStocks]
 *     responses:
 *       200:
 *         description: Available symbols retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       symbol:
 *                         type: string
 *                       name:
 *                         type: string
 *                       rank_position:
 *                         type: integer
 */
router.get('/symbols', TopStockController.getAvailableSymbols);

/**
 * @swagger
 * /api/top-stocks/chart/{symbol}:
 *   get:
 *     summary: Get chart data for a specific stock
 *     tags: [TopStocks]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol
 *       - in: query
 *         name: attribute
 *         schema:
 *           type: string
 *           enum: [close_price, open_price, high_price, low_price, volume]
 *           default: close_price
 *         description: Attribute to chart
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to include
 *     responses:
 *       200:
 *         description: Chart data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 symbol:
 *                   type: string
 *                 attribute:
 *                   type: string
 *                 period:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       value:
 *                         type: number
 *                       volume:
 *                         type: integer
 */
router.get('/chart/:symbol', TopStockController.getChartData);

/**
 * @swagger
 * /api/top-stocks/fetch:
 *   post:
 *     summary: Fetch and update top stocks data from Yahoo Finance
 *     tags: [TopStocks]
 *     responses:
 *       200:
 *         description: Top stocks data updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 date:
 *                   type: string
 *                   format: date
 *                 count:
 *                   type: integer
 *                 jsonFile:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TopStock'
 *       500:
 *         description: Server error
 */
router.post('/fetch', TopStockController.fetchAndUpdateTopStocks);

/**
 * @swagger
 * /api/top-stocks/fetch-historical:
 *   post:
 *     summary: Fetch historical top stocks data for the past 30 days
 *     tags: [TopStocks]
 *     responses:
 *       200:
 *         description: Historical top stocks data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 period:
 *                   type: string
 *                 totalRecords:
 *                   type: integer
 *                 successfulSymbols:
 *                   type: integer
 *                 failedSymbols:
 *                   type: integer
 *                 jsonFile:
 *                   type: string
 *                 symbols:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.post('/fetch-historical', TopStockController.fetchHistoricalTopStocks);

/**
 * @swagger
 * /api/top-stocks/sectors:
 *   get:
 *     summary: Get all available sectors
 *     tags: [TopStocks]
 *     responses:
 *       200:
 *         description: Sectors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/sectors', TopStockController.getSectors);

/**
 * @swagger
 * /api/top-stocks/sector/{sector}:
 *   get:
 *     summary: Get top stocks by sector
 *     tags: [TopStocks]
 *     parameters:
 *       - in: path
 *         name: sector
 *         required: true
 *         schema:
 *           type: string
 *         description: Sector name
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for which to retrieve data (YYYY-MM-DD). Defaults to latest.
 *     responses:
 *       200:
 *         description: Sector stocks data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sector:
 *                   type: string
 *                 date:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TopStock'
 */
router.get('/sector/:sector', TopStockController.getTopStocksBySector);

/**
 * @swagger
 * /api/top-stocks/symbol/{symbol}:
 *   get:
 *     summary: Get stock data by symbol
 *     tags: [TopStocks]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Stock data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 symbol:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TopStock'
 */
router.get('/symbol/:symbol', TopStockController.getStockBySymbol);

/**
 * @swagger
 * /api/top-stocks/statistics:
 *   get:
 *     summary: Get statistics for top stocks
 *     tags: [TopStocks]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for which to retrieve statistics (YYYY-MM-DD). Defaults to latest.
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 date:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_stocks:
 *                       type: integer
 *                     avg_price:
 *                       type: number
 *                     max_price:
 *                       type: number
 *                     min_price:
 *                       type: number
 *                     avg_volume:
 *                       type: number
 *                     total_volume:
 *                       type: number
 *                     avg_market_cap:
 *                       type: number
 *                     sectors_count:
 *                       type: integer
 */
router.get('/statistics', TopStockController.getStatistics);

/**
 * @swagger
 * /api/top-stocks/export:
 *   get:
 *     summary: Export top stocks data to JSON file
 *     tags: [TopStocks]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for which to export data (YYYY-MM-DD). Defaults to today.
 *     responses:
 *       200:
 *         description: Data exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 date:
 *                   type: string
 *                   format: date
 *                 count:
 *                   type: integer
 *                 filePath:
 *                   type: string
 */
router.get('/export', TopStockController.exportToJson);

/**
 * @swagger
 * /api/top-stocks/cleanup:
 *   delete:
 *     summary: Cleanup old records
 *     tags: [TopStocks]
 *     parameters:
 *       - in: query
 *         name: daysToKeep
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to keep records for
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedRecords:
 *                   type: integer
 */
router.delete('/cleanup', TopStockController.cleanupOldRecords);

module.exports = router;
