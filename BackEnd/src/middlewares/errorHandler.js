const ResponseHandler = require('../utils/responseHandler');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  console.error('Stack trace:', err.stack);

  // Sequelize database connection errors
  if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
    console.error('Database connection error:', err.message);
    return ResponseHandler.error(res, 503, 'Database connection failed. Please try again later.', 
      process.env.NODE_ENV === 'development' ? err.message : undefined);
  }

  // Sequelize timeout errors
  if (err.name === 'SequelizeTimeoutError') {
    console.error('Database timeout error:', err.message);
    return ResponseHandler.error(res, 504, 'Database request timeout. Please try again later.',
      process.env.NODE_ENV === 'development' ? err.message : undefined);
  }

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message
    }));
    return ResponseHandler.validationError(res, 'Validation Error', errors);
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: `${error.path} already exists`
    }));
    return ResponseHandler.validationError(res, 'Duplicate Entry', errors);
  }

  // Sequelize database errors
  if (err.name === 'SequelizeDatabaseError') {
    console.error('Database error:', err.message);
    return ResponseHandler.error(res, 500, 'Database error occurred',
      process.env.NODE_ENV === 'development' ? err.message : undefined);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ResponseHandler.unauthorized(res, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return ResponseHandler.unauthorized(res, 'Token expired');
  }

  // Cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return ResponseHandler.validationError(res, 'Invalid ID format');
  }

  // Default error
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return ResponseHandler.error(res, statusCode, message, 
    process.env.NODE_ENV === 'development' ? err : undefined);
};

module.exports = errorHandler;
