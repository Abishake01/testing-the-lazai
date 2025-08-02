const blockchainService = require('../utils/blockchain');
const aiService = require('../services/aiService');
const Dispute = require('../models/Dispute');
const logger = require('../config/logger');
const { isValidTransactionHash, isValidAddress } = require('../utils/validation');

/**
 * Main dispute resolution endpoint
 */
const resolveDispute = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { txHash, contractAddress, toAddress, disputeDescription } = req.body;
    
    logger.info('Dispute resolution request received', {
      txHash,
      contractAddress,
      toAddress: toAddress || 'not provided',
      disputeDescriptionLength: disputeDescription.length
    });

    // Step 1: Get transaction receipt and details
    const [receipt, transaction] = await Promise.all([
      blockchainService.getTransactionReceipt(txHash),
      blockchainService.getTransaction(txHash)
    ]);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or not yet mined'
      });
    }

    // Step 2: Parse logs and determine contract type
    const parsedLogs = blockchainService.parseLogs(receipt.logs, contractAddress);
    
    // Step 3: Get contract state (balances, ownership)
    const contractState = await blockchainService.getContractState(
      contractAddress, 
      toAddress || null, 
      parsedLogs
    );

    // Step 4: Get historical logs if needed (last 1000 blocks)
    let historicalLogs = [];
    if (parsedLogs.transfers.length === 0) {
      historicalLogs = await blockchainService.getHistoricalLogs(contractAddress);
      const historicalParsedLogs = blockchainService.parseLogs(historicalLogs, contractAddress);
      parsedLogs.transfers.push(...historicalParsedLogs.transfers);
    }

    // Step 5: Determine transaction status and analyze patterns
    const transactionStatus = receipt.status === 1 ? 'success' : 'failed';
    const patternAnalysis = blockchainService.analyzeTransactionPattern(transaction, receipt, parsedLogs);

    // Step 6: Prepare data for AI analysis
    const disputeData = {
      txHash,
      contractAddress,
      toAddress: toAddress || null,
      disputeDescription,
      parsedLogs,
      contractState,
      transactionStatus,
      patternAnalysis,
      transactionDetails: {
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
        status: receipt.status,
        from: transaction?.from,
        to: transaction?.to,
        value: transaction?.value?.toString()
      }
    };

    // Step 7: Get AI resolution
    const aiSolution = await aiService.resolveDispute(disputeData);``

    // Step 8: Prepare response
    const response = {
      success: true,
      data: {
        txHash,
        contractAddress,
        toAddress: toAddress || null,
        transactionStatus,
        aiSolution,
        parsedLogs,
        contractState,
        transactionDetails: disputeData.transactionDetails
      }
    };

    // Step 9: Store in database if MongoDB is available
    try {
      const dispute = new Dispute({
        txHash,
        contractAddress,
        toAddress: toAddress || null,
        disputeDescription,
        aiSolution,
        parsedLogs,
        contractState,
        transactionStatus,
        resolvedAt: new Date()
      });
      await dispute.save();
      logger.info('Dispute saved to database', { txHash });
    } catch (dbError) {
      logger.warn('Failed to save dispute to database:', dbError.message);
    }

    // Step 10: Cache results
    const cacheKey = `dispute:${txHash}:${contractAddress}:${toAddress || 'null'}`;
    await blockchainService.cacheData(cacheKey, response.data, 3600); // Cache for 1 hour

    const processingTime = Date.now() - startTime;
    logger.info('Dispute resolution completed', {
      txHash,
      processingTime: `${processingTime}ms`
    });

    res.json(response);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('Dispute resolution failed', {
      error: error.message,
      stack: error.stack,
      processingTime: `${processingTime}ms`
    });

    // Handle specific error types
    if (error.message.includes('Transaction not found')) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    if (error.message.includes('AI service failed')) {
      return res.status(503).json({
        success: false,
        error: 'AI service temporarily unavailable'
      });
    }

    if (error.message.includes('Provider')) {
      return res.status(503).json({
        success: false,
        error: 'Blockchain service temporarily unavailable'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get dispute history endpoint
 */
const getDisputeHistory = async (req, res) => {
  try {
    const { txHash, limit = 10, offset = 0 } = req.query;
    
    const query = {};
    if (txHash) {
      query.txHash = txHash;
    }

    const disputes = await Dispute.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-__v');

    const total = await Dispute.countDocuments(query);

    res.json({
      success: true,
      data: {
        disputes,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get dispute history:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dispute history'
    });
  }
};

/**
 * Health check endpoint
 */
const healthCheck = async (req, res) => {
  try {
    // Check blockchain connection
    const network = await blockchainService.provider.getNetwork();
    
    // Check AI service
    aiService.validateConfig();

    res.json({
      success: true,
      data: {
        status: 'healthy',
        blockchain: {
          network: network.name,
          chainId: network.chainId
        },
        services: {
          blockchain: 'connected',
          ai: 'configured',
          database: Dispute.db.readyState === 1 ? 'connected' : 'disconnected'
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Health check failed:', error.message);
    res.status(503).json({
      success: false,
      error: 'Service unhealthy',
      details: error.message
    });
  }
};

/**
 * Get transaction logs by transaction hash and contract address
 */
async function getTransactionLogs(req, res) {
  try {
    const { txHash, contractAddress } = req.body;

    // Validate inputs
    if (!txHash || !contractAddress) {
      return res.status(400).json({
        success: false,
        error: 'Both txHash and contractAddress are required'
      });
    }

    // Validate transaction hash format
    if (!isValidTransactionHash(txHash)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction hash format'
      });
    }

    // Validate contract address format
    if (!isValidAddress(contractAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contract address format'
      });
    }

    logger.info('Fetching transaction logs', {
      txHash,
      contractAddress,
      ip: req.ip
    });

    // Get transaction receipt
    const receipt = await blockchainService.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Get transaction details
    const transaction = await blockchainService.getTransaction(txHash);
    
    // Parse logs for the specific contract
    const parsedLogs = blockchainService.parseLogs(receipt.logs || [], contractAddress);
    
    // Get contract state
    const contractState = await blockchainService.getContractState(contractAddress, null, parsedLogs);

    // Prepare response with safe property access
    const response = {
      success: true,
      data: {
        transactionHash: txHash,
        contractAddress: contractAddress,
        blockNumber: receipt.blockNumber || 0,
        transactionStatus: receipt.status === 1 ? 'success' : 'failed',
        gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : '0',
        effectiveGasPrice: receipt.effectiveGasPrice ? receipt.effectiveGasPrice.toString() : '0',
        from: transaction?.from || 'unknown',
        to: transaction?.to || 'unknown',
        value: transaction?.value ? transaction.value.toString() : '0',
        parsedLogs: {
          contractType: parsedLogs.contractType || 'unknown',
          transfers: parsedLogs.transfers || [],
          failures: parsedLogs.failures || [],
          partialTransfers: parsedLogs.partialTransfers || [],
          unknownEvents: parsedLogs.unknownEvents || [],
          totalLogs: receipt.logs ? receipt.logs.length : 0,
          contractLogs: (parsedLogs.transfers?.length || 0) + (parsedLogs.failures?.length || 0) + (parsedLogs.partialTransfers?.length || 0) + (parsedLogs.unknownEvents?.length || 0)
        },
        contractState: contractState || {},
        rawLogs: receipt.logs ? receipt.logs.map(log => ({
          address: log.address || 'unknown',
          topics: log.topics || [],
          data: log.data || '',
          logIndex: log.logIndex || 0,
          transactionIndex: log.transactionIndex || 0,
          blockNumber: log.blockNumber || 0
        })) : [],
        timestamp: new Date().toISOString()
      }
    };

    // Cache the result
    await blockchainService.cacheData(`logs:${txHash}:${contractAddress}`, response.data, 3600);

    res.json(response);

  } catch (error) {
    logger.error('Error fetching transaction logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction logs',
      details: error.message
    });
  }
}

module.exports = {
  resolveDispute,
  getDisputeHistory,
  healthCheck,
  getTransactionLogs
}; 