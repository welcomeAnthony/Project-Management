/**
 * Simple Automation Test Script for Portfolio Management API
 * Tests the main API endpoints to ensure basic functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test configuration
const TEST_CONFIG = {
  timeout: 10000, // 10 seconds timeout
  retries: 3
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

/**
 * Helper function to run a test with error handling
 */
async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🧪 ${testResults.total}. ${testName}...`);
  
  try {
    await testFunction();
    testResults.passed++;
    console.log(`✅ PASSED: ${testName}`);
  } catch (error) {
    testResults.failed++;
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
  }
}

/**
 * Test 1: Health Check
 */
async function testHealthCheck() {
  const response = await axios.get(`${BASE_URL}/health`, { timeout: TEST_CONFIG.timeout });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error('Health check returned success: false');
  }
  
  console.log(`   📊 API Status: ${response.data.message}`);
}

/**
 * Test 2: Get All Portfolios
 */
async function testGetPortfolios() {
  const response = await axios.get(`${API_BASE}/portfolios`, { timeout: TEST_CONFIG.timeout });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const portfolios = response.data.data || [];
  console.log(`   📊 Found ${portfolios.length} portfolios`);
  
  // Store first portfolio ID for other tests
  if (portfolios.length > 0) {
    global.testPortfolioId = portfolios[0].id;
    console.log(`   🔍 Using portfolio ID ${global.testPortfolioId} for subsequent tests`);
  }
}

/**
 * Test 3: Get Portfolio Items (if portfolio exists)
 */
async function testGetPortfolioItems() {
  if (!global.testPortfolioId) {
    console.log(`   ⏭️  Skipped: No portfolio available for testing`);
    return;
  }
  
  const response = await axios.get(`${API_BASE}/portfolios/${global.testPortfolioId}/items`, { 
    timeout: TEST_CONFIG.timeout 
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const items = response.data.data || [];
  console.log(`   📊 Found ${items.length} portfolio items`);
}

/**
 * Test 4: Get Top Stocks (Latest)
 */
async function testGetTopStocks() {
  const response = await axios.get(`${API_BASE}/top-stocks/latest`, { timeout: TEST_CONFIG.timeout });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const stocks = response.data.data || [];
  console.log(`   📊 Found ${stocks.length} top stocks`);
  
  // Store first stock symbol for other tests
  if (stocks.length > 0) {
    global.testStockSymbol = stocks[0].symbol;
    console.log(`   🔍 Using stock symbol ${global.testStockSymbol} for subsequent tests`);
  }
}

/**
 * Test 5: Get Stock Sectors
 */
async function testGetSectors() {
  const response = await axios.get(`${API_BASE}/top-stocks/sectors`, { timeout: TEST_CONFIG.timeout });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const sectors = response.data.data || [];
  console.log(`   📊 Found ${sectors.length} sectors: ${sectors.slice(0, 3).join(', ')}${sectors.length > 3 ? '...' : ''}`);
  
  // Store first sector for other tests
  if (sectors.length > 0) {
    global.testSector = sectors[0];
  }
}

/**
 * Test 6: Get Stocks by Sector
 */
async function testGetStocksBySector() {
  if (!global.testSector) {
    console.log(`   ⏭️  Skipped: No sector available for testing`);
    return;
  }
  
  const response = await axios.get(`${API_BASE}/top-stocks/sector/${global.testSector}`, { 
    timeout: TEST_CONFIG.timeout 
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const stocks = response.data.data || [];
  console.log(`   📊 Found ${stocks.length} stocks in ${global.testSector} sector`);
}

/**
 * Test 7: Get Stock by Symbol
 */
async function testGetStockBySymbol() {
  if (!global.testStockSymbol) {
    console.log(`   ⏭️  Skipped: No stock symbol available for testing`);
    return;
  }
  
  const response = await axios.get(`${API_BASE}/top-stocks/symbol/${global.testStockSymbol}`, { 
    timeout: TEST_CONFIG.timeout 
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const stockData = response.data.data || [];
  console.log(`   📊 Found ${stockData.length} records for ${global.testStockSymbol}`);
}

/**
 * Test 8: Get Market Statistics
 */
async function testGetStatistics() {
  const response = await axios.get(`${API_BASE}/top-stocks/statistics`, { timeout: TEST_CONFIG.timeout });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const stats = response.data.data;
  console.log(`   📊 Statistics retrieved successfully`);
  console.log(`   📈 Total records: ${stats.total_records || 'N/A'}`);
}

/**
 * Test 9: Create and Delete Test Portfolio
 */
async function testCreateAndDeletePortfolio() {
  // Create test portfolio
  const testPortfolio = {
    name: `Test Portfolio ${Date.now()}`,
    description: 'Automated test portfolio - safe to delete'
  };
  
  const createResponse = await axios.post(`${API_BASE}/portfolios`, testPortfolio, { 
    timeout: TEST_CONFIG.timeout 
  });
  
  if (createResponse.status !== 201) {
    throw new Error(`Expected status 201, got ${createResponse.status}`);
  }
  
  const portfolioId = createResponse.data.data.id;
  console.log(`   ✨ Created test portfolio with ID: ${portfolioId}`);
  
  // Delete test portfolio
  const deleteResponse = await axios.delete(`${API_BASE}/portfolios/${portfolioId}`, { 
    timeout: TEST_CONFIG.timeout 
  });
  
  if (deleteResponse.status !== 200) {
    throw new Error(`Expected status 200, got ${deleteResponse.status}`);
  }
  
  console.log(`   🗑️  Deleted test portfolio successfully`);
}

/**
 * Test 10: Get Available Stock Symbols
 */
async function testGetAvailableSymbols() {
  const response = await axios.get(`${API_BASE}/top-stocks/symbols`, { timeout: TEST_CONFIG.timeout });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const symbols = response.data.data || [];
  console.log(`   📊 Found ${symbols.length} available stock symbols`);
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Portfolio Management API Automation Tests...');
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('=' .repeat(60));
  
  // Initialize global test variables
  global.testPortfolioId = null;
  global.testStockSymbol = null;
  global.testSector = null;
  
  // Run all tests
  await runTest('Health Check', testHealthCheck);
  await runTest('Get All Portfolios', testGetPortfolios);
  await runTest('Get Portfolio Items', testGetPortfolioItems);
  await runTest('Get Top Stocks (Latest)', testGetTopStocks);
  await runTest('Get Stock Sectors', testGetSectors);
  await runTest('Get Stocks by Sector', testGetStocksBySector);
  await runTest('Get Stock by Symbol', testGetStockBySymbol);
  await runTest('Get Market Statistics', testGetStatistics);
  await runTest('Get Available Stock Symbols', testGetAvailableSymbols);
  await runTest('Create and Delete Test Portfolio', testCreateAndDeletePortfolio);
  
  // Print test summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
  console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! API is functioning correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the API and database connection.');
  }
  
  console.log('\n💡 Tip: Make sure the server is running on http://localhost:3000 before running tests.');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('\n💥 Test runner crashed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  runTest,
  testResults
};
