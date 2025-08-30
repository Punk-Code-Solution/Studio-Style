const { validationResult } = require('express-validator');
const ResponseHandler = require('../utils/responseHandler');

/**
 * Middleware to handle validation results
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return ResponseHandler.validationError(res, 'Validation failed', formattedErrors);
  }
  
  next();
};

/**
 * Validation rules for account creation
 */
const validateAccountCreation = [
  // Add your validation rules here
  handleValidationErrors
];

/**
 * Validation rules for account update
 */
const validateAccountUpdate = [
  // Add your validation rules here
  handleValidationErrors
];

/**
 * Validation rules for login
 */
const validateLogin = [
  // Add your validation rules here
  handleValidationErrors
];

/**
 * Validation rules for product creation
 */
const validateProductCreation = [
  // Add your validation rules here
  handleValidationErrors
];

/**
 * Validation rules for service creation
 */
const validateServiceCreation = [
  // Add your validation rules here
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateAccountCreation,
  validateAccountUpdate,
  validateLogin,
  validateProductCreation,
  validateServiceCreation
};
