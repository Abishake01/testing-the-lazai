# Environment Setup Guide for Monad Testnet Blockchain Dispute Resolution

This guide will help you set up all the necessary environment variables and services for the Monad Testnet blockchain dispute resolution system.

## 🚀 Quick Start

1. **Copy the environment template**:
   ```bash
   cp monad.env.example .env
   ```

2. **Edit the `.env` file** with your configuration (see details below)

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

## 📋 Required Environment Variables

### 🔗 Monad Testnet Configuration

```env
# Monad Testnet RPC Configuration (REQUIRED)
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
```

**What you need:**
- ✅ **No API key required** - Monad Testnet RPC is public
- ✅ **Free to use** - No rate limits for basic usage
- ✅ **EVM compatible** - Supports all Ethereum tools

**Alternative RPC URLs:**
```env
# Primary Monad Testnet RPC
MONAD_RPC_URL=https://testnet-rpc.monad.xyz

# Backup RPC (if needed)
MONAD_RPC_URL=https://testnet-rpc.monad.xyz:8545
```

### 🤖 AI Service Configuration (REQUIRED)

```env
# Groq AI API Configuration
AI_API_URL=https://api.groq.com/openai/v1/chat/completions
AI_API_KEY=your_groq_api_key_here
```

**How to get Groq API Key:**

1. **Visit [Groq Console](https://console.groq.com/)**
2. **Sign up/Login** to your account
3. **Navigate to API Keys** section
4. **Create a new API key**
5. **Copy the key** and paste it in your `.env` file

**Alternative AI Services:**
```env
# OpenAI (if you prefer)
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_API_KEY=your_openai_api_key_here

# Anthropic Claude (if you prefer)
AI_API_URL=https://api.anthropic.com/v1/messages
AI_API_KEY=your_anthropic_api_key_here
```

### 🗄️ Database Configuration (OPTIONAL)

#### MongoDB Setup (Recommended for production)

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/blockchain-disputes
```

**Local MongoDB Setup:**
```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt update
sudo apt install mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Check status
sudo systemctl status mongodb
```

**MongoDB Atlas (Cloud - Recommended):**
1. **Visit [MongoDB Atlas](https://www.mongodb.com/atlas)**
2. **Create free account**
3. **Create a new cluster**
4. **Get connection string**
5. **Replace in .env:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blockchain-disputes
   ```

#### Redis Setup (Optional - for caching)

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
```

**Local Redis Setup:**
```bash
# Install Redis (Ubuntu/Debian)
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Check status
sudo systemctl status redis-server
```

**Redis Cloud (Alternative):**
1. **Visit [Redis Cloud](https://redis.com/try-free/)**
2. **Create free account**
3. **Create database**
4. **Get connection details**
5. **Update .env:**
   ```env
   REDIS_URL=redis://username:password@host:port
   REDIS_PASSWORD=your_redis_password
   ```

### 🔒 Security Configuration

```env
# Security Settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**What these do:**
- `RATE_LIMIT_WINDOW_MS`: Time window for rate limiting (15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window (100 requests)

### 🖥️ Server Configuration

```env
# Server Configuration
PORT=3000
NODE_ENV=development
```

**Port Configuration:**
- `PORT=3000` - Default port for development
- `PORT=8080` - Common production port
- `PORT=80` - Standard HTTP port (requires sudo)

## 📝 Complete .env Example

```env
# ========================================
# MONAD TESTNET BLOCKCHAIN DISPUTE RESOLVER
# ========================================

# Server Configuration
PORT=3000
NODE_ENV=development

# ========================================
# MONAD TESTNET CONFIGURATION (REQUIRED)
# ========================================
MONAD_RPC_URL=https://testnet-rpc.monad.xyz

# ========================================
# AI SERVICE CONFIGURATION (REQUIRED)
# ========================================
AI_API_URL=https://api.groq.com/openai/v1/chat/completions
AI_API_KEY=your_groq_api_key_here

# ========================================
# DATABASE CONFIGURATION (OPTIONAL)
# ========================================
# MongoDB (for dispute history)
MONGODB_URI=mongodb://localhost:27017/blockchain-disputes

# Redis (for caching)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# ========================================
# SECURITY CONFIGURATION
# ========================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🧪 Testing Your Setup

### 1. Test Environment Variables

```bash
# Test if all required variables are set
node -e "
const dotenv = require('dotenv');
dotenv.config();

const required = ['MONAD_RPC_URL', 'AI_API_URL', 'AI_API_KEY'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.log('❌ Missing required environment variables:', missing);
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!');
}
"
```

### 2. Test Monad Testnet Connection

```bash
# Test blockchain connection
curl -X POST http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "blockchain": {
      "network": "monad-testnet",
      "chainId": 1337
    },
    "services": {
      "blockchain": "connected",
      "ai": "configured",
      "database": "connected"
    }
  }
}
```

### 3. Test Transaction Logs Endpoint

```bash
# Test with a sample transaction
curl -X POST http://localhost:3000/api/v1/getTransactionLogs \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "0xd98e4049a88ad4010a69ba2bf5d7a427fd07a814fe4120d43c72dda9157120b2",
    "contractAddress": "0x..."
  }'
