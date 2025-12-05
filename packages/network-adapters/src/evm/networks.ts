/**
 * EVM Network Configurations
 *
 * Pre-configured network settings for popular EVM chains
 */

import type { NetworkConfig } from '../types';

/**
 * Ethereum Mainnet
 */
export const ethereum: NetworkConfig = {
  id: 'ethereum',
  name: 'Ethereum',
  family: 'evm',
  chainId: 1,
  rpcUrls: [
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://ethereum.publicnode.com',
  ],
  wsUrls: ['wss://ethereum.publicnode.com'],
  explorerUrls: ['https://etherscan.io'],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  isTestnet: false,
  blockTime: 12000,
  iconUrl: '/icons/ethereum.svg',
};

/**
 * Ethereum Sepolia Testnet
 */
export const sepolia: NetworkConfig = {
  id: 'sepolia',
  name: 'Sepolia',
  family: 'evm',
  chainId: 11155111,
  rpcUrls: [
    'https://rpc.sepolia.org',
    'https://rpc2.sepolia.org',
    'https://ethereum-sepolia.publicnode.com',
  ],
  wsUrls: ['wss://ethereum-sepolia.publicnode.com'],
  explorerUrls: ['https://sepolia.etherscan.io'],
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  isTestnet: true,
  blockTime: 12000,
  iconUrl: '/icons/ethereum.svg',
};

/**
 * Base Mainnet
 */
export const base: NetworkConfig = {
  id: 'base',
  name: 'Base',
  family: 'evm',
  chainId: 8453,
  rpcUrls: [
    'https://mainnet.base.org',
    'https://base.llamarpc.com',
    'https://base.publicnode.com',
  ],
  wsUrls: ['wss://base.publicnode.com'],
  explorerUrls: ['https://basescan.org'],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  isTestnet: false,
  blockTime: 2000,
  iconUrl: '/icons/base.svg',
};

/**
 * Base Sepolia Testnet
 */
export const baseSepolia: NetworkConfig = {
  id: 'base-sepolia',
  name: 'Base Sepolia',
  family: 'evm',
  chainId: 84532,
  rpcUrls: [
    'https://sepolia.base.org',
    'https://base-sepolia.publicnode.com',
  ],
  wsUrls: ['wss://base-sepolia.publicnode.com'],
  explorerUrls: ['https://sepolia.basescan.org'],
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  isTestnet: true,
  blockTime: 2000,
  iconUrl: '/icons/base.svg',
};

/**
 * Arbitrum One
 */
export const arbitrum: NetworkConfig = {
  id: 'arbitrum',
  name: 'Arbitrum One',
  family: 'evm',
  chainId: 42161,
  rpcUrls: [
    'https://arb1.arbitrum.io/rpc',
    'https://arbitrum.llamarpc.com',
    'https://arbitrum-one.publicnode.com',
  ],
  wsUrls: ['wss://arbitrum-one.publicnode.com'],
  explorerUrls: ['https://arbiscan.io'],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  isTestnet: false,
  blockTime: 250,
  iconUrl: '/icons/arbitrum.svg',
};

/**
 * Optimism
 */
export const optimism: NetworkConfig = {
  id: 'optimism',
  name: 'Optimism',
  family: 'evm',
  chainId: 10,
  rpcUrls: [
    'https://mainnet.optimism.io',
    'https://optimism.llamarpc.com',
    'https://optimism.publicnode.com',
  ],
  wsUrls: ['wss://optimism.publicnode.com'],
  explorerUrls: ['https://optimistic.etherscan.io'],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  isTestnet: false,
  blockTime: 2000,
  iconUrl: '/icons/optimism.svg',
};

/**
 * Polygon
 */
export const polygon: NetworkConfig = {
  id: 'polygon',
  name: 'Polygon',
  family: 'evm',
  chainId: 137,
  rpcUrls: [
    'https://polygon-rpc.com',
    'https://polygon.llamarpc.com',
    'https://polygon-bor.publicnode.com',
  ],
  wsUrls: ['wss://polygon-bor.publicnode.com'],
  explorerUrls: ['https://polygonscan.com'],
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  isTestnet: false,
  blockTime: 2000,
  iconUrl: '/icons/polygon.svg',
};

/**
 * BSC (BNB Smart Chain)
 */
export const bsc: NetworkConfig = {
  id: 'bsc',
  name: 'BNB Smart Chain',
  family: 'evm',
  chainId: 56,
  rpcUrls: [
    'https://bsc-dataseed.binance.org',
    'https://bsc.publicnode.com',
  ],
  wsUrls: ['wss://bsc.publicnode.com'],
  explorerUrls: ['https://bscscan.com'],
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  isTestnet: false,
  blockTime: 3000,
  iconUrl: '/icons/bsc.svg',
};

/**
 * Avalanche C-Chain
 */
export const avalanche: NetworkConfig = {
  id: 'avalanche',
  name: 'Avalanche C-Chain',
  family: 'evm',
  chainId: 43114,
  rpcUrls: [
    'https://api.avax.network/ext/bc/C/rpc',
    'https://avalanche-c-chain.publicnode.com',
  ],
  wsUrls: ['wss://avalanche-c-chain.publicnode.com'],
  explorerUrls: ['https://snowtrace.io'],
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
  },
  isTestnet: false,
  blockTime: 2000,
  iconUrl: '/icons/avalanche.svg',
};

/**
 * All EVM networks
 */
export const evmNetworks: NetworkConfig[] = [
  ethereum,
  sepolia,
  base,
  baseSepolia,
  arbitrum,
  optimism,
  polygon,
  bsc,
  avalanche,
];

/**
 * EVM mainnets only
 */
export const evmMainnets: NetworkConfig[] = evmNetworks.filter(
  (n) => !n.isTestnet
);

/**
 * EVM testnets only
 */
export const evmTestnets: NetworkConfig[] = evmNetworks.filter(
  (n) => n.isTestnet
);
