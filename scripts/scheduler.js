const cron = require('node-cron');
const path = require('path');
const { fork } = require('child_process');
const TopStockScheduler = require('./topStockScheduler');

// Schedule task to run at 00:00 (midnight) every day
cron.schedule('10 11 * * *', () => {
    console.log('Running generatePerformanceData script at:', new Date().toISOString());
    
    const scriptPath = path.join(__dirname, 'generatePerformanceData.js');
    const child = fork(scriptPath);

    child.on('exit', (code) => {
        console.log(`Script finished with code ${code} at ${new Date().toISOString()}`);
    });
});

// Start the Top Stocks Scheduler
TopStockScheduler.startScheduler();

console.log('All schedulers started successfully');
