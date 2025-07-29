const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const { 
  validateRequest, 
  validateParams,
  transactionSchema,
  transactionUpdateSchema,
  idParamSchema,
  portfolioIdParamSchema
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/security');

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - portfolio_id
 *         - transaction_type
 *         - symbol
 *         - asset_name
 *         - quantity
 *         - price_per_unit
 *         - total_amount
 *         - transaction_date
 *       properties:
 *         id:
 *           type: integer
 *           description: Transaction ID
 *         portfolio_id:
 *           type: integer
 *           description: ID of the portfolio
 *         portfolio_item_id:
 *           type: integer
 *           description: ID of the portfolio item (optional)
 *         transaction_type:
 *           type: string
 *           enum: [buy, sell, dividend, split, transfer, fee, deposit, withdrawal]
 *           description: Type of transaction
 *         symbol:
 *           type: string
 *           description: Asset symbol
 *         asset_name:
 *           type: string
 *           description: Full name of the asset
 *         quantity:
 *           type: number
 *           format: float
 *           description: Quantity of assets
 *         price_per_unit:
 *           type: number
 *           format: float
 *           description: Price per unit
 *         total_amount:
 *           type: number
 *           format: float
 *           description: Total transaction amount
 *         fees:
 *           type: number
 *           format: float
 *           description: Transaction fees
 *         transaction_date:
 *           type: string
 *           format: date
 *           description: Date of transaction
 *         description:
 *           type: string
 *           description: Transaction description
 *         reference_number:
 *           type: string
 *           description: Reference number
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *           description: Transaction status
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 1
 *         portfolio_id: 1
 *         portfolio_item_id: 1
 *         transaction_type: "buy"
 *         symbol: "AAPL"
 *         asset_name: "Apple Inc."
 *         quantity: 10
 *         price_per_unit: 150.00
 *         total_amount: 1500.00
 *         fees: 9.99
 *         transaction_date: "2024-01-15"
 *         description: "Initial purchase of Apple shares"
 *         reference_number: "TXN-001"
 *         status: "completed"
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions with optional filtering
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: portfolio_id
 *         schema:
 *           type: integer
 *         description: Filter by portfolio ID
 *       - in: query
 *         name: transaction_type
 *         schema:
 *           type: string
 *           enum: [buy, sell, dividend, split, transfer, fee, deposit, withdrawal]
 *         description: Filter by transaction type
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *         description: Filter by asset symbol
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     pagination:
 *                       type: object
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transaction'
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Portfolio not found
 */
router.get('/', asyncHandler(TransactionController.getAllTransactions));
router.post('/', validateRequest(transactionSchema), asyncHandler(TransactionController.createTransaction));

/**
 * @swagger
 * /api/transactions/recent:
 *   get:
 *     summary: Get recent transactions
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent transactions to return
 *       - in: query
 *         name: portfolio_id
 *         schema:
 *           type: integer
 *         description: Filter by portfolio ID
 *     responses:
 *       200:
 *         description: Recent transactions
 */
router.get('/recent', asyncHandler(TransactionController.getRecentTransactions));

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details
 *       404:
 *         description: Transaction not found
 *   put:
 *     summary: Update transaction
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transaction'
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       404:
 *         description: Transaction not found
 *   delete:
 *     summary: Delete transaction
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *       404:
 *         description: Transaction not found
 */
router.get('/:id', validateParams(idParamSchema), asyncHandler(TransactionController.getTransactionById));
router.put('/:id', validateParams(idParamSchema), validateRequest(transactionUpdateSchema), asyncHandler(TransactionController.updateTransaction));
router.delete('/:id', validateParams(idParamSchema), asyncHandler(TransactionController.deleteTransaction));

/**
 * @swagger
 * /api/portfolios/{portfolio_id}/transactions:
 *   get:
 *     summary: Get transactions for a specific portfolio
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: portfolio_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Portfolio ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Portfolio transactions
 *       404:
 *         description: Portfolio not found
 */
router.get('/portfolios/:portfolio_id', validateParams(portfolioIdParamSchema), asyncHandler(TransactionController.getPortfolioTransactions));

/**
 * @swagger
 * /api/portfolios/{portfolio_id}/transactions/stats:
 *   get:
 *     summary: Get transaction statistics for a portfolio
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: portfolio_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Portfolio ID
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Statistics from date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Statistics to date
 *     responses:
 *       200:
 *         description: Transaction statistics
 *       404:
 *         description: Portfolio not found
 */
router.get('/portfolios/:portfolio_id/stats', validateParams(portfolioIdParamSchema), asyncHandler(TransactionController.getPortfolioStats));

/**
 * @swagger
 * /api/portfolios/{portfolio_id}/transactions/summary:
 *   get:
 *     summary: Get symbol-wise transaction summary for a portfolio
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: portfolio_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Portfolio ID
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *         description: Filter by specific symbol
 *     responses:
 *       200:
 *         description: Symbol-wise transaction summary
 *       404:
 *         description: Portfolio not found
 */
router.get('/portfolios/:portfolio_id/summary', validateParams(portfolioIdParamSchema), asyncHandler(TransactionController.getSymbolSummary));

module.exports = router;
