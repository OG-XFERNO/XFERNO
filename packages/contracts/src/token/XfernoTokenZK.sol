// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title XfernoTokenZK
 * @notice ERC20 token with ZK rollup support and cross-chain bridging
 * 
 * Features:
 * - Standard ERC20 functionality
 * - Permit for gasless approvals
 * - Mint/burn controlled by bridges
 * - ZK rollup deposit/withdrawal support
 * - Pausable for emergencies
 */
contract XfernoTokenZK is ERC20, ERC20Burnable, ERC20Permit, AccessControl, Pausable {
    
    // ============ Roles ============
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ZK_ROLLUP_ROLE = keccak256("ZK_ROLLUP_ROLE");

    // ============ Events ============

    event BridgeMint(address indexed to, uint256 amount, bytes32 indexed sourceChainTxHash);
    event BridgeBurn(address indexed from, uint256 amount, uint256 indexed targetChainId);
    event ZKDeposit(address indexed from, uint256 amount, bytes32 indexed commitment);
    event ZKWithdrawal(address indexed to, uint256 amount, bytes32 indexed nullifier);

    // ============ State Variables ============

    /// @notice Token metadata
    string public imageUrl;
    string public description;
    string public website;
    string public twitter;
    string public discord;
    string public telegram;

    /// @notice Creator address
    address public creator;

    /// @notice Chain ID where token was originally created
    uint256 public originChainId;

    /// @notice Total supply cap (0 = no cap)
    uint256 public maxSupply;

    /// @notice Whether this is the canonical (origin) deployment
    bool public isCanonical;

    /// @notice Used nullifiers for ZK withdrawals
    mapping(bytes32 => bool) public usedNullifiers;

    /// @notice Bridge transaction hashes that have been processed
    mapping(bytes32 => bool) public processedBridgeTxs;

    // ============ Constructor ============

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        uint256 _maxSupply,
        address _creator,
        bool _isCanonical
    ) ERC20(_name, _symbol) ERC20Permit(_name) {
        creator = _creator;
        maxSupply = _maxSupply;
        isCanonical = _isCanonical;
        originChainId = block.chainid;

        _grantRole(DEFAULT_ADMIN_ROLE, _creator);
        _grantRole(MINTER_ROLE, _creator);
        _grantRole(PAUSER_ROLE, _creator);

        if (_initialSupply > 0) {
            require(_maxSupply == 0 || _initialSupply <= _maxSupply, "XfernoTokenZK: exceeds max supply");
            _mint(_creator, _initialSupply);
        }
    }

    // ============ External Functions ============

    /**
     * @notice Mint tokens (only for authorized minters)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(maxSupply == 0 || totalSupply() + amount <= maxSupply, "XfernoTokenZK: exceeds max supply");
        _mint(to, amount);
    }

    /**
     * @notice Mint tokens from bridge
     * @param to Recipient address
     * @param amount Amount to mint
     * @param sourceChainTxHash Transaction hash from source chain
     */
    function bridgeMint(
        address to,
        uint256 amount,
        bytes32 sourceChainTxHash
    ) external onlyRole(BRIDGE_ROLE) whenNotPaused {
        require(!processedBridgeTxs[sourceChainTxHash], "XfernoTokenZK: already processed");
        require(maxSupply == 0 || totalSupply() + amount <= maxSupply, "XfernoTokenZK: exceeds max supply");
        
        processedBridgeTxs[sourceChainTxHash] = true;
        _mint(to, amount);
        
        emit BridgeMint(to, amount, sourceChainTxHash);
    }

    /**
     * @notice Burn tokens for bridging to another chain
     * @param amount Amount to burn
     * @param targetChainId Target chain ID
     */
    function bridgeBurn(
        uint256 amount,
        uint256 targetChainId
    ) external whenNotPaused {
        require(amount > 0, "XfernoTokenZK: zero amount");
        _burn(msg.sender, amount);
        
        emit BridgeBurn(msg.sender, amount, targetChainId);
    }

    /**
     * @notice Deposit tokens to ZK rollup
     * @param amount Amount to deposit
     * @param commitment Poseidon commitment for L2 account
     */
    function zkDeposit(
        uint256 amount,
        bytes32 commitment
    ) external whenNotPaused {
        require(amount > 0, "XfernoTokenZK: zero amount");
        _burn(msg.sender, amount);
        
        emit ZKDeposit(msg.sender, amount, commitment);
    }

    /**
     * @notice Withdraw tokens from ZK rollup
     * @param to Recipient address
     * @param amount Amount to withdraw
     * @param nullifier Nullifier to prevent double-spend
     */
    function zkWithdraw(
        address to,
        uint256 amount,
        bytes32 nullifier
    ) external onlyRole(ZK_ROLLUP_ROLE) whenNotPaused {
        require(!usedNullifiers[nullifier], "XfernoTokenZK: nullifier used");
        require(maxSupply == 0 || totalSupply() + amount <= maxSupply, "XfernoTokenZK: exceeds max supply");
        
        usedNullifiers[nullifier] = true;
        _mint(to, amount);
        
        emit ZKWithdrawal(to, amount, nullifier);
    }

    // ============ Admin Functions ============

    /**
     * @notice Set token metadata
     */
    function setMetadata(
        string calldata _imageUrl,
        string calldata _description,
        string calldata _website,
        string calldata _twitter,
        string calldata _discord,
        string calldata _telegram
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        imageUrl = _imageUrl;
        description = _description;
        website = _website;
        twitter = _twitter;
        discord = _discord;
        telegram = _telegram;
    }

    /**
     * @notice Pause token transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Grant bridge role
     */
    function grantBridgeRole(address bridge) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(BRIDGE_ROLE, bridge);
    }

    /**
     * @notice Grant ZK rollup role
     */
    function grantZKRollupRole(address rollup) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ZK_ROLLUP_ROLE, rollup);
    }

    // ============ View Functions ============

    /**
     * @notice Get full token metadata
     */
    function getMetadata() external view returns (
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        string memory _imageUrl,
        string memory _description,
        string memory _website,
        string memory _twitter,
        string memory _discord,
        string memory _telegram
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            imageUrl,
            description,
            website,
            twitter,
            discord,
            telegram
        );
    }

    /**
     * @notice Check if a nullifier has been used
     */
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }

    /**
     * @notice Check if a bridge tx has been processed
     */
    function isBridgeTxProcessed(bytes32 txHash) external view returns (bool) {
        return processedBridgeTxs[txHash];
    }

    // ============ Internal Functions ============

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        super._update(from, to, value);
    }
}
