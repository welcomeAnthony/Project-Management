const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/top-stocks';

async function testHistoricalDataAPI() {
  console.log('🧪 Testing Historical Top Stocks API...\n');

  try {
    // Test 1: Fetch historical data (this is the main test)
    console.log('1️⃣ Testing POST /api/top-stocks/fetch-historical');
    console.log('⚠️  This will take 2-3 minutes and fetch 30 days of data...');
    
    const startTime = Date.now();
    const historicalResponse = await axios.post(`${BASE_URL}/fetch-historical`);
    const endTime = Date.now();
    
    console.log('✅ Success: Historical data fetched');
    console.log('Total records:', historicalResponse.data.totalRecords);
    console.log('Successful symbols:', historicalResponse.data.successfulSymbols);
    console.log('Failed symbols:', historicalResponse.data.failedSymbols);
    console.log('Time taken:', Math.round((endTime - startTime) / 1000), 'seconds');
    console.log('JSON file saved:', historicalResponse.data.jsonFile);
    console.log('');

    // Test 2: Get available symbols
    console.log('2️⃣ Testing GET /api/top-stocks/symbols');
    const symbolsResponse = await axios.get(`${BASE_URL}/symbols`);
    console.log('✅ Success:', symbolsResponse.data.count, 'symbols available');
    console.log('Symbols:', symbolsResponse.data.data.map(s => s.symbol).join(', '));
    console.log('');

    // Test 3: Get chart data for AAPL
    if (symbolsResponse.data.data.length > 0) {
      const firstSymbol = symbolsResponse.data.data[0].symbol;
      console.log(`3️⃣ Testing GET /api/top-stocks/chart/${firstSymbol}`);
      
      const chartResponse = await axios.get(`${BASE_URL}/chart/${firstSymbol}?attribute=close_price&days=30`);
      console.log('✅ Success: Chart data retrieved');
      console.log('Symbol:', chartResponse.data.symbol);
      console.log('Attribute:', chartResponse.data.attribute);
      console.log('Period:', chartResponse.data.period);
      console.log('Data points:', chartResponse.data.count);
      
      if (chartResponse.data.data.length > 0) {
        const latestData = chartResponse.data.data[chartResponse.data.data.length - 1];
        console.log('Latest data point:', latestData.date, '$' + latestData.value);
      }
      console.log('');

      // Test 4: Get chart data for volume
      console.log(`4️⃣ Testing volume chart for ${firstSymbol}`);
      const volumeResponse = await axios.get(`${BASE_URL}/chart/${firstSymbol}?attribute=volume&days=14`);
      console.log('✅ Success: Volume chart data retrieved');
      console.log('Data points:', volumeResponse.data.count);
      console.log('');
    }

    // Test 5: Get statistics after historical data
    console.log('5️⃣ Testing GET /api/top-stocks/statistics (after historical data)');
    const statsResponse = await axios.get(`${BASE_URL}/statistics`);
    console.log('✅ Success: Updated statistics retrieved');
    console.log('Total stocks:', statsResponse.data.data.total_stocks);
    console.log('Average price:', '$' + Number(statsResponse.data.data.avg_price).toFixed(2));
    console.log('Sectors count:', statsResponse.data.data.sectors_count);
    console.log('');

    console.log('🎉 All historical API tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Historical data fetched and saved to database');
    console.log('- Chart data endpoints working correctly');
    console.log('- Enhanced UI should now show charts and historical data');
    console.log('\n🌐 Next steps:');
    console.log('- Visit http://localhost:3000/top-stocks.html');
    console.log('- Try the Charts tab to see interactive price charts');
    console.log('- Use the "Fetch 30-Day History" button for more data');

  } catch (error) {
    console.error('❌ Historical API test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n💡 This might be due to:');
      console.log('- Yahoo Finance API rate limiting');
      console.log('- Market being closed');
      console.log('- Network connectivity issues');
      console.log('\nTry running the test again in a few minutes.');
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  testHistoricalDataAPI().then(() => {
    console.log('\nHistorical API testing completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Historical API testing failed:', error);
    process.exit(1);
  });
}

module.exports = { testHistoricalDataAPI };
