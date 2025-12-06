// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./XfernoToken.sol";
import "./BondingCurve.sol";

/**
 * @title TokenFactory for BDAG
 * @notice Factory contract for creating XFERNO tokens
 * @dev Paris EVM compatible - no Cancun opcodes
 */
contract TokenFactory {
    // ============ State ============
    
    address public owner;
    address public bondingCurve;
    uint256 public creationFee;
    
    address[] private _allTokens;
    mapping(address => address[]) private _tokensByCreator;
    mapping(address => bool) public isXfernoToken;
    
    bool private _locked;
    
    // ============ Events ============
    
    event TokenCreated(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply
    );
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event CreationFeeUpdated(uint256 oldFee, uint256 newFee);
    
    // ============ Errors ============
    
    error Unauthorized();
    error InsufficientFee();
    error ZeroAddress();
    error TransferFailed();
    error EmptyName();
    error EmptySymbol();
    error Reentrancy();
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }
    
    modifier nonReentrant() {
        if (_locked) revert Reentrancy();
        _locked = true;
        _;
        _locked = false;
    }
    
    // ============ Constructor ============
    
    constructor(
        address owner_,
        address bondingCurve_,
        uint256 creationFee_
    ) {
        if (bondingCurve_ == address(0)) revert ZeroAddress();
        
        owner = owner_;
        bondingCurve = bondingCurve_;
        creationFee = creationFee_;
        
        emit OwnershipTransferred(address(0), owner_);
    }
    
    // ============ View Functions ============
    
    function getTokensByCreator(address creator) external view returns (address[] memory) {
        return _tokensByCreator[creator];
    }
    
    function getAllTokens() external view returns (address[] memory) {
        return _allTokens;
    }
    
    function getTokenCount() external view returns (uint256) {
        return _allTokens.length;
    }
    
    // ============ Token Creation ============
    
    function createToken(
        string calldata name_,
        string calldata symbol_,
        uint256 totalSupply_
    ) external payable nonReentrant returns (address token) {
        if (bytes(name_).length == 0) revert EmptyName();
        if (bytes(symbol_).length == 0) revert EmptySymbol();
        if (msg.value < creationFee) revert InsufficientFee();
        
        // Default supply: 1 billion tokens
        uint256 supply = totalSupply_ == 0 ? 1_000_000_000 ether : totalSupply_;
        
        // Create token
        token = address(new XfernoToken(
            name_,
            symbol_,
            supply,
            msg.sender,
            bondingCurve
        ));
        
        // Register with bonding curve
        BondingCurve(payable(bondingCurve)).registerToken(token);
        
        // Track token
        _allTokens.push(token);
        _tokensByCreator[msg.sender].push(token);
        isXfernoToken[token] = true;
        
        // Transfer creation fee to owner
        if (msg.value > 0) {
            (bool success, ) = owner.call{value: msg.value}("");
            if (!success) revert TransferFailed();
        }
        
        emit TokenCreated(token, msg.sender, name_, symbol_, supply);
        return token;
    }
    
    // ============ Admin Functions ============
    
    function setCreationFee(uint256 newFee) external onlyOwner {
        emit CreationFeeUpdated(creationFee, newFee);
        creationFee = newFee;
    }
    
    function setBondingCurve(address newBondingCurve) external onlyOwner {
        if (newBondingCurve == address(0)) revert ZeroAddress();
        bondingCurve = newBondingCurve;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = owner.call{value: balance}("");
            if (!success) revert TransferFailed();
        }
    }
    
    receive() external payable {}
}
