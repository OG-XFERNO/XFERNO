// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title XfernoToken for BDAG
 * @notice ERC20 token with bonding curve integration
 * @dev Paris EVM compatible - no Cancun opcodes
 */
contract XfernoToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    
    address public immutable creator;
    address public immutable bondingCurve;
    bool public tradingEnabled;
    bool public graduated;
    uint256 public graduatedAt;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event TradingEnabled();
    event Graduated(uint256 timestamp);
    
    error Unauthorized();
    error InsufficientBalance();
    error InsufficientAllowance();
    
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        address creator_,
        address bondingCurve_
    ) {
        name = name_;
        symbol = symbol_;
        totalSupply = totalSupply_;
        creator = creator_;
        bondingCurve = bondingCurve_;
        
        balanceOf[bondingCurve_] = totalSupply_;
        emit Transfer(address(0), bondingCurve_, totalSupply_);
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        if (currentAllowance != type(uint256).max) {
            if (currentAllowance < amount) revert InsufficientAllowance();
            unchecked {
                allowance[from][msg.sender] = currentAllowance - amount;
            }
        }
        return _transfer(from, to, amount);
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        if (balanceOf[from] < amount) revert InsufficientBalance();
        unchecked {
            balanceOf[from] -= amount;
            balanceOf[to] += amount;
        }
        emit Transfer(from, to, amount);
        return true;
    }
    
    function enableTrading() external {
        if (msg.sender != bondingCurve) revert Unauthorized();
        tradingEnabled = true;
        emit TradingEnabled();
    }
    
    function setGraduated() external {
        if (msg.sender != bondingCurve) revert Unauthorized();
        graduated = true;
        graduatedAt = block.timestamp;
        emit Graduated(block.timestamp);
    }
    
    function burn(uint256 amount) external {
        if (balanceOf[msg.sender] < amount) revert InsufficientBalance();
        unchecked {
            balanceOf[msg.sender] -= amount;
            totalSupply -= amount;
        }
        emit Transfer(msg.sender, address(0), amount);
    }
}
