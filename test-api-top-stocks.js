const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/top-stocks';

async function testTopStocksAPI() {
  console.log('🧪 Testing Top Stocks API Endpoints...\n');

  try {
    // Test 1: Get latest top stocks
    console.log('1️⃣ Testing GET /api/top-stocks/latest');
    const latestResponse = await axios.get(`${BASE_URL}/latest`);
    console.log('✅ Success:', latestResponse.data.count, 'stocks retrieved');
    console.log('Sample stock:', latestResponse.data.data[0]?.symbol);
    console.log('');

    // Test 2: Get top stocks for today
    console.log('2️⃣ Testing GET /api/top-stocks');
    const todayResponse = await axios.get(`${BASE_URL}`);
    console.log('✅ Success:', todayResponse.data.count, 'stocks retrieved for today');
    console.log('');

    // Test 3: Get sectors
    console.log('3️⃣ Testing GET /api/top-stocks/sectors');
    const sectorsResponse = await axios.get(`${BASE_URL}/sectors`);
    console.log('✅ Success:', sectorsResponse.data.count, 'sectors found');
    console.log('Sectors:', sectorsResponse.data.data);
    console.log('');

    // Test 4: Get stocks by sector (if any sectors exist)
    if (sectorsResponse.data.data.length > 0) {
      const firstSector = sectorsResponse.data.data[0];
      console.log(`4️⃣ Testing GET /api/top-stocks/sector/${firstSector}`);
      const sectorResponse = await axios.get(`${BASE_URL}/sector/${firstSector}`);
      console.log('✅ Success:', sectorResponse.data.count, 'stocks in', firstSector, 'sector');
      console.log('');
    }

    // Test 5: Get stock by symbol
    if (latestResponse.data.data.length > 0) {
      const firstStock = latestResponse.data.data[0];
      console.log(`5️⃣ Testing GET /api/top-stocks/symbol/${firstStock.symbol}`);
      const symbolResponse = await axios.get(`${BASE_URL}/symbol/${firstStock.symbol}`);
      console.log('✅ Success:', symbolResponse.data.count, 'records for', firstStock.symbol);
      console.log('');
    }

    // Test 6: Get statistics
    console.log('6️⃣ Testing GET /api/top-stocks/statistics');
    const statsResponse = await axios.get(`${BASE_URL}/statistics`);
    console.log('✅ Success: Statistics retrieved');
    console.log('Total stocks:', statsResponse.data.data.total_stocks);
    console.log('Average price:', statsResponse.data.data.avg_price);
    console.log('');

    // Test 7: Export to JSON
    console.log('7️⃣ Testing GET /api/top-stocks/export');
    const exportResponse = await axios.get(`${BASE_URL}/export`);
    console.log('✅ Success: Data exported to', exportResponse.data.filePath);
    console.log('');

    // Test 8: Fetch fresh data (this might take a while)
    console.log('8️⃣ Testing POST /api/top-stocks/fetch (this may take 20-30 seconds...)');
    const fetchResponse = await axios.post(`${BASE_URL}/fetch`);
    console.log('✅ Success: Fresh data fetched');
    console.log('Stocks updated:', fetchResponse.data.count);
    console.log('JSON file saved:', fetchResponse.data.jsonFile);
    console.log('');

    console.log('🎉 All API tests completed successfully!');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  }
}

// Run the test if called directly
if (require.main === module) {
  testTopStocksAPI().then(() => {
    console.log('API testing completed');
    process.exit(0);
  }).catch((error) => {
    console.error('API testing failed:', error);
    process.exit(1);
  });
}

module.exports = { testTopStocksAPI };
