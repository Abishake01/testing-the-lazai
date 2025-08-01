const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Example transaction from Monad Explorer
const EXAMPLE_TRANSACTION = {
  txHash: '0xd98e4049a88ad4010a69ba2bf5d7a427fd07a814fe4120d43c72dda9157120b2',
  contractAddress: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701' // Replace with the actual contract address from the transaction
};

/**
 * Test the getTransactionLogs endpoint
 */
async function testGetTransactionLogs() {
  console.log('🔍 Testing Get Transaction Logs Endpoint\n');

  // First, check if server is running
  try {
    console.log('🔍 Checking if server is running...');
    await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Server is running!\n');
  } catch (error) {
    console.log('❌ Server is not running!');
    console.log('💡 Please start the server first:');
    console.log('   npm start');
    console.log('   or');
    console.log('   npm run dev');
    console.log('\nThen run this test again.\n');
    return;
  }

  try {
    console.log('📋 Example Transaction:');
    console.log(`   Transaction Hash: ${EXAMPLE_TRANSACTION.txHash}`);
    console.log(`   Contract Address: ${EXAMPLE_TRANSACTION.contractAddress}`);
    console.log(`   Explorer URL: https://testnet.monadexplorer.com/tx/${EXAMPLE_TRANSACTION.txHash}`);

    const response = await axios.post(`${API_BASE_URL}/getTransactionLogs`, {
      txHash: EXAMPLE_TRANSACTION.txHash,
      contractAddress: EXAMPLE_TRANSACTION.contractAddress
    });

    if (response.data.success) {
      const data = response.data.data;
      
      console.log('\n✅ Transaction Details:');
      console.log(`   Block Number: ${data.blockNumber}`);
      console.log(`   Status: ${data.transactionStatus}`);
      console.log(`   From: ${data.from}`);
      console.log(`   To: ${data.to}`);
      console.log(`   Value: ${data.value} wei`);
      console.log(`   Gas Used: ${data.gasUsed}`);
      console.log(`   Gas Price: ${data.effectiveGasPrice} wei`);
      
      console.log('\n📊 Parsed Logs:');
      console.log(`   Contract Type: ${data.parsedLogs.contractType || 'Unknown'}`);
      console.log(`   Total Logs: ${data.parsedLogs.totalLogs}`);
      console.log(`   Contract Logs: ${data.parsedLogs.contractLogs}`);
      
      if (data.parsedLogs.transfers.length > 0) {
        console.log('\n🔄 Transfer Events:');
        data.parsedLogs.transfers.forEach((transfer, index) => {
          console.log(`   ${index + 1}. Type: ${transfer.type}`);
          console.log(`      From: ${transfer.from}`);
          console.log(`      To: ${transfer.to}`);
          if (transfer.value) console.log(`      Value: ${transfer.value}`);
          if (transfer.amount) console.log(`      Amount: ${transfer.amount}`);
          if (transfer.tokenId) console.log(`      Token ID: ${transfer.tokenId}`);
        });
      }
      
      if (data.parsedLogs.failures.length > 0) {
        console.log('\n❌ Failure Events:');
        data.parsedLogs.failures.forEach((failure, index) => {
          console.log(`   ${index + 1}. Type: ${failure.type}`);
          console.log(`      From: ${failure.from}`);
          console.log(`      To: ${failure.to}`);
          if (failure.amount) console.log(`      Amount: ${failure.amount}`);
          if (failure.tokenId) console.log(`      Token ID: ${failure.tokenId}`);
          console.log(`      Reason: ${failure.reason}`);
        });
      }
      
      if (data.parsedLogs.partialTransfers.length > 0) {
        console.log('\n🔄 Partial Transfer Events:');
        data.parsedLogs.partialTransfers.forEach((partial, index) => {
          console.log(`   ${index + 1}. From: ${partial.from}`);
          console.log(`      To: ${partial.to}`);
          console.log(`      Requested: ${partial.requested}`);
          console.log(`      Sent: ${partial.sent}`);
        });
      }
      
      console.log('\n📋 Contract State:');
      console.log(`   Contract Info: ${JSON.stringify(data.contractState.contractInfo, null, 2)}`);
      console.log(`   Balances: ${JSON.stringify(data.contractState.balances, null, 2)}`);
      console.log(`   Ownership: ${JSON.stringify(data.contractState.ownership, null, 2)}`);
      
      console.log('\n🔍 Raw Logs:');
      data.rawLogs.forEach((log, index) => {
        console.log(`   Log ${index + 1}:`);
        console.log(`      Address: ${log.address}`);
        console.log(`      Topics: ${log.topics.join(', ')}`);
        console.log(`      Data: ${log.data}`);
        console.log(`      Log Index: ${log.logIndex}`);
      });
      
    } else {
      console.log('❌ API returned error:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.response?.data?.error || error.message);
  }
}

/**
 * Test with custom transaction
 */
async function testCustomTransaction(txHash, contractAddress) {
  console.log(`\n🔍 Testing Custom Transaction: ${txHash}`);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/getTransactionLogs`, {
      txHash,
      contractAddress
    });

    if (response.data.success) {
      const data = response.data.data;
      console.log('✅ Transaction found!');
      console.log(`   Status: ${data.transactionStatus}`);
      console.log(`   Contract Type: ${data.parsedLogs.contractType || 'Unknown'}`);
      console.log(`   Total Logs: ${data.parsedLogs.totalLogs}`);
      console.log(`   Contract Logs: ${data.parsedLogs.contractLogs}`);
      
      // Show parsed events
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
      console.log('❌ Error:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.response?.data?.error || error.message);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Transaction Logs API Tests\n');
  console.log('📋 Prerequisites:');
  console.log('   1. Make sure you have set up your .env file');
  console.log('   2. Start the server: npm start');
  console.log('   3. Ensure you have a Groq API key configured\n');

  // Test with example transaction
  await testGetTransactionLogs();
  
  // Test with custom transaction (uncomment and modify as needed)
  // await testCustomTransaction('0x...', '0x...');
  
  console.log('\n✅ All tests completed!');
  console.log('\n📝 Manual Testing:');
  console.log('   curl -X POST http://localhost:3000/api/v1/getTransactionLogs \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"txHash": "0xd98e4049a88ad4010a69ba2bf5d7a427fd07a814fe4120d43c72dda9157120b2", "contractAddress": "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701"}\'');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testGetTransactionLogs,
  testCustomTransaction,
  runTests
}; 