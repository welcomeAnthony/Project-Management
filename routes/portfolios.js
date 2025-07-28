const express = require('express');
const router = express.Router();
const PortfolioController = require('../controllers/portfolioController');
const { 
  validateRequest, 
  validateParams,
  portfolioSchema,
  portfolioUpdateSchema,
  idParamSchema 
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/security');

/**
 * @swagger
 * components:
 *   schemas:
 *     Portfolio:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the portfolio
 *         name:
 *           type: string
 *           description: The portfolio name
 *         description:
 *           type: string
 *           description: The portfolio description
 *         total_value:
 *           type: number
 *           format: float
 *           description: The total value of the portfolio
 *         item_count:
 *           type: integer
 *           description: Number of items in the portfolio
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 1
 *         name: "My Investment Portfolio"
 *         description: "Diversified investment portfolio"
 *         total_value: 50000.00
 *         item_count: 5
 *     PortfolioInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: The portfolio name
 *         description:
 *           type: string
 *           description: The portfolio description
 *       example:
 *         name: "My Investment Portfolio"
 *         description: "Diversified investment portfolio"
 */

/**
 * @swagger
 * tags:
 *   name: Portfolios
 *   description: Portfolio management API
 */

/**
 * @swagger
 * /api/portfolios:
 *   get:
 *     summary: Get all portfolios
 *     tags: [Portfolios]
 *     responses:
 *       200:
 *         description: List of all portfolios
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
 *                     $ref: '#/components/schemas/Portfolio'
 *                 count:
 *                   type: integer
 */
router.get('/', asyncHandler(PortfolioController.getAllPortfolios));

/**
 * @swagger
 * /api/portfolios/{id}:
 *   get:
 *     summary: Get portfolio by ID
 *     tags: [Portfolios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Portfolio ID
 *     responses:
 *       200:
 *         description: Portfolio details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Portfolio'
 *       404:
 *         description: Portfolio not found
 */
router.get(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(PortfolioController.getPortfolioById)
);

/**
 * @swagger
 * /api/portfolios:
 *   post:
 *     summary: Create a new portfolio
 *     tags: [Portfolios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PortfolioInput'
 *     responses:
 *       201:
 *         description: Portfolio created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Portfolio'
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  validateRequest(portfolioSchema),
  asyncHandler(PortfolioController.createPortfolio)
);

/**
 * @swagger
 * /api/portfolios/{id}:
 *   put:
 *     summary: Update portfolio
 *     tags: [Portfolios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Portfolio ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PortfolioInput'
 *     responses:
 *       200:
 *         description: Portfolio updated successfully
 *       404:
 *         description: Portfolio not found
 */
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateRequest(portfolioUpdateSchema),
  asyncHandler(PortfolioController.updatePortfolio)
);

/**
 * @swagger
 * /api/portfolios/{id}:
 *   delete:
 *     summary: Delete portfolio
 *     tags: [Portfolios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Portfolio ID
 *     responses:
 *       200:
 *         description: Portfolio deleted successfully
 *       404:
 *         description: Portfolio not found
 */
router.delete(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(PortfolioController.deletePortfolio)
);

/**
 * @swagger
 * /api/portfolios/{id}/performance:
 *   get:
 *     summary: Get portfolio performance data
 *     tags: [Portfolios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Portfolio ID
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days of performance data
 *     responses:
 *       200:
 *         description: Portfolio performance data
 *       404:
 *         description: Portfolio not found
 */
router.get(
  '/:id/performance',
  validateParams(idParamSchema),
  asyncHandler(PortfolioController.getPortfolioPerformance)
);

/**
 * @swagger
 * /api/portfolios/{id}/summary:
 *   get:
 *     summary: Get comprehensive portfolio summary
 *     tags: [Portfolios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Portfolio ID
 *     responses:
 *       200:
 *         description: Comprehensive portfolio summary with items and allocations
 *       404:
 *         description: Portfolio not found
 */
router.get(
  '/:id/summary',
  validateParams(idParamSchema),
  asyncHandler(PortfolioController.getPortfolioSummary)
);

module.exports = router;
