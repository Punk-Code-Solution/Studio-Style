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

// Import routes
const authRoutes = require('./src/Routes/auth.routes');
const accountRoutes = require('./src/Routes/account.routes');
const companyRoutes = require('./src/Routes/company.routes');
const productRoutes = require('./src/Routes/product.routes');
const purchaseRoutes = require('./src/Routes/purchase_sale.routes');
const serviceRoutes = require('./src/Routes/service.routes');
const loginRoutes = require('./src/Routes/login.routes');
const whatsappRoutes = require('./src/Routes/whatsapp.routes');

const app = express();
const PORT = process.env.PORT || 3001;

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
        url: `http://localhost:${PORT}`,
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
// const corsOptions = {
//   origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:3001'],
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   credentials: true,
//   optionsSuccessStatus: 204
// };
// app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Logging middleware
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// } else {
//   app.use(morgan('combined'));
// }

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Server is running',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development'
//   });
// });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/product', productRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

// Global error handler (must be last)
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
   try {
     // Test database connection
     await db.sequelize.authenticate();
     console.log('✅ Database connection established successfully.');

     // Sync database (in development)
     if (process.env.NODE_ENV === 'development') {
       await db.sequelize.sync({ alter: true });
       console.log('✅ Database synchronized.');
     }

     // Start server
     app.listen(PORT, () => {
       console.log(`🚀 Server is running on port ${PORT}`);
       console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
       console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
     });
   } catch (error) {
     console.error('❌ Unable to start server:', error);
     process.exit(1);
   }
 };

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
// startServer();
