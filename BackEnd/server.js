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
      description: 'Studio & Style API Documentation',
      contact: {
        name: 'API Support',
        email: 'punkcodesolution@gmail.com'
      }
    },
    servers: [
      {
        url: `https://studio-style.vercel.app/api`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/Routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Don't block requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all localhost origins for development
    if (origin.startsWith('http://localhost')) {
      return callback(null, true);
    }
    
    // Allow all Vercel app domains
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // Allow specific production domains
    const allowedOrigins = [
      'https://studio-style.vercel.app',
      'https://studio-style-henna.vercel.app'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Block everything else
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

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

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

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

// Handle preflight OPTIONS requests globally
app.options('*', (req, res) => {
  res.status(200).end();
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
     // Test database connection (optional for Vercel)
     if (process.env.NODE_ENV === 'development') {
        await db.sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
        await db.sequelize.sync({ alter: true });
        console.log('✅ Database synchronized.');
     } else {
        // In production, try to connect but don't fail if DB is not available
        try {
          await db.sequelize.authenticate();
          console.log('✅ Database connection established in production.');
        } catch (dbError) {
          console.warn('⚠️ Database connection failed in production, continuing without DB:', dbError.message);
        }
     }

     // For local development only
     if (process.env.NODE_ENV === 'development') {
       app.listen(PORT, () => {
         console.log(`🚀 Server is running on port ${PORT}`);
         console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
         console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
       });
     }
   } catch (error) {
     console.error('❌ Unable to start server:', error);
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

// // Graceful shutdown
// process.on('SIGTERM', async () => {
//   console.log('SIGTERM received, shutting down gracefully');
//   await db.sequelize.close();
//   process.exit(0);
// });

// process.on('SIGINT', async () => {
//   console.log('SIGINT received, shutting down gracefully');
//   await db.sequelize.close();
//   process.exit(0);
// });

// // Start the server
startServer();
