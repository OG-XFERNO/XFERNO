// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./XfernoToken.sol";

/**
 * @title BondingCurve for BDAG
 * @notice Constant product AMM bonding curve for token presales
 * @dev Paris EVM compatible - no Cancun opcodes
 */
contract BondingCurve {
    // ============ State ============
    
    address public owner;
    address public feeRecipient;
    address public dexFactory;
    
    uint256 public virtualEthReserve;
    uint256 public virtualTokenReserve;
    uint256 public graduationThreshold;
    uint256 public feeBps;
    
    bool private _locked;
    
    struct TokenState {
        uint256 ethReserve;
        uint256 tokenReserve;
        bool graduated;
        bool active;
    }
    
    mapping(address => TokenState) public tokenStates;
    
    // ============ Events ============
    
    event TokenRegistered(address indexed token);
    event TokenBought(address indexed token, address indexed buyer, uint256 ethIn, uint256 tokensOut);
    event TokenSold(address indexed token, address indexed seller, uint256 tokensIn, uint256 ethOut);
    event TokenGraduated(address indexed token, uint256 ethReserve, uint256 tokenReserve);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // ============ Errors ============
    
    error Unauthorized();
    error TokenNotRegistered();
    error AlreadyGraduated();
    error InsufficientPayment();
    error SlippageExceeded();
    error TransferFailed();
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
        address dexFactory_,
        address feeRecipient_,
        uint256 virtualEthReserve_,
        uint256 virtualTokenReserve_,
        uint256 graduationThreshold_,
        uint256 feeBps_
    ) {
        owner = owner_;
        dexFactory = dexFactory_;
        feeRecipient = feeRecipient_;
        virtualEthReserve = virtualEthReserve_;
        virtualTokenReserve = virtualTokenReserve_;
        graduationThreshold = graduationThreshold_;
        feeBps = feeBps_;
        
        emit OwnershipTransferred(address(0), owner_);
    }
    
    // ============ View Functions ============
    
    function getTokenState(address token) external view returns (TokenState memory) {
        return tokenStates[token];
    }
    
    function getBuyPrice(address token, uint256 ethAmount) public view returns (uint256) {
        TokenState memory state = tokenStates[token];
        if (!state.active) revert TokenNotRegistered();
        
        uint256 ethReserve = virtualEthReserve + state.ethReserve;
        uint256 tokenReserve = virtualTokenReserve + state.tokenReserve;
        
        // Constant product: (ethReserve + ethIn) * (tokenReserve - tokensOut) = k
        uint256 k = ethReserve * tokenReserve;
        uint256 newEthReserve = ethReserve + ethAmount;
        uint256 newTokenReserve = k / newEthReserve;
        
        return tokenReserve - newTokenReserve;
    }
    
    function getSellPrice(address token, uint256 tokenAmount) public view returns (uint256) {
        TokenState memory state = tokenStates[token];
        if (!state.active) revert TokenNotRegistered();
        
        uint256 ethReserve = virtualEthReserve + state.ethReserve;
        uint256 tokenReserve = virtualTokenReserve + state.tokenReserve;
        
        uint256 k = ethReserve * tokenReserve;
        uint256 newTokenReserve = tokenReserve + tokenAmount;
        uint256 newEthReserve = k / newTokenReserve;
        
        return ethReserve - newEthReserve;
    }
    
    function isGraduatable(address token) public view returns (bool) {
        TokenState memory state = tokenStates[token];
        return state.active && !state.graduated && state.ethReserve >= graduationThreshold;
    }
    
    // ============ Trading Functions ============
    
    function registerToken(address token) external {
        tokenStates[token] = TokenState({
            ethReserve: 0,
            tokenReserve: XfernoToken(token).totalSupply(),
            graduated: false,
            active: true
        });
        emit TokenRegistered(token);
    }
    
    function buy(address token, uint256 minTokensOut) external payable nonReentrant returns (uint256) {
        TokenState storage state = tokenStates[token];
        if (!state.active) revert TokenNotRegistered();
        if (state.graduated) revert AlreadyGraduated();
        
        uint256 fee = (msg.value * feeBps) / 10000;
        uint256 ethIn = msg.value - fee;
        
        uint256 tokensOut = getBuyPrice(token, ethIn);
        if (tokensOut < minTokensOut) revert SlippageExceeded();
        
        state.ethReserve += ethIn;
        state.tokenReserve -= tokensOut;
        
        // Transfer fee
        if (fee > 0) {
            (bool feeSuccess, ) = feeRecipient.call{value: fee}("");
            if (!feeSuccess) revert TransferFailed();
        }
        
        // Transfer tokens
        XfernoToken(token).transfer(msg.sender, tokensOut);
        
        emit TokenBought(token, msg.sender, msg.value, tokensOut);
        return tokensOut;
    }
    
    function sell(address token, uint256 tokenAmount, uint256 minEthOut) external nonReentrant returns (uint256) {
        TokenState storage state = tokenStates[token];
        if (!state.active) revert TokenNotRegistered();
        if (state.graduated) revert AlreadyGraduated();
        
        uint256 ethOut = getSellPrice(token, tokenAmount);
        uint256 fee = (ethOut * feeBps) / 10000;
        uint256 ethAfterFee = ethOut - fee;
        
        if (ethAfterFee < minEthOut) revert SlippageExceeded();
        
        state.ethReserve -= ethOut;
        state.tokenReserve += tokenAmount;
        
        // Transfer tokens from seller
        XfernoToken(token).transferFrom(msg.sender, address(this), tokenAmount);
        
        // Transfer fee
        if (fee > 0) {
            (bool feeSuccess, ) = feeRecipient.call{value: fee}("");
            if (!feeSuccess) revert TransferFailed();
        }
        
        // Transfer ETH to seller
        (bool success, ) = msg.sender.call{value: ethAfterFee}("");
        if (!success) revert TransferFailed();
        
        emit TokenSold(token, msg.sender, tokenAmount, ethAfterFee);
        return ethAfterFee;
    }
    
    function graduate(address token) external nonReentrant returns (uint256, uint256) {
        TokenState storage state = tokenStates[token];
        if (!state.active) revert TokenNotRegistered();
        if (state.graduated) revert AlreadyGraduated();
        if (state.ethReserve < graduationThreshold) revert InsufficientPayment();
        
        state.graduated = true;
        
        uint256 ethForLiquidity = state.ethReserve;
        uint256 tokensForLiquidity = state.tokenReserve;
        
        XfernoToken(token).setGraduated();
        
        emit TokenGraduated(token, ethForLiquidity, tokensForLiquidity);
        return (ethForLiquidity, tokensForLiquidity);
    }
    
    // ============ Admin Functions ============
    
    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        feeRecipient = newFeeRecipient;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    receive() external payable {}
}
