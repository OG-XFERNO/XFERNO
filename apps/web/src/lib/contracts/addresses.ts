/**
 * XFERNO Contract Addresses
 * Deploy addresses per chain
 */

import { type Address } from 'viem';

export interface ContractAddresses {
  tokenFactory: Address;
  bondingCurve: Address;
}

// Contract addresses per chain ID
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  // Ethereum Mainnet
  1: {
    tokenFactory: '0x0000000000000000000000000000000000000000' as Address,
    bondingCurve: '0x0000000000000000000000000000000000000000' as Address,
  },
  // Sepolia Testnet
  11155111: {
    tokenFactory: '0x0000000000000000000000000000000000000000' as Address,
    bondingCurve: '0x0000000000000000000000000000000000000000' as Address,
  },
  // Base
  8453: {
    tokenFactory: '0x0000000000000000000000000000000000000000' as Address,
    bondingCurve: '0x0000000000000000000000000000000000000000' as Address,
  },
  // Base Sepolia Testnet
  84532: {
    tokenFactory: '0x0000000000000000000000000000000000000000' as Address,
    bondingCurve: '0x0000000000000000000000000000000000000000' as Address,
  },
  // Arbitrum One
  42161: {
    tokenFactory: '0x0000000000000000000000000000000000000000' as Address,
    bondingCurve: '0x0000000000000000000000000000000000000000' as Address,
  },
  // Optimism
  10: {
    tokenFactory: '0x0000000000000000000000000000000000000000' as Address,
    bondingCurve: '0x0000000000000000000000000000000000000000' as Address,
  },
  // Polygon
  137: {
    tokenFactory: '0x0000000000000000000000000000000000000000' as Address,
    bondingCurve: '0x0000000000000000000000000000000000000000' as Address,
  },
};

/**
 * Get contract addresses for a specific chain
 */
export function getContractAddresses(chainId: number): ContractAddresses | null {
  return CONTRACT_ADDRESSES[chainId] || null;
}

/**
 * Check if contracts are deployed on a chain
 */
export function isChainSupported(chainId: number): boolean {
  const addresses = CONTRACT_ADDRESSES[chainId];
  if (!addresses) return false;
  
  // Check if addresses are not zero
  return (
    addresses.tokenFactory !== '0x0000000000000000000000000000000000000000' &&
    addresses.bondingCurve !== '0x0000000000000000000000000000000000000000'
  );
}

/**
 * Supported chain IDs where contracts are deployed
 */
export const SUPPORTED_CHAIN_IDS = Object.keys(CONTRACT_ADDRESSES).map(Number);
