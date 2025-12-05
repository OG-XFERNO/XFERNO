// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IXfernoFactory.sol";
import "./XfernoPair.sol";

/**
 * @title XfernoFactory
 * @notice Factory contract for creating XFERNO DEX pairs
 * @dev Manages pair creation and fee settings
 */
contract XfernoFactory is IXfernoFactory {
    // ============ State Variables ============

    address public feeTo;
    address public feeToSetter;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    // ============ Errors ============

    error IdenticalAddresses();
    error ZeroAddress();
    error PairExists();
    error Forbidden();

    // ============ Constructor ============

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    // ============ View Functions ============

    /**
     * @notice Get total number of pairs created
     */
    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    // ============ Pair Creation ============

    /**
     * @notice Create a new liquidity pair
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return pair Address of the created pair
     */
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        if (tokenA == tokenB) revert IdenticalAddresses();
        
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        
        if (token0 == address(0)) revert ZeroAddress();
        if (getPair[token0][token1] != address(0)) revert PairExists();

        // Deploy pair using CREATE2 for deterministic addresses
        bytes memory bytecode = type(XfernoPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        // Initialize the pair
        XfernoPair(pair).initialize(token0, token1);

        // Store pair mappings (both directions)
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    // ============ Admin Functions ============

    /**
     * @notice Set fee recipient address
     * @param _feeTo New fee recipient
     */
    function setFeeTo(address _feeTo) external {
        if (msg.sender != feeToSetter) revert Forbidden();
        address oldFeeTo = feeTo;
        feeTo = _feeTo;
        emit FeeToUpdated(oldFeeTo, _feeTo);
    }

    /**
     * @notice Set fee setter address
     * @param _feeToSetter New fee setter
     */
    function setFeeToSetter(address _feeToSetter) external {
        if (msg.sender != feeToSetter) revert Forbidden();
        address oldSetter = feeToSetter;
        feeToSetter = _feeToSetter;
        emit FeeToSetterUpdated(oldSetter, _feeToSetter);
    }

    // ============ Helper Functions ============

    /**
     * @notice Get the init code hash for pair creation
     * @dev Used by XfernoLibrary for CREATE2 address calculation
     */
    function pairCodeHash() external pure returns (bytes32) {
        return keccak256(type(XfernoPair).creationCode);
    }
}
