import { NetworkType, TokenStandard } from '@prisma/client';

/**
 * Gas estimation result for network operations
 */
export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCost: bigint;
  estimatedCostUsd?: number;
}

/**
 * Token deployment parameters
 */
export interface DeployTokenParams {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  owner: string;
  isMintable?: boolean;
  isBurnable?: boolean;
}

/**
 * Token deployment result
 */
export interface DeployTokenResult {
  tokenAddress: string;
  transactionHash: string;
  blockNumber: number;
}

/**
 * Bridge deployment parameters
 */
export interface DeployBridgeParams {
  tokenAddress: string;
  targetNetworkId: string;
  bridgeType: 'ZK_PORTAL' | 'L1_BRIDGE';
}

/**
 * Bridge deployment result
 */
export interface DeployBridgeResult {
  bridgeAddress: string;
  transactionHash: string;
  blockNumber: number;
}

/**
 * DEX pool deployment parameters
 */
export interface DeployPoolParams {
  tokenAddress: string;
  baseAssetAddress: string; // WETH, WBDAG, etc.
  initialTokenAmount: bigint;
  initialBaseAmount: bigint;
}

/**
 * DEX pool deployment result
 */
export interface DeployPoolResult {
  poolAddress: string;
  lpTokenAddress: string;
  transactionHash: string;
  blockNumber: number;
}

/**
 * Transaction parameters
 */
export interface TransactionParams {
  to: string;
  data: string;
  value?: bigint;
  gasLimit?: bigint;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  hash: string;
  blockNumber?: number;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: bigint;
}

/**
 * Network configuration from database
 */
export interface NetworkConfig {
  id: string;
  name: string;
  chainId: number | null;
  type: NetworkType;
  symbol: string;
  tokenStandard: TokenStandard;
  rpcUrl: string;
  wsUrl: string | null;
  explorerUrl: string | null;
  isEnabledForBase: boolean;
  isEnabledForSplit: boolean;
  gasToken: string | null;
  avgBlockTimeMs: number | null;
}

/**
 * Abstract Network Adapter interface
 * All network-specific adapters must implement this interface
 */
export interface INetworkAdapter {
  /**
   * Network configuration
   */
  readonly networkId: string;
  readonly networkType: NetworkType;
  readonly chainId: number | null;

  /**
   * Initialize the adapter with network configuration
   */
  initialize(config: NetworkConfig): Promise<void>;

  /**
   * Check if the adapter is connected and ready
   */
  isConnected(): Promise<boolean>;

  /**
   * Get the native balance of an address
   */
  getBalance(address: string): Promise<bigint>;

  /**
   * Get token balance for an address
   */
  getTokenBalance(tokenAddress: string, ownerAddress: string): Promise<bigint>;

  /**
   * Estimate gas for deploying a token
   */
  estimateDeployToken(params: DeployTokenParams): Promise<GasEstimate>;

  /**
   * Deploy a new token contract
   */
  deployToken(params: DeployTokenParams): Promise<DeployTokenResult>;

  /**
   * Estimate gas for deploying a bridge
   */
  estimateDeployBridge(params: DeployBridgeParams): Promise<GasEstimate>;

  /**
   * Deploy a bridge contract
   */
  deployBridge(params: DeployBridgeParams): Promise<DeployBridgeResult>;

  /**
   * Estimate gas for deploying a DEX pool
   */
  estimateDeployPool(params: DeployPoolParams): Promise<GasEstimate>;

  /**
   * Deploy a DEX pool and seed liquidity
   */
  deployPool(params: DeployPoolParams): Promise<DeployPoolResult>;

  /**
   * Get the current gas price
   */
  getGasPrice(): Promise<bigint>;

  /**
   * Send a raw transaction
   */
  sendTransaction(params: TransactionParams): Promise<TransactionResult>;

  /**
   * Wait for a transaction to be confirmed
   */
  waitForTransaction(hash: string, confirmations?: number): Promise<TransactionResult>;

  /**
   * Get transaction receipt
   */
  getTransactionReceipt(hash: string): Promise<TransactionResult | null>;

  /**
   * Get the explorer URL for a transaction
   */
  getExplorerTxUrl(hash: string): string;

  /**
   * Get the explorer URL for an address
   */
  getExplorerAddressUrl(address: string): string;
}

/**
 * Factory function type for creating network adapters
 */
export type NetworkAdapterFactory = (config: NetworkConfig) => INetworkAdapter;
