/**
 * Network Adapter Interfaces
 *
 * Core interfaces that all network adapters must implement
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

/**
 * Base interface for all network adapters
 */
export interface INetworkAdapter {
  /** Network configuration */
  readonly config: NetworkConfig;

  /** Current connection state */
  readonly state: WalletState;

  /**
   * Connect to the network
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the network
   */
  disconnect(): Promise<void>;

  /**
   * Get the current block number
   */
  getBlockNumber(): Promise<bigint>;

  /**
   * Get native currency balance for an address
   */
  getBalance(address: string): Promise<bigint>;

  /**
   * Get token balance for an address
   */
  getTokenBalance(address: string, tokenAddress: string): Promise<TokenBalance>;

  /**
   * Get multiple token balances
   */
  getTokenBalances(
    address: string,
    tokenAddresses: string[]
  ): Promise<TokenBalance[]>;

  /**
   * Estimate gas for a transaction
   */
  estimateGas(params: ContractWriteParams): Promise<GasEstimate>;

  /**
   * Read from a contract (view/pure function)
   */
  readContract<T = unknown>(params: ContractReadParams): Promise<T>;

  /**
   * Write to a contract (state-changing function)
   */
  writeContract(params: ContractWriteParams): Promise<string>;

  /**
   * Wait for a transaction to be confirmed
   */
  waitForTransaction(
    hash: string,
    confirmations?: number
  ): Promise<TransactionReceipt>;

  /**
   * Get transaction receipt
   */
  getTransactionReceipt(hash: string): Promise<TransactionReceipt | null>;

  /**
   * Subscribe to new blocks
   */
  onBlock(callback: (blockNumber: bigint) => void): () => void;

  /**
   * Subscribe to contract events
   */
  onContractEvent(
    address: string,
    abi: readonly unknown[],
    eventName: string,
    callback: (log: unknown) => void
  ): () => void;
}

/**
 * Interface for adapters that support token operations
 */
export interface ITokenAdapter {
  /**
   * Deploy a new token
   */
  deployToken(params: DeployTokenParams): Promise<string>;

  /**
   * Get token metadata
   */
  getTokenMetadata(tokenAddress: string): Promise<TokenMetadata>;

  /**
   * Approve token spending
   */
  approveToken(
    tokenAddress: string,
    spender: string,
    amount: bigint
  ): Promise<string>;

  /**
   * Get token allowance
   */
  getAllowance(
    tokenAddress: string,
    owner: string,
    spender: string
  ): Promise<bigint>;

  /**
   * Transfer tokens
   */
  transferToken(
    tokenAddress: string,
    to: string,
    amount: bigint
  ): Promise<string>;
}

/**
 * Interface for adapters that support DEX operations
 */
export interface IDexAdapter {
  /**
   * Create a liquidity pool
   */
  createPool(params: CreatePoolParams): Promise<string>;

  /**
   * Add liquidity to a pool
   */
  addLiquidity(params: AddLiquidityParams): Promise<string>;

  /**
   * Remove liquidity from a pool
   */
  removeLiquidity(params: RemoveLiquidityParams): Promise<string>;

  /**
   * Execute a swap
   */
  swap(params: SwapParams): Promise<string>;

  /**
   * Get a swap quote
   */
  getSwapQuote(params: SwapQuoteParams): Promise<SwapQuote>;

  /**
   * Get pool information
   */
  getPoolInfo(poolAddress: string): Promise<PoolInfo>;
}

/**
 * Interface for adapters that support bonding curve operations
 */
export interface IBondingCurveAdapter {
  /**
   * Buy tokens from the bonding curve
   */
  buyTokens(params: BondingCurveBuyParams): Promise<string>;

  /**
   * Sell tokens to the bonding curve
   */
  sellTokens(params: BondingCurveSellParams): Promise<string>;

  /**
   * Get current price from the bonding curve
   */
  getCurrentPrice(tokenAddress: string): Promise<bigint>;

  /**
   * Calculate buy price for a given amount
   */
  calculateBuyPrice(tokenAddress: string, amount: bigint): Promise<bigint>;

  /**
   * Calculate sell price for a given amount
   */
  calculateSellPrice(tokenAddress: string, amount: bigint): Promise<bigint>;

  /**
   * Get bonding curve state
   */
  getBondingCurveState(tokenAddress: string): Promise<BondingCurveState>;
}

// ============================================
// PARAM TYPES
// ============================================

export interface DeployTokenParams {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  owner?: string;
}

export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
}

export interface CreatePoolParams {
  tokenA: string;
  tokenB: string;
  fee?: number;
  initialPriceA?: bigint;
  initialPriceB?: bigint;
}

export interface AddLiquidityParams {
  poolAddress: string;
  tokenA: string;
  tokenB: string;
  amountA: bigint;
  amountB: bigint;
  minAmountA?: bigint;
  minAmountB?: bigint;
  deadline?: number;
}

export interface RemoveLiquidityParams {
  poolAddress: string;
  liquidity: bigint;
  minAmountA?: bigint;
  minAmountB?: bigint;
  deadline?: number;
}

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  minAmountOut: bigint;
  path?: string[];
  deadline?: number;
}

export interface SwapQuoteParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
}

export interface SwapQuote {
  amountOut: bigint;
  priceImpact: number;
  path: string[];
  fee: bigint;
}

export interface PoolInfo {
  address: string;
  tokenA: string;
  tokenB: string;
  reserveA: bigint;
  reserveB: bigint;
  fee: number;
  liquidity: bigint;
}

export interface BondingCurveBuyParams {
  tokenAddress: string;
  amount: bigint;
  maxCost: bigint;
}

export interface BondingCurveSellParams {
  tokenAddress: string;
  amount: bigint;
  minReceive: bigint;
}

export interface BondingCurveState {
  tokenAddress: string;
  currentSupply: bigint;
  currentPrice: bigint;
  reserveBalance: bigint;
  curveType: 'linear' | 'exponential' | 'sigmoid';
  isGraduated: boolean;
}
