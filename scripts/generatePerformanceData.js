require('dotenv').config();
const mysql = require('mysql2/promise');

async function generatePerformanceData(portfolioId = null, days = 30) {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        // Get portfolios to process
        let portfolios;
        if (portfolioId) {
            const [rows] = await connection.execute(
                'SELECT * FROM portfolios WHERE id = ?',
                [portfolioId]
            );
            portfolios = rows;
        } else {
            const [rows] = await connection.execute('SELECT * FROM portfolios');
            portfolios = rows;
        }

        for (const portfolio of portfolios) {
            console.log(`Generating performance data for portfolio: ${portfolio.name}`);
            
            // Check if performance data already exists
            const [existing] = await connection.execute(
                'SELECT COUNT(*) as count FROM portfolio_performance WHERE portfolio_id = ?',
                [portfolio.id]
            );

            if (existing[0].count > 0) {
                console.log(`  - Performance data already exists, skipping...`);
                continue;
            }

            // Get current portfolio value
            const [items] = await connection.execute(`
                SELECT SUM(quantity * current_price) as total_value 
                FROM portfolio_items 
                WHERE portfolio_id = ?
            `, [portfolio.id]);

            const currentValue = items[0].total_value || 10000; // Default to $10,000 if no items
            
            // Generate historical data for the past N days
            const performanceData = [];
            const endDate = new Date();
            
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(endDate);
                date.setDate(date.getDate() - i);
                
                // Create realistic fluctuation (±2% per day)
                const fluctuation = (Math.random() - 0.5) * 0.04; // -2% to +2%
                const dayValue = currentValue * (1 + fluctuation * (i / days));
                
                performanceData.push([
                    portfolio.id,
                    date.toISOString().split('T')[0],
                    Math.round(dayValue * 100) / 100 // Round to 2 decimal places
                ]);
            }

            // Insert performance data
            if (performanceData.length > 0) {
                for (const [portfolioId, date, totalValue] of performanceData) {
                    await connection.execute(
                        'INSERT INTO portfolio_performance (portfolio_id, date, total_value, created_at) VALUES (?, ?, ?, NOW())',
                        [portfolioId, date, totalValue]
                    );
                }
                console.log(`  - Generated ${performanceData.length} performance records`);
            }
        }

        console.log('Performance data generation completed!');
    } catch (error) {
        console.error('Error generating performance data:', error);
    } finally {
        await connection.end();
    }
}

// Check command line arguments
const args = process.argv.slice(2);
let portfolioId = null;
let days = 30;

if (args.length > 0) {
    portfolioId = parseInt(args[0]);
}
if (args.length > 1) {
    days = parseInt(args[1]);
}

// Run the script
generatePerformanceData(portfolioId, days);