```

## 🔧 Troubleshooting

### ❌ "Failed to initialize provider"

**Solution:**
1. Check your `MONAD_RPC_URL` is correct
2. Ensure you have internet connection
3. Try the backup RPC URL

### ❌ "AI service failed"

**Solution:**
1. Verify your `AI_API_KEY` is correct
2. Check your Groq account has credits
3. Ensure `AI_API_URL` is correct

### ❌ "MongoDB connection failed"

**Solution:**
1. Start MongoDB service: `sudo systemctl start mongodb`
2. Check MongoDB is running: `sudo systemctl status mongodb`
3. Verify connection string in `.env`

### ❌ "Redis connection failed"

**Solution:**
1. Start Redis service: `sudo systemctl start redis-server`
2. Check Redis is running: `sudo systemctl status redis-server`
3. Verify Redis URL in `.env`

## 🚀 Production Deployment

### Environment Variables for Production

```env
# Production Configuration
NODE_ENV=production
PORT=8080

# Use production AI service
AI_API_URL=https://api.groq.com/openai/v1/chat/completions
AI_API_KEY=your_production_groq_api_key

# Use cloud databases
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blockchain-disputes
REDIS_URL=redis://username:password@host:port

# Stricter rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
```

### Security Checklist

- ✅ **Environment variables** are set
- ✅ **API keys** are secure and not in code
- ✅ **Rate limiting** is configured
- ✅ **CORS** is properly set
- ✅ **HTTPS** is enabled (for production)
- ✅ **Firewall** rules are configured

## 📚 Additional Resources

### Monad Testnet Resources

- **RPC URL**: https://testnet-rpc.monad.xyz
- **Explorer**: https://testnet.monadexplorer.com
- **Faucet**: https://faucet.monad.xyz
- **Documentation**: https://docs.monad.xyz

### AI Service Resources

- **Groq Console**: https://console.groq.com
- **OpenAI API**: https://platform.openai.com
- **Anthropic Claude**: https://console.anthropic.com

### Database Resources

- **MongoDB Atlas**: https://www.mongodb.com/atlas
- **Redis Cloud**: https://redis.com/try-free/

## 🎯 Quick Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Test the API
npm run test:logs

# Check health
curl http://localhost:3000/api/v1/health
```

## 📞 Support

If you encounter issues:

1. **Check the logs**: `tail -f logs/combined.log`
2. **Verify environment**: Run the test script above
3. **Check services**: Ensure MongoDB/Redis are running
4. **Test connectivity**: Try the health endpoint

---

**Happy coding! 🚀** 