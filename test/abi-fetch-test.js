const abiFetcher = require('../utils/abiFetcher');

// Replace with a real contract address deployed on Monad Testnet
const contractAddress = '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701';

async function testFetchABI() {
  try {
    const abi = await abiFetcher.fetchABI(contractAddress);
    if (abi) {
      console.log('✅ ABI fetched successfully:');
      console.log(JSON.stringify(abi, null, 2));
    } else {
      console.log('❌ Failed to fetch ABI.');
    }
  } catch (error) {
    console.error('❌ Error fetching ABI:', error.message);
  }
}

testFetchABI();
