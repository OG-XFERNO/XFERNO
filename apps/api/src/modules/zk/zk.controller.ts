import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ZKService, TransferTx, DepositTx, WithdrawalTx } from './zk.service';

@Controller('zk')
export class ZKController {
  constructor(private readonly zkService: ZKService) {}

  // ============ State Queries ============

  /**
   * Get current state root
   */
  @Get('state')
  getState() {
    return {
      stateRoot: this.zkService.getStateRoot(),
      stats: this.zkService.getStats(),
    };
  }

  /**
   * Get account state
   */
  @Get('account/:address/:tokenId')
  getAccount(
    @Param('address') address: string,
    @Param('tokenId') tokenId: string,
  ) {
    const account = this.zkService.getAccountState(address, tokenId);
    if (!account) {
      return { exists: false };
    }
    return {
      exists: true,
      account,
      merkleProof: this.zkService.getMerkleProof(address, tokenId),
    };
  }

  /**
   * Get all accounts for a user
   */
  @Get('accounts/:address')
  getUserAccounts(@Param('address') address: string) {
    return {
      accounts: this.zkService.getUserAccounts(address),
    };
  }

  /**
   * Get account balance
   */
  @Get('balance/:address/:tokenId')
  getBalance(
    @Param('address') address: string,
    @Param('tokenId') tokenId: string,
  ) {
    return {
      address,
      tokenId,
      balance: this.zkService.getBalance(address, tokenId),
    };
  }

  // ============ Deposits ============

  /**
   * Process a deposit from L1
   */
  @Post('deposit')
  async processDeposit(@Body() deposit: DepositTx) {
    const result = await this.zkService.processDeposit(deposit);
    return {
      success: true,
      ...result,
    };
  }

  // ============ Transfers ============

  /**
   * Queue a transfer transaction
   */
  @Post('transfer/queue')
  async queueTransfer(@Body() tx: TransferTx) {
    const result = await this.zkService.queueTransfer(tx);
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Execute a single transfer (for testing)
   */
  @Post('transfer/execute')
  async executeTransfer(@Body() tx: TransferTx) {
    const result = await this.zkService.executeTransfer(tx);
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get pending transactions
   */
  @Get('pending')
  getPendingTransactions() {
    return {
      transactions: this.zkService.getPendingTransactions(),
    };
  }

  // ============ Withdrawals ============

  /**
   * Process a withdrawal request
   */
  @Post('withdrawal')
  async processWithdrawal(@Body() withdrawal: WithdrawalTx) {
    const result = await this.zkService.processWithdrawal(withdrawal);
    return {
      success: true,
      ...result,
    };
  }

  // ============ Batch Processing ============

  /**
   * Create and process a batch
   */
  @Post('batch')
  async createBatch(@Query('maxSize') maxSize?: string) {
    const batch = await this.zkService.createBatch(
      maxSize ? parseInt(maxSize) : 8,
    );

    if (!batch) {
      return {
        success: false,
        message: 'No pending transactions',
      };
    }

    return {
      success: true,
      batch,
      proofInputs: this.zkService.generateProofInputs(batch),
    };
  }

  // ============ Merkle Proofs ============

  /**
   * Get Merkle proof for an account
   */
  @Get('proof/:address/:tokenId')
  getMerkleProof(
    @Param('address') address: string,
    @Param('tokenId') tokenId: string,
  ) {
    return this.zkService.getMerkleProof(address, tokenId);
  }
}
