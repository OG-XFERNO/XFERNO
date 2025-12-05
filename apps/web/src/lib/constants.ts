export const APP_NAME = 'XFERNO';
export const APP_DESCRIPTION = 'Multi-chain token launchpad and DEX';

export const SUPPORTED_CHAIN_IDS = {
  ETH_MAINNET: 1,
  ETH_SEPOLIA: 11155111,
  ARBITRUM: 42161,
  BASE: 8453,
  POLYGON: 137,
  AVALANCHE: 43114,
  BNB: 56,
} as const;

export const LAUNCH_MODES = {
  ZK_SINGLE_CHAIN: 'zk_single_chain',
  ZK_SPLIT_MULTICHAIN: 'zk_split_multichain',
  L1_SINGLE_CHAIN: 'l1_single_chain',
  L1_SPLIT_MULTICHAIN: 'l1_split_multichain',
} as const;

export const TOKEN_STATUS = {
  DRAFT: 'DRAFT',
  PRESALE_ACTIVE: 'PRESALE_ACTIVE',
  GRADUATION_PENDING: 'GRADUATION_PENDING',
  GRADUATED_DEPLOYING: 'GRADUATED_DEPLOYING',
  LIVE_MULTICHAIN: 'LIVE_MULTICHAIN',
  PAUSED: 'PAUSED',
  FAILED: 'FAILED',
} as const;

export const BONDING_CURVE_TYPES = {
  LINEAR: 'linear',
  EXPONENTIAL: 'exponential',
  SIGMOID: 'sigmoid',
} as const;

export const API_ENDPOINTS = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  GRAPHQL: '/graphql',
  HEALTH: '/health',
} as const;

export const ROUTES = {
  HOME: '/',
  TOKENS: '/tokens',
  TOKEN: (id: string) => `/token/${id}`,
  LAUNCH: '/launch',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  ADMIN: '/admin',
} as const;

export const SOCIAL_LINKS = {
  TWITTER: 'https://twitter.com/xferno',
  DISCORD: 'https://discord.gg/xferno',
  TELEGRAM: 'https://t.me/xferno',
  GITHUB: 'https://github.com/OG-XFERNO/XFERNO',
} as const;
