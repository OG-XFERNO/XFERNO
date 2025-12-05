// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ITokenFactory} from "../interfaces/ITokenFactory.sol";
import {XfernoToken} from "../token/XfernoToken.sol";
import {BondingCurve} from "../curve/BondingCurve.sol";

/**
 * @title TokenFactory
 * @notice Factory contract for creating XFERNO tokens
 * @dev Creates tokens with bonding curve integration
 */
contract TokenFactory is ITokenFactory, Ownable, ReentrancyGuard {
    // ============================================
    // STATE
    // ============================================

    /// @notice Bonding curve contract
    address public override bondingCurve;

    /// @notice Token creation fee
    uint256 public override creationFee;

    /// @notice All created tokens
    address[] private _allTokens;

    /// @notice Tokens by creator
    mapping(address => address[]) private _tokensByCreator;

    /// @notice Valid XFERNO tokens
    mapping(address => bool) private _isXfernoToken;

    // ============================================
    // ERRORS
    // ============================================

    error InsufficientFee();
    error ZeroAddress();
    error TransferFailed();
    error EmptyName();
    error EmptySymbol();

    // ============================================
    // EVENTS (from interface + additional)
    // ============================================

    event TokenMetadata(
        address indexed token,
        string description,
        string imageUri,
        string[] socialLinks
    );

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor(
        address owner_,
        address bondingCurve_,
        uint256 creationFee_
    ) Ownable(owner_) {
        if (bondingCurve_ == address(0)) revert ZeroAddress();

        bondingCurve = bondingCurve_;
        creationFee = creationFee_;
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /// @inheritdoc ITokenFactory
    function getTokensByCreator(address creator) external view override returns (address[] memory) {
        return _tokensByCreator[creator];
    }

    /// @inheritdoc ITokenFactory
    function totalTokens() external view override returns (uint256) {
        return _allTokens.length;
    }

    /// @inheritdoc ITokenFactory
    function isXfernoToken(address token) external view override returns (bool) {
        return _isXfernoToken[token];
    }

    /// @notice Get all tokens (paginated)
    function getTokens(uint256 offset, uint256 limit) external view returns (address[] memory) {
        uint256 total = _allTokens.length;
        if (offset >= total) {
            return new address[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        address[] memory tokens = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            tokens[i - offset] = _allTokens[i];
        }

        return tokens;
    }

    // ============================================
    // WRITE FUNCTIONS
    // ============================================

    /// @inheritdoc ITokenFactory
    function createToken(
        TokenParams calldata params
    ) external payable override nonReentrant returns (address token) {
        // Validate
        if (msg.value < creationFee) revert InsufficientFee();
        if (bytes(params.name).length == 0) revert EmptyName();
        if (bytes(params.symbol).length == 0) revert EmptySymbol();

        // Create token
        XfernoToken newToken = new XfernoToken(
            params.name,
            params.symbol,
            msg.sender,
            bondingCurve
        );

        token = address(newToken);

        // Register in state
        _allTokens.push(token);
        _tokensByCreator[msg.sender].push(token);
        _isXfernoToken[token] = true;

        // Register with bonding curve
        BondingCurve(bondingCurve).registerToken(token);

        // Emit events
        emit TokenCreated(token, msg.sender, params.name, params.symbol, 0);
        emit TokenMetadata(token, params.description, params.imageUri, params.socialLinks);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /// @inheritdoc ITokenFactory
    function setBondingCurve(address newCurve) external override onlyOwner {
        if (newCurve == address(0)) revert ZeroAddress();

        address oldCurve = bondingCurve;
        bondingCurve = newCurve;

        emit BondingCurveUpdated(oldCurve, newCurve);
    }

    /// @inheritdoc ITokenFactory
    function setCreationFee(uint256 newFee) external override onlyOwner {
        uint256 oldFee = creationFee;
        creationFee = newFee;

        emit CreationFeeUpdated(oldFee, newFee);
    }

    /// @inheritdoc ITokenFactory
    function withdrawFees(address to) external override onlyOwner {
        if (to == address(0)) revert ZeroAddress();

        uint256 balance = address(this).balance;
        (bool success, ) = to.call{value: balance}("");
        if (!success) revert TransferFailed();
    }

    /// @notice Receive ETH
    receive() external payable {}
}
