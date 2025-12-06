'use client';

import { createConfig, http } from 'wagmi';
import { mainnet, base, arbitrum, optimism, polygon, bsc, avalanche, sepolia } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// WalletConnect Project ID - should be in env
// Get a free project ID at https://cloud.walletconnect.com/
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
const hasValidProjectId = projectId.length > 10 && projectId !== 'demo';

// Build connectors - only include WalletConnect if we have a valid project ID
const connectors = [
  injected(),
  coinbaseWallet({ appName: 'XFERNO' }),
  // Only add WalletConnect if we have a valid project ID
  ...(hasValidProjectId ? [walletConnect({ projectId })] : []),
];

// Log warning in development if no WalletConnect project ID
if (typeof window !== 'undefined' && !hasValidProjectId) {
  console.warn(
    '[XFERNO] WalletConnect disabled - no valid project ID. ' +
    'Get a free one at https://cloud.walletconnect.com/ and add ' +
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to your .env.local file.'
  );
}

export const config = createConfig({
  chains: [mainnet, base, arbitrum, optimism, polygon, bsc, avalanche, sepolia],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});

// Chain metadata for UI
export const chainMetadata: Record<number, { name: string; icon: string; color: string }> = {
  [mainnet.id]: { name: 'Ethereum', icon: '⟠', color: '#627EEA' },
  [base.id]: { name: 'Base', icon: '🔵', color: '#0052FF' },
  [arbitrum.id]: { name: 'Arbitrum', icon: '🔷', color: '#28A0F0' },
  [optimism.id]: { name: 'Optimism', icon: '🔴', color: '#FF0420' },
  [polygon.id]: { name: 'Polygon', icon: '💜', color: '#8247E5' },
  [bsc.id]: { name: 'BNB Chain', icon: '💛', color: '#F0B90B' },
  [avalanche.id]: { name: 'Avalanche', icon: '🔺', color: '#E84142' },
  [sepolia.id]: { name: 'Sepolia', icon: '🧪', color: '#CFB5F0' },
};

// Platform fee constants
export const PLATFORM_FEE_BPS = 100; // 1%
export const PLATFORM_FEE_PERCENT = PLATFORM_FEE_BPS / 10000;

// Gas estimation multipliers by chain
export const GAS_MULTIPLIERS: Record<number, number> = {
  [mainnet.id]: 1.2,
  [base.id]: 1.1,
  [arbitrum.id]: 1.1,
  [optimism.id]: 1.1,
  [polygon.id]: 1.3,
  [bsc.id]: 1.2,
  [avalanche.id]: 1.2,
  [sepolia.id]: 1.1,
};
