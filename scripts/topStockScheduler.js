const cron = require('node-cron');
const TopStock = require('../models/TopStock');
const yahooFinance = require('yahoo-finance2').default;

class TopStockScheduler {
  static async fetchTopStocks() {
    try {
      console.log('Starting scheduled top stocks data fetch...');
      const today = new Date().toISOString().split('T')[0];
      
      // Top 10 most popular stocks by market cap
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
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (symbolError) {
          console.error(`Error fetching data for ${symbol}:`, symbolError.message);
          continue;
        }
      }

      if (stocksData.length === 0) {
        console.error('Failed to fetch any stock data during scheduled run');
        return;
      }

      // Save to database
      await TopStock.bulkInsert(stocksData);
      console.log(`Saved ${stocksData.length} stocks to database`);

      // Save to JSON file
      const jsonFilePath = await TopStock.saveToJsonFile(stocksData);
      console.log(`Saved stocks data to JSON file: ${jsonFilePath}`);

      // Cleanup old records (keep last 30 days)
      const deletedRows = await TopStock.cleanupOldRecords(30);
      if (deletedRows > 0) {
        console.log(`Cleaned up ${deletedRows} old records`);
      }

      console.log('Scheduled top stocks data fetch completed successfully');

    } catch (error) {
      console.error('Error during scheduled top stocks fetch:', error);
    }
  }

  static startScheduler() {
    console.log('Starting Top Stocks Scheduler...');

    // Schedule to run every day at 9:30 AM (after market open)
    cron.schedule('30 9 * * 1-5', async () => {
      console.log('Running scheduled top stocks data fetch...');
      await this.fetchTopStocks();
    }, {
      timezone: "America/New_York"
    });

    // Schedule to run every day at 4:30 PM (after market close)
    cron.schedule('30 16 * * 1-5', async () => {
      console.log('Running end-of-day top stocks data fetch...');
      await this.fetchTopStocks();
    }, {
      timezone: "America/New_York"
    });

    // Schedule cleanup every Sunday at 2 AM
    cron.schedule('0 2 * * 0', async () => {
      console.log('Running weekly cleanup of old top stocks data...');
      try {
        const deletedRows = await TopStock.cleanupOldRecords(30);
        console.log(`Weekly cleanup completed. Deleted ${deletedRows} old records.`);
      } catch (error) {
        console.error('Error during weekly cleanup:', error);
      }
    });

    // Manual trigger for testing (every 5 minutes during development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Adding 5-minute test schedule for top stocks');
      cron.schedule('*/5 * * * *', async () => {
        console.log('Running development test fetch...');
        await this.fetchTopStocks();
      });
    }

    console.log('Top Stocks Scheduler started successfully');
    console.log('Schedules:');
    console.log('- Market open (9:30 AM EST): Monday-Friday');
    console.log('- Market close (4:30 PM EST): Monday-Friday');
    console.log('- Weekly cleanup (2:00 AM EST): Sundays');
    if (process.env.NODE_ENV === 'development') {
      console.log('- Development test: Every 5 minutes');
    }
  }

  static async runOnce() {
    console.log('Running one-time top stocks data fetch...');
    await this.fetchTopStocks();
  }
}

module.exports = TopStockScheduler;
