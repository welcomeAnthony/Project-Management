const TopStock = require('../models/TopStock');
const yahooFinance = require('yahoo-finance2').default;

class TopStockController {
  // Get top stocks for today or a specific date
  static async getTopStocks(req, res) {
    try {
      const { date } = req.query;
      const targetDate = date || new Date().toISOString().split('T')[0];

      const stocks = await TopStock.findByDate(targetDate);
      
      res.json({
        success: true,
        date: targetDate,
        count: stocks.length,
        data: stocks
      });
    } catch (error) {
      console.error('Error fetching top stocks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top stocks',
        error: error.message
      });
    }
  }

  // Get latest top stocks data
  static async getLatestTopStocks(req, res) {
    try {
      const stocks = await TopStock.findLatest();
      
      res.json({
        success: true,
        count: stocks.length,
        data: stocks
      });
    } catch (error) {
      console.error('Error fetching latest top stocks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch latest top stocks',
        error: error.message
      });
    }
  }

  // Get top stocks by sector
  static async getTopStocksBySector(req, res) {
    try {
      const { sector } = req.params;
      const { date } = req.query;

      const stocks = await TopStock.findBySector(sector, date);
      
      res.json({
        success: true,
        sector,
        date: date || 'latest',
        count: stocks.length,
        data: stocks
      });
    } catch (error) {
      console.error('Error fetching top stocks by sector:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top stocks by sector',
        error: error.message
      });
    }
  }

  // Get stock data by symbol
  static async getStockBySymbol(req, res) {
    try {
      const { symbol } = req.params;
      const { startDate, endDate } = req.query;

      const stocks = await TopStock.findBySymbol(symbol, startDate, endDate);
      
      res.json({
        success: true,
        symbol,
        count: stocks.length,
        data: stocks
      });
    } catch (error) {
      console.error('Error fetching stock by symbol:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock data',
        error: error.message
      });
    }
  }

  // Fetch and update top stocks data from Yahoo Finance
  static async fetchAndUpdateTopStocks(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Top 10 most popular stocks by market cap (you can modify this list)
      const topSymbols = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 
        'TSLA', 'META', 'BRK-B', 'UNH', 'JNJ'
      ];

      const stocksData = [];
      let rank = 1;

      for (const symbol of topSymbols) {
        try {
          console.log(`Fetching data for ${symbol}...`);
          
          // Get quote data
          const quote = await yahooFinance.quote(symbol);
          
          // Get additional data if available
          let additionalData = {};
          try {
            const quoteSummary = await yahooFinance.quoteSummary(symbol, {
              modules: ['summaryProfile', 'financialData', 'defaultKeyStatistics']
            });
            
            if (quoteSummary.summaryProfile) {
              additionalData.sector = quoteSummary.summaryProfile.sector;
              additionalData.industry = quoteSummary.summaryProfile.industry;
            }
            
            if (quoteSummary.financialData) {
              additionalData.pe_ratio = quoteSummary.financialData.currentRatio;
            }
            
            if (quoteSummary.defaultKeyStatistics) {
              additionalData.beta = quoteSummary.defaultKeyStatistics.beta;
              additionalData.eps = quoteSummary.defaultKeyStatistics.trailingEps;
              additionalData.fifty_two_week_high = quoteSummary.defaultKeyStatistics.fiftyTwoWeekHigh;
              additionalData.fifty_two_week_low = quoteSummary.defaultKeyStatistics.fiftyTwoWeekLow;
            }
          } catch (detailError) {
            console.warn(`Could not fetch detailed data for ${symbol}:`, detailError.message);
          }

          const stockData = {
            symbol: quote.symbol,
            name: quote.displayName || quote.shortName || quote.longName,
            date: today,
            open_price: quote.regularMarketOpen || null,
            close_price: quote.regularMarketPrice || quote.regularMarketPreviousClose,
            high_price: quote.regularMarketDayHigh || null,
            low_price: quote.regularMarketDayLow || null,
            volume: quote.regularMarketVolume || null,
            market_cap: quote.marketCap || null,
            pe_ratio: quote.trailingPE || additionalData.pe_ratio || null,
            dividend_yield: quote.dividendYield || null,
            fifty_two_week_high: quote.fiftyTwoWeekHigh || additionalData.fifty_two_week_high || null,
            fifty_two_week_low: quote.fiftyTwoWeekLow || additionalData.fifty_two_week_low || null,
            avg_volume: quote.averageDailyVolume10Day || null,
            beta: additionalData.beta || null,
            eps: quote.epsTrailingTwelveMonths || additionalData.eps || null,
            sector: additionalData.sector || null,
            industry: additionalData.industry || null,
            currency: quote.currency || 'USD',
            exchange: quote.exchange || null,
            rank_position: rank
          };

          stocksData.push(stockData);
          rank++;

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (symbolError) {
          console.error(`Error fetching data for ${symbol}:`, symbolError.message);
          continue;
        }
      }

      if (stocksData.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch any stock data'
        });
      }

      // Save to database
      await TopStock.bulkInsert(stocksData);

      // Save to JSON file
      const jsonFilePath = await TopStock.saveToJsonFile(stocksData);

      res.json({
        success: true,
        message: 'Top stocks data updated successfully',
        date: today,
        count: stocksData.length,
        jsonFile: jsonFilePath,
        data: stocksData
      });

    } catch (error) {
      console.error('Error fetching and updating top stocks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch and update top stocks',
        error: error.message
      });
    }
  }

  // Get available sectors
  static async getSectors(req, res) {
    try {
      const sectors = await TopStock.getSectors();
      
      res.json({
        success: true,
        count: sectors.length,
        data: sectors
      });
    } catch (error) {
      console.error('Error fetching sectors:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sectors',
        error: error.message
      });
    }
  }

  // Get statistics
  static async getStatistics(req, res) {
    try {
      const { date } = req.query;
      const stats = await TopStock.getStatistics(date);
      
      res.json({
        success: true,
        date: date || 'latest',
        data: stats
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  }

  // Export data to JSON file
  static async exportToJson(req, res) {
    try {
      const { date } = req.query;
      const targetDate = date || new Date().toISOString().split('T')[0];

      const stocks = await TopStock.findByDate(targetDate);
      
      if (stocks.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No stock data found for the specified date'
        });
      }

      const jsonFilePath = await TopStock.saveToJsonFile(stocks, `top_stocks_${targetDate}.json`);

      res.json({
        success: true,
        message: 'Data exported to JSON successfully',
        date: targetDate,
        count: stocks.length,
        filePath: jsonFilePath
      });

    } catch (error) {
      console.error('Error exporting to JSON:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export data to JSON',
        error: error.message
      });
    }
  }

  // Cleanup old records
  static async cleanupOldRecords(req, res) {
    try {
      const { daysToKeep = 30 } = req.query;
      const deletedRows = await TopStock.cleanupOldRecords(parseInt(daysToKeep));

      res.json({
        success: true,
        message: `Cleanup completed. Deleted ${deletedRows} old records.`,
        deletedRecords: deletedRows
      });

    } catch (error) {
      console.error('Error during cleanup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup old records',
        error: error.message
      });
    }
  }
}

module.exports = TopStockController;
