/**
 * Base Network Adapter
 *
 * Abstract base class that provides common functionality
 * for all network adapters
 */

import type {
  NetworkConfig,
  TransactionReceipt,
  TokenBalance,
  GasEstimate,
  WalletState,
  ContractReadParams,
  ContractWriteParams,
} from './types';
import type { INetworkAdapter } from './interfaces';

/**
 * Abstract base adapter that all network-specific adapters extend
 */
export abstract class BaseNetworkAdapter implements INetworkAdapter {
  public readonly config: NetworkConfig;
  protected _state: WalletState = { connected: false };

  constructor(config: NetworkConfig) {
    this.config = config;
  }

  get state(): WalletState {
    return { ...this._state };
  }

  /**
   * Update connection state
   */
  protected updateState(update: Partial<WalletState>): void {
    this._state = { ...this._state, ...update };
  }

  /**
   * Validate that the adapter is connected
   */
  protected ensureConnected(): void {
    if (!this._state.connected) {
      throw new Error(`Not connected to ${this.config.name}`);
    }
  }

  /**
   * Format address for display
   */
  protected formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Get explorer URL for a transaction
   */
  public getTransactionUrl(hash: string): string {
    const baseUrl = this.config.explorerUrls[0];
    return `${baseUrl}/tx/${hash}`;
  }

  /**
   * Get explorer URL for an address
   */
  public getAddressUrl(address: string): string {
    const baseUrl = this.config.explorerUrls[0];
    return `${baseUrl}/address/${address}`;
  }

  /**
   * Get explorer URL for a token
   */
  public getTokenUrl(tokenAddress: string): string {
    const baseUrl = this.config.explorerUrls[0];
    return `${baseUrl}/token/${tokenAddress}`;
  }

  // Abstract methods to be implemented by chain-specific adapters
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract getBlockNumber(): Promise<bigint>;
  abstract getBalance(address: string): Promise<bigint>;
  abstract getTokenBalance(
    address: string,
    tokenAddress: string
  ): Promise<TokenBalance>;
  abstract getTokenBalances(
    address: string,
    tokenAddresses: string[]
  ): Promise<TokenBalance[]>;
  abstract estimateGas(params: ContractWriteParams): Promise<GasEstimate>;
  abstract readContract<T = unknown>(params: ContractReadParams): Promise<T>;
  abstract writeContract(params: ContractWriteParams): Promise<string>;
  abstract waitForTransaction(
    hash: string,
    confirmations?: number
  ): Promise<TransactionReceipt>;
  abstract getTransactionReceipt(
    hash: string
  ): Promise<TransactionReceipt | null>;
  abstract onBlock(callback: (blockNumber: bigint) => void): () => void;
  abstract onContractEvent(
    address: string,
    abi: readonly unknown[],
    eventName: string,
    callback: (log: unknown) => void
  ): () => void;
}
