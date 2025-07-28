// Test script for Portfolio Management API
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testAPI() {
  try {
    console.log('🧪 Testing Portfolio Management API...\n');
    
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Health check passed:', healthResponse.data.message);
    
    // Test 2: Get portfolios
    console.log('\n2. Testing get portfolios...');
    const portfoliosResponse = await axios.get(`${API_BASE}/portfolios`);
    console.log('✅ Portfolios retrieved:', portfoliosResponse.data.count, 'portfolios found');
    
    if (portfoliosResponse.data.count > 0) {
      const portfolio = portfoliosResponse.data.data[0];
      console.log('   📊 Sample portfolio:', portfolio.name, '- Value:', portfolio.calculated_value);
      
      // Test 3: Get portfolio items
      console.log('\n3. Testing get portfolio items...');
      const itemsResponse = await axios.get(`${API_BASE}/portfolios/${portfolio.id}/items`);
      console.log('✅ Portfolio items retrieved:', itemsResponse.data.count, 'items found');
      
      // Test 4: Get portfolio performance
      console.log('\n4. Testing portfolio performance...');
      const performanceResponse = await axios.get(`${API_BASE}/portfolios/${portfolio.id}/performance`);
      console.log('✅ Performance data retrieved:', performanceResponse.data.data.performance.length, 'data points');
      
      // Test 5: Get portfolio summary
      console.log('\n5. Testing portfolio summary...');
      const summaryResponse = await axios.get(`${API_BASE}/portfolios/${portfolio.id}/summary`);
      console.log('✅ Portfolio summary retrieved');
      console.log('   📈 Total Value:', summaryResponse.data.data.summary.total_current_value);
      console.log('   📊 Total Items:', summaryResponse.data.data.summary.total_items);
      console.log('   💰 Total Gain/Loss:', summaryResponse.data.data.summary.total_gain_loss);
    }
    
    // Test 6: Create a test portfolio
    console.log('\n6. Testing create portfolio...');
    const newPortfolio = {
      name: 'Test Portfolio',
      description: 'This is a test portfolio created by the test script'
    };
    
    const createResponse = await axios.post(`${API_BASE}/portfolios`, newPortfolio);
    console.log('✅ Portfolio created:', createResponse.data.data.name);
    const testPortfolioId = createResponse.data.data.id;
    
    // Test 7: Add an item to the test portfolio
    console.log('\n7. Testing add portfolio item...');
    const newItem = {
      portfolio_id: testPortfolioId,
      symbol: 'TEST',
      name: 'Test Stock',
      type: 'stock',
      quantity: 100,
      purchase_price: 50.00,
      current_price: 55.00,
      purchase_date: '2024-01-01',
      sector: 'Technology',
      currency: 'USD'
    };
    
    const addItemResponse = await axios.post(`${API_BASE}/items`, newItem);
    console.log('✅ Portfolio item added:', addItemResponse.data.data.symbol);
    const testItemId = addItemResponse.data.data.id;
    
    // Test 8: Update the item
    console.log('\n8. Testing update portfolio item...');
    const updateItem = {
      current_price: 60.00,
      quantity: 150
    };
    
    const updateResponse = await axios.put(`${API_BASE}/items/${testItemId}`, updateItem);
    console.log('✅ Portfolio item updated, new price:', updateResponse.data.data.current_price);
    
    // Test 9: Delete the test item
    console.log('\n9. Testing delete portfolio item...');
    await axios.delete(`${API_BASE}/items/${testItemId}`);
    console.log('✅ Portfolio item deleted');
    
    // Test 10: Delete the test portfolio
    console.log('\n10. Testing delete portfolio...');
    await axios.delete(`${API_BASE}/portfolios/${testPortfolioId}`);
    console.log('✅ Test portfolio deleted');
    
    console.log('\n🎉 All API tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Error details:', error.response.data);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };
