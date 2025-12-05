pragma circom 2.1.6;

include "./lib/merkle.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/mux1.circom";

/**
 * Batch Transaction Circuit
 * Processes multiple transactions in a single proof for efficiency
 * 
 * This is the main circuit used for ZK rollup state transitions.
 * It validates a batch of transactions and computes the new state root.
 * 
 * Public inputs:
 *   - oldRoot: Merkle root before batch
 *   - newRoot: Merkle root after batch
 *   - batchHash: Hash of all transactions in batch
 * 
 * @param levels - Merkle tree depth
 * @param batchSize - Number of transactions in batch
 */
template BatchProcessor(levels, batchSize) {
    // Public inputs
    signal input oldRoot;
    signal input newRoot;
    signal input batchHash;

    // Transaction data for each tx in batch
    signal input txType[batchSize]; // 0=transfer, 1=deposit, 2=withdrawal
    
    // Sender data
    signal input senderAddress[batchSize];
    signal input senderTokenId[batchSize];
    signal input senderBalance[batchSize];
    signal input senderNonce[batchSize];
    signal input senderPathElements[batchSize][levels];
    signal input senderPathIndices[batchSize][levels];

    // Receiver data (for transfers)
    signal input receiverAddress[batchSize];
    signal input receiverBalance[batchSize];
    signal input receiverNonce[batchSize];
    signal input receiverPathElements[batchSize][levels];
    signal input receiverPathIndices[batchSize][levels];

    // Transaction amounts
    signal input amount[batchSize];

    // Intermediate roots
    signal intermediateRoots[batchSize + 1];
    intermediateRoots[0] <== oldRoot;

    // Process each transaction
    component senderLeaves[batchSize];
    component newSenderLeaves[batchSize];
    component senderUpdates[batchSize];
    component receiverLeaves[batchSize];
    component newReceiverLeaves[batchSize];
    component receiverUpdates[batchSize];
    component balanceChecks[batchSize];
    component txHashers[batchSize];

    signal txHashes[batchSize];

    for (var i = 0; i < batchSize; i++) {
        // Verify sender has sufficient balance
        balanceChecks[i] = GreaterEqThan(252);
        balanceChecks[i].in[0] <== senderBalance[i];
        balanceChecks[i].in[1] <== amount[i];
        balanceChecks[i].out === 1;

        // Old sender leaf
        senderLeaves[i] = AccountLeaf();
        senderLeaves[i].address <== senderAddress[i];
        senderLeaves[i].tokenId <== senderTokenId[i];
        senderLeaves[i].balance <== senderBalance[i];
        senderLeaves[i].nonce <== senderNonce[i];

        // New sender leaf
        newSenderLeaves[i] = AccountLeaf();
        newSenderLeaves[i].address <== senderAddress[i];
        newSenderLeaves[i].tokenId <== senderTokenId[i];
        newSenderLeaves[i].balance <== senderBalance[i] - amount[i];
        newSenderLeaves[i].nonce <== senderNonce[i] + 1;

        // Update sender
        senderUpdates[i] = MerkleTreeUpdater(levels);
        senderUpdates[i].oldLeaf <== senderLeaves[i].leaf;
        senderUpdates[i].newLeaf <== newSenderLeaves[i].leaf;
        senderUpdates[i].oldRoot <== intermediateRoots[i];
        for (var j = 0; j < levels; j++) {
            senderUpdates[i].pathElements[j] <== senderPathElements[i][j];
            senderUpdates[i].pathIndices[j] <== senderPathIndices[i][j];
        }

        // Old receiver leaf
        receiverLeaves[i] = AccountLeaf();
        receiverLeaves[i].address <== receiverAddress[i];
        receiverLeaves[i].tokenId <== senderTokenId[i];
        receiverLeaves[i].balance <== receiverBalance[i];
        receiverLeaves[i].nonce <== receiverNonce[i];

        // New receiver leaf
        newReceiverLeaves[i] = AccountLeaf();
        newReceiverLeaves[i].address <== receiverAddress[i];
        newReceiverLeaves[i].tokenId <== senderTokenId[i];
        newReceiverLeaves[i].balance <== receiverBalance[i] + amount[i];
        newReceiverLeaves[i].nonce <== receiverNonce[i];

        // Update receiver
        receiverUpdates[i] = MerkleTreeUpdater(levels);
        receiverUpdates[i].oldLeaf <== receiverLeaves[i].leaf;
        receiverUpdates[i].newLeaf <== newReceiverLeaves[i].leaf;
        receiverUpdates[i].oldRoot <== senderUpdates[i].newRoot;
        for (var j = 0; j < levels; j++) {
            receiverUpdates[i].pathElements[j] <== receiverPathElements[i][j];
            receiverUpdates[i].pathIndices[j] <== receiverPathIndices[i][j];
        }

        intermediateRoots[i + 1] <== receiverUpdates[i].newRoot;

        // Compute tx hash
        txHashers[i] = Poseidon(5);
        txHashers[i].inputs[0] <== senderAddress[i];
        txHashers[i].inputs[1] <== receiverAddress[i];
        txHashers[i].inputs[2] <== senderTokenId[i];
        txHashers[i].inputs[3] <== amount[i];
        txHashers[i].inputs[4] <== senderNonce[i];
        txHashes[i] <== txHashers[i].out;
    }

    // Verify final root
    newRoot === intermediateRoots[batchSize];

    // Verify batch hash (hash of all tx hashes)
    component batchHasher = Poseidon(batchSize);
    for (var i = 0; i < batchSize; i++) {
        batchHasher.inputs[i] <== txHashes[i];
    }
    batchHash === batchHasher.out;
}

// Default: 20 levels (1M accounts), 8 transactions per batch
component main {public [oldRoot, newRoot, batchHash]} = BatchProcessor(20, 8);
