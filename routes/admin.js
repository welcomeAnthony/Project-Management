const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

// Database connection
async function getDbConnection() {
    return await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
}

// Get performance data status for all portfolios
router.get('/performance-status', async (req, res) => {
    try {
        const connection = await getDbConnection();
        
        const [rows] = await connection.execute(`
            SELECT 
                p.id,
                p.name,
                COUNT(pp.id) as records,
                MIN(pp.date) as earliest,
                MAX(pp.date) as latest
            FROM portfolios p 
            LEFT JOIN portfolio_performance pp ON p.id = pp.portfolio_id 
            GROUP BY p.id, p.name
            ORDER BY p.name
        `);
        
        await connection.end();
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error getting performance status:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Generate performance data
router.post('/generate-performance', async (req, res) => {
    try {
        const { portfolioId, days = 30 } = req.body;
        const connection = await getDbConnection();
        
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

        let totalRecordsCreated = 0;
        
        for (const portfolio of portfolios) {
            // Get current portfolio value
            const [items] = await connection.execute(`
                SELECT SUM(quantity * current_price) as total_value 
                FROM portfolio_items 
                WHERE portfolio_id = ?
            `, [portfolio.id]);

            const currentValue = items[0].total_value || 10000;
            
            // Generate historical data for the past N days
            const endDate = new Date();
            let recordsCreated = 0;
            
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(endDate);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                // Check if data already exists for this date
                const [existing] = await connection.execute(
                    'SELECT COUNT(*) as count FROM portfolio_performance WHERE portfolio_id = ? AND date = ?',
                    [portfolio.id, dateStr]
                );

                if (existing[0].count === 0) {
                    // Create realistic fluctuation (±2% per day)
                    const fluctuation = (Math.random() - 0.5) * 0.04;
                    const dayValue = currentValue * (1 + fluctuation * (i / days));
                    
                    await connection.execute(
                        'INSERT INTO portfolio_performance (portfolio_id, date, total_value, created_at) VALUES (?, ?, ?, NOW())',
                        [portfolio.id, dateStr, Math.round(dayValue * 100) / 100]
                    );
                    recordsCreated++;
                }
            }
            
            totalRecordsCreated += recordsCreated;
        }
        
        await connection.end();
        
        res.json({
            success: true,
            message: `Generated ${totalRecordsCreated} performance records for ${portfolios.length} portfolio(s)`,
            recordsCreated: totalRecordsCreated
        });
    } catch (error) {
        console.error('Error generating performance data:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
