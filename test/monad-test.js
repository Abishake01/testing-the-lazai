const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';
const TEST_CONTRACT_ADDRESS = '0x...'; // Replace with your deployed contract address
const TEST_RECIPIENT_ADDRESS = '0x...'; // Replace with a test recipient address

// Sample transaction hashes for testing (replace with actual transaction hashes)
const TEST_TRANSACTIONS = {
  successful: '0x...', // A successful sendTokens transaction
  failed: '0x...',     // A failed sendTokens transaction (amount > 1000)
  partial: '0x...',    // A partialTransfer transaction
  nftFailed: '0x...'   // A failed NFT transfer (token ID 999)
};

/**
 * Test the dispute resolution API
 */
async function testDisputeResolution() {
  console.log('🧪 Testing Monad Testnet Dispute Resolution API\n');

  try {
    // Test 1: Successful transaction dispute
    console.log('📋 Test 1: Successful Transaction Dispute');
    await testDispute(
      TEST_TRANSACTIONS.successful,
      TEST_CONTRACT_ADDRESS,
      TEST_RECIPIENT_ADDRESS,
      'I sent 500 tokens but the recipient claims they never received them'
    );

    // Test 2: Failed transaction dispute
    console.log('\n📋 Test 2: Failed Transaction Dispute');
    await testDispute(
      TEST_TRANSACTIONS.failed,
      TEST_CONTRACT_ADDRESS,
      TEST_RECIPIENT_ADDRESS,
      'I tried to send 1500 tokens but the transaction failed'
    );

    // Test 3: Partial transfer dispute
    console.log('\n📋 Test 3: Partial Transfer Dispute');
    await testDispute(
      TEST_TRANSACTIONS.partial,
      TEST_CONTRACT_ADDRESS,
      TEST_RECIPIENT_ADDRESS,
      'I requested 1000 tokens but only received 500'
    );

    // Test 4: NFT transfer failure dispute
    console.log('\n📋 Test 4: NFT Transfer Failure Dispute');
    await testDispute(
      TEST_TRANSACTIONS.nftFailed,
      TEST_CONTRACT_ADDRESS,
      TEST_RECIPIENT_ADDRESS,
      'I tried to transfer NFT token ID 999 but it failed'
    );

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Test a specific dispute scenario
 */
async function testDispute(txHash, contractAddress, toAddress, disputeDescription) {
  try {
    console.log(`   Transaction: ${txHash}`);
    console.log(`   Contract: ${contractAddress}`);
    console.log(`   Recipient: ${toAddress}`);
    console.log(`   Dispute: ${disputeDescription}`);

    const response = await axios.post(`${API_BASE_URL}/resolveDispute`, {
      txHash,
      contractAddress,
      toAddress,
      disputeDescription
    });

    if (response.data.success) {
      const data = response.data.data;
      console.log('   ✅ AI Solution:');
      console.log(`   ${data.aiSolution}`);
      
      console.log('   📊 Parsed Logs:');
      console.log(`   - Contract Type: ${data.parsedLogs.contractType}`);
      console.log(`   - Transfers: ${data.parsedLogs.transfers.length}`);
      console.log(`   - Failures: ${data.parsedLogs.failures.length}`);
      console.log(`   - Partial Transfers: ${data.parsedLogs.partialTransfers.length}`);
      
      console.log('   💰 Contract State:');
      console.log(`   - Balance: ${data.contractState.balances[toAddress] || 'N/A'}`);
      console.log(`   - Transaction Status: ${data.transactionStatus}`);
    } else {
      console.log('   ❌ API returned error:', response.data.error);
    }
  } catch (error) {
    console.log('   ❌ Request failed:', error.response?.data?.error || error.message);
  }
}

/**
 * Test health endpoint
 */
async function testHealth() {
  try {
    console.log('🏥 Testing Health Endpoint');
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('   ✅ Health check passed:', response.data);
  } catch (error) {
    console.log('   ❌ Health check failed:', error.message);
  }
}

/**
 * Test dispute history endpoint
 */
async function testDisputeHistory() {
  try {
    console.log('📚 Testing Dispute History');
    const response = await axios.get(`${API_BASE_URL}/disputes`);
    console.log(`   ✅ Found ${response.data.data.length} disputes`);
  } catch (error) {
    console.log('   ❌ Failed to get dispute history:', error.message);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Monad Testnet API Tests\n');

  // Test health endpoint
  await testHealth();
  console.log('');

  // Test dispute resolution
  await testDisputeResolution();
  console.log('');

  // Test dispute history
  await testDisputeHistory();
  console.log('');

  console.log('✅ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testDisputeResolution,
  testHealth,
  testDisputeHistory,
  runTests
}; 