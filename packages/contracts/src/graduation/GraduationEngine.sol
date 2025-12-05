// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IXfernoToken.sol";
import "../interfaces/IBondingCurve.sol";

import "../dex/interfaces/IXfernoFactory.sol";
import "../dex/interfaces/IXfernoRouter.sol";

/**
 * @title XFERNO DEX Interfaces
 * @notice Uses in-house XFERNO DEX for graduation liquidity
 */

/**
 * @title GraduationEngine
 * @notice Handles the graduation of tokens from bonding curve to DEX
 * 
 * When a token reaches its graduation target on the bonding curve:
 * 1. Presale is finalized
 * 2. Token is deployed to DEX (Uniswap V2 compatible)
 * 3. Liquidity pool is created and seeded
 * 4. LP tokens are locked/burned
 * 5. Token transitions to live trading
 */
contract GraduationEngine is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Events ============

    event GraduationInitiated(
        address indexed token,
        uint256 totalRaised,
        uint256 timestamp
    );

    event PoolCreated(
        address indexed token,
        address indexed pair,
        uint256 tokenAmount,
        uint256 ethAmount
    );

    event LiquidityAdded(
        address indexed token,
        address indexed pair,
        uint256 liquidity
    );

    event GraduationCompleted(
        address indexed token,
        address indexed pair,
        uint256 timestamp
    );

    event GraduationFailed(
        address indexed token,
        string reason
    );

    event FeeCollected(
        address indexed token,
        uint256 amount
    );

    // ============ Structs ============

    struct GraduationConfig {
        uint256 tokenAllocationPercent;  // % of tokens for liquidity (e.g., 80%)
        uint256 platformFeePercent;      // Platform fee (e.g., 2%)
        uint256 creatorFeePercent;       // Creator fee (e.g., 3%)
        uint256 minLiquidityETH;         // Minimum ETH for liquidity
        bool burnLPTokens;               // Whether to burn LP tokens
        address lpTokenRecipient;        // Where to send LP tokens if not burning
    }

    struct GraduationStatus {
        bool initiated;
        bool completed;
        address pair;
        uint256 liquidityTokens;
        uint256 graduatedAt;
        uint256 totalRaised;
    }

    // ============ State Variables ============

    /// @notice XFERNO DEX Router
    IXfernoRouter public router;

    /// @notice Bonding curve contract
    IBondingCurve public bondingCurve;

    /// @notice Default graduation config
    GraduationConfig public defaultConfig;

    /// @notice Per-token graduation configs
    mapping(address => GraduationConfig) public tokenConfigs;

    /// @notice Graduation status per token
    mapping(address => GraduationStatus) public graduationStatus;

    /// @notice Platform fee recipient
    address public feeRecipient;

    /// @notice Authorized graduation callers
    mapping(address => bool) public authorizedCallers;

    // ============ Constructor ============

    constructor(
        address _router,
        address _bondingCurve,
        address _feeRecipient
    ) Ownable(msg.sender) {
        router = IXfernoRouter(_router);
        bondingCurve = IBondingCurve(_bondingCurve);
        feeRecipient = _feeRecipient;

        // Set default config
        defaultConfig = GraduationConfig({
            tokenAllocationPercent: 80,    // 80% of tokens to LP
            platformFeePercent: 2,          // 2% platform fee
            creatorFeePercent: 3,           // 3% creator fee
            minLiquidityETH: 0.1 ether,    // Minimum 0.1 ETH
            burnLPTokens: true,             // Burn LP by default
            lpTokenRecipient: address(0)
        });

        authorizedCallers[msg.sender] = true;
    }

    // ============ Modifiers ============

    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "GraduationEngine: not authorized");
        _;
    }

    // ============ External Functions ============

    /**
     * @notice Initiate graduation for a token
     * @param token Token address to graduate
     */
    function initiateGraduation(address token) external onlyAuthorized nonReentrant whenNotPaused {
        require(!graduationStatus[token].initiated, "GraduationEngine: already initiated");
        
        // Get token info from bonding curve
        (
            ,
            uint256 totalRaised,
            uint256 graduationTarget,
            bool graduated,
            
        ) = bondingCurve.getTokenInfo(token);

        require(totalRaised >= graduationTarget, "GraduationEngine: target not reached");
        require(!graduated, "GraduationEngine: already graduated on curve");

        graduationStatus[token] = GraduationStatus({
            initiated: true,
            completed: false,
            pair: address(0),
            liquidityTokens: 0,
            graduatedAt: 0,
            totalRaised: totalRaised
        });

        emit GraduationInitiated(token, totalRaised, block.timestamp);
    }

    /**
     * @notice Execute the graduation process
     * @param token Token to graduate
     */
    function executeGraduation(address token) external onlyAuthorized nonReentrant whenNotPaused {
        GraduationStatus storage status = graduationStatus[token];
        require(status.initiated, "GraduationEngine: not initiated");
        require(!status.completed, "GraduationEngine: already completed");

        GraduationConfig memory config = _getConfig(token);
        
        // 1. Finalize presale on bonding curve (withdraws ETH)
        bondingCurve.graduateToken(token);

        // 2. Calculate amounts
        uint256 ethBalance = address(this).balance;
        require(ethBalance >= config.minLiquidityETH, "GraduationEngine: insufficient ETH");

        // Calculate fees
        uint256 platformFee = (ethBalance * config.platformFeePercent) / 100;
        uint256 creatorFee = (ethBalance * config.creatorFeePercent) / 100;
        uint256 liquidityETH = ethBalance - platformFee - creatorFee;

        // 3. Get token balance and calculate liquidity allocation
        uint256 tokenBalance = IERC20(token).balanceOf(address(this));
        uint256 liquidityTokens = (tokenBalance * config.tokenAllocationPercent) / 100;

        // 4. Send fees
        if (platformFee > 0) {
            (bool success, ) = feeRecipient.call{value: platformFee}("");
            require(success, "GraduationEngine: platform fee transfer failed");
            emit FeeCollected(token, platformFee);
        }

        if (creatorFee > 0) {
            address creator = IXfernoToken(token).creator();
            (bool success, ) = creator.call{value: creatorFee}("");
            require(success, "GraduationEngine: creator fee transfer failed");
        }

        // 5. Create pool and add liquidity
        (address pair, uint256 liquidity) = _createPoolAndAddLiquidity(
            token,
            liquidityTokens,
            liquidityETH,
            config
        );

        // 6. Update status
        status.completed = true;
        status.pair = pair;
        status.liquidityTokens = liquidity;
        status.graduatedAt = block.timestamp;

        emit GraduationCompleted(token, pair, block.timestamp);
    }

    /**
     * @notice Graduate token in single transaction (initiate + execute)
     * @param token Token to graduate
     */
    function graduate(address token) external onlyAuthorized nonReentrant whenNotPaused {
        // Initiate if not already
        if (!graduationStatus[token].initiated) {
            (
                ,
                uint256 totalRaised,
                uint256 graduationTarget,
                bool graduated,
                
            ) = bondingCurve.getTokenInfo(token);

            require(totalRaised >= graduationTarget, "GraduationEngine: target not reached");
            require(!graduated, "GraduationEngine: already graduated on curve");

            graduationStatus[token] = GraduationStatus({
                initiated: true,
                completed: false,
                pair: address(0),
                liquidityTokens: 0,
                graduatedAt: 0,
                totalRaised: totalRaised
            });

            emit GraduationInitiated(token, totalRaised, block.timestamp);
        }

        // Execute graduation
        GraduationStatus storage status = graduationStatus[token];
        require(!status.completed, "GraduationEngine: already completed");

        GraduationConfig memory config = _getConfig(token);
        
        // Finalize presale
        bondingCurve.graduateToken(token);

        uint256 ethBalance = address(this).balance;
        require(ethBalance >= config.minLiquidityETH, "GraduationEngine: insufficient ETH");

        uint256 platformFee = (ethBalance * config.platformFeePercent) / 100;
        uint256 creatorFee = (ethBalance * config.creatorFeePercent) / 100;
        uint256 liquidityETH = ethBalance - platformFee - creatorFee;

        uint256 tokenBalance = IERC20(token).balanceOf(address(this));
        uint256 liquidityTokens = (tokenBalance * config.tokenAllocationPercent) / 100;

        // Send fees
        if (platformFee > 0) {
            (bool feeSuccess, ) = feeRecipient.call{value: platformFee}("");
            require(feeSuccess, "GraduationEngine: platform fee failed");
            emit FeeCollected(token, platformFee);
        }

        if (creatorFee > 0) {
            address creator = IXfernoToken(token).creator();
            (bool creatorSuccess, ) = creator.call{value: creatorFee}("");
            require(creatorSuccess, "GraduationEngine: creator fee failed");
        }

        // Create pool
        (address pair, uint256 liquidity) = _createPoolAndAddLiquidity(
            token,
            liquidityTokens,
            liquidityETH,
            config
        );

        status.completed = true;
        status.pair = pair;
        status.liquidityTokens = liquidity;
        status.graduatedAt = block.timestamp;

        emit GraduationCompleted(token, pair, block.timestamp);
    }

    // ============ Internal Functions ============

    function _createPoolAndAddLiquidity(
        address token,
        uint256 tokenAmount,
        uint256 ethAmount,
        GraduationConfig memory config
    ) internal returns (address pair, uint256 liquidity) {
        // Approve router
        IERC20(token).approve(address(router), tokenAmount);

        // Add liquidity
        (uint256 amountToken, uint256 amountETH, uint256 lp) = router.addLiquidityETH{value: ethAmount}(
            token,
            tokenAmount,
            (tokenAmount * 95) / 100,  // 5% slippage tolerance
            (ethAmount * 95) / 100,     // 5% slippage tolerance
            address(this),
            block.timestamp + 300       // 5 minute deadline
        );

        // Get pair address
        pair = IXfernoFactory(router.factory()).getPair(token, router.WETH());
        require(pair != address(0), "GraduationEngine: pair not created");

        emit PoolCreated(token, pair, amountToken, amountETH);

        // Handle LP tokens
        if (config.burnLPTokens) {
            // Send to dead address (burn)
            IERC20(pair).safeTransfer(address(0xdead), lp);
        } else if (config.lpTokenRecipient != address(0)) {
            IERC20(pair).safeTransfer(config.lpTokenRecipient, lp);
        }

        emit LiquidityAdded(token, pair, lp);

        return (pair, lp);
    }

    function _getConfig(address token) internal view returns (GraduationConfig memory) {
        GraduationConfig memory config = tokenConfigs[token];
        if (config.tokenAllocationPercent == 0) {
            return defaultConfig;
        }
        return config;
    }

    // ============ Admin Functions ============

    /**
     * @notice Set custom config for a token
     */
    function setTokenConfig(
        address token,
        GraduationConfig calldata config
    ) external onlyOwner {
        require(config.tokenAllocationPercent <= 100, "GraduationEngine: invalid allocation");
        require(config.platformFeePercent + config.creatorFeePercent <= 20, "GraduationEngine: fees too high");
        tokenConfigs[token] = config;
    }

    /**
     * @notice Update default config
     */
    function setDefaultConfig(GraduationConfig calldata config) external onlyOwner {
        require(config.tokenAllocationPercent <= 100, "GraduationEngine: invalid allocation");
        require(config.platformFeePercent + config.creatorFeePercent <= 20, "GraduationEngine: fees too high");
        defaultConfig = config;
    }

    /**
     * @notice Update router address
     */
    function setRouter(address _router) external onlyOwner {
        router = IXfernoRouter(_router);
    }

    /**
     * @notice Update bonding curve address
     */
    function setBondingCurve(address _bondingCurve) external onlyOwner {
        bondingCurve = IBondingCurve(_bondingCurve);
    }

    /**
     * @notice Update fee recipient
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    /**
     * @notice Add/remove authorized caller
     */
    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        authorizedCallers[caller] = authorized;
    }

    /**
     * @notice Pause graduation
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause graduation
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Recover stuck tokens
     */
    function recoverTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    /**
     * @notice Recover stuck ETH
     */
    function recoverETH() external onlyOwner {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "GraduationEngine: ETH transfer failed");
    }

    // ============ View Functions ============

    /**
     * @notice Get graduation status for a token
     */
    function getGraduationStatus(address token) external view returns (GraduationStatus memory) {
        return graduationStatus[token];
    }

    /**
     * @notice Check if a token is ready for graduation
     */
    function isReadyForGraduation(address token) external view returns (bool) {
        (
            ,
            uint256 totalRaised,
            uint256 graduationTarget,
            bool graduated,
            
        ) = bondingCurve.getTokenInfo(token);

        return totalRaised >= graduationTarget && !graduated;
    }

    /**
     * @notice Get effective config for a token
     */
    function getEffectiveConfig(address token) external view returns (GraduationConfig memory) {
        return _getConfig(token);
    }

    receive() external payable {}
}
