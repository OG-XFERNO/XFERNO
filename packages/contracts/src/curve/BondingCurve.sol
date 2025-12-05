// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IBondingCurve} from "../interfaces/IBondingCurve.sol";
import {IXfernoToken} from "../interfaces/IXfernoToken.sol";

/**
 * @title BondingCurve
 * @notice Implements constant product AMM bonding curve for token presales
 * @dev Uses virtual reserves for price calculation: price = virtualEth / virtualToken
 *
 * NOTE: This is a Phase 0 skeleton. Full implementation in Phase 1.
 */
contract BondingCurve is IBondingCurve, ReentrancyGuard, Ownable {
    // ============================================
    // STATE
    // ============================================

    /// @notice Curve parameters
    CurveParams private _curveParams;

    /// @notice Token states
    mapping(address => TokenState) private _tokenStates;

    /// @notice DEX factory for graduation
    address public dexFactory;

    /// @notice Fee recipient
    address public feeRecipient;

    // ============================================
    // ERRORS
    // ============================================

    error TokenNotRegistered();
    error AlreadyGraduated();
    error NotGraduatable();
    error InsufficientPayment();
    error SlippageExceeded();
    error TransferFailed();

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor(
        address owner_,
        address dexFactory_,
        address feeRecipient_,
        CurveParams memory params_
    ) Ownable(owner_) {
        dexFactory = dexFactory_;
        feeRecipient = feeRecipient_;
        _curveParams = params_;
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /// @inheritdoc IBondingCurve
    function curveParams() external view override returns (CurveParams memory) {
        return _curveParams;
    }

    /// @inheritdoc IBondingCurve
    function getTokenState(address token) external view override returns (TokenState memory) {
        return _tokenStates[token];
    }

    /// @inheritdoc IBondingCurve
    function getBuyPrice(
        address token,
        uint256 tokenAmount
    ) public view override returns (uint256 ethCost) {
        TokenState memory state = _tokenStates[token];

        // Virtual reserves
        uint256 virtualEth = _curveParams.virtualEthReserve + state.ethReserve;
        uint256 virtualToken = _curveParams.virtualTokenReserve - state.tokenSupply;

        // Constant product formula: (x + dx) * (y - dy) = x * y
        // Solving for dx: dx = (x * dy) / (y - dy)
        uint256 numerator = virtualEth * tokenAmount;
        uint256 denominator = virtualToken - tokenAmount;
        ethCost = (numerator / denominator) + 1; // Round up

        // Add fee
        ethCost = ethCost + (ethCost * _curveParams.feeBps) / 10000;
    }

    /// @inheritdoc IBondingCurve
    function getSellPrice(
        address token,
        uint256 tokenAmount
    ) public view override returns (uint256 ethReturn) {
        TokenState memory state = _tokenStates[token];

        // Virtual reserves
        uint256 virtualEth = _curveParams.virtualEthReserve + state.ethReserve;
        uint256 virtualToken = _curveParams.virtualTokenReserve - state.tokenSupply;

        // Constant product formula for selling
        // dx = (x * dy) / (y + dy)
        uint256 numerator = virtualEth * tokenAmount;
        uint256 denominator = virtualToken + tokenAmount;
        ethReturn = numerator / denominator;

        // Subtract fee
        ethReturn = ethReturn - (ethReturn * _curveParams.feeBps) / 10000;
    }

    /// @inheritdoc IBondingCurve
    function getCurrentPrice(address token) external view override returns (uint256) {
        TokenState memory state = _tokenStates[token];

        uint256 virtualEth = _curveParams.virtualEthReserve + state.ethReserve;
        uint256 virtualToken = _curveParams.virtualTokenReserve - state.tokenSupply;

        // Price = ETH / Token (scaled to 18 decimals)
        return (virtualEth * 1e18) / virtualToken;
    }

    /// @inheritdoc IBondingCurve
    function canGraduate(address token) public view override returns (bool) {
        TokenState memory state = _tokenStates[token];
        return !state.graduated && state.ethReserve >= _curveParams.graduationThreshold;
    }

    // ============================================
    // WRITE FUNCTIONS
    // ============================================

    /// @notice Register a new token (called by factory)
    function registerToken(address token) external {
        // TODO: Verify caller is factory
        _tokenStates[token] = TokenState({
            ethReserve: 0,
            tokenSupply: 0,
            graduated: false,
            graduatedAt: 0
        });
    }

    /// @inheritdoc IBondingCurve
    function buy(
        address token,
        uint256 minTokens
    ) external payable override nonReentrant returns (uint256 tokenAmount) {
        TokenState storage state = _tokenStates[token];
        if (state.graduated) revert AlreadyGraduated();

        // Calculate tokens to mint based on ETH sent
        // This is simplified - real impl would solve for tokens given ETH
        uint256 ethAmount = msg.value;
        tokenAmount = _calculateTokensForEth(token, ethAmount);

        if (tokenAmount < minTokens) revert SlippageExceeded();

        // Update state
        state.ethReserve += ethAmount;
        state.tokenSupply += tokenAmount;

        // Mint tokens to buyer
        IXfernoToken(token).mint(msg.sender, tokenAmount);

        emit TokensBought(msg.sender, token, ethAmount, tokenAmount, 0);

        // Check for graduation
        if (canGraduate(token)) {
            _graduate(token);
        }
    }

    /// @inheritdoc IBondingCurve
    function sell(
        address token,
        uint256 tokenAmount,
        uint256 minEth
    ) external override nonReentrant returns (uint256 ethAmount) {
        TokenState storage state = _tokenStates[token];
        if (state.graduated) revert AlreadyGraduated();

        ethAmount = getSellPrice(token, tokenAmount);
        if (ethAmount < minEth) revert SlippageExceeded();

        // Update state
        state.ethReserve -= ethAmount;
        state.tokenSupply -= tokenAmount;

        // Burn tokens from seller (requires approval)
        IXfernoToken(token).burnFrom(msg.sender, tokenAmount);

        // Send ETH to seller
        (bool success, ) = msg.sender.call{value: ethAmount}("");
        if (!success) revert TransferFailed();

        emit TokensSold(msg.sender, token, tokenAmount, ethAmount, 0);
    }

    /// @inheritdoc IBondingCurve
    function graduate(address token) external override returns (address) {
        if (!canGraduate(token)) revert NotGraduatable();
        return _graduate(token);
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================

    function _calculateTokensForEth(
        address token,
        uint256 ethAmount
    ) internal view returns (uint256) {
        TokenState memory state = _tokenStates[token];

        // Virtual reserves
        uint256 virtualEth = _curveParams.virtualEthReserve + state.ethReserve;
        uint256 virtualToken = _curveParams.virtualTokenReserve - state.tokenSupply;

        // Remove fee from ETH
        uint256 ethAfterFee = ethAmount - (ethAmount * _curveParams.feeBps) / 10000;

        // Constant product: tokens = (tokenReserve * ethIn) / (ethReserve + ethIn)
        return (virtualToken * ethAfterFee) / (virtualEth + ethAfterFee);
    }

    function _graduate(address token) internal returns (address dexPool) {
        TokenState storage state = _tokenStates[token];

        state.graduated = true;
        state.graduatedAt = block.timestamp;

        // TODO: Create DEX pool and add liquidity
        // This will be implemented in Phase 1
        dexPool = address(0);

        IXfernoToken(token).graduate(dexPool);

        emit TokenGraduated(token, dexPool, state.ethReserve, state.tokenSupply);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    function setDexFactory(address newFactory) external onlyOwner {
        dexFactory = newFactory;
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        feeRecipient = newRecipient;
    }

    function updateCurveParams(CurveParams memory newParams) external onlyOwner {
        _curveParams = newParams;
    }
}
