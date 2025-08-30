const ResponseHandler = require('../utils/responseHandler');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

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
  return ResponseHandler.error(res, err.status || 500, err.message || 'Internal Server Error', err);
};

module.exports = errorHandler;
