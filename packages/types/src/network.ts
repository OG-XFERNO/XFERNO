export type NetworkType = 'EVM' | 'SOLANA' | 'MOVE' | 'OTHER';

export type TokenStandard = 'ERC20' | 'SPL' | 'MOVE';

export interface Network {
  id: string;
  name: string;
  chainId: number | null;
  type: NetworkType;
  symbol: string;
  tokenStandard: TokenStandard;
  rpcUrl: string;
  wsUrl?: string;
  explorerUrl?: string;
  isEnabledForBase: boolean;
  isEnabledForSplit: boolean;
  gasToken: string;
  avgBlockTimeMs?: number;
  iconUrl?: string;
}

export interface NetworkConfig {
  id: string;
  rpcUrl: string;
  wsUrl?: string;
  chainId?: number;
  explorerUrl?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const SUPPORTED_NETWORKS = {
  ETH_MAINNET: 'eth_mainnet',
  ETH_SEPOLIA: 'eth_sepolia',
  BDAG_MAINNET: 'bdag_mainnet',
  ARBITRUM: 'arbitrum',
  BASE: 'base',
  POLYGON: 'polygon',
  AVALANCHE: 'avalanche',
  BNB: 'bnb',
  SOLANA: 'solana',
} as const;

export type SupportedNetwork = (typeof SUPPORTED_NETWORKS)[keyof typeof SUPPORTED_NETWORKS];
