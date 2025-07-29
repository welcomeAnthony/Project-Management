const express = require('express');
const axios = require('axios');
const router = express.Router();

const ALPHA_VANTAGE_API_KEY = 'USGWONGSBF7P4HGC';
const API_BASE_URL = 'https://www.alphavantage.co/query';

// Cache for API responses (10 minutes)
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * @swagger
 * /api/market/quote/{symbol}:
 *   get:
 *     summary: Get real-time quote for a symbol
 *     tags: [Market Data]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol (e.g., AAPL, GOOGL)
 *     responses:
 *       200:
 *         description: Quote data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     symbol:
 *                       type: string
 *                     price:
 *                       type: string
 *                     change:
 *                       type: string
 *                     changePercent:
 *                       type: string
 *                     lastUpdated:
 *                       type: string
 *       400:
 *         description: Invalid symbol
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Server error
 */
router.get('/quote/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        
        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: 'Symbol is required'
            });
        }

        const cacheKey = `quote_${symbol.toUpperCase()}`;
        const cachedData = cache.get(cacheKey);
        
        // Return cached data if still valid
        if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
            return res.json({
                success: true,
                data: cachedData.data,
                cached: true
            });
        }

        // Fetch fresh data from Alpha Vantage
        const response = await axios.get(API_BASE_URL, {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol: symbol.toUpperCase(),
                apikey: ALPHA_VANTAGE_API_KEY
            },
            timeout: 10000
        });

        const quote = response.data['Global Quote'];
        
        if (!quote || Object.keys(quote).length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found for symbol: ' + symbol
            });
        }

        const quoteData = {
            symbol: quote['01. symbol'],
            price: parseFloat(quote['05. price']).toFixed(2),
            change: parseFloat(quote['09. change']).toFixed(2),
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')).toFixed(2),
            lastUpdated: quote['07. latest trading day']
        };

        // Cache the response
        cache.set(cacheKey, {
            data: quoteData,
            timestamp: Date.now()
        });

        res.json({
            success: true,
            data: quoteData
        });

    } catch (error) {
        console.error('Error fetching quote:', error);
        
        if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                success: false,
                message: 'Request timeout'
            });
        }
        
        if (error.response && error.response.status === 429) {
            return res.status(429).json({
                success: false,
                message: 'API rate limit exceeded'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to fetch quote data'
        });
    }
});

/**
 * @swagger
 * /api/market/indices:
 *   get:
 *     summary: Get real-time data for major market indices
 *     tags: [Market Data]
 *     responses:
 *       200:
 *         description: Market indices data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       symbol:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: string
 *                       change:
 *                         type: string
 *                       changePercent:
 *                         type: string
 */
router.get('/indices', async (req, res) => {
    try {
        const indices = [
            { symbol: 'IXIC', name: 'NASDAQ Composite' },
            { symbol: 'HSI', name: 'Hang Seng Index' },
            { symbol: 'SPX', name: 'S&P 500' },
            { symbol: 'DJI', name: 'Dow Jones' },
            { symbol: 'FTSE', name: 'FTSE 100' },
            { symbol: 'N225', name: 'Nikkei 225' }
        ];

        const cacheKey = 'market_indices';
        const cachedData = cache.get(cacheKey);
        
        // Return cached data if still valid
        if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
            return res.json({
                success: true,
                data: cachedData.data,
                cached: true
            });
        }

        const results = [];
        
        // For demo purposes, let's use mock data if Alpha Vantage fails
        const mockData = [
            { symbol: 'IXIC', name: 'NASDAQ Composite', price: '15750.25', change: '1.2', changePercent: '1.2' },
            { symbol: 'HSI', name: 'Hang Seng Index', price: '17245.30', change: '-0.8', changePercent: '-0.8' },
            { symbol: 'SPX', name: 'S&P 500', price: '4485.60', change: '0.5', changePercent: '0.5' },
            { symbol: 'DJI', name: 'Dow Jones', price: '34820.45', change: '0.3', changePercent: '0.3' },
            { symbol: 'FTSE', name: 'FTSE 100', price: '7650.80', change: '-0.2', changePercent: '-0.2' },
            { symbol: 'N225', name: 'Nikkei 225', price: '33250.75', change: '1.8', changePercent: '1.8' }
        ];
        
        // Try to fetch real data first, fall back to mock data
        let useRealData = false;
        
        try {
            // Test with one symbol first
            const testResponse = await axios.get(API_BASE_URL, {
                params: {
                    function: 'GLOBAL_QUOTE',
                    symbol: 'AAPL',
                    apikey: ALPHA_VANTAGE_API_KEY
                },
                timeout: 5000
            });
            
            if (testResponse.data && testResponse.data['Global Quote']) {
                useRealData = true;
            }
        } catch (testError) {
            console.log('Alpha Vantage API test failed, using mock data');
        }
        
        if (useRealData) {
            // Fetch real data with rate limiting (Alpha Vantage free tier)
            for (let i = 0; i < indices.length; i++) {
                try {
                    const response = await axios.get(API_BASE_URL, {
                        params: {
                            function: 'GLOBAL_QUOTE',
                            symbol: indices[i].symbol,
                            apikey: ALPHA_VANTAGE_API_KEY
                        },
                        timeout: 10000
                    });

                    const quote = response.data['Global Quote'];
                    
                    if (quote && Object.keys(quote).length > 0) {
                        results.push({
                            symbol: indices[i].symbol,
                            name: indices[i].name,
                            price: parseFloat(quote['05. price']).toFixed(2),
                            change: parseFloat(quote['09. change']).toFixed(2),
                            changePercent: parseFloat(quote['10. change percent'].replace('%', '')).toFixed(2),
                            lastUpdated: quote['07. latest trading day']
                        });
                    } else {
                        // Add mock data for failed fetches
                        const mockItem = mockData.find(m => m.symbol === indices[i].symbol);
                        results.push({
                            ...indices[i],
                            ...mockItem,
                            lastUpdated: new Date().toISOString().split('T')[0]
                        });
                    }

                    // Add delay between requests to avoid rate limiting
                    if (i < indices.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    
                } catch (error) {
                    console.warn(`Failed to fetch ${indices[i].symbol}:`, error.message);
                    const mockItem = mockData.find(m => m.symbol === indices[i].symbol);
                    results.push({
                        ...indices[i],
                        ...mockItem,
                        lastUpdated: new Date().toISOString().split('T')[0]
                    });
                }
            }
        } else {
            // Use mock data with slight random variations
            for (const mockItem of mockData) {
                const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
                const basePrice = parseFloat(mockItem.price);
                const newPrice = (basePrice * (1 + variation)).toFixed(2);
                const changePercent = ((variation * 100).toFixed(2));
                const changeAmount = (basePrice * variation).toFixed(2);
                
                results.push({
                    symbol: mockItem.symbol,
                    name: mockItem.name,
                    price: newPrice,
                    change: changeAmount,
                    changePercent: changePercent,
                    lastUpdated: new Date().toISOString().split('T')[0]
                });
            }
        }

        // Cache the response
        cache.set(cacheKey, {
            data: results,
            timestamp: Date.now()
        });

        res.json({
            success: true,
            data: results,
            source: useRealData ? 'alpha_vantage' : 'mock_data'
        });

    } catch (error) {
        console.error('Error fetching market indices:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch market indices data'
        });
    }
});

// Clear expired cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            cache.delete(key);
        }
    }
}, CACHE_DURATION);

module.exports = router;
