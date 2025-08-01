const express = require('express');
const { resolveDispute, getDisputeHistory, healthCheck, getTransactionLogs } = require('../controllers/disputeController');
const { validateDisputeRequest, createRateLimiter, securityMiddleware } = require('../middleware/validation');

const router = express.Router();

// Apply security middleware to all routes
router.use(securityMiddleware);

// Apply rate limiting
const rateLimiter = createRateLimiter();

// Health check endpoint
router.get('/health', rateLimiter, healthCheck);

// Dispute history endpoint
router.get('/disputes', rateLimiter, getDisputeHistory);

// Main dispute resolution endpoint
router.post('/resolveDispute', rateLimiter, validateDisputeRequest, resolveDispute);

// Get transaction logs endpoint
router.post('/getTransactionLogs', rateLimiter, getTransactionLogs);

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /disputes',
      'POST /resolveDispute',
      'POST /getTransactionLogs'
    ]
  });
});

module.exports = router; 