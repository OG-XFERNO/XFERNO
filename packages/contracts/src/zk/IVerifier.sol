// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVerifier
 * @notice Interface for ZK proof verifiers
 */
interface IVerifier {
    /**
     * @notice Verify a ZK proof
     * @param proof The proof data
     * @param publicInputs The public inputs to the circuit
     * @return True if the proof is valid
     */
    function verifyProof(
        uint256[8] calldata proof,
        uint256[] calldata publicInputs
    ) external view returns (bool);
}
