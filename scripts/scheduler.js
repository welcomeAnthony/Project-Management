const cron = require('node-cron');
const path = require('path');
const { fork } = require('child_process');
const TopStockScheduler = require('./topStockScheduler');

// Schedule task to run at 00:00 (midnight) every day
cron.schedule('0 0 * * *', () => {
    console.log('Running generatePerformanceData script at:', new Date().toISOString());
    
    const scriptPath = path.join(__dirname, 'generatePerformanceData.js');
    const child = fork(scriptPath);

    child.on('exit', (code) => {
        console.log(`generatePerformanceData script finished with code ${code} at ${new Date().toISOString()}`);
    });
});

// Schedule Top 10 Stocks data update - Daily at 6:00 AM
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily Top 10 stocks data update at:', new Date().toISOString());
    
    try {
        await TopStockScheduler.fetchTopStocks();
        console.log('Top 10 stocks data update completed successfully at:', new Date().toISOString());
    } catch (error) {
        console.error('Error during Top 10 stocks data update:', error);
    }
});

console.log('All schedulers started successfully');
console.log('Scheduled tasks:');
console.log('- Portfolio Performance: Daily at 0:0 PM');
console.log('- Top Stocks Update: Daily at 0:00 AM');
