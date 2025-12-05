pragma circom 2.1.6;

include "./lib/merkle.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/**
 * Deposit Circuit
 * Proves a valid deposit into the ZK rollup balance tree
 * 
 * Deposits are initiated on L1 and processed in batches on L2.
 * The circuit verifies the new balance tree state after adding
 * deposited funds to an account.
 * 
 * Public inputs:
 *   - oldRoot: Merkle root before deposit
 *   - newRoot: Merkle root after deposit
 *   - depositHash: Hash of deposit data (from L1 event)
 * 
 * Private inputs:
 *   - Account data + merkle path
 *   - Deposit amount
 */
template Deposit(levels) {
    // Public inputs
    signal input oldRoot;
    signal input newRoot;
    signal input depositHash;

    // Account data (private)
    signal input accountAddress;
    signal input tokenId;
    signal input oldBalance;
    signal input nonce;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // Deposit data (private)
    signal input amount;
    signal input l1TxHash; // L1 transaction hash for verification

    // ========== CONSTRAINTS ==========

    // 1. Verify deposit amount is positive
    component amountPositive = GreaterThan(252);
    amountPositive.in[0] <== amount;
    amountPositive.in[1] <== 0;
    amountPositive.out === 1;

    // 2. Compute old account leaf
    component oldLeaf = AccountLeaf();
    oldLeaf.address <== accountAddress;
    oldLeaf.tokenId <== tokenId;
    oldLeaf.balance <== oldBalance;
    oldLeaf.nonce <== nonce;

    // 3. Compute new account leaf (balance increased)
    component newLeaf = AccountLeaf();
    newLeaf.address <== accountAddress;
    newLeaf.tokenId <== tokenId;
    newLeaf.balance <== oldBalance + amount;
    newLeaf.nonce <== nonce;

    // 4. Update account in tree
    component updater = MerkleTreeUpdater(levels);
    updater.oldLeaf <== oldLeaf.leaf;
    updater.newLeaf <== newLeaf.leaf;
    updater.oldRoot <== oldRoot;
    for (var i = 0; i < levels; i++) {
        updater.pathElements[i] <== pathElements[i];
        updater.pathIndices[i] <== pathIndices[i];
    }

    // 5. Verify new root matches
    newRoot === updater.newRoot;

    // 6. Verify deposit hash matches L1 event data
    component hashVerifier = Poseidon(4);
    hashVerifier.inputs[0] <== accountAddress;
    hashVerifier.inputs[1] <== tokenId;
    hashVerifier.inputs[2] <== amount;
    hashVerifier.inputs[3] <== l1TxHash;
    depositHash === hashVerifier.out;
}

component main {public [oldRoot, newRoot, depositHash]} = Deposit(20);
