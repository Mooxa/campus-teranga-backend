const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');

/**
 * Security Configuration
 * 
 * This module provides comprehensive security middleware
 * for the Express application.
 */

/**
 * Rate limiting configuration
 */
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: message || 'Too many requests from this IP, please try again later.',
        retryAfter: Math.round(windowMs / 1000),
      });
    },
  });
};

// General rate limiting
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiting for auth endpoints
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many authentication attempts, please try again later.'
);

// Password reset rate limiting
const passwordResetLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // limit each IP to 3 password reset requests per hour
  'Too many password reset attempts, please try again later.'
);

/**
 * Speed limiting configuration
 */
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: (used, req) => {
    const delayAfter = req.slowDown.limit;
    return (used - delayAfter) * 500;
  },
  maxDelayMs: 20000, // max delay of 20 seconds
});

/**
 * Helmet configuration for security headers
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

/**
 * CORS configuration
 */
const corsConfig = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001', // Admin dashboard local development
      'http://localhost:3002', // Alternative admin port
      'http://192.168.1.2:3000', // iOS simulator access
      'http://192.168.1.2:3001', // iOS simulator admin access
      'https://campus-teranga-admin.vercel.app',
      'https://campus-teranga-admin-git-main.vercel.app',
      'https://campus-teranga-admin-git-develop.vercel.app',
      'https://campus-teranga-admin-git-main-mooxa.vercel.app',
      'https://campus-teranga-admin-git-develop-mooxa.vercel.app',
    ];
    
    // Allow localhost and local network for development
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || 
          origin.includes('127.0.0.1') || 
          origin.includes('192.168.1.2')) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  optionsSuccessStatus: 200,
};

/**
 * XSS sanitization function
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj) => {
  if (typeof obj === 'string') {
    return xss(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Security middleware array
 */
const securityMiddleware = [
  // Security headers
  helmetConfig,
  
  // Rate limiting
  generalLimiter,
  speedLimiter,
  
  // Input sanitization
  mongoSanitize(), // Prevent NoSQL injection
  sanitizeInput, // XSS protection
  hpp(), // Prevent parameter pollution
  
  // Body parsing (should be after sanitization)
  // This will be added in the main app configuration
];

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  speedLimiter,
  helmetConfig,
  corsConfig,
  sanitizeInput,
  securityMiddleware,
};
