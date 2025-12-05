// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {IXfernoToken} from "../interfaces/IXfernoToken.sol";

/**
 * @title XfernoToken
 * @notice ERC20 token created through XFERNO launchpad
 * @dev Integrates with bonding curve for presale mechanics
 */
contract XfernoToken is ERC20, ERC20Burnable, IXfernoToken {
    // ============================================
    // STATE
    // ============================================

    /// @notice Token creator address
    address public immutable override creator;

    /// @notice Bonding curve contract
    address public immutable override bondingCurve;

    /// @notice Whether trading is enabled
    bool public override tradingEnabled;

    /// @notice Whether token has graduated to DEX
    bool public override graduated;

    /// @notice Timestamp when token graduated
    uint256 public override graduatedAt;

    /// @notice DEX pool address after graduation
    address public dexPool;

    // ============================================
    // ERRORS
    // ============================================

    error TradingNotEnabled();
    error AlreadyGraduated();
    error OnlyBondingCurve();
    error ZeroAddress();

    // ============================================
    // MODIFIERS
    // ============================================

    modifier onlyBondingCurve() {
        if (msg.sender != bondingCurve) revert OnlyBondingCurve();
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor(
        string memory name_,
        string memory symbol_,
        address creator_,
        address bondingCurve_
    ) ERC20(name_, symbol_) {
        if (creator_ == address(0)) revert ZeroAddress();
        if (bondingCurve_ == address(0)) revert ZeroAddress();

        creator = creator_;
        bondingCurve = bondingCurve_;
    }

    // ============================================
    // EXTERNAL FUNCTIONS
    // ============================================

    /// @inheritdoc IXfernoToken
    function enableTrading() external override onlyBondingCurve {
        tradingEnabled = true;
        emit TradingEnabled(true);
    }

    /// @inheritdoc IXfernoToken
    function graduate(address dexPool_) external override onlyBondingCurve {
        if (graduated) revert AlreadyGraduated();
        if (dexPool_ == address(0)) revert ZeroAddress();

        graduated = true;
        graduatedAt = block.timestamp;
        dexPool = dexPool_;

        emit Graduated(dexPool_, 0); // Liquidity amount to be set by bonding curve
    }

    /// @inheritdoc IXfernoToken
    function mint(address to, uint256 amount) external override onlyBondingCurve {
        _mint(to, amount);
    }

    /// @inheritdoc ERC20Burnable
    function burn(uint256 value) public virtual override(ERC20Burnable, IXfernoToken) {
        super.burn(value);
    }

    /// @inheritdoc ERC20Burnable
    function burnFrom(address account, uint256 value) public virtual override(ERC20Burnable, IXfernoToken) {
        super.burnFrom(account, value);
    }

    // ============================================
    // OVERRIDES
    // ============================================

    /// @notice Override transfer to check trading status
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        // Allow minting (from = 0) and burning (to = 0)
        // Allow bonding curve transfers
        // Block other transfers until trading enabled or graduated
        if (
            from != address(0) &&
            to != address(0) &&
            from != bondingCurve &&
            to != bondingCurve &&
            !tradingEnabled &&
            !graduated
        ) {
            revert TradingNotEnabled();
        }

        super._update(from, to, amount);
    }
}
