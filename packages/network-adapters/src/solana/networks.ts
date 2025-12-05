/**
 * Solana Network Configurations
 *
 * Pre-configured network settings for Solana clusters
 */

import type { NetworkConfig } from '../types';

/**
 * Solana Mainnet
 */
export const solanaMainnet: NetworkConfig = {
  id: 'solana',
  name: 'Solana',
  family: 'solana',
  rpcUrls: [
    'https://api.mainnet-beta.solana.com',
    'https://solana-mainnet.rpc.extrnode.com',
  ],
  wsUrls: ['wss://api.mainnet-beta.solana.com'],
  explorerUrls: ['https://explorer.solana.com'],
  nativeCurrency: {
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
  },
  isTestnet: false,
  blockTime: 400, // ~400ms slot time
  iconUrl: '/icons/solana.svg',
};

/**
 * Solana Devnet
 */
export const solanaDevnet: NetworkConfig = {
  id: 'solana-devnet',
  name: 'Solana Devnet',
  family: 'solana',
  rpcUrls: ['https://api.devnet.solana.com'],
  wsUrls: ['wss://api.devnet.solana.com'],
  explorerUrls: ['https://explorer.solana.com?cluster=devnet'],
  nativeCurrency: {
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
  },
  isTestnet: true,
  blockTime: 400,
  iconUrl: '/icons/solana.svg',
};

/**
 * Solana Testnet
 */
export const solanaTestnet: NetworkConfig = {
  id: 'solana-testnet',
  name: 'Solana Testnet',
  family: 'solana',
  rpcUrls: ['https://api.testnet.solana.com'],
  wsUrls: ['wss://api.testnet.solana.com'],
  explorerUrls: ['https://explorer.solana.com?cluster=testnet'],
  nativeCurrency: {
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
  },
  isTestnet: true,
  blockTime: 400,
  iconUrl: '/icons/solana.svg',
};

/**
 * All Solana networks
 */
export const solanaNetworks: NetworkConfig[] = [
  solanaMainnet,
  solanaDevnet,
  solanaTestnet,
];

/**
 * Solana mainnets only
 */
export const solanaMainnets: NetworkConfig[] = solanaNetworks.filter(
  (n) => !n.isTestnet
);

/**
 * Solana testnets only
 */
export const solanaTestnets: NetworkConfig[] = solanaNetworks.filter(
  (n) => n.isTestnet
);
