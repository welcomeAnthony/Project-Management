const Transaction = require('../models/Transaction');
const Portfolio = require('../models/Portfolio');
const PortfolioItem = require('../models/PortfolioItem');

class TransactionController {
  // Get all transactions with filtering and pagination
  static async getAllTransactions(req, res) {
    try {
      const {
        portfolio_id,
        transaction_type,
        symbol,
        status,
        date_from,
        date_to,
        page = 1,
        limit = 20
      } = req.query;

      const filters = {};
      if (portfolio_id) filters.portfolio_id = portfolio_id;
      if (transaction_type) filters.transaction_type = transaction_type;
      if (symbol) filters.symbol = symbol;
      if (status) filters.status = status;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      filters.limit = parseInt(limit);
      filters.offset = offset;

      const [transactions, totalCount] = await Promise.all([
        Transaction.findAll(filters),
        Transaction.count(filters)
      ]);

      const totalPages = Math.ceil(totalCount / parseInt(limit));

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            totalPages,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      throw error;
    }
  }

  // Get transaction by ID
  static async getTransactionById(req, res) {
    try {
      const { id } = req.validatedParams;
      const transaction = await Transaction.findById(id);
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
          error: 'TRANSACTION_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      throw error;
    }
  }

  // Get transactions by portfolio ID
  static async getPortfolioTransactions(req, res) {
    try {
      const { portfolio_id } = req.validatedParams;
      const { page = 1, limit = 20 } = req.query;

      // Check if portfolio exists
      const portfolio = await Portfolio.findById(portfolio_id);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found',
          error: 'PORTFOLIO_NOT_FOUND'
        });
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const transactions = await Transaction.findByPortfolioId(
        portfolio_id,
        parseInt(limit),
        offset
      );

      const totalCount = await Transaction.count({ portfolio_id });
      const totalPages = Math.ceil(totalCount / parseInt(limit));

      res.json({
        success: true,
        data: {
          portfolio_id,
          portfolio_name: portfolio.name,
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            totalPages,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      throw error;
    }
  }

  // Create new transaction
  static async createTransaction(req, res) {
    try {
      const transactionData = req.validatedBody;

      // Ensure asset_name is not null or empty, use symbol as fallback
      if (!transactionData.asset_name || transactionData.asset_name.trim() === '' || transactionData.asset_name === 'null') {
        transactionData.asset_name = transactionData.symbol;
      }

      // Verify portfolio exists
      const portfolio = await Portfolio.findById(transactionData.portfolio_id);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found',
          error: 'PORTFOLIO_NOT_FOUND'
        });
      }

      // If portfolio_item_id is provided, verify it exists and belongs to the portfolio
      if (transactionData.portfolio_item_id) {
        const portfolioItem = await PortfolioItem.findById(transactionData.portfolio_item_id);
        if (!portfolioItem || portfolioItem.portfolio_id !== transactionData.portfolio_id) {
          return res.status(404).json({
            success: false,
            message: 'Portfolio item not found or does not belong to the specified portfolio',
            error: 'PORTFOLIO_ITEM_NOT_FOUND'
          });
        }
      }

      const transaction = await Transaction.create(transactionData);

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction
      });
    } catch (error) {
      throw error;
    }
  }

  // Update transaction
  static async updateTransaction(req, res) {
    try {
      const { id } = req.validatedParams;
      const transactionData = req.validatedBody;

      const existingTransaction = await Transaction.findById(id);
      if (!existingTransaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
          error: 'TRANSACTION_NOT_FOUND'
        });
      }

      const transaction = await Transaction.update(id, transactionData);

      res.json({
        success: true,
        message: 'Transaction updated successfully',
        data: transaction
      });
    } catch (error) {
      throw error;
    }
  }

  // Delete transaction
  static async deleteTransaction(req, res) {
    try {
      const { id } = req.validatedParams;
      
      const transaction = await Transaction.findById(id);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
          error: 'TRANSACTION_NOT_FOUND'
        });
      }

      const deleted = await Transaction.delete(id);
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete transaction',
          error: 'DELETE_FAILED'
        });
      }

      res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      throw error;
    }
  }

  // Get portfolio transaction statistics
  static async getPortfolioStats(req, res) {
    try {
      const { portfolio_id } = req.validatedParams;
      const { date_from, date_to } = req.query;

      // Check if portfolio exists
      const portfolio = await Portfolio.findById(portfolio_id);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found',
          error: 'PORTFOLIO_NOT_FOUND'
        });
      }

      const stats = await Transaction.getPortfolioStats(portfolio_id, date_from, date_to);

      res.json({
        success: true,
        data: {
          portfolio_id,
          portfolio_name: portfolio.name,
          date_from,
          date_to,
          statistics: stats
        }
      });
    } catch (error) {
      throw error;
    }
  }

  // Get recent transactions
  static async getRecentTransactions(req, res) {
    try {
      const { limit = 10, portfolio_id } = req.query;

      const transactions = await Transaction.getRecent(parseInt(limit), portfolio_id);

      res.json({
        success: true,
        data: {
          transactions,
          count: transactions.length
        }
      });
    } catch (error) {
      throw error;
    }
  }

  // Get symbol-wise transaction summary
  static async getSymbolSummary(req, res) {
    try {
      const { portfolio_id } = req.validatedParams;
      const { symbol } = req.query;

      // Check if portfolio exists
      const portfolio = await Portfolio.findById(portfolio_id);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found',
          error: 'PORTFOLIO_NOT_FOUND'
        });
      }

      const summary = await Transaction.getSymbolSummary(portfolio_id, symbol);

      res.json({
        success: true,
        data: {
          portfolio_id,
          portfolio_name: portfolio.name,
          symbol,
          summary
        }
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TransactionController;
