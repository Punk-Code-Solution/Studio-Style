require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Import database connection
const db = require('./src/Database/models');

// Import middlewares
const errorHandler = require('./src/middlewares/errorHandler');
const { authenticateToken } = require('./src/middlewares/auth');

// Import routes
const authRoutes = require('./src/Routes/auth.routes');
const accountRoutes = require('./src/Routes/account.routes');
const companyRoutes = require('./src/Routes/company.routes');
const productRoutes = require('./src/Routes/product.routes');
const purchaseRoutes = require('./src/Routes/purchase_sale.routes');
const serviceRoutes = require('./src/Routes/service.routes');
const whatsappRoutes = require('./src/Routes/whatsapp.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Vercel (required for rate limiting)
app.set('trust proxy', 1);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Studio & Style API',
      version: '1.0.0',
      description: 'Studio & Style API Documentation'
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://studio-style-henna.vercel.app/api'
          : 'http://localhost:3001/api',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ]
  },
  apis: ['./src/Routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow all origins for simplicity
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// OPTIONS handled by CORS middleware above

// Basic logging middleware (minimal)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});
app.use(limiter);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoints removed for production

// Root endpoint info
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Studio Style API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      apiHealth: '/api/health',
      auth: '/api/auth',
      docs: '/api-docs'
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/company', authenticateToken, companyRoutes);
app.use('/api/product', authenticateToken, productRoutes);
app.use('/api/purchase', authenticateToken, purchaseRoutes);
app.use('/api/service', authenticateToken, serviceRoutes);
app.use('/api/whatsapp', authenticateToken, whatsappRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
   try {
     // Test database connection (only in development)
     if (process.env.NODE_ENV === 'development') {
        await db.sequelize.authenticate();
        await db.sequelize.sync({ alter: true });
        console.log('Database connected and synchronized');
     }

     // Start server locally
     if (process.env.NODE_ENV === 'development') {
       app.listen(PORT, () => {
         console.log(`Server running on port ${PORT}`);
       });
     }
   } catch (error) {
     console.error('Unable to start server:', error);
     if (process.env.NODE_ENV === 'development') {
       process.exit(1);
     }
   }
 };

// Initialize server
if (process.env.NODE_ENV === 'development') {
  startServer();
}

// Export app for Vercel (always export for serverless)
module.exports = app;
