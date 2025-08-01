# Monad Testnet Blockchain Dispute Resolution System

A complete system for creating, deploying, and analyzing a dummy Solidity smart contract on the Monad Testnet to simulate transaction failures and resolve disputes using AI.

## 🚀 Features

- **Smart Contract**: `DummyDisputeContract.sol` with intentional failure scenarios
- **Deployment**: Hardhat script for Monad Testnet deployment
- **Backend API**: Node.js/Express server for dispute resolution
- **AI Integration**: Groq API for intelligent dispute analysis
- **Blockchain Integration**: Ethers.js for Monad Testnet interaction
- **Database**: MongoDB for dispute history storage
- **Caching**: Redis for performance optimization

## 📁 Project Structure

```
├── contracts/
│   └── DummyDisputeContract.sol    # Smart contract for Monad Testnet
├── scripts/
│   └── deploy.js                   # Hardhat deployment script
├── config/
│   ├── database.js                 # MongoDB and Redis configuration
│   └── logger.js                   # Winston logging configuration
├── models/
│   └── Dispute.js                  # Mongoose schema for disputes
├── utils/
│   ├── blockchain.js               # Ethers.js blockchain service
│   └── validation.js               # Input validation utilities
├── services/
│   └── aiService.js                # Groq AI integration
├── middleware/
│   └── validation.js               # Express middleware
├── controllers/
│   └── disputeController.js        # API endpoint handlers
├── routes/
│   └── disputeRoutes.js            # Express routes
├── test/
│   └── api-test.js                 # API testing utility
├── hardhat.config.js               # Hardhat configuration
├── package.json                    # Node.js dependencies
├── server.js                       # Express server entry point
├── monad.env.example               # Environment variables template
└── README_MONAD.md                # This file
```

## 🛠️ Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp monad.env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   # Monad Testnet RPC Configuration
   MONAD_RPC_URL=https://testnet-rpc.monad.xyz
   
   # AI API Configuration
   AI_API_URL=https://api.groq.com/openai/v1/chat/completions
   AI_API_KEY=your_groq_api_key_here
   
   # Hardhat Configuration
   PRIVATE_KEY=your_private_key_here
   MONADSCAN_API_KEY=your_monadscan_api_key_here
   
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/blockchain-disputes
   REDIS_URL=redis://localhost:6379
   ```

3. **Fund your wallet**:
   - Get MON tokens from the [Monad Testnet Faucet](https://faucet.monad.xyz)
   - Ensure your wallet has enough MON for deployment

## 🚀 Deployment

### 1. Deploy Smart Contract

```bash
# Compile contracts
npx hardhat compile

# Deploy to Monad Testnet
npx hardhat run scripts/deploy.js --network monadTestnet
```

The deployment script will:
- Deploy the `DummyDisputeContract` to Monad Testnet
- Verify the contract on MonadScan
- Mint initial tokens and NFT for testing
- Display contract address and useful links

### 2. Start the Backend Server

```bash
# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

The server will be available at `http://localhost:3000`

## 🧪 Testing the System

### Smart Contract Testing

The `DummyDisputeContract` includes several test scenarios:

1. **Successful Transfer**:
   ```solidity
   sendTokens(recipient, 500) // Should succeed
   ```

2. **Failed Transfer (Amount > 1000)**:
   ```solidity
   sendTokens(recipient, 1500) // Should fail with "Amount too high"
   ```

3. **Failed Transfer (Zero Address)**:
   ```solidity
   sendTokens(address(0), 500) // Should fail with "Invalid recipient"
   ```

4. **Partial Transfer**:
   ```solidity
   partialTransfer(recipient, 1000) // Should send 500 tokens
   ```

5. **NFT Transfer Failure**:
   ```solidity
   transferNFT(recipient, 999) // Should fail with "Token transfer blocked"
   ```

### API Testing

Use the provided test script:

```bash
node test/api-test.js
```

Or test manually with curl:

```bash
# Resolve a dispute
curl -X POST http://localhost:3000/api/v1/resolveDispute \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "0x...",
    "contractAddress": "0x...",
    "toAddress": "0x...",
    "disputeDescription": "I sent tokens but they never arrived"
  }'

# Check health
curl http://localhost:3000/api/v1/health

# Get dispute history
curl http://localhost:3000/api/v1/disputes
```

## 🔍 API Endpoints

### POST /api/v1/resolveDispute

Resolves blockchain disputes using AI analysis.

**Request Body**:
```json
{
  "txHash": "0x...",
  "contractAddress": "0x...",
  "toAddress": "0x...",
  "disputeDescription": "Description of the dispute"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "aiSolution": "AI analysis and solution",
    "parsedLogs": {
      "transfers": [...],
      "failures": [...],
      "partialTransfers": [...],
      "contractType": "MonadDummyContract"
    },
    "contractState": {
      "balances": {...},
      "ownership": {...},
      "contractInfo": {...}
    },
    "transactionStatus": "success|failed",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/v1/health

Health check endpoint.

### GET /api/v1/disputes

Retrieve dispute history from MongoDB.

## 🔧 Smart Contract Details

### DummyDisputeContract.sol

**Functions**:
- `sendTokens(address to, uint256 amount)`: Transfer tokens (fails if amount > 1000)
- `partialTransfer(address to, uint256 amount)`: Transfer half the requested amount
- `mintTokens(address to, uint256 amount)`: Mint new tokens
- `mintNFT(address to)`: Mint an NFT
- `transferNFT(address to, uint256 tokenId)`: Transfer NFT (fails for token ID 999)

**Events**:
- `Transfer`: Successful token transfer
- `TransferFailed`: Failed token transfer with reason
- `PartialTransfer`: Partial transfer with requested vs sent amounts
- `TokenMinted`: NFT minting event
- `TokenTransferFailed`: Failed NFT transfer with reason

## 🤖 AI Analysis

The AI service analyzes disputes using the following criteria:

1. **Transaction Verification**: Checks if tokens/NFTs were actually transferred
2. **Failure Analysis**: Identifies why transactions failed
3. **Partial Transfer Detection**: Determines if partial amounts were sent
4. **Fake Dispute Detection**: Identifies false claims
5. **Refund Recommendation**: Suggests full, partial, or no refund

## 🔗 Useful Links

- **Monad Testnet Faucet**: https://faucet.monad.xyz
- **MonadScan**: https://testnet.monadscan.com
- **MonadExplorer**: https://testnet.monadexplorer.com
- **Monad RPC**: https://testnet-rpc.monad.xyz

## 🛡️ Security Features

- Input validation and sanitization
- Rate limiting (100 requests per 15 minutes)
- Security headers (Helmet)
- CORS protection
- Environment variable protection
- No sensitive data logging

## 📊 Performance Optimizations

- Redis caching for logs and ABIs
- Batch queries for contract state
- Retry logic for RPC failures
- Historical log fetching (past 1000 blocks)
- Connection pooling for databases

## 🐛 Error Handling

- 400: Invalid input parameters
- 404: Transaction not found
- 500: Server errors with meaningful messages
- Graceful shutdown handling
- Unhandled promise rejection handling

## 🚀 Deployment to Production

1. **Set up environment variables** for production
2. **Configure MongoDB** and Redis instances
3. **Set up monitoring** and logging
4. **Configure reverse proxy** (nginx)
5. **Set up SSL certificates**
6. **Deploy using PM2** or Docker

## 📝 Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev

# Compile contracts
npx hardhat compile

# Run local hardhat network
npx hardhat node
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details. 