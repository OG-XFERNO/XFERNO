// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IBondingCurve
 * @notice Interface for XFERNO bonding curve contracts
 * @dev Implements token pricing and graduation logic
 */
interface IBondingCurve {
    // ============================================
    // EVENTS
    // ============================================

    /// @notice Emitted when tokens are bought
    event TokensBought(
        address indexed buyer,
        address indexed token,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 newPrice
    );

    /// @notice Emitted when tokens are sold
    event TokensSold(
        address indexed seller,
        address indexed token,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 newPrice
    );

    /// @notice Emitted when token graduates to DEX
    event TokenGraduated(
        address indexed token,
        address indexed dexPool,
        uint256 ethLiquidity,
        uint256 tokenLiquidity
    );

    // ============================================
    // STRUCTS
    // ============================================

    struct CurveParams {
        /// @notice Initial virtual ETH reserves
        uint256 virtualEthReserve;
        /// @notice Initial virtual token reserves
        uint256 virtualTokenReserve;
        /// @notice Target ETH amount for graduation
        uint256 graduationThreshold;
        /// @notice Fee percentage (in basis points, 100 = 1%)
        uint256 feeBps;
    }

    struct TokenState {
        /// @notice Current ETH in the curve
        uint256 ethReserve;
        /// @notice Current tokens in circulation
        uint256 tokenSupply;
        /// @notice Has the token graduated?
        bool graduated;
        /// @notice Graduation timestamp
        uint256 graduatedAt;
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /// @notice Get curve parameters
    function curveParams() external view returns (CurveParams memory);

    /// @notice Get token state
    function getTokenState(address token) external view returns (TokenState memory);

    /// @notice Calculate buy price for amount of tokens
    function getBuyPrice(address token, uint256 tokenAmount) external view returns (uint256 ethCost);

    /// @notice Calculate sell price for amount of tokens
    function getSellPrice(
        address token,
        uint256 tokenAmount
    ) external view returns (uint256 ethReturn);

    /// @notice Get current token price
    function getCurrentPrice(address token) external view returns (uint256);

    /// @notice Check if token can graduate
    function canGraduate(address token) external view returns (bool);

    // ============================================
    // WRITE FUNCTIONS
    // ============================================

    /// @notice Buy tokens from the curve
    /// @param token Token address
    /// @param minTokens Minimum tokens to receive
    /// @return tokenAmount Amount of tokens bought
    function buy(address token, uint256 minTokens) external payable returns (uint256 tokenAmount);

    /// @notice Sell tokens to the curve
    /// @param token Token address
    /// @param tokenAmount Amount of tokens to sell
    /// @param minEth Minimum ETH to receive
    /// @return ethAmount Amount of ETH received
    function sell(
        address token,
        uint256 tokenAmount,
        uint256 minEth
    ) external returns (uint256 ethAmount);

    /// @notice Graduate token to DEX
    /// @param token Token address
    /// @return dexPool Address of created DEX pool
    function graduate(address token) external returns (address dexPool);
}
