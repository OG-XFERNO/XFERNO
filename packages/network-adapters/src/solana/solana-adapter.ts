/**
 * Solana Network Adapter
 *
 * Base adapter for Solana blockchain using @solana/web3.js
 *
 * NOTE: This is a skeleton implementation for Phase 0.
 * Full implementation will be completed in Phase 1.
 */

import {
  Connection,
  PublicKey,
  clusterApiUrl,
  type Commitment,
} from '@solana/web3.js';

import { BaseNetworkAdapter } from '../base-adapter';
import type {
  NetworkConfig,
  TransactionReceipt,
  TokenBalance,
  GasEstimate,
  ContractReadParams,
  ContractWriteParams,
  TransactionLog,
} from '../types';

/**
 * Solana Network Adapter
 *
 * Provides interaction with Solana blockchain
 */
export class SolanaAdapter extends BaseNetworkAdapter {
  private connection: Connection | null = null;
  private commitment: Commitment = 'confirmed';

  constructor(config: NetworkConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    try {
      this.connection = new Connection(
        this.config.rpcUrls[0],
        this.commitment
      );

      // Verify connection
      await this.connection.getVersion();

      this.updateState({
        connected: true,
        chainId: this.config.id,
      });
    } catch (error) {
      this.updateState({
        connected: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connection = null;
    this.updateState({
      connected: false,
      address: undefined,
      chainId: undefined,
    });
  }

  async getBlockNumber(): Promise<bigint> {
    this.ensureConnected();
    const slot = await this.connection!.getSlot();
    return BigInt(slot);
  }

  async getBalance(address: string): Promise<bigint> {
    this.ensureConnected();
    const pubkey = new PublicKey(address);
    const balance = await this.connection!.getBalance(pubkey);
    return BigInt(balance);
  }

  async getTokenBalance(
    address: string,
    tokenAddress: string
  ): Promise<TokenBalance> {
    this.ensureConnected();

    // TODO: Implement SPL token balance lookup
    // This requires the SPL Token program interaction

    return {
      address: tokenAddress,
      symbol: 'UNKNOWN',
      decimals: 9,
      balance: 0n,
      formatted: '0',
    };
  }

  async getTokenBalances(
    address: string,
    tokenAddresses: string[]
  ): Promise<TokenBalance[]> {
    return Promise.all(
      tokenAddresses.map((token) => this.getTokenBalance(address, token))
    );
  }

  async estimateGas(_params: ContractWriteParams): Promise<GasEstimate> {
    this.ensureConnected();

    // Solana uses a different fee model (priority fees)
    // Return a placeholder for now
    return {
      gasLimit: 200000n,
      gasPrice: 5000n, // lamports per signature
      estimatedCost: 5000n,
    };
  }

  async readContract<T = unknown>(_params: ContractReadParams): Promise<T> {
    this.ensureConnected();

    // TODO: Implement Solana program account data reading
    throw new Error('Solana readContract not yet implemented');
  }

  async writeContract(_params: ContractWriteParams): Promise<string> {
    this.ensureConnected();

    // TODO: Implement Solana transaction submission
    throw new Error('Solana writeContract not yet implemented');
  }

  async waitForTransaction(
    hash: string,
    _confirmations = 1
  ): Promise<TransactionReceipt> {
    this.ensureConnected();

    const result = await this.connection!.confirmTransaction(hash, 'confirmed');

    if (result.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(result.value.err)}`);
    }

    const tx = await this.connection!.getTransaction(hash, {
      commitment: 'confirmed',
    });

    if (!tx) {
      throw new Error('Transaction not found');
    }

    return {
      hash,
      blockNumber: BigInt(tx.slot),
      blockHash: tx.transaction.message.recentBlockhash,
      transactionIndex: 0,
      gasUsed: BigInt(tx.meta?.computeUnitsConsumed || 0),
      effectiveGasPrice: BigInt(tx.meta?.fee || 0),
      status: tx.meta?.err ? 'reverted' : 'success',
      logs: [],
    };
  }

  async getTransactionReceipt(
    hash: string
  ): Promise<TransactionReceipt | null> {
    this.ensureConnected();

    try {
      const tx = await this.connection!.getTransaction(hash, {
        commitment: 'confirmed',
      });

      if (!tx) {
        return null;
      }

      return {
        hash,
        blockNumber: BigInt(tx.slot),
        blockHash: tx.transaction.message.recentBlockhash,
        transactionIndex: 0,
        gasUsed: BigInt(tx.meta?.computeUnitsConsumed || 0),
        effectiveGasPrice: BigInt(tx.meta?.fee || 0),
        status: tx.meta?.err ? 'reverted' : 'success',
        logs: [],
      };
    } catch {
      return null;
    }
  }

  onBlock(callback: (blockNumber: bigint) => void): () => void {
    this.ensureConnected();

    const subscriptionId = this.connection!.onSlotChange((slotInfo) => {
      callback(BigInt(slotInfo.slot));
    });

    return () => {
      this.connection?.removeSlotChangeListener(subscriptionId);
    };
  }

  onContractEvent(
    _address: string,
    _abi: readonly unknown[],
    _eventName: string,
    _callback: (log: unknown) => void
  ): () => void {
    this.ensureConnected();

    // TODO: Implement Solana program log subscription
    console.warn('Solana contract event subscription not yet implemented');

    return () => {};
  }
}

/**
 * Factory function for creating Solana adapters
 */
export function createSolanaAdapter(config: NetworkConfig): SolanaAdapter {
  return new SolanaAdapter(config);
}
