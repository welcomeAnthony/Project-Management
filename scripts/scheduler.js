const cron = require('node-cron');
const path = require('path');
const { fork } = require('child_process');

// Schedule task to run at 00:00 (midnight) every day
cron.schedule('0 0 * * *', () => {
    console.log('Running generatePerformanceData script at:', new Date().toISOString());
    
    const scriptPath = path.join(__dirname, 'generatePerformanceData.js');
    const child = fork(scriptPath);

    child.on('exit', (code) => {
        console.log(`Script finished with code ${code} at ${new Date().toISOString()}`);
    });
});
