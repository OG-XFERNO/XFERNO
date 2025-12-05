// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IXfernoFactory
 * @notice Interface for XFERNO DEX factory
 * @dev Creates and manages liquidity pairs
 */
interface IXfernoFactory {
    // ============ Events ============

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256 pairCount);
    event FeeToUpdated(address indexed oldFeeTo, address indexed newFeeTo);
    event FeeToSetterUpdated(address indexed oldSetter, address indexed newSetter);

    // ============ View Functions ============

    function feeTo() external view returns (address);
    function feeToSetter() external view returns (address);
    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function allPairs(uint256 index) external view returns (address pair);
    function allPairsLength() external view returns (uint256);

    // ============ Write Functions ============

    function createPair(address tokenA, address tokenB) external returns (address pair);
    function setFeeTo(address newFeeTo) external;
    function setFeeToSetter(address newFeeToSetter) external;
}
