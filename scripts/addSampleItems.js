const mysql = require('mysql2/promise');
require('dotenv').config();

async function addSampleItems() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        // Get all portfolios
        const [portfolios] = await connection.execute('SELECT id FROM portfolios');
        
        const sampleItems = [
            { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', sector: 'Technology' },
            { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', sector: 'Technology' },
            { symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock', sector: 'Entertainment' },
            { symbol: 'UBER', name: 'Uber Technologies Inc.', type: 'stock', sector: 'Transportation' },
            { symbol: 'SPOT', name: 'Spotify Technology S.A.', type: 'stock', sector: 'Technology' },
            { symbol: 'SQ', name: 'Block Inc.', type: 'stock', sector: 'Fintech' },
            { symbol: 'PYPL', name: 'PayPal Holdings Inc.', type: 'stock', sector: 'Fintech' },
            { symbol: 'DIS', name: 'The Walt Disney Company', type: 'stock', sector: 'Entertainment' },
            { symbol: 'V', name: 'Visa Inc.', type: 'stock', sector: 'Financial Services' },
            { symbol: 'MA', name: 'Mastercard Incorporated', type: 'stock', sector: 'Financial Services' }
        ];

        for (const portfolio of portfolios) {
            console.log(`Adding items to portfolio ${portfolio.id}...`);
            
            for (let i = 0; i < 5; i++) {
                const item = sampleItems[i % sampleItems.length];
                const quantity = Math.floor(Math.random() * 50) + 10;
                const purchasePrice = Math.floor(Math.random() * 200) + 50;
                const currentPrice = purchasePrice * (0.9 + Math.random() * 0.3); // ±20% variation
                
                await connection.execute(`
                    INSERT IGNORE INTO portfolio_items 
                    (portfolio_id, symbol, name, type, quantity, purchase_price, current_price, purchase_date, sector, currency) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD')
                `, [
                    portfolio.id, 
                    `${item.symbol}_${i}`, // Make symbol unique per portfolio
                    item.name, 
                    item.type, 
                    quantity, 
                    purchasePrice, 
                    Math.round(currentPrice * 100) / 100,
                    '2024-03-01',
                    item.sector
                ]);
            }
        }

        console.log('Sample items added successfully!');
        
        // Check total count
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM portfolio_items');
        console.log('Total portfolio items now:', rows[0].count);
        
        await connection.end();
    } catch (error) {
        console.error('Error adding sample items:', error);
        await connection.end();
    }
}

addSampleItems();
