const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Test data - Replace with real transaction data
const testDispute = {
  txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  contractAddress: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c8',
  toAddress: '0x1234567890abcdef1234567890abcdef1234567890',
  disputeDescription: 'I sent USDC tokens to this address but they haven\'t received them yet. The transaction shows as successful but the recipient says they didn\'t get the tokens.'
};

/**
 * Test the dispute resolution endpoint
 */
async function testDisputeResolution() {
  try {
    console.log('Testing dispute resolution...');
    console.log('Request data:', testDispute);
    
    const response = await axios.post(`${API_BASE_URL}/resolveDispute`, testDispute, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout
    });
    
    console.log('✅ Dispute resolution successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Dispute resolution failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

/**
 * Test the health check endpoint
 */
async function testHealthCheck() {
  try {
    console.log('Testing health check...');
    
    const response = await axios.get(`${API_BASE_URL}/health`);
    
    console.log('✅ Health check successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Health check failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

/**
 * Test the dispute history endpoint
 */
async function testDisputeHistory() {
  try {
    console.log('Testing dispute history...');
    
    const response = await axios.get(`${API_BASE_URL}/disputes?limit=5`);
    
    console.log('✅ Dispute history successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Dispute history failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting API tests...\n');
  
  await testHealthCheck();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testDisputeHistory();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testDisputeResolution();
  console.log('\n' + '='.repeat(50) + '\n');
  
  console.log('🏁 Tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testDisputeResolution,
  testHealthCheck,
  testDisputeHistory,
  runTests
}; 