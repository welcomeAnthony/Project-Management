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

  // Fetch historical data for top stocks (past 30 days)
  static async fetchHistoricalTopStocks(req, res) {
    try {
      console.log('Starting historical top stocks data fetch (30 days)...');
      
      // Top 10 most popular stocks by market cap
      const topSymbols = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 
        'TSLA', 'META', 'BRK-B', 'UNH', 'JNJ'
      ];

      // Calculate date range (past 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const allStocksData = [];
      let successCount = 0;
      let failureCount = 0;

      // Process each symbol with enhanced error handling
      for (let rankIndex = 0; rankIndex < topSymbols.length; rankIndex++) {
        const symbol = topSymbols[rankIndex];
        const rank = rankIndex + 1;
        
        try {
          console.log(`Fetching 30-day historical data for ${symbol} (${rank}/10)...`);
          
          // Fetch historical data for the past 30 days
          const historicalData = await yahooFinance.historical(symbol, {
            period1: startDate,
            period2: endDate,
            interval: '1d'
          });

          if (!historicalData || historicalData.length === 0) {
            console.warn(`No historical data found for ${symbol}`);
            failureCount++;
            continue;
          }

          // Get additional stock info (sector, industry, etc.)
          let stockInfo = {};
          try {
            const quote = await yahooFinance.quote(symbol);
            const quoteSummary = await yahooFinance.quoteSummary(symbol, {
              modules: ['summaryProfile', 'defaultKeyStatistics']
            });
            
            stockInfo = {
              name: quote.displayName || quote.shortName || quote.longName || symbol,
              sector: quoteSummary.summaryProfile?.sector || null,
              industry: quoteSummary.summaryProfile?.industry || null,
              currency: quote.currency || 'USD',
              exchange: quote.exchange || null,
              beta: quoteSummary.defaultKeyStatistics?.beta || null,
              eps: quoteSummary.defaultKeyStatistics?.trailingEps || null,
              fifty_two_week_high: quoteSummary.defaultKeyStatistics?.fiftyTwoWeekHigh || null,
              fifty_two_week_low: quoteSummary.defaultKeyStatistics?.fiftyTwoWeekLow || null
            };
          } catch (infoError) {
            console.warn(`Could not fetch additional info for ${symbol}:`, infoError.message);
            stockInfo = { name: symbol };
          }

          // Process each day's data
          for (const dayData of historicalData) {
            const stockData = {
              symbol: symbol,
              name: stockInfo.name,
              date: dayData.date.toISOString().split('T')[0],
              open_price: dayData.open || null,
              close_price: dayData.close || null,
              high_price: dayData.high || null,
              low_price: dayData.low || null,
              volume: dayData.volume || null,
              market_cap: null, // Not available in historical data
              pe_ratio: null, // Not available in historical data
              dividend_yield: null, // Not available in historical data
              fifty_two_week_high: stockInfo.fifty_two_week_high,
              fifty_two_week_low: stockInfo.fifty_two_week_low,
              avg_volume: null, // Not available in historical data
              beta: stockInfo.beta,
              eps: stockInfo.eps,
              sector: stockInfo.sector,
              industry: stockInfo.industry,
              currency: stockInfo.currency,
              exchange: stockInfo.exchange,
              rank_position: rank
            };
            
            allStocksData.push(stockData);
          }

          successCount++;
          console.log(`✅ Successfully fetched ${historicalData.length} days for ${symbol}`);

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (symbolError) {
          console.error(`❌ Failed to fetch data for ${symbol}:`, symbolError.message);
          failureCount++;
          
          // If we get too many failures, stop to avoid being banned
          if (failureCount >= 3) {
            console.error('Too many failures detected. Stopping to avoid API restrictions.');
            break;
          }
          continue;
        }
      }

      if (allStocksData.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch any historical stock data',
          successCount,
          failureCount
        });
      }

      console.log(`Saving ${allStocksData.length} historical records to database...`);
      
      // Save to database in batches to avoid overwhelming the system
      const batchSize = 50;
      for (let i = 0; i < allStocksData.length; i += batchSize) {
        const batch = allStocksData.slice(i, i + batchSize);
        await TopStock.bulkInsert(batch);
      }

      // Save to JSON file
      const jsonFilePath = await TopStock.saveToJsonFile(allStocksData, `historical_top_stocks_30days_${new Date().toISOString().split('T')[0]}.json`);

      res.json({
        success: true,
        message: 'Historical top stocks data fetched successfully',
        period: '30 days',
        totalRecords: allStocksData.length,
        successfulSymbols: successCount,
        failedSymbols: failureCount,
        jsonFile: jsonFilePath,
        symbols: topSymbols.slice(0, successCount)
      });

    } catch (error) {
      console.error('Error fetching historical top stocks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch historical top stocks',
        error: error.message
      });
    }
  }

  // Fetch and update top stocks data from Yahoo Finance (current day only)
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
          console.log(`Fetching current data for ${symbol}...`);
          
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

  // Get chart data for a specific stock and attribute
  static async getChartData(req, res) {
    try {
      const { symbol } = req.params;
      const { attribute = 'close_price', days = 30 } = req.query;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(days));
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const stocks = await TopStock.findBySymbol(symbol, startDateStr, endDateStr);
      
      if (!stocks || stocks.length === 0) {
        return res.json({
          success: true,
          symbol,
          attribute,
          period: `${days} days`,
          count: 0,
          data: []
        });
      }

      // Sort by date and extract the requested attribute
      const chartData = stocks
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(stock => ({
          date: stock.date,
          value: stock[attribute] || 0,
          volume: stock.volume || 0
        }));

      res.json({
        success: true,
        symbol,
        attribute,
        period: `${days} days`,
        count: chartData.length,
        data: chartData
      });

    } catch (error) {
      console.error('Error fetching chart data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chart data',
        error: error.message
      });
    }
  }

  // Get available symbols
  static async getAvailableSymbols(req, res) {
    try {
      const symbols = await TopStock.getAvailableSymbols();
      
      res.json({
        success: true,
        count: symbols.length,
        data: symbols
      });
    } catch (error) {
      console.error('Error fetching available symbols:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available symbols',
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
