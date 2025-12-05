/**
 * Network Adapter Types
 */

import type { NetworkId } from '@xferno/types';

/**
 * Supported chain families
 */
export type ChainFamily = 'evm' | 'solana' | 'cosmos' | 'move';

/**
 * Network configuration
 */
export interface NetworkConfig {
  /** Unique network identifier */
  id: NetworkId;
  /** Human-readable name */
  name: string;
  /** Chain family (evm, solana, etc.) */
  family: ChainFamily;
  /** Chain ID (for EVM chains) */
  chainId?: number;
  /** RPC endpoints */
  rpcUrls: string[];
  /** WebSocket endpoints (optional) */
  wsUrls?: string[];
  /** Block explorer URLs */
  explorerUrls: string[];
  /** Native currency */
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  /** Is this a testnet? */
  isTestnet: boolean;
  /** Average block time in milliseconds */
  blockTime: number;
  /** Network icon URL */
  iconUrl?: string;
}

/**
 * Transaction status
 */
export type TransactionStatus =
  | 'pending'
  | 'submitted'
  | 'confirming'
  | 'confirmed'
  | 'failed'
  | 'cancelled';

/**
 * Transaction receipt
 */
export interface TransactionReceipt {
  /** Transaction hash */
  hash: string;
  /** Block number */
  blockNumber: bigint;
  /** Block hash */
  blockHash: string;
  /** Transaction index in block */
  transactionIndex: number;
  /** Gas used */
  gasUsed: bigint;
  /** Effective gas price */
  effectiveGasPrice: bigint;
  /** Status (1 = success, 0 = failure) */
  status: 'success' | 'reverted';
  /** Contract address (if deployment) */
  contractAddress?: string;
  /** Logs/events */
  logs: TransactionLog[];
}

/**
 * Transaction log/event
 */
export interface TransactionLog {
  /** Log index */
  logIndex: number;
  /** Contract address that emitted the log */
  address: string;
  /** Event topics */
  topics: string[];
  /** Event data */
  data: string;
}

/**
 * Token balance
 */
export interface TokenBalance {
  /** Token contract address */
  address: string;
  /** Token symbol */
  symbol: string;
  /** Token decimals */
  decimals: number;
  /** Raw balance */
  balance: bigint;
  /** Formatted balance */
  formatted: string;
}

/**
 * Gas estimate
 */
export interface GasEstimate {
  /** Estimated gas limit */
  gasLimit: bigint;
  /** Gas price (legacy) */
  gasPrice?: bigint;
  /** Max fee per gas (EIP-1559) */
  maxFeePerGas?: bigint;
  /** Max priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: bigint;
  /** Estimated cost in native currency */
  estimatedCost: bigint;
}

/**
 * Wallet connection state
 */
export interface WalletState {
  /** Is wallet connected? */
  connected: boolean;
  /** Connected address */
  address?: string;
  /** Current chain ID */
  chainId?: number | string;
  /** Connection error */
  error?: Error;
}

/**
 * Contract call parameters
 */
export interface ContractCallParams {
  /** Contract address */
  address: string;
  /** Contract ABI */
  abi: readonly unknown[];
  /** Function name */
  functionName: string;
  /** Function arguments */
  args?: readonly unknown[];
  /** Value to send (in wei) */
  value?: bigint;
}

/**
 * Contract read parameters
 */
export interface ContractReadParams extends ContractCallParams {}

/**
 * Contract write parameters
 */
export interface ContractWriteParams extends ContractCallParams {
  /** Gas limit override */
  gasLimit?: bigint;
  /** Gas price override */
  gasPrice?: bigint;
  /** Max fee per gas override */
  maxFeePerGas?: bigint;
  /** Max priority fee override */
  maxPriorityFeePerGas?: bigint;
}
