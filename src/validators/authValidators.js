const { body, validationResult } = require('express-validator');
const logger = require('../config/logger');

/**
 * Authentication Validators
 * 
 * This module provides comprehensive validation for authentication endpoints
 * using express-validator with custom validation rules.
 */

/**
 * Validation result handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    logger.warn('Validation failed:', {
      errors: formattedErrors,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }
  
  next();
};

/**
 * Email validation rule
 */
const emailValidation = body('email')
  .optional()
  .isEmail()
  .withMessage('Please provide a valid email address')
  .normalizeEmail()
  .isLength({ max: 254 })
  .withMessage('Email address is too long');

/**
 * Password validation rule
 */
const passwordValidation = body('password')
  .isLength({ min: 8, max: 128 })
  .withMessage('Password must be between 8 and 128 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  .matches(/^[a-zA-Z\d@$!%*?&]+$/)
  .withMessage('Password can only contain letters, numbers, and special characters @$!%*?&');

/**
 * Full name validation rule
 */
const fullNameValidation = body('fullName')
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage('Full name must be between 2 and 50 characters')
  .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
  .withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes')
  .custom((value) => {
    const words = value.trim().split(/\s+/);
    if (words.length < 2) {
      throw new Error('Please enter your first and last name');
    }
    return true;
  });

/**
 * Phone number validation rule
 */
const phoneNumberValidation = body('phoneNumber')
  .trim()
  .isLength({ min: 9, max: 15 })
  .withMessage('Phone number must be between 9 and 15 digits')
  .matches(/^\+?[1-9]\d{1,14}$/)
  .withMessage('Please provide a valid phone number')
  .customSanitizer((value) => {
    // Remove all non-digit characters except +
    return value.replace(/[^\d+]/g, '');
  });

/**
 * Password confirmation validation rule
 */
const passwordConfirmationValidation = body('confirmPassword')
  .custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  });

/**
 * Registration validation rules
 */
const validateRegistration = [
  fullNameValidation,
  phoneNumberValidation,
  emailValidation,
  passwordValidation,
  passwordConfirmationValidation,
  handleValidationErrors,
];

/**
 * Login validation rules
 */
const validateLogin = [
  phoneNumberValidation,
  passwordValidation,
  handleValidationErrors,
];

/**
 * Password change validation rules
 */
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  passwordValidation,
  passwordConfirmationValidation,
  handleValidationErrors,
];

/**
 * Profile update validation rules
 */
const validateProfileUpdate = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
    .withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes'),
  emailValidation,
  handleValidationErrors,
];

/**
 * Password reset request validation rules
 */
const validatePasswordResetRequest = [
  phoneNumberValidation,
  handleValidationErrors,
];

/**
 * Password reset validation rules
 */
const validatePasswordReset = [
  phoneNumberValidation,
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('Reset code must be exactly 6 digits')
    .isNumeric()
    .withMessage('Reset code must contain only numbers'),
  passwordValidation,
  passwordConfirmationValidation,
  handleValidationErrors,
];

/**
 * Token validation middleware
 */
const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required',
    });
  }
  
  const token = authHeader.substring(7);
  
  if (!token || token.length < 10) {
    return res.status(401).json({
      success: false,
      message: 'Invalid access token format',
    });
  }
  
  req.token = token;
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validatePasswordChange,
  validateProfileUpdate,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateToken,
  handleValidationErrors,
};
