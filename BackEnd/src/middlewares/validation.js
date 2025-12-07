const { validationResult, body, param, query } = require('express-validator');
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
  body('service')
    .notEmpty()
    .withMessage('Service name is required')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Service name must be between 2 and 255 characters'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('commission_rate')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Commission rate must be between 0 and 1'),
  body('additionalComments')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Additional comments must be less than 1000 characters'),
  handleValidationErrors
];

/**
 * Validation rules for service update
 */
const validateServiceUpdate = [
  body('id')
    .notEmpty()
    .withMessage('Service ID is required'),
  body('service')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Service name must be between 2 and 255 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('commission_rate')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Commission rate must be between 0 and 1'),
  body('additionalComments')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Additional comments must be less than 1000 characters'),
  handleValidationErrors
];

/**
 * Validation rules for service ID parameter
 */
const validateServiceId = [
  param('id')
    .notEmpty()
    .withMessage('Service ID is required')
    .isUUID()
    .withMessage('Service ID must be a valid UUID'),
  handleValidationErrors
];

/**
 * Validation rules for service query ID
 */
const validateServiceQueryId = [
  query('id')
    .notEmpty()
    .withMessage('Service ID is required')
    .isUUID()
    .withMessage('Service ID must be a valid UUID'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateAccountCreation,
  validateAccountUpdate,
  validateLogin,
  validateProductCreation,
  validateServiceCreation,
  validateServiceUpdate,
  validateServiceId,
  validateServiceQueryId
};
