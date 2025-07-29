const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import middleware
const { createRateLimit, securityHeaders, errorHandler, notFoundHandler } = require('./middleware/security');

// Import routes
const portfolioRoutes = require('./routes/portfolios');
const portfolioItemRoutes = require('./routes/portfolioItems');
const adminRoutes = require('./routes/admin');
const marketRoutes = require('./routes/market');
const transactionRoutes = require('./routes/transactions');

// Import database and swagger
const { testConnection } = require('./config/database');
const { specs, swaggerUi, swaggerOptions } = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(securityHeaders);
app.use(createRateLimit());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Portfolio Management API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Redirect root to API documentation
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// API routes
app.use('/api/portfolios', portfolioRoutes);
app.use('/api', portfolioItemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/transactions', transactionRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Please check your database configuration.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`
╭─────────────────────────────────────────╮
│       Portfolio Management API          │
├─────────────────────────────────────────┤
│ Server running on: http://localhost:${PORT}  │
│ API Documentation: http://localhost:${PORT}/api-docs │
│ Health Check: http://localhost:${PORT}/health        │
│ Environment: ${process.env.NODE_ENV || 'development'}                   │
╰─────────────────────────────────────────╯
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
