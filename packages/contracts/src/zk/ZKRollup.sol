// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IVerifier.sol";

/**
 * @title ZKRollup
 * @notice Main ZK Rollup contract for XFERNO presale tokens
 * @dev Handles deposits, withdrawals, and state root updates
 * 
 * The rollup maintains a Merkle root of all account balances.
 * Users can deposit tokens, trade off-chain, and withdraw with ZK proofs.
 */
contract ZKRollup is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Events ============

    event Deposit(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 indexed depositId
    );

    event WithdrawalInitiated(
        address indexed user,
        address indexed token,
        uint256 amount,
        bytes32 withdrawalHash
    );

    event WithdrawalCompleted(
        address indexed user,
        address indexed token,
        uint256 amount,
        bytes32 withdrawalHash
    );

    event StateRootUpdated(
        bytes32 indexed oldRoot,
        bytes32 indexed newRoot,
        uint256 batchNumber,
        bytes32 batchHash
    );

    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    event OperatorUpdated(address indexed oldOperator, address indexed newOperator);

    // ============ Structs ============

    struct PendingDeposit {
        address user;
        address token;
        uint256 amount;
        uint256 timestamp;
        bool processed;
    }

    struct PendingWithdrawal {
        address user;
        address token;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
    }

    // ============ State Variables ============

    /// @notice Current state root of the balance Merkle tree
    bytes32 public stateRoot;

    /// @notice Batch number (incremented with each state update)
    uint256 public batchNumber;

    /// @notice Verifier contract for ZK proofs
    IVerifier public verifier;

    /// @notice Operator address (can submit batches)
    address public operator;

    /// @notice Deposit counter
    uint256 public depositCount;

    /// @notice Pending deposits mapping
    mapping(uint256 => PendingDeposit) public pendingDeposits;

    /// @notice Pending withdrawals by hash
    mapping(bytes32 => PendingWithdrawal) public pendingWithdrawals;

    /// @notice Processed withdrawal hashes
    mapping(bytes32 => bool) public processedWithdrawals;

    /// @notice Supported tokens for deposits
    mapping(address => bool) public supportedTokens;

    /// @notice Minimum deposit amount per token
    mapping(address => uint256) public minDeposit;

    /// @notice Challenge period for withdrawals (default 1 hour for testnet)
    uint256 public challengePeriod = 1 hours;

    // ============ Constructor ============

    constructor(
        address _verifier,
        address _operator,
        bytes32 _initialRoot
    ) Ownable(msg.sender) {
        verifier = IVerifier(_verifier);
        operator = _operator;
        stateRoot = _initialRoot;
    }

    // ============ Modifiers ============

    modifier onlyOperator() {
        require(msg.sender == operator, "ZKRollup: not operator");
        _;
    }

    // ============ External Functions ============

    /**
     * @notice Deposit ETH into the rollup
     */
    function depositETH() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "ZKRollup: zero deposit");
        require(supportedTokens[address(0)], "ZKRollup: ETH not supported");
        require(msg.value >= minDeposit[address(0)], "ZKRollup: below minimum");

        uint256 depositId = depositCount++;
        pendingDeposits[depositId] = PendingDeposit({
            user: msg.sender,
            token: address(0),
            amount: msg.value,
            timestamp: block.timestamp,
            processed: false
        });

        emit Deposit(msg.sender, address(0), msg.value, depositId);
    }

    /**
     * @notice Deposit ERC20 tokens into the rollup
     * @param token Token address
     * @param amount Amount to deposit
     */
    function depositToken(
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(amount > 0, "ZKRollup: zero deposit");
        require(supportedTokens[token], "ZKRollup: token not supported");
        require(amount >= minDeposit[token], "ZKRollup: below minimum");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        uint256 depositId = depositCount++;
        pendingDeposits[depositId] = PendingDeposit({
            user: msg.sender,
            token: token,
            amount: amount,
            timestamp: block.timestamp,
            processed: false
        });

        emit Deposit(msg.sender, token, amount, depositId);
    }

    /**
     * @notice Submit a new batch with ZK proof
     * @param newRoot New state root after batch
     * @param batchHash Hash of transactions in batch
     * @param proof ZK proof of valid state transition
     * @param depositIds IDs of deposits included in this batch
     */
    function submitBatch(
        bytes32 newRoot,
        bytes32 batchHash,
        uint256[8] calldata proof,
        uint256[] calldata depositIds
    ) external onlyOperator nonReentrant whenNotPaused {
        // Prepare public inputs for verifier
        uint256[] memory publicInputs = new uint256[](3);
        publicInputs[0] = uint256(stateRoot);
        publicInputs[1] = uint256(newRoot);
        publicInputs[2] = uint256(batchHash);

        // Verify ZK proof
        require(
            verifier.verifyProof(proof, publicInputs),
            "ZKRollup: invalid proof"
        );

        // Mark deposits as processed
        for (uint256 i = 0; i < depositIds.length; i++) {
            require(!pendingDeposits[depositIds[i]].processed, "ZKRollup: deposit already processed");
            pendingDeposits[depositIds[i]].processed = true;
        }

        // Update state
        bytes32 oldRoot = stateRoot;
        stateRoot = newRoot;
        batchNumber++;

        emit StateRootUpdated(oldRoot, newRoot, batchNumber, batchHash);
    }

    /**
     * @notice Initiate a withdrawal (must be included in a batch)
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     * @param withdrawalHash Hash from the ZK circuit
     * @param proof ZK proof of valid withdrawal
     */
    function initiateWithdrawal(
        address token,
        uint256 amount,
        bytes32 withdrawalHash,
        uint256[8] calldata proof
    ) external nonReentrant whenNotPaused {
        require(!processedWithdrawals[withdrawalHash], "ZKRollup: already withdrawn");
        require(pendingWithdrawals[withdrawalHash].user == address(0), "ZKRollup: withdrawal pending");

        // Verify withdrawal proof
        uint256[] memory publicInputs = new uint256[](3);
        publicInputs[0] = uint256(stateRoot);
        publicInputs[1] = uint256(stateRoot); // Withdrawal doesn't change root until batch
        publicInputs[2] = uint256(withdrawalHash);

        require(
            verifier.verifyProof(proof, publicInputs),
            "ZKRollup: invalid withdrawal proof"
        );

        pendingWithdrawals[withdrawalHash] = PendingWithdrawal({
            user: msg.sender,
            token: token,
            amount: amount,
            timestamp: block.timestamp,
            claimed: false
        });

        emit WithdrawalInitiated(msg.sender, token, amount, withdrawalHash);
    }

    /**
     * @notice Claim a withdrawal after challenge period
     * @param withdrawalHash Hash of the withdrawal
     */
    function claimWithdrawal(bytes32 withdrawalHash) external nonReentrant {
        PendingWithdrawal storage withdrawal = pendingWithdrawals[withdrawalHash];
        
        require(withdrawal.user == msg.sender, "ZKRollup: not your withdrawal");
        require(!withdrawal.claimed, "ZKRollup: already claimed");
        require(
            block.timestamp >= withdrawal.timestamp + challengePeriod,
            "ZKRollup: challenge period not over"
        );

        withdrawal.claimed = true;
        processedWithdrawals[withdrawalHash] = true;

        if (withdrawal.token == address(0)) {
            (bool success, ) = msg.sender.call{value: withdrawal.amount}("");
            require(success, "ZKRollup: ETH transfer failed");
        } else {
            IERC20(withdrawal.token).safeTransfer(msg.sender, withdrawal.amount);
        }

        emit WithdrawalCompleted(msg.sender, withdrawal.token, withdrawal.amount, withdrawalHash);
    }

    // ============ Admin Functions ============

    /**
     * @notice Add a supported token
     */
    function addSupportedToken(address token, uint256 _minDeposit) external onlyOwner {
        supportedTokens[token] = true;
        minDeposit[token] = _minDeposit;
    }

    /**
     * @notice Remove a supported token
     */
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }

    /**
     * @notice Update the verifier contract
     */
    function setVerifier(address _verifier) external onlyOwner {
        address oldVerifier = address(verifier);
        verifier = IVerifier(_verifier);
        emit VerifierUpdated(oldVerifier, _verifier);
    }

    /**
     * @notice Update the operator address
     */
    function setOperator(address _operator) external onlyOwner {
        address oldOperator = operator;
        operator = _operator;
        emit OperatorUpdated(oldOperator, _operator);
    }

    /**
     * @notice Update the challenge period
     */
    function setChallengePeriod(uint256 _challengePeriod) external onlyOwner {
        challengePeriod = _challengePeriod;
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdraw (only when paused, for stuck funds)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(paused(), "ZKRollup: not paused");
        
        if (token == address(0)) {
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "ZKRollup: ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }
    }

    // ============ View Functions ============

    /**
     * @notice Get pending deposit info
     */
    function getDeposit(uint256 depositId) external view returns (PendingDeposit memory) {
        return pendingDeposits[depositId];
    }

    /**
     * @notice Get pending withdrawal info
     */
    function getWithdrawal(bytes32 withdrawalHash) external view returns (PendingWithdrawal memory) {
        return pendingWithdrawals[withdrawalHash];
    }

    /**
     * @notice Check if a withdrawal can be claimed
     */
    function canClaimWithdrawal(bytes32 withdrawalHash) external view returns (bool) {
        PendingWithdrawal memory withdrawal = pendingWithdrawals[withdrawalHash];
        return !withdrawal.claimed && 
               withdrawal.user != address(0) &&
               block.timestamp >= withdrawal.timestamp + challengePeriod;
    }

    receive() external payable {
        revert("ZKRollup: use depositETH");
    }
}
