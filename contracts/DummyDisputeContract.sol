// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DummyDisputeContract
 * @dev A smart contract for simulating transaction failures and disputes on Monad Testnet
 * This contract intentionally fails under specific conditions to test dispute resolution
 */
contract DummyDisputeContract {
    // State variables
    mapping(address => uint256) public balances;
    mapping(address => uint256) public tokenIds;
    uint256 public totalSupply;
    uint256 public nextTokenId;
    
    // Events for dispute resolution
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event TransferFailed(address indexed from, address indexed to, uint256 amount, string reason);
    event PartialTransfer(address indexed from, address indexed to, uint256 requested, uint256 sent);
    event TokenMinted(address indexed to, uint256 tokenId);
    event TokenTransferFailed(address indexed from, address indexed to, uint256 tokenId, string reason);
    
    // Errors
    error InsufficientBalance();
    error InvalidRecipient();
    error AmountTooHigh();
    error ZeroAmount();
    error TokenNotOwned();
    
    constructor() {
        totalSupply = 10000;
        nextTokenId = 1;
    }
    
    /**
     * @dev Send tokens to a recipient address
     * @param to The recipient address
     * @param amount The amount to transfer
     * @return success Whether the transfer was successful
     */
    function sendTokens(address to, uint256 amount) external returns (bool success) {
        // Validate inputs
        if (to == address(0)) {
            emit TransferFailed(msg.sender, to, amount, "Invalid recipient: zero address");
            revert InvalidRecipient();
        }
        
        if (amount == 0) {
            emit TransferFailed(msg.sender, to, amount, "Invalid amount: zero");
            revert ZeroAmount();
        }
        
        if (amount > 1000) {
            emit TransferFailed(msg.sender, to, amount, "Amount too high: exceeds 1000");
            revert AmountTooHigh();
        }
        
        // Check if sender has enough balance
        if (balances[msg.sender] < amount) {
            emit TransferFailed(msg.sender, to, amount, "Insufficient balance");
            revert InsufficientBalance();
        }
        
        // Perform the transfer
        balances[msg.sender] -= amount;
        balances[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    /**
     * @dev Simulate a partial transfer (sends half the requested amount)
     * @param to The recipient address
     * @param amount The amount to transfer
     * @return success Whether the transfer was successful
     */
    function partialTransfer(address to, uint256 amount) external returns (bool success) {
        // Validate inputs
        if (to == address(0)) {
            emit TransferFailed(msg.sender, to, amount, "Invalid recipient: zero address");
            revert InvalidRecipient();
        }
        
        if (amount == 0) {
            emit TransferFailed(msg.sender, to, amount, "Invalid amount: zero");
            revert ZeroAmount();
        }
        
        // Check if sender has enough balance
        if (balances[msg.sender] < amount) {
            emit TransferFailed(msg.sender, to, amount, "Insufficient balance");
            revert InsufficientBalance();
        }
        
        // Calculate partial amount (half of requested)
        uint256 partialAmount = amount / 2;
        
        // Perform the partial transfer
        balances[msg.sender] -= partialAmount;
        balances[to] += partialAmount;
        
        emit PartialTransfer(msg.sender, to, amount, partialAmount);
        return true;
    }
    
    /**
     * @dev Mint tokens to an address (for testing)
     * @param to The recipient address
     * @param amount The amount to mint
     */
    function mintTokens(address to, uint256 amount) external {
        if (to == address(0)) {
            revert InvalidRecipient();
        }
        
        balances[to] += amount;
        totalSupply += amount;
        
        emit Transfer(address(0), to, amount);
    }
    
    /**
     * @dev Mint an NFT token to an address
     * @param to The recipient address
     * @return tokenId The minted token ID
     */
    function mintNFT(address to) external returns (uint256 tokenId) {
        if (to == address(0)) {
            revert InvalidRecipient();
        }
        
        tokenId = nextTokenId++;
        tokenIds[to] = tokenId;
        
        emit TokenMinted(to, tokenId);
        return tokenId;
    }
    
    /**
     * @dev Transfer an NFT token (with potential failure)
     * @param to The recipient address
     * @param tokenId The token ID to transfer
     * @return success Whether the transfer was successful
     */
    function transferNFT(address to, uint256 tokenId) external returns (bool success) {
        // Validate inputs
        if (to == address(0)) {
            emit TokenTransferFailed(msg.sender, to, tokenId, "Invalid recipient: zero address");
            revert InvalidRecipient();
        }
        
        if (tokenIds[msg.sender] != tokenId) {
            emit TokenTransferFailed(msg.sender, to, tokenId, "Token not owned by sender");
            revert TokenNotOwned();
        }
        
        // Simulate failure for specific token IDs
        if (tokenId == 999) {
            emit TokenTransferFailed(msg.sender, to, tokenId, "Token transfer blocked: special token");
            return false;
        }
        
        // Perform the transfer
        tokenIds[msg.sender] = 0;
        tokenIds[to] = tokenId;
        
        emit Transfer(msg.sender, to, tokenId);
        return true;
    }
    
    /**
     * @dev Get the balance of an address
     * @param account The address to check
     * @return The balance
     */
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
    
    /**
     * @dev Get the owner of a token ID
     * @param tokenId The token ID to check
     * @return The owner address
     */
    function ownerOf(uint256 tokenId) external view returns (address) {
        // Find the owner by checking all addresses (simplified for demo)
        // In a real implementation, you'd use a mapping
        for (uint256 i = 1; i < nextTokenId; i++) {
            if (i == tokenId) {
                // This is a simplified implementation
                // In practice, you'd maintain a mapping of tokenId to owner
                return address(0); // Placeholder
            }
        }
        return address(0);
    }
    
    /**
     * @dev Get the total supply
     * @return The total supply
     */
    function getTotalSupply() external view returns (uint256) {
        return totalSupply;
    }
    
    /**
     * @dev Get the next token ID
     * @return The next token ID
     */
    function getNextTokenId() external view returns (uint256) {
        return nextTokenId;
    }
} 