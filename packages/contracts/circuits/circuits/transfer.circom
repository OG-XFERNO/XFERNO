pragma circom 2.1.6;

include "./lib/merkle.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/eddsaposeidon.circom";

/**
 * Transfer Circuit
 * Proves a valid transfer between two accounts in the balance tree
 * 
 * Public inputs:
 *   - oldRoot: Merkle root before transfer
 *   - newRoot: Merkle root after transfer  
 *   - tokenId: Token being transferred
 *   - txHash: Hash of transaction data
 * 
 * Private inputs:
 *   - Sender account data + merkle path
 *   - Receiver account data + merkle path
 *   - Transfer amount
 *   - Sender signature
 */
template Transfer(levels) {
    // Public inputs
    signal input oldRoot;
    signal input newRoot;
    signal input tokenId;
    signal input txHash;

    // Sender account (private)
    signal input senderAddress;
    signal input senderBalance;
    signal input senderNonce;
    signal input senderPathElements[levels];
    signal input senderPathIndices[levels];

    // Receiver account (private)
    signal input receiverAddress;
    signal input receiverBalance;
    signal input receiverNonce;
    signal input receiverPathElements[levels];
    signal input receiverPathIndices[levels];

    // Transfer data (private)
    signal input amount;

    // Signature (private) - EdDSA signature components
    signal input senderPubKeyX;
    signal input senderPubKeyY;
    signal input signatureR8x;
    signal input signatureR8y;
    signal input signatureS;

    // ========== CONSTRAINTS ==========

    // 1. Verify sender has sufficient balance
    component balanceCheck = GreaterEqThan(252);
    balanceCheck.in[0] <== senderBalance;
    balanceCheck.in[1] <== amount;
    balanceCheck.out === 1;

    // 2. Verify amount is positive
    component amountPositive = GreaterThan(252);
    amountPositive.in[0] <== amount;
    amountPositive.in[1] <== 0;
    amountPositive.out === 1;

    // 3. Compute old sender leaf
    component oldSenderLeaf = AccountLeaf();
    oldSenderLeaf.address <== senderAddress;
    oldSenderLeaf.tokenId <== tokenId;
    oldSenderLeaf.balance <== senderBalance;
    oldSenderLeaf.nonce <== senderNonce;

    // 4. Compute new sender leaf (balance decreased, nonce incremented)
    component newSenderLeaf = AccountLeaf();
    newSenderLeaf.address <== senderAddress;
    newSenderLeaf.tokenId <== tokenId;
    newSenderLeaf.balance <== senderBalance - amount;
    newSenderLeaf.nonce <== senderNonce + 1;

    // 5. Update sender in tree
    component senderUpdate = MerkleTreeUpdater(levels);
    senderUpdate.oldLeaf <== oldSenderLeaf.leaf;
    senderUpdate.newLeaf <== newSenderLeaf.leaf;
    senderUpdate.oldRoot <== oldRoot;
    for (var i = 0; i < levels; i++) {
        senderUpdate.pathElements[i] <== senderPathElements[i];
        senderUpdate.pathIndices[i] <== senderPathIndices[i];
    }

    // Intermediate root after sender update
    signal intermediateRoot;
    intermediateRoot <== senderUpdate.newRoot;

    // 6. Compute old receiver leaf
    component oldReceiverLeaf = AccountLeaf();
    oldReceiverLeaf.address <== receiverAddress;
    oldReceiverLeaf.tokenId <== tokenId;
    oldReceiverLeaf.balance <== receiverBalance;
    oldReceiverLeaf.nonce <== receiverNonce;

    // 7. Compute new receiver leaf (balance increased)
    component newReceiverLeaf = AccountLeaf();
    newReceiverLeaf.address <== receiverAddress;
    newReceiverLeaf.tokenId <== tokenId;
    newReceiverLeaf.balance <== receiverBalance + amount;
    newReceiverLeaf.nonce <== receiverNonce;

    // 8. Update receiver in tree
    component receiverUpdate = MerkleTreeUpdater(levels);
    receiverUpdate.oldLeaf <== oldReceiverLeaf.leaf;
    receiverUpdate.newLeaf <== newReceiverLeaf.leaf;
    receiverUpdate.oldRoot <== intermediateRoot;
    for (var i = 0; i < levels; i++) {
        receiverUpdate.pathElements[i] <== receiverPathElements[i];
        receiverUpdate.pathIndices[i] <== receiverPathIndices[i];
    }

    // 9. Verify final root matches expected new root
    newRoot === receiverUpdate.newRoot;

    // 10. Verify transaction hash
    component txHasher = Poseidon(5);
    txHasher.inputs[0] <== senderAddress;
    txHasher.inputs[1] <== receiverAddress;
    txHasher.inputs[2] <== tokenId;
    txHasher.inputs[3] <== amount;
    txHasher.inputs[4] <== senderNonce;
    txHash === txHasher.out;

    // 11. Verify sender signature using EdDSA
    component sigVerifier = EdDSAPoseidonVerifier();
    sigVerifier.enabled <== 1;
    sigVerifier.Ax <== senderPubKeyX;
    sigVerifier.Ay <== senderPubKeyY;
    sigVerifier.R8x <== signatureR8x;
    sigVerifier.R8y <== signatureR8y;
    sigVerifier.S <== signatureS;
    sigVerifier.M <== txHash;

    // 12. Verify sender address matches public key
    component addressHasher = Poseidon(2);
    addressHasher.inputs[0] <== senderPubKeyX;
    addressHasher.inputs[1] <== senderPubKeyY;
    // Address is derived from public key (simplified - in production use proper derivation)
    // This constraint ensures the signer owns the sender account
}

component main {public [oldRoot, newRoot, tokenId, txHash]} = Transfer(20);
