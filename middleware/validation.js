const { body, validationResult } = require('express-validator');
const { isValidTransactionHash, isValidAddress, sanitizeText } = require('../utils/validation');
const logger = require('../config/logger');

/**
 * Validation middleware for dispute resolution endpoint
 */
const validateDisputeRequest = [
  // Validate txHash
  body('txHash')
    .notEmpty()
    .withMessage('Transaction hash is required')
    .custom((value) => {
      if (!isValidTransactionHash(value)) {
        throw new Error('Invalid transaction hash format (must be 32-byte hex)');
      }
      return true;
    }),

  // Validate contractAddress
  body('contractAddress')
    .notEmpty()
    .withMessage('Contract address is required')
    .custom((value) => {
      if (!isValidAddress(value)) {
        throw new Error('Invalid contract address format');
      }
      return true;
    }),

  // Validate toAddress
  body('toAddress')
    .notEmpty()
    .withMessage('Recipient address is required')
    .custom((value) => {
      if (!isValidAddress(value)) {
        throw new Error('Invalid recipient address format');
      }
      return true;
    }),

  // Validate and sanitize disputeDescription
  body('disputeDescription')
    .notEmpty()
    .withMessage('Dispute description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Dispute description must be between 10 and 1000 characters')
    .customSanitizer((value) => sanitizeText(value)),

  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation failed:', {
        errors: errors.array(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

/**
 * Rate limiting middleware
 */
const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message = 'Too many requests') => {
  return rateLimit({
    windowMs: windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      success: false,
      error: message
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded:', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(429).json({
        success: false,
        error: message
      });
    }
  });
};

/**
 * Security middleware
 */
const helmet = require('helmet');
const cors = require('cors');

const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
];

module.exports = {
  validateDisputeRequest,
  createRateLimiter,
  securityMiddleware
}; 