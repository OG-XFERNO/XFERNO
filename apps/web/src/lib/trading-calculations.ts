import { formatEther } from 'viem';

/**
 * Trading calculation utilities
 * These functions handle fee and gas calculations for the trading interface
 */

// Platform fee in basis points (100 = 1%)
export const PLATFORM_FEE_BPS = 100;

// Gas multipliers per chain for more accurate estimates
export const GAS_MULTIPLIERS: Record<number, number> = {
  1: 1.2,      // Ethereum Mainnet
  8453: 1.1,   // Base
  42161: 1.15, // Arbitrum
  10: 1.1,     // Optimism
  137: 1.3,    // Polygon
  56: 1.2,     // BSC
  43114: 1.2,  // Avalanche
  11155111: 1.0, // Sepolia
};

// Default gas units for different operations
export const GAS_UNITS = {
  BUY: BigInt(150000),
  SELL: BigInt(120000),
  APPROVE: BigInt(50000),
};

export interface TradeCalculationInput {
  inputAmount: number;
  tokenPrice: number;
  tradeType: 'buy' | 'sell';
  chainId: number;
  gasPrice: bigint | null;
  liquidity: number;
}

export interface TradeCalculationResult {
  inputAmount: number;
  outputAmount: number;
  platformFee: number;
  platformFeePercent: number;
  estimatedGasEth: number;
  estimatedGasWei: bigint;
  totalCost: number;
  priceImpact: number;
  rate: number;
  minReceived: number;
}

/**
 * Calculates the platform fee for a given amount
 * @param amount - The trade amount
 * @returns The platform fee amount
 */
export function calculatePlatformFee(amount: number): number {
  return amount * (PLATFORM_FEE_BPS / 10000);
}

/**
 * Calculates the platform fee percentage
 * @returns The platform fee as a decimal (0.01 = 1%)
 */
export function getPlatformFeePercent(): number {
  return PLATFORM_FEE_BPS / 10000;
}

/**
 * Estimates gas cost in ETH for a trade
 * @param tradeType - 'buy' or 'sell'
 * @param gasPrice - Current gas price in wei
 * @param chainId - Chain ID for gas multiplier
 * @returns Object with gas cost in ETH and wei
 */
export function estimateGasCost(
  tradeType: 'buy' | 'sell',
  gasPrice: bigint | null,
  chainId: number
): { gasEth: number; gasWei: bigint } {
  const gasUnits = tradeType === 'buy' ? GAS_UNITS.BUY : GAS_UNITS.SELL;
  const gasPriceWei = gasPrice || BigInt(20000000000); // 20 gwei fallback
  const gasMultiplier = GAS_MULTIPLIERS[chainId] || 1.2;
  
  // Calculate with multiplier (multiply by 100, then divide by 100 to handle decimals with bigint)
  const multiplierBigInt = BigInt(Math.floor(gasMultiplier * 100));
  const estimatedGasWei = (gasUnits * gasPriceWei * multiplierBigInt) / BigInt(100);
  const estimatedGasEth = parseFloat(formatEther(estimatedGasWei));
  
  return {
    gasEth: estimatedGasEth,
    gasWei: estimatedGasWei,
  };
}

/**
 * Calculates price impact for a trade
 * Price impact is the percentage effect on the pool's liquidity
 * @param tradeAmount - The trade amount in ETH
 * @param liquidity - The pool's total liquidity in ETH
 * @returns Price impact as a percentage
 */
export function calculatePriceImpact(tradeAmount: number, liquidity: number): number {
  if (liquidity <= 0) return 0;
  return (tradeAmount / liquidity) * 100;
}

/**
 * Calculates the minimum received amount after slippage
 * @param expectedAmount - The expected output amount
 * @param slippagePercent - The slippage tolerance percentage (e.g., 0.5 for 0.5%)
 * @returns The minimum amount to receive
 */
export function calculateMinReceived(expectedAmount: number, slippagePercent: number): number {
  return expectedAmount * (1 - slippagePercent / 100);
}

/**
 * Full trade calculation for buy or sell operations
 * @param input - Trade calculation input parameters
 * @returns Complete trade calculation result
 */
export function calculateTrade(input: TradeCalculationInput): TradeCalculationResult {
  const { inputAmount, tokenPrice, tradeType, chainId, gasPrice, liquidity } = input;
  
  const platformFeePercent = getPlatformFeePercent();
  const { gasEth, gasWei } = estimateGasCost(tradeType, gasPrice, chainId);
  
  if (tradeType === 'buy') {
    // Buying tokens with ETH
    const tokensReceived = inputAmount / tokenPrice;
    const platformFee = calculatePlatformFee(inputAmount);
    const totalCost = inputAmount + platformFee + gasEth;
    const priceImpact = calculatePriceImpact(inputAmount, liquidity);
    
    return {
      inputAmount,
      outputAmount: tokensReceived,
      platformFee,
      platformFeePercent,
      estimatedGasEth: gasEth,
      estimatedGasWei: gasWei,
      totalCost,
      priceImpact,
      rate: tokenPrice,
      minReceived: tokensReceived, // Would apply slippage in real impl
    };
  } else {
    // Selling tokens for ETH
    const ethReceived = inputAmount * tokenPrice;
    const platformFee = calculatePlatformFee(ethReceived);
    const netReceived = ethReceived - platformFee;
    const priceImpact = calculatePriceImpact(ethReceived, liquidity);
    
    return {
      inputAmount,
      outputAmount: netReceived,
      platformFee,
      platformFeePercent,
      estimatedGasEth: gasEth,
      estimatedGasWei: gasWei,
      totalCost: gasEth, // Only gas for selling
      priceImpact,
      rate: tokenPrice,
      minReceived: netReceived, // Would apply slippage in real impl
    };
  }
}

/**
 * Formats a number for display with appropriate precision
 * @param num - The number to format
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatTradeNumber(num: number, decimals: number = 6): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(decimals);
}

/**
 * Validates if a trade amount is within acceptable bounds
 * @param amount - The trade amount
 * @param balance - The user's balance
 * @param minAmount - Minimum allowed amount (default: 0)
 * @returns Object with isValid flag and error message if invalid
 */
export function validateTradeAmount(
  amount: number,
  balance: number,
  minAmount: number = 0
): { isValid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }
  
  if (amount < minAmount) {
    return { isValid: false, error: `Minimum amount is ${minAmount}` };
  }
  
  if (amount > balance) {
    return { isValid: false, error: 'Insufficient balance' };
  }
  
  return { isValid: true };
}
