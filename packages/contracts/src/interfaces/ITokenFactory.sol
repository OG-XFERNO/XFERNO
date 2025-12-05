// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ITokenFactory
 * @notice Interface for XFERNO token factory
 * @dev Creates new tokens with bonding curve integration
 */
interface ITokenFactory {
    // ============================================
    // EVENTS
    // ============================================

    /// @notice Emitted when a new token is created
    event TokenCreated(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        uint256 initialSupply
    );

    /// @notice Emitted when bonding curve is updated
    event BondingCurveUpdated(address indexed oldCurve, address indexed newCurve);

    /// @notice Emitted when creation fee is updated
    event CreationFeeUpdated(uint256 oldFee, uint256 newFee);

    // ============================================
    // STRUCTS
    // ============================================

    struct TokenParams {
        /// @notice Token name
        string name;
        /// @notice Token symbol
        string symbol;
        /// @notice Token description (stored off-chain, emitted in event)
        string description;
        /// @notice Token image URI
        string imageUri;
        /// @notice Social links (Twitter, Telegram, Website)
        string[] socialLinks;
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /// @notice Get the bonding curve contract
    function bondingCurve() external view returns (address);

    /// @notice Get token creation fee
    function creationFee() external view returns (uint256);

    /// @notice Get all tokens created by an address
    function getTokensByCreator(address creator) external view returns (address[] memory);

    /// @notice Get total number of tokens created
    function totalTokens() external view returns (uint256);

    /// @notice Check if address is a valid XFERNO token
    function isXfernoToken(address token) external view returns (bool);

    // ============================================
    // WRITE FUNCTIONS
    // ============================================

    /// @notice Create a new token
    /// @param params Token parameters
    /// @return token Address of created token
    function createToken(TokenParams calldata params) external payable returns (address token);

    /// @notice Update bonding curve (admin only)
    function setBondingCurve(address newCurve) external;

    /// @notice Update creation fee (admin only)
    function setCreationFee(uint256 newFee) external;

    /// @notice Withdraw collected fees (admin only)
    function withdrawFees(address to) external;
}
