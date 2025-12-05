import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Merkle Tree node representation
 */
interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
}

/**
 * Account state in the ZK rollup
 */
export interface AccountState {
  address: string;
  tokenId: string;
  balance: string;
  nonce: number;
}

/**
 * Transfer transaction data
 */
export interface TransferTx {
  from: string;
  to: string;
  tokenId: string;
  amount: string;
  nonce: number;
  signature?: string;
}

/**
 * Deposit transaction data
 */
export interface DepositTx {
  account: string;
  tokenId: string;
  amount: string;
  l1TxHash: string;
}

/**
 * Withdrawal transaction data
 */
export interface WithdrawalTx {
  account: string;
  l1Recipient: string;
  tokenId: string;
  amount: string;
  nonce: number;
  signature: string;
}

/**
 * ZK Proof data
 */
export interface ZKProof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  publicSignals: string[];
}

/**
 * Batch submission data
 */
export interface BatchData {
  oldRoot: string;
  newRoot: string;
  batchHash: string;
  transactions: TransferTx[];
  proof?: ZKProof;
}

@Injectable()
export class ZKService {
  private readonly logger = new Logger(ZKService.name);
  
  // In-memory state (would be persisted to DB in production)
  private stateRoot: string;
  private accounts: Map<string, AccountState> = new Map();
  private pendingTransactions: TransferTx[] = [];
  private batchNumber: number = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Initialize with empty state root
    this.stateRoot = this.hashEmpty();
  }

  // ============ State Management ============

  /**
   * Get current state root
   */
  getStateRoot(): string {
    return this.stateRoot;
  }

  /**
   * Get account state
   */
  getAccountState(address: string, tokenId: string): AccountState | null {
    const key = this.accountKey(address, tokenId);
    return this.accounts.get(key) || null;
  }

  /**
   * Get all accounts for a user
   */
  getUserAccounts(address: string): AccountState[] {
    const accounts: AccountState[] = [];
    for (const [key, account] of this.accounts) {
      if (account.address.toLowerCase() === address.toLowerCase()) {
        accounts.push(account);
      }
    }
    return accounts;
  }

  /**
   * Get account balance
   */
  getBalance(address: string, tokenId: string): string {
    const account = this.getAccountState(address, tokenId);
    return account?.balance || '0';
  }

  // ============ Deposits ============

  /**
   * Process a deposit from L1
   */
  async processDeposit(deposit: DepositTx): Promise<{ newRoot: string; accountLeaf: string }> {
    const key = this.accountKey(deposit.account, deposit.tokenId);
    let account = this.accounts.get(key);

    if (!account) {
      account = {
        address: deposit.account,
        tokenId: deposit.tokenId,
        balance: '0',
        nonce: 0,
      };
    }

    // Add deposit amount to balance
    const newBalance = BigInt(account.balance) + BigInt(deposit.amount);
    account.balance = newBalance.toString();
    this.accounts.set(key, account);

    // Compute new state root
    const accountLeaf = this.hashAccount(account);
    this.stateRoot = this.computeMerkleRoot();

    this.logger.log(`Processed deposit: ${deposit.amount} to ${deposit.account}`);

    return {
      newRoot: this.stateRoot,
      accountLeaf,
    };
  }

  // ============ Transfers ============

  /**
   * Validate and queue a transfer transaction
   */
  async queueTransfer(tx: TransferTx): Promise<{ txHash: string; position: number }> {
    // Validate sender has sufficient balance
    const senderKey = this.accountKey(tx.from, tx.tokenId);
    const sender = this.accounts.get(senderKey);

    if (!sender) {
      throw new BadRequestException('Sender account not found');
    }

    if (BigInt(sender.balance) < BigInt(tx.amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    if (sender.nonce !== tx.nonce) {
      throw new BadRequestException(`Invalid nonce. Expected ${sender.nonce}, got ${tx.nonce}`);
    }

    // Compute transaction hash
    const txHash = this.hashTransaction(tx);

    // Add to pending transactions
    this.pendingTransactions.push(tx);

    this.logger.log(`Queued transfer: ${tx.amount} from ${tx.from} to ${tx.to}`);

    return {
      txHash,
      position: this.pendingTransactions.length - 1,
    };
  }

  /**
   * Execute a single transfer (for testing/simulation)
   */
  async executeTransfer(tx: TransferTx): Promise<{ oldRoot: string; newRoot: string }> {
    const oldRoot = this.stateRoot;

    // Update sender
    const senderKey = this.accountKey(tx.from, tx.tokenId);
    const sender = this.accounts.get(senderKey);

    if (!sender || BigInt(sender.balance) < BigInt(tx.amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    sender.balance = (BigInt(sender.balance) - BigInt(tx.amount)).toString();
    sender.nonce += 1;
    this.accounts.set(senderKey, sender);

    // Update receiver
    const receiverKey = this.accountKey(tx.to, tx.tokenId);
    let receiver = this.accounts.get(receiverKey);

    if (!receiver) {
      receiver = {
        address: tx.to,
        tokenId: tx.tokenId,
        balance: '0',
        nonce: 0,
      };
    }

    receiver.balance = (BigInt(receiver.balance) + BigInt(tx.amount)).toString();
    this.accounts.set(receiverKey, receiver);

    // Compute new state root
    this.stateRoot = this.computeMerkleRoot();

    return {
      oldRoot,
      newRoot: this.stateRoot,
    };
  }

  // ============ Withdrawals ============

  /**
   * Process a withdrawal request
   */
  async processWithdrawal(withdrawal: WithdrawalTx): Promise<{
    withdrawalHash: string;
    newRoot: string;
  }> {
    const key = this.accountKey(withdrawal.account, withdrawal.tokenId);
    const account = this.accounts.get(key);

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    if (BigInt(account.balance) < BigInt(withdrawal.amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    if (account.nonce !== withdrawal.nonce) {
      throw new BadRequestException(`Invalid nonce. Expected ${account.nonce}, got ${withdrawal.nonce}`);
    }

    // Compute withdrawal hash
    const withdrawalHash = this.hashWithdrawal(withdrawal);

    // Update account
    account.balance = (BigInt(account.balance) - BigInt(withdrawal.amount)).toString();
    account.nonce += 1;
    this.accounts.set(key, account);

    // Compute new state root
    this.stateRoot = this.computeMerkleRoot();

    this.logger.log(`Processed withdrawal: ${withdrawal.amount} to ${withdrawal.l1Recipient}`);

    return {
      withdrawalHash,
      newRoot: this.stateRoot,
    };
  }

  // ============ Batch Processing ============

  /**
   * Get pending transactions for batch
   */
  getPendingTransactions(): TransferTx[] {
    return [...this.pendingTransactions];
  }

  /**
   * Create and process a batch of transactions
   */
  async createBatch(maxSize: number = 8): Promise<BatchData | null> {
    if (this.pendingTransactions.length === 0) {
      return null;
    }

    const oldRoot = this.stateRoot;
    const transactions = this.pendingTransactions.splice(0, maxSize);

    // Execute all transactions
    for (const tx of transactions) {
      await this.executeTransfer(tx);
    }

    const newRoot = this.stateRoot;
    const batchHash = this.hashBatch(transactions);

    this.batchNumber += 1;

    this.logger.log(`Created batch #${this.batchNumber} with ${transactions.length} transactions`);

    return {
      oldRoot,
      newRoot,
      batchHash,
      transactions,
    };
  }

  /**
   * Generate proof inputs for a batch
   */
  generateProofInputs(batch: BatchData): Record<string, unknown> {
    // This would be the actual proof input generation
    // In production, this would prepare inputs for snarkjs
    return {
      oldRoot: batch.oldRoot,
      newRoot: batch.newRoot,
      batchHash: batch.batchHash,
      // ... additional circuit inputs
    };
  }

  // ============ Merkle Tree Operations ============

  /**
   * Get Merkle proof for an account
   */
  getMerkleProof(address: string, tokenId: string): {
    leaf: string;
    pathElements: string[];
    pathIndices: number[];
  } {
    const key = this.accountKey(address, tokenId);
    const account = this.accounts.get(key);

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    const leaf = this.hashAccount(account);
    
    // Simplified proof generation (would be full Merkle tree in production)
    const pathElements: string[] = [];
    const pathIndices: number[] = [];

    // Generate 20 levels of path (placeholder)
    for (let i = 0; i < 20; i++) {
      pathElements.push(this.hashEmpty());
      pathIndices.push(0);
    }

    return {
      leaf,
      pathElements,
      pathIndices,
    };
  }

  // ============ Stats ============

  /**
   * Get ZK rollup statistics
   */
  getStats(): {
    stateRoot: string;
    batchNumber: number;
    totalAccounts: number;
    pendingTransactions: number;
  } {
    return {
      stateRoot: this.stateRoot,
      batchNumber: this.batchNumber,
      totalAccounts: this.accounts.size,
      pendingTransactions: this.pendingTransactions.length,
    };
  }

  // ============ Helper Functions ============

  private accountKey(address: string, tokenId: string): string {
    return `${address.toLowerCase()}-${tokenId}`;
  }

  private hashEmpty(): string {
    return crypto.createHash('sha256').update('empty').digest('hex');
  }

  private hashAccount(account: AccountState): string {
    const data = `${account.address}:${account.tokenId}:${account.balance}:${account.nonce}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private hashTransaction(tx: TransferTx): string {
    const data = `${tx.from}:${tx.to}:${tx.tokenId}:${tx.amount}:${tx.nonce}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private hashWithdrawal(withdrawal: WithdrawalTx): string {
    const data = `${withdrawal.account}:${withdrawal.l1Recipient}:${withdrawal.tokenId}:${withdrawal.amount}:${withdrawal.nonce}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private hashBatch(transactions: TransferTx[]): string {
    const txHashes = transactions.map(tx => this.hashTransaction(tx));
    return crypto.createHash('sha256').update(txHashes.join(':')).digest('hex');
  }

  private computeMerkleRoot(): string {
    if (this.accounts.size === 0) {
      return this.hashEmpty();
    }

    // Simplified Merkle root computation
    const leaves = Array.from(this.accounts.values()).map(acc => this.hashAccount(acc));
    
    // Pad to power of 2
    while (leaves.length < 2 || (leaves.length & (leaves.length - 1)) !== 0) {
      leaves.push(this.hashEmpty());
    }

    // Build tree bottom-up
    let level = leaves;
    while (level.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] || this.hashEmpty();
        const parent = crypto.createHash('sha256').update(left + right).digest('hex');
        nextLevel.push(parent);
      }
      level = nextLevel;
    }

    return level[0];
  }
}
