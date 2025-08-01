const { ethers } = require('ethers');

/**
 * Validates Ethereum transaction hash (32-byte hex)
 * @param {string} txHash - Transaction hash to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidTransactionHash = (txHash) => {
  if (!txHash || typeof txHash !== 'string') return false;
  
  // Check if it's a valid hex string with 0x prefix
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) return false;
  
  return true;
};

/**
 * Validates Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  
  try {
    return ethers.isAddress(address);
  } catch (error) {
    return false;
  }
};

/**
 * Sanitizes text input to prevent injection attacks
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  // Remove potentially dangerous characters and limit length
  return text
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
};

/**
 * Validates and normalizes Ethereum address (checksum)
 * @param {string} address - Address to normalize
 * @returns {string|null} - Checksummed address or null if invalid
 */
const normalizeAddress = (address) => {
  if (!isValidAddress(address)) return null;
  
  try {
    return ethers.getAddress(address);
  } catch (error) {
    return null;
  }
};

module.exports = {
  isValidTransactionHash,
  isValidAddress,
  sanitizeText,
  normalizeAddress
}; 