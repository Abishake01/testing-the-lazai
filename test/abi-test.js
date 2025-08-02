const abiFetcher = require('../utils/abiFetcher');

// Test contract address
const CONTRACT_ADDRESS = '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701';

/**
 * Test ABI fetching functionality
 */
async function testABIFetching() {
  console.log('🔍 Testing ABI Fetching for Contract\n');
  console.log(`Contract Address: ${CONTRACT_ADDRESS}`);
  console.log(`Explorer URL: https://testnet.monadscan.com/address/${CONTRACT_ADDRESS}\n`);

  try {
    console.log('📡 Fetching ABI from blockchain explorers...\n');
    
    // Test fetching ABI
    const abi = await abiFetcher.fetchABI(CONTRACT_ADDRESS);
    
    if (abi) {
      console.log('✅ ABI fetched successfully!');
      console.log(`📊 ABI contains ${abi.length} items`);
      
      // Show event definitions
      const events = abi.filter(item => item.type === 'event');
      console.log(`📋 Found ${events.length} events:`);
      
      events.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.name}`);
        if (event.inputs) {
          event.inputs.forEach(input => {
            console.log(`      - ${input.name || 'unnamed'}: ${input.type}${input.indexed ? ' (indexed)' : ''}`);
          });
        }
      });
      
      // Show function definitions
      const functions = abi.filter(item => item.type === 'function');
      console.log(`🔧 Found ${functions.length} functions`);
      
      // Test parsing with the ABI
      console.log('\n🧪 Testing log parsing with fetched ABI...');
      
      // Sample log from your transaction
      const sampleLog = {
        address: CONTRACT_ADDRESS,
        topics: [
          '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c',
          '0x000000000000000000000000bf5542a20a6684d83ccb46a7ae588bf32073a704'
        ],
        data: '0x000000000000000000000000000000000000000000000000016345785d8a0000',
        logIndex: 0,
        transactionIndex: 42,
        blockNumber: 28831786
      };
      
      const parsedLogs = abiFetcher.parseLogsWithABI([sampleLog], CONTRACT_ADDRESS, abi);
      
      console.log('📊 Parsed Logs:');
      console.log(`   Contract Type: ${parsedLogs.contractType}`);
      console.log(`   Transfers: ${parsedLogs.transfers.length}`);
      console.log(`   Failures: ${parsedLogs.failures.length}`);
      console.log(`   Partial Transfers: ${parsedLogs.partialTransfers.length}`);
      console.log(`   Parsed Events: ${parsedLogs.parsedEvents.length}`);
      
      if (parsedLogs.parsedEvents.length > 0) {
        console.log('\n📋 Parsed Events:');
        parsedLogs.parsedEvents.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.name}`);
          if (event.args.length > 0) {
            console.log(`      Args: ${event.args.join(', ')}`);
          }
        });
      }
      
    } else {
      console.log('❌ No ABI found for this contract');
      console.log('💡 This could mean:');
      console.log('   - Contract is not verified on blockchain explorers');
      console.log('   - API keys are not configured');
      console.log('   - Network connectivity issues');
      console.log('\n🔧 You can still use the enhanced raw log parsing');
    }
    
  } catch (error) {
    console.log('❌ Error testing ABI fetching:', error.message);
  }
}

/**
 * Test caching functionality
 */
async function testCaching() {
  console.log('\n🗄️ Testing ABI Caching...\n');
  
  try {
    // Test cache operations
    const testABI = [{ type: 'event', name: 'TestEvent', inputs: [] }];
    
    // Cache ABI
    await abiFetcher.cacheABI(CONTRACT_ADDRESS, testABI);
    console.log('✅ ABI cached successfully');
    
    // Retrieve cached ABI
    const cachedABI = await abiFetcher.getCachedABI(CONTRACT_ADDRESS);
    if (cachedABI) {
      console.log('✅ Cached ABI retrieved successfully');
    } else {
      console.log('❌ Failed to retrieve cached ABI');
    }
    
  } catch (error) {
    console.log('❌ Error testing caching:', error.message);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting ABI Fetching Tests\n');
  console.log('📋 Prerequisites:');
  console.log('   1. Make sure you have set up your .env file');
  console.log('   2. Configure API keys for blockchain explorers (optional)');
  console.log('   3. Ensure network connectivity\n');

  await testABIFetching();
  await testCaching();
  
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
  testABIFetching,
  testCaching,
  runTests
}; 