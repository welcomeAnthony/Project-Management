const Portfolio = require('../models/Portfolio');
const PortfolioItem = require('../models/PortfolioItem');

class PortfolioController {
  // Get all portfolios
  static async getAllPortfolios(req, res) {
    try {
      const portfolios = await Portfolio.findAll();
      res.json({
        success: true,
        data: portfolios,
        count: portfolios.length
      });
    } catch (error) {
      throw error;
    }
  }

  // Get portfolio by ID
  static async getPortfolioById(req, res) {
    try {
      const { id } = req.validatedParams;
      const portfolio = await Portfolio.findById(id);
      
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found',
          error: 'PORTFOLIO_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: portfolio
      });
    } catch (error) {
      throw error;
    }
  }

  // Create new portfolio
  static async createPortfolio(req, res) {
    try {
      const portfolio = await Portfolio.create(req.validatedBody);
      res.status(201).json({
        success: true,
        message: 'Portfolio created successfully',
        data: portfolio
      });
    } catch (error) {
      throw error;
    }
  }

  // Update portfolio
  static async updatePortfolio(req, res) {
    try {
      const { id } = req.validatedParams;
      const portfolio = await Portfolio.update(id, req.validatedBody);
      
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found',
          error: 'PORTFOLIO_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Portfolio updated successfully',
        data: portfolio
      });
    } catch (error) {
      throw error;
    }
  }

  // Delete portfolio
  static async deletePortfolio(req, res) {
    try {
      const { id } = req.validatedParams;
      const deleted = await Portfolio.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found',
          error: 'PORTFOLIO_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Portfolio deleted successfully'
      });
    } catch (error) {
      throw error;
    }
  }

  // Get portfolio performance
  static async getPortfolioPerformance(req, res) {
    try {
      const { id } = req.validatedParams;
      const days = parseInt(req.query.days) || 30;
      
      // Check if portfolio exists
      const portfolio = await Portfolio.findById(id);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found',
          error: 'PORTFOLIO_NOT_FOUND'
        });
      }

      const performance = await Portfolio.getPerformance(id, days);
      
      res.json({
        success: true,
        data: {
          portfolio_id: id,
          portfolio_name: portfolio.name,
          performance: performance.reverse(), // Reverse to get chronological order
          period_days: days
        }
      });
    } catch (error) {
      throw error;
    }
  }

  // Get portfolio summary with allocation data
  static async getPortfolioSummary(req, res) {
    try {
      const { id } = req.validatedParams;
      
      const portfolio = await Portfolio.findById(id);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found',
          error: 'PORTFOLIO_NOT_FOUND'
        });
      }

      const items = await PortfolioItem.findByPortfolioId(id);
      const typeAllocation = await PortfolioItem.getAllocationByType(id);
      const sectorAllocation = await PortfolioItem.getAllocationBySector(id);

      // Calculate summary statistics
      const totalGainLoss = items.reduce((sum, item) => sum + (item.gain_loss_amount || 0), 0);
      const totalInvestment = items.reduce((sum, item) => sum + item.purchase_value, 0);
      const totalCurrentValue = items.reduce((sum, item) => sum + item.current_value, 0);
      const overallGainLossPercent = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;

      res.json({
        success: true,
        data: {
          portfolio,
          summary: {
            total_items: items.length,
            total_investment: totalInvestment,
            total_current_value: totalCurrentValue,
            total_gain_loss: totalGainLoss,
            overall_gain_loss_percent: overallGainLossPercent
          },
          allocations: {
            by_type: typeAllocation,
            by_sector: sectorAllocation
          },
          items
        }
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PortfolioController;
