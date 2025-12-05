pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

// Merkle tree depth for balance tree (supports 2^20 = ~1M accounts)
// Can be adjusted based on needs

/**
 * Hash two children to create parent node
 */
template HashLeftRight() {
    signal input left;
    signal input right;
    signal output hash;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== left;
    hasher.inputs[1] <== right;
    hash <== hasher.out;
}

/**
 * Compute Merkle root from leaf and path
 * @param levels - depth of the Merkle tree
 */
template MerkleTreeChecker(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component hashers[levels];
    component indexBits = Num2Bits(levels);

    signal computedPath[levels + 1];
    computedPath[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        hashers[i] = HashLeftRight();
        
        // If pathIndex is 0, leaf is on left, sibling on right
        // If pathIndex is 1, leaf is on right, sibling on left
        hashers[i].left <== computedPath[i] + pathIndices[i] * (pathElements[i] - computedPath[i]);
        hashers[i].right <== pathElements[i] + pathIndices[i] * (computedPath[i] - pathElements[i]);
        
        computedPath[i + 1] <== hashers[i].hash;
    }

    // Verify computed root matches expected root
    root === computedPath[levels];
}

/**
 * Compute new Merkle root after updating a leaf
 * @param levels - depth of the Merkle tree
 */
template MerkleTreeUpdater(levels) {
    signal input oldLeaf;
    signal input newLeaf;
    signal input oldRoot;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output newRoot;

    // Verify old leaf exists in tree
    component oldChecker = MerkleTreeChecker(levels);
    oldChecker.leaf <== oldLeaf;
    oldChecker.root <== oldRoot;
    for (var i = 0; i < levels; i++) {
        oldChecker.pathElements[i] <== pathElements[i];
        oldChecker.pathIndices[i] <== pathIndices[i];
    }

    // Compute new root with updated leaf
    component hashers[levels];
    signal computedPath[levels + 1];
    computedPath[0] <== newLeaf;

    for (var i = 0; i < levels; i++) {
        hashers[i] = HashLeftRight();
        hashers[i].left <== computedPath[i] + pathIndices[i] * (pathElements[i] - computedPath[i]);
        hashers[i].right <== pathElements[i] + pathIndices[i] * (computedPath[i] - pathElements[i]);
        computedPath[i + 1] <== hashers[i].hash;
    }

    newRoot <== computedPath[levels];
}

/**
 * Hash account data into leaf
 * Leaf = Poseidon(address, tokenId, balance, nonce)
 */
template AccountLeaf() {
    signal input address;
    signal input tokenId;
    signal input balance;
    signal input nonce;
    signal output leaf;

    component hasher = Poseidon(4);
    hasher.inputs[0] <== address;
    hasher.inputs[1] <== tokenId;
    hasher.inputs[2] <== balance;
    hasher.inputs[3] <== nonce;
    leaf <== hasher.out;
}
