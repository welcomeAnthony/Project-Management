const PortfolioItem = require('../models/PortfolioItem');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');

class PortfolioItemController {
  // Get all items for a portfolio
  static async getPortfolioItems(req, res) {
    try {
      const { portfolio_id } = req.validatedParams;
      
      // Check if portfolio exists
      const portfolio = await Portfolio.findById(portfolio_id);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found',
          error: 'PORTFOLIO_NOT_FOUND'
        });
      }

      const items = await PortfolioItem.findByPortfolioId(portfolio_id);
      
      res.json({
        success: true,
        data: {
          portfolio_id,
          portfolio_name: portfolio.name,
          items,
          count: items.length
        }
      });
    } catch (error) {
      throw error;
    }
  }

  // Get portfolio item by ID
  static async getPortfolioItemById(req, res) {
    try {
      const { id } = req.validatedParams;
      const item = await PortfolioItem.findById(id);
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio item not found',
          error: 'ITEM_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      throw error;
    }
  }

  // Create new portfolio item
  static async createPortfolioItem(req, res) {
    try {
      // Check if portfolio exists
      const portfolio = await Portfolio.findById(req.validatedBody.portfolio_id);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found',
          error: 'PORTFOLIO_NOT_FOUND'
        });
      }

      const item = await PortfolioItem.create(req.validatedBody);
      
      // Create a corresponding transaction record
      const transactionData = {
        portfolio_id: item.portfolio_id,
        portfolio_item_id: item.id,
        transaction_type: 'buy',
        symbol: item.symbol,
        asset_name: item.name || item.symbol, // Add fallback here too
        quantity: item.quantity,
        price_per_unit: item.purchase_price,
        total_amount: item.quantity * item.purchase_price,
        fees: 0,
        transaction_date: item.purchase_date,
        description: `Initial purchase of ${item.name || item.symbol} (${item.symbol})`,
        status: 'completed'
      };
      
      await Transaction.create(transactionData);
      
      res.status(201).json({
        success: true,
        message: 'Portfolio item created successfully',
        data: item
      });
    } catch (error) {
      throw error;
    }
  }

  // Update portfolio item
  static async updatePortfolioItem(req, res) {
    try {
      const { id } = req.validatedParams;
      const item = await PortfolioItem.update(id, req.validatedBody);
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio item not found',
          error: 'ITEM_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Portfolio item updated successfully',
        data: item
      });
    } catch (error) {
      throw error;
    }
  }

  // Delete portfolio item
  static async deletePortfolioItem(req, res) {
    try {
      const { id } = req.validatedParams;
      const deleted = await PortfolioItem.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio item not found',
          error: 'ITEM_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Portfolio item deleted successfully'
      });
    } catch (error) {
      throw error;
    }
  }

  // Update price for specific symbol
  static async updatePrice(req, res) {
    try {
      const { symbol, price } = req.validatedBody;
      const updatedCount = await PortfolioItem.updatePrice(symbol, price);
      
      res.json({
        success: true,
        message: `Price updated for ${updatedCount} items with symbol ${symbol}`,
        data: {
          symbol,
          new_price: price,
          items_updated: updatedCount
        }
      });
    } catch (error) {
      throw error;
    }
  }

  // Get allocation data for a portfolio
  static async getPortfolioAllocation(req, res) {
    try {
      const { portfolio_id } = req.validatedParams;
      
      // Check if portfolio exists
      const portfolio = await Portfolio.findById(portfolio_id);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found',
          error: 'PORTFOLIO_NOT_FOUND'
        });
      }

      const typeAllocation = await PortfolioItem.getAllocationByType(portfolio_id);
      const sectorAllocation = await PortfolioItem.getAllocationBySector(portfolio_id);
      
      res.json({
        success: true,
        data: {
          portfolio_id,
          portfolio_name: portfolio.name,
          allocations: {
            by_type: typeAllocation,
            by_sector: sectorAllocation
          }
        }
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PortfolioItemController;
