const express = require('express');
const router = express.Router();
const PortfolioItemController = require('../controllers/portfolioItemController');
const { 
  validateRequest, 
  validateParams,
  portfolioItemSchema,
  portfolioItemUpdateSchema,
  priceUpdateSchema,
  idParamSchema 
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/security');
const Joi = require('joi');

// Portfolio ID parameter schema
const portfolioIdParamSchema = Joi.object({
  portfolio_id: Joi.number().integer().positive().required()
});

/**
 * @swagger
 * components:
 *   schemas:
 *     PortfolioItem:
 *       type: object
 *       required:
 *         - portfolio_id
 *         - symbol
 *         - name
 *         - type
 *         - quantity
 *         - purchase_price
 *         - purchase_date
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the portfolio item
 *         portfolio_id:
 *           type: integer
 *           description: The portfolio this item belongs to
 *         symbol:
 *           type: string
 *           description: The trading symbol
 *         name:
 *           type: string
 *           description: The full name of the asset
 *         type:
 *           type: string
 *           enum: [stock, bond, cash, crypto, etf, mutual_fund, other]
 *           description: The type of asset
 *         quantity:
 *           type: number
 *           description: Number of shares/units
 *         purchase_price:
 *           type: number
 *           format: float
 *           description: Price per unit when purchased
 *         current_price:
 *           type: number
 *           format: float
 *           description: Current price per unit
 *         purchase_date:
 *           type: string
 *           format: date
 *           description: Date when the asset was purchased
 *         sector:
 *           type: string
 *           description: The sector of the asset
 *         currency:
 *           type: string
 *           description: Currency code (e.g., USD)
 *         current_value:
 *           type: number
 *           format: float
 *           description: Current total value (quantity * current_price)
 *         purchase_value:
 *           type: number
 *           format: float
 *           description: Original purchase value (quantity * purchase_price)
 *         gain_loss_amount:
 *           type: number
 *           format: float
 *           description: Total gain/loss amount
 *         gain_loss_percent:
 *           type: number
 *           format: float
 *           description: Gain/loss percentage
 *       example:
 *         id: 1
 *         portfolio_id: 1
 *         symbol: "AAPL"
 *         name: "Apple Inc."
 *         type: "stock"
 *         quantity: 50
 *         purchase_price: 150.00
 *         current_price: 175.50
 *         purchase_date: "2024-01-15"
 *         sector: "Technology"
 *         currency: "USD"
 *     PortfolioItemInput:
 *       type: object
 *       required:
 *         - portfolio_id
 *         - symbol
 *         - name
 *         - type
 *         - quantity
 *         - purchase_price
 *         - purchase_date
 *       properties:
 *         portfolio_id:
 *           type: integer
 *         symbol:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [stock, bond, cash, crypto, etf, mutual_fund, other]
 *         quantity:
 *           type: number
 *         purchase_price:
 *           type: number
 *         current_price:
 *           type: number
 *         purchase_date:
 *           type: string
 *           format: date
 *         sector:
 *           type: string
 *         currency:
 *           type: string
 *       example:
 *         portfolio_id: 1
 *         symbol: "AAPL"
 *         name: "Apple Inc."
 *         type: "stock"
 *         quantity: 50
 *         purchase_price: 150.00
 *         current_price: 175.50
 *         purchase_date: "2024-01-15"
 *         sector: "Technology"
 *         currency: "USD"
 */

/**
 * @swagger
 * tags:
 *   name: Portfolio Items
 *   description: Portfolio items management API
 */

/**
 * @swagger
 * /api/portfolios/{portfolio_id}/items:
 *   get:
 *     summary: Get all items in a portfolio
 *     tags: [Portfolio Items]
 *     parameters:
 *       - in: path
 *         name: portfolio_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Portfolio ID
 *     responses:
 *       200:
 *         description: List of portfolio items
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
 *                     portfolio_id:
 *                       type: integer
 *                     portfolio_name:
 *                       type: string
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PortfolioItem'
 *                     count:
 *                       type: integer
 *       404:
 *         description: Portfolio not found
 */
router.get(
  '/portfolios/:portfolio_id/items',
  validateParams(portfolioIdParamSchema),
  asyncHandler(PortfolioItemController.getPortfolioItems)
);

/**
 * @swagger
 * /api/portfolios/{portfolio_id}/items/{id}:
 *   get:
 *     summary: Get portfolio item by ID
 *     tags: [Portfolio Items]
 *     parameters:
 *       - in: path
 *         name: portfolio_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Portfolio ID
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Portfolio item ID
 *     responses:
 *       200:
 *         description: Portfolio item details
 *       404:
 *         description: Portfolio item not found
 */
router.get(
  '/items/:id',
  validateParams(idParamSchema),
  asyncHandler(PortfolioItemController.getPortfolioItemById)
);

/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Create a new portfolio item
 *     tags: [Portfolio Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PortfolioItemInput'
 *     responses:
 *       201:
 *         description: Portfolio item created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Portfolio not found
 */
router.post(
  '/items',
  validateRequest(portfolioItemSchema),
  asyncHandler(PortfolioItemController.createPortfolioItem)
);

/**
 * @swagger
 * /api/items/{id}:
 *   put:
 *     summary: Update portfolio item
 *     tags: [Portfolio Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Portfolio item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PortfolioItemInput'
 *     responses:
 *       200:
 *         description: Portfolio item updated successfully
 *       404:
 *         description: Portfolio item not found
 */
router.put(
  '/items/:id',
  validateParams(idParamSchema),
  validateRequest(portfolioItemUpdateSchema),
  asyncHandler(PortfolioItemController.updatePortfolioItem)
);

/**
 * @swagger
 * /api/items/{id}:
 *   delete:
 *     summary: Delete portfolio item
 *     tags: [Portfolio Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Portfolio item ID
 *     responses:
 *       200:
 *         description: Portfolio item deleted successfully
 *       404:
 *         description: Portfolio item not found
 */
router.delete(
  '/items/:id',
  validateParams(idParamSchema),
  asyncHandler(PortfolioItemController.deletePortfolioItem)
);

/**
 * @swagger
 * /api/items/price:
 *   put:
 *     summary: Update price for all items with a specific symbol
 *     tags: [Portfolio Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symbol
 *               - price
 *             properties:
 *               symbol:
 *                 type: string
 *                 description: The trading symbol
 *               price:
 *                 type: number
 *                 format: float
 *                 description: The new price
 *             example:
 *               symbol: "AAPL"
 *               price: 180.50
 *     responses:
 *       200:
 *         description: Price updated successfully
 *       400:
 *         description: Validation error
 */
router.put(
  '/items/price',
  validateRequest(priceUpdateSchema),
  asyncHandler(PortfolioItemController.updatePrice)
);

/**
 * @swagger
 * /api/portfolios/{portfolio_id}/allocation:
 *   get:
 *     summary: Get portfolio allocation data
 *     tags: [Portfolio Items]
 *     parameters:
 *       - in: path
 *         name: portfolio_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Portfolio ID
 *     responses:
 *       200:
 *         description: Portfolio allocation data by type and sector
 *       404:
 *         description: Portfolio not found
 */
router.get(
  '/portfolios/:portfolio_id/allocation',
  validateParams(portfolioIdParamSchema),
  asyncHandler(PortfolioItemController.getPortfolioAllocation)
);

module.exports = router;
