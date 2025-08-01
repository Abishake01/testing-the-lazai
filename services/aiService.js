const axios = require('axios');
const logger = require('../config/logger');

class AIService {
  constructor() {
    this.apiUrl = process.env.AI_API_URL;
    this.apiKey = process.env.AI_API_KEY;
  }

  /**
   * Generate AI response for dispute resolution
   */
  async resolveDispute(disputeData) {
    try {
      const prompt = this.buildPrompt(disputeData);
      
      const response = await axios.post(this.apiUrl, {
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are an AI expert in blockchain transaction analysis and dispute resolution. You analyze transaction data, logs, and user disputes to provide clear, actionable solutions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      if (response.data && response.data.choices && response.data.choices[0]) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error('Invalid response format from AI API');
      }
    } catch (error) {
      logger.error('AI service error:', error.message);
      throw new Error(`AI service failed: ${error.message}`);
    }
  }

  /**
   * Build comprehensive prompt for AI analysis
   */
  buildPrompt(disputeData) {
    const {
      txHash,
      contractAddress,
      toAddress,
      disputeDescription,
      parsedLogs,
      contractState,
      transactionStatus,
      transactionDetails
    } = disputeData;

    let prompt = `You are an AI resolving blockchain transaction disputes on the Monad Testnet. Analyze the following data and provide a clear, actionable solution:

TRANSACTION DETAILS:
- Transaction Hash: ${txHash}
- Contract Address: ${contractAddress}
- Recipient Address: ${toAddress}
- Transaction Status: ${transactionStatus || 'Unknown'}

USER DISPUTE:
${disputeDescription}

BLOCKCHAIN DATA:
- Contract Type: ${parsedLogs.contractType || 'Unknown'}
- Contract Info: ${JSON.stringify(parsedLogs.contractInfo, null, 2)}
- Transfer Events: ${JSON.stringify(parsedLogs.transfers, null, 2)}
- Transfer Failures: ${JSON.stringify(parsedLogs.failures || [], null, 2)}
- Partial Transfers: ${JSON.stringify(parsedLogs.partialTransfers || [], null, 2)}
- Contract State: ${JSON.stringify(contractState, null, 2)}

ANALYSIS REQUIREMENTS:
1. Verify if ${toAddress} received tokens/NFTs based on the transfer events
2. Check current balances and ownership status
3. Identify any discrepancies between user expectations and actual blockchain state
4. Detect user sentiment (frustration, confusion, etc.)
5. Determine if full refund, partial refund, or no refund is warranted
6. Detect fake disputes (e.g., claiming non-delivery when logs show successful transfer)

Please provide your analysis in the following format:

ANALYSIS:
[Your detailed analysis of the dispute and blockchain data]

VERIFICATION:
[What you found regarding token/NFT transfers to the recipient address]

ISSUES IDENTIFIED:
[List any discrepancies or problems found]

REFUND RECOMMENDATION:
[Full refund / Partial refund / No refund - with clear reasoning]

SOLUTION:
[Clear, actionable steps the user should take]

SENTIMENT:
[Analysis of user's emotional state and concerns]`;

    return prompt;
  }

  /**
   * Validate AI API configuration
   */
  validateConfig() {
    if (!this.apiUrl) {
      throw new Error('AI_API_URL environment variable is required');
    }
    if (!this.apiKey) {
      throw new Error('AI_API_KEY environment variable is required');
    }
  }
}

module.exports = new AIService(); 