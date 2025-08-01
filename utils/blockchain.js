const { ethers } = require('ethers');
const logger = require('../config/logger');
const { getRedisClient } = require('../config/database');

// Standard ERC-20 and ERC-721 ABIs
const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

const ERC721_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function balanceOf(address owner) view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)'
];

// Monad Testnet DummyDisputeContract ABI
const DUMMY_DISPUTE_CONTRACT_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 amount)',
  'event TransferFailed(address indexed from, address indexed to, uint256 amount, string reason)',
  'event PartialTransfer(address indexed from, address indexed to, uint256 requested, uint256 sent)',
  'event TokenMinted(address indexed to, uint256 tokenId)',
  'event TokenTransferFailed(address indexed from, address indexed to, uint256 tokenId, string reason)',
  'function balanceOf(address account) external view returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function getTotalSupply() external view returns (uint256)',
  'function getNextTokenId() external view returns (uint256)'
];

class BlockchainService {
  constructor() {
    this.provider = null;
    this.redisClient = getRedisClient();
    this.initProvider();
  }

  /**
   * Initialize Ethereum provider with retry logic
   */
  async initProvider() {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        // Use Monad Testnet RPC URL if available, otherwise fall back to Ethereum
        const rpcUrl = process.env.MONAD_RPC_URL || process.env.ETHEREUM_RPC_URL;
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        await this.provider.getNetwork(); // Test connection
        logger.info(`Provider initialized successfully for ${rpcUrl.includes('monad') ? 'Monad Testnet' : 'Ethereum'}`);
        break;
      } catch (error) {
        retries++;
        logger.error(`Provider initialization attempt ${retries} failed:`, error.message);
        
        if (retries >= maxRetries) {
          throw new Error('Failed to initialize provider after 3 attempts');
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
  }

  /**
   * Get transaction receipt with retry logic
   */
  async getTransactionReceipt(txHash, maxRetries = 3) {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const receipt = await this.provider.getTransactionReceipt(txHash);
        return receipt;
      } catch (error) {
        retries++;
        logger.error(`Transaction receipt fetch attempt ${retries} failed for ${txHash}:`, error.message);
        
        if (retries >= maxRetries) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(txHash) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      return tx;
    } catch (error) {
      logger.error(`Failed to get transaction ${txHash}:`, error.message);
      throw error;
    }
  }

  /**
   * Parse logs for ERC-20, ERC-721, and Monad DummyDisputeContract transfers
   */
  parseLogs(logs, contractAddress) {
    const parsedLogs = {
      transfers: [],
      failures: [],
      partialTransfers: [],
      contractType: null,
      contractInfo: {}
    };

    try {
      // Try to determine contract type and parse logs
      const erc20Contract = new ethers.Contract(contractAddress, ERC20_ABI, this.provider);
      const erc721Contract = new ethers.Contract(contractAddress, ERC721_ABI, this.provider);
      const dummyContract = new ethers.Contract(contractAddress, DUMMY_DISPUTE_CONTRACT_ABI, this.provider);

      for (const log of logs) {
        try {
          // Try to parse as ERC-20 Transfer
          const erc20Interface = new ethers.Interface(ERC20_ABI);
          const parsedLog = erc20Interface.parseLog(log);
          
          if (parsedLog && parsedLog.name === 'Transfer') {
            parsedLogs.transfers.push({
              type: 'ERC20',
              from: parsedLog.args[0],
              to: parsedLog.args[1],
              value: parsedLog.args[2].toString(),
              logIndex: log.logIndex
            });
            parsedLogs.contractType = 'ERC20';
          }
        } catch (error) {
          try {
            // Try to parse as ERC-721 Transfer
            const erc721Interface = new ethers.Interface(ERC721_ABI);
            const parsedLog = erc721Interface.parseLog(log);
            
            if (parsedLog && parsedLog.name === 'Transfer') {
              parsedLogs.transfers.push({
                type: 'ERC721',
                from: parsedLog.args[0],
                to: parsedLog.args[1],
                tokenId: parsedLog.args[2].toString(),
                logIndex: log.logIndex
              });
              parsedLogs.contractType = 'ERC721';
            }
          } catch (erc721Error) {
            try {
              // Try to parse as Monad DummyDisputeContract events
              const dummyInterface = new ethers.Interface(DUMMY_DISPUTE_CONTRACT_ABI);
              const parsedLog = dummyInterface.parseLog(log);
              
              if (parsedLog) {
                switch (parsedLog.name) {
                  case 'Transfer':
                    parsedLogs.transfers.push({
                      type: 'MonadToken',
                      from: parsedLog.args[0],
                      to: parsedLog.args[1],
                      amount: parsedLog.args[2].toString(),
                      logIndex: log.logIndex
                    });
                    parsedLogs.contractType = 'MonadDummyContract';
                    break;
                  case 'TransferFailed':
                    parsedLogs.failures.push({
                      type: 'TransferFailed',
                      from: parsedLog.args[0],
                      to: parsedLog.args[1],
                      amount: parsedLog.args[2].toString(),
                      reason: parsedLog.args[3],
                      logIndex: log.logIndex
                    });
                    parsedLogs.contractType = 'MonadDummyContract';
                    break;
                  case 'PartialTransfer':
                    parsedLogs.partialTransfers.push({
                      type: 'PartialTransfer',
                      from: parsedLog.args[0],
                      to: parsedLog.args[1],
                      requested: parsedLog.args[2].toString(),
                      sent: parsedLog.args[3].toString(),
                      logIndex: log.logIndex
                    });
                    parsedLogs.contractType = 'MonadDummyContract';
                    break;
                  case 'TokenMinted':
                    parsedLogs.transfers.push({
                      type: 'TokenMinted',
                      to: parsedLog.args[0],
                      tokenId: parsedLog.args[1].toString(),
                      logIndex: log.logIndex
                    });
                    parsedLogs.contractType = 'MonadDummyContract';
                    break;
                  case 'TokenTransferFailed':
                    parsedLogs.failures.push({
                      type: 'TokenTransferFailed',
                      from: parsedLog.args[0],
                      to: parsedLog.args[1],
                      tokenId: parsedLog.args[2].toString(),
                      reason: parsedLog.args[3],
                      logIndex: log.logIndex
                    });
                    parsedLogs.contractType = 'MonadDummyContract';
                    break;
                }
              }
            } catch (dummyError) {
              // Log is not a recognized event
              continue;
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error parsing logs:', error.message);
    }

    return parsedLogs;
  }

  /**
   * Get contract state (balances, ownership)
   */
  async getContractState(contractAddress, toAddress, parsedLogs) {
    const state = {
      balances: {},
      ownership: {},
      contractInfo: {}
    };

    try {
      if (parsedLogs.contractType === 'ERC20') {
        const contract = new ethers.Contract(contractAddress, ERC20_ABI, this.provider);
        
        // Get token info
        try {
          state.contractInfo.symbol = await contract.symbol();
          state.contractInfo.name = await contract.name();
          state.contractInfo.decimals = await contract.decimals();
        } catch (error) {
          logger.warn('Could not fetch ERC-20 contract info:', error.message);
        }

        // Get balance for toAddress
        try {
          const balance = await contract.balanceOf(toAddress);
          state.balances[toAddress] = balance.toString();
        } catch (error) {
          logger.error('Failed to get ERC-20 balance:', error.message);
        }
      } else if (parsedLogs.contractType === 'ERC721') {
        const contract = new ethers.Contract(contractAddress, ERC721_ABI, this.provider);
        
        // Get token info
        try {
          state.contractInfo.symbol = await contract.symbol();
          state.contractInfo.name = await contract.name();
        } catch (error) {
          logger.warn('Could not fetch ERC-721 contract info:', error.message);
        }

        // Get ownership for each token ID in transfers
        for (const transfer of parsedLogs.transfers) {
          if (transfer.type === 'ERC721' && transfer.to === toAddress) {
            try {
              const owner = await contract.ownerOf(transfer.tokenId);
              state.ownership[transfer.tokenId] = owner;
            } catch (error) {
              logger.error(`Failed to get owner of token ${transfer.tokenId}:`, error.message);
            }
          }
        }

        // Get balance for toAddress
        try {
          const balance = await contract.balanceOf(toAddress);
          state.balances[toAddress] = balance.toString();
        } catch (error) {
          logger.error('Failed to get ERC-721 balance:', error.message);
        }
      } else if (parsedLogs.contractType === 'MonadDummyContract') {
        const contract = new ethers.Contract(contractAddress, DUMMY_DISPUTE_CONTRACT_ABI, this.provider);
        
        // Get contract info
        try {
          state.contractInfo.totalSupply = await contract.getTotalSupply();
          state.contractInfo.nextTokenId = await contract.getNextTokenId();
        } catch (error) {
          logger.warn('Could not fetch Monad contract info:', error.message);
        }

        // Get balance for toAddress
        try {
          const balance = await contract.balanceOf(toAddress);
          state.balances[toAddress] = balance.toString();
        } catch (error) {
          logger.error('Failed to get Monad contract balance:', error.message);
        }

        // Get ownership for each token ID in transfers
        for (const transfer of parsedLogs.transfers) {
          if (transfer.type === 'TokenMinted' && transfer.to === toAddress) {
            try {
              const owner = await contract.ownerOf(transfer.tokenId);
              state.ownership[transfer.tokenId] = owner;
            } catch (error) {
              logger.error(`Failed to get owner of token ${transfer.tokenId}:`, error.message);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error getting contract state:', error.message);
    }

    return state;
  }

  /**
   * Get historical logs for contract (last 1000 blocks)
   */
  async getHistoricalLogs(contractAddress, fromBlock = null) {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const toBlock = currentBlock;
      const fromBlockNumber = fromBlock || Math.max(0, currentBlock - 1000);

      const logs = await this.provider.getLogs({
        address: contractAddress,
        fromBlock: fromBlockNumber,
        toBlock: toBlock
      });

      return logs;
    } catch (error) {
      logger.error('Error getting historical logs:', error.message);
      return [];
    }
  }

  /**
   * Cache data in Redis
   */
  async cacheData(key, data, ttl = 3600) {
    if (!this.redisClient) return;
    
    try {
      await this.redisClient.setEx(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.error('Redis cache error:', error.message);
    }
  }

  /**
   * Get cached data from Redis
   */
  async getCachedData(key) {
    if (!this.redisClient) return null;
    
    try {
      const data = await this.redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis get error:', error.message);
      return null;
    }
  }
}

module.exports = new BlockchainService(); 