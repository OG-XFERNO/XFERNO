// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IXfernoToken
 * @notice Interface for XFERNO launchpad tokens
 * @dev Extends ERC20 with launchpad-specific functionality
 */
interface IXfernoToken is IERC20 {
    /// @notice Emitted when token is graduated to DEX
    event Graduated(address indexed dexPool, uint256 liquidity);

    /// @notice Emitted when trading is enabled/disabled
    event TradingEnabled(bool enabled);

    /// @notice Get the token creator
    function creator() external view returns (address);

    /// @notice Get the bonding curve contract
    function bondingCurve() external view returns (address);

    /// @notice Check if trading is enabled
    function tradingEnabled() external view returns (bool);

    /// @notice Check if token has graduated
    function graduated() external view returns (bool);

    /// @notice Get graduation timestamp (0 if not graduated)
    function graduatedAt() external view returns (uint256);

    /// @notice Enable trading (only callable by bonding curve)
    function enableTrading() external;

    /// @notice Mark as graduated (only callable by bonding curve)
    function graduate(address dexPool) external;

    /// @notice Mint tokens (only callable by bonding curve)
    function mint(address to, uint256 amount) external;

    /// @notice Burn tokens
    function burn(uint256 amount) external;

    /// @notice Burn tokens from address (requires allowance)
    function burnFrom(address from, uint256 amount) external;
}
