const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

/**
 * Check environment setup
 */
async function checkSetup() {
  console.log('🔍 Checking Environment Setup...\n');

  // Check required environment variables
  const required = ['MONAD_RPC_URL', 'AI_API_URL', 'AI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(key => {
      console.log(`   - ${key}`);
    });
    console.log('\n💡 Please set these in your .env file');
    console.log('   Copy monad.env.example to .env and fill in the values');
    return false;
  } else {
    console.log('✅ All required environment variables are set');
  }

  // Check if server is running
  try {
    console.log('\n🔍 Checking if server is running...');
    const response = await axios.get('http://localhost:3000/api/v1/health', { timeout: 5000 });
    
    if (response.data.success) {
      console.log('✅ Server is running and healthy');
      console.log(`   Blockchain: ${response.data.data.blockchain.network}`);
      console.log(`   Chain ID: ${response.data.data.blockchain.chainId}`);
      console.log(`   Services: ${JSON.stringify(response.data.data.services)}`);
    } else {
      console.log('⚠️  Server is running but health check failed');
    }
    return true;
  } catch (error) {
    console.log('❌ Server is not running');
    console.log('💡 Please start the server:');
    console.log('   npm start');
    console.log('   or');
    console.log('   npm run dev');
    return false;
  }
}

/**
 * Test transaction logs endpoint
 */
async function testTransactionLogs() {
  console.log('\n🧪 Testing Transaction Logs Endpoint...\n');

  const testData = {
    txHash: '0xd98e4049a88ad4010a69ba2bf5d7a427fd07a814fe4120d43c72dda9157120b2',
    contractAddress: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701'
  };

  try {
    console.log('📋 Test Transaction:');
    console.log(`   Hash: ${testData.txHash}`);
    console.log(`   Contract: ${testData.contractAddress}`);
    console.log(`   Explorer: https://testnet.monadexplorer.com/tx/${testData.txHash}`);

    const response = await axios.post('http://localhost:3000/api/v1/getTransactionLogs', testData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    if (response.data.success) {
      const data = response.data.data;
      console.log('\n✅ Transaction Logs Retrieved Successfully!');
      console.log(`   Status: ${data.transactionStatus}`);
      console.log(`   Block: ${data.blockNumber}`);
      console.log(`   Gas Used: ${data.gasUsed}`);
      console.log(`   Total Logs: ${data.parsedLogs.totalLogs}`);
      console.log(`   Contract Logs: ${data.parsedLogs.contractLogs}`);
      
      if (data.parsedLogs.transfers.length > 0) {
        console.log(`   Transfer Events: ${data.parsedLogs.transfers.length}`);
      }
      if (data.parsedLogs.failures.length > 0) {
        console.log(`   Failure Events: ${data.parsedLogs.failures.length}`);
      }
      if (data.parsedLogs.partialTransfers.length > 0) {
        console.log(`   Partial Transfer Events: ${data.parsedLogs.partialTransfers.length}`);
      }
    } else {
      console.log('❌ API returned error:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.error || error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Monad Testnet Blockchain Dispute Resolver - Setup Check\n');

  const setupOk = await checkSetup();
  
  if (setupOk) {
    await testTransactionLogs();
  }

  console.log('\n📝 Next Steps:');
  console.log('   1. If setup is complete, run: npm run test:logs');
  console.log('   2. For manual testing, use the curl command shown in the test output');
  console.log('   3. Check logs/combined.log for detailed information');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkSetup, testTransactionLogs }; 