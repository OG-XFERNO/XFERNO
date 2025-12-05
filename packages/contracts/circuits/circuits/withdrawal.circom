pragma circom 2.1.6;

include "./lib/merkle.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/eddsaposeidon.circom";

/**
 * Withdrawal Circuit
 * Proves a valid withdrawal from the ZK rollup to L1
 * 
 * Withdrawals are initiated on L2 and can be claimed on L1
 * after the proof is verified.
 * 
 * Public inputs:
 *   - oldRoot: Merkle root before withdrawal
 *   - newRoot: Merkle root after withdrawal
 *   - withdrawalHash: Hash of withdrawal data (for L1 claim)
 * 
 * Private inputs:
 *   - Account data + merkle path
 *   - Withdrawal amount and recipient
 *   - Account owner signature
 */
template Withdrawal(levels) {
    // Public inputs
    signal input oldRoot;
    signal input newRoot;
    signal input withdrawalHash;

    // Account data (private)
    signal input accountAddress;
    signal input tokenId;
    signal input balance;
    signal input nonce;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // Withdrawal data (private)
    signal input amount;
    signal input l1Recipient; // L1 address to receive funds

    // Signature (private)
    signal input pubKeyX;
    signal input pubKeyY;
    signal input signatureR8x;
    signal input signatureR8y;
    signal input signatureS;

    // ========== CONSTRAINTS ==========

    // 1. Verify account has sufficient balance
    component balanceCheck = GreaterEqThan(252);
    balanceCheck.in[0] <== balance;
    balanceCheck.in[1] <== amount;
    balanceCheck.out === 1;

    // 2. Verify withdrawal amount is positive
    component amountPositive = GreaterThan(252);
    amountPositive.in[0] <== amount;
    amountPositive.in[1] <== 0;
    amountPositive.out === 1;

    // 3. Compute old account leaf
    component oldLeaf = AccountLeaf();
    oldLeaf.address <== accountAddress;
    oldLeaf.tokenId <== tokenId;
    oldLeaf.balance <== balance;
    oldLeaf.nonce <== nonce;

    // 4. Compute new account leaf (balance decreased, nonce incremented)
    component newLeaf = AccountLeaf();
    newLeaf.address <== accountAddress;
    newLeaf.tokenId <== tokenId;
    newLeaf.balance <== balance - amount;
    newLeaf.nonce <== nonce + 1;

    // 5. Update account in tree
    component updater = MerkleTreeUpdater(levels);
    updater.oldLeaf <== oldLeaf.leaf;
    updater.newLeaf <== newLeaf.leaf;
    updater.oldRoot <== oldRoot;
    for (var i = 0; i < levels; i++) {
        updater.pathElements[i] <== pathElements[i];
        updater.pathIndices[i] <== pathIndices[i];
    }

    // 6. Verify new root matches
    newRoot === updater.newRoot;

    // 7. Compute withdrawal hash for L1 claim
    component hashComputer = Poseidon(5);
    hashComputer.inputs[0] <== accountAddress;
    hashComputer.inputs[1] <== l1Recipient;
    hashComputer.inputs[2] <== tokenId;
    hashComputer.inputs[3] <== amount;
    hashComputer.inputs[4] <== nonce;
    withdrawalHash === hashComputer.out;

    // 8. Verify owner signature
    component sigVerifier = EdDSAPoseidonVerifier();
    sigVerifier.enabled <== 1;
    sigVerifier.Ax <== pubKeyX;
    sigVerifier.Ay <== pubKeyY;
    sigVerifier.R8x <== signatureR8x;
    sigVerifier.R8y <== signatureR8y;
    sigVerifier.S <== signatureS;
    sigVerifier.M <== withdrawalHash;
}

component main {public [oldRoot, newRoot, withdrawalHash]} = Withdrawal(20);
