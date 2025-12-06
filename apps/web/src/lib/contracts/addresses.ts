/**
 * XFERNO Contract Addresses
 * Update these after deploying to each network
 * 
 * Deployment instructions:
 * 1. Deploy contracts: `cd packages/contracts && pnpm deploy:sepolia`
 * 2. Copy addresses from deployment output
 * 3. Update this file with the new addresses
 */

import { type Address } from 'viem';

export interface ContractAddresses {
  tokenFactory: Address;
  bondingCurve: Address;
}

export interface ChainConfig {
  addresses: ContractAddresses;
  creationFee: bigint;
  blockExplorer: string;
}

// Contract addresses per chain ID
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  // Ethereum Mainnet
  1: {
    addresses: {
      tokenFactory: '0x0000000000000000000000000000000000000000' as Address,
      bondingCurve: '0x0000000000000000000000000000000000000000' as Address,
    },
    creationFee: BigInt('10000000000000000'), // 0.01 ETH
    blockExplorer: 'https://etherscan.io',
  },
  // Sepolia Testnet - V2 DEPLOYED!
  11155111: {
    addresses: {
      tokenFactory: '0x822f72301756D054d3F3F4834F1c0A1A03A95716' as Address,
      bondingCurve: '0x66C9032Cc141Ce85d5f5D497e452c646548dEd2F' as Address,
    },
    creationFee: BigInt('1000000000000000'), // 0.001 ETH
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  // Base Mainnet
  8453: {
    addresses: {
      tokenFactory: '0x0000000000000000000000000000000000000000' as Address,
      bondingCurve: '0x0000000000000000000000000000000000000000' as Address,
    },
    creationFee: BigInt('1000000000000000'), // 0.001 ETH
    blockExplorer: 'https://basescan.org',
  },
  // Base Sepolia Testnet
  84532: {
    addresses: {
      tokenFactory: '0x0000000000000000000000000000000000000000' as Address,
      bondingCurve: '0x0000000000000000000000000000000000000000' as Address,
    },
    creationFee: BigInt('100000000000000'), // 0.0001 ETH
    blockExplorer: 'https://sepolia.basescan.org',
  },
  // Arbitrum One
  42161: {
    addresses: {
      tokenFactory: '0x0000000000000000000000000000000000000000' as Address,
      bondingCurve: '0x0000000000000000000000000000000000000000' as Address,
    },
    creationFee: BigInt('1000000000000000'), // 0.001 ETH
    blockExplorer: 'https://arbiscan.io',
  },
  // Optimism
  10: {
    addresses: {
      tokenFactory: '0x0000000000000000000000000000000000000000' as Address,
      bondingCurve: '0x0000000000000000000000000000000000000000' as Address,
    },
    creationFee: BigInt('1000000000000000'), // 0.001 ETH
    blockExplorer: 'https://optimistic.etherscan.io',
  },
};

/**
 * Get chain configuration for a specific chain
 */
export function getChainConfig(chainId: number): ChainConfig | null {
  return CHAIN_CONFIGS[chainId] || null;
}

/**
 * Get contract addresses for a specific chain
 */
export function getContractAddresses(chainId: number): ContractAddresses | null {
  const config = CHAIN_CONFIGS[chainId];
  return config?.addresses || null;
}

/**
 * Check if a chain is in our supported list (testnets allowed for UI testing)
 */
export function isChainSupported(chainId: number): boolean {
  return chainId in CHAIN_CONFIGS;
}

/**
 * Check if contracts are actually deployed on a chain
 */
export function areContractsDeployed(chainId: number): boolean {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) return false;
  
  return (
    config.addresses.tokenFactory !== '0x0000000000000000000000000000000000000000' &&
    config.addresses.bondingCurve !== '0x0000000000000000000000000000000000000000'
  );
}

/**
 * Get block explorer URL for a transaction
 */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) return '';
  return `${config.blockExplorer}/tx/${txHash}`;
}

/**
 * Get block explorer URL for an address
 */
export function getExplorerAddressUrl(chainId: number, address: string): string {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) return '';
  return `${config.blockExplorer}/address/${address}`;
}

/**
 * Get block explorer URL for a token
 */
export function getExplorerTokenUrl(chainId: number, address: string): string {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) return '';
  return `${config.blockExplorer}/token/${address}`;
}

/**
 * Supported chain IDs
 */
export const SUPPORTED_CHAIN_IDS = Object.keys(CHAIN_CONFIGS).map(Number);

/**
 * Testnet chain IDs
 */
export const TESTNET_CHAIN_IDS = [11155111, 84532];

/**
 * Mainnet chain IDs
 */
export const MAINNET_CHAIN_IDS = [1, 8453, 42161, 10];
