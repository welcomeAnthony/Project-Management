const TopStockScheduler = require('./topStockScheduler');

async function testTopStocksFetch() {
  console.log('Testing Top Stocks Data Fetch...');
  
  try {
    await TopStockScheduler.runOnce();
    console.log('✅ Top Stocks data fetch test completed successfully!');
  } catch (error) {
    console.error('❌ Top Stocks data fetch test failed:', error);
  }
}

// Run the test if called directly
if (require.main === module) {
  testTopStocksFetch().then(() => {
    console.log('Test completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testTopStocksFetch };
