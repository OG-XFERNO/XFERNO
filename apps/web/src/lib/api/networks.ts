const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export interface Network {
  id: string;
  name: string;
  chainId: number | null;
  type: 'EVM' | 'SOLANA' | 'MOVE' | 'OTHER';
  symbol: string;
  tokenStandard: 'ERC20' | 'SPL' | 'MOVE';
  rpcUrl: string;
  wsUrl: string | null;
  explorerUrl: string | null;
  isEnabledForBase: boolean;
  isEnabledForSplit: boolean;
  gasToken: string | null;
  avgBlockTimeMs: number | null;
  iconUrl: string | null;
}

/**
 * Get all networks
 */
export async function getAllNetworks(): Promise<Network[]> {
  const response = await fetch(`${API_BASE}/api/networks`);
  const data = await response.json();
  return data.data || [];
}

/**
 * Get networks available for base chain deployment
 */
export async function getBaseNetworks(): Promise<Network[]> {
  const response = await fetch(`${API_BASE}/api/networks/base`);
  const data = await response.json();
  return data.data || [];
}

/**
 * Get networks available for split deployment
 */
export async function getSplitNetworks(): Promise<Network[]> {
  const response = await fetch(`${API_BASE}/api/networks/split`);
  const data = await response.json();
  return data.data || [];
}

/**
 * Estimate deployment costs for multi-chain launch
 */
export async function estimateDeploymentCosts(
  baseNetwork: string,
  splitNetworks: string[],
  token: string,
): Promise<{
  baseNetwork: { networkId: string; estimatedCost: string };
  splitNetworks: { networkId: string; estimatedCost: string }[];
  totalEstimatedCost: string;
}> {
  const response = await fetch(
    `${API_BASE}/api/networks/estimate?baseNetwork=${baseNetwork}&splitNetworks=${splitNetworks.join(',')}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const data = await response.json();
  return data.data;
}

/**
 * Get network icon based on network ID
 */
export function getNetworkIcon(networkId: string): string {
  const icons: Record<string, string> = {
    ETH_MAINNET: '/networks/ethereum.svg',
    ETH_SEPOLIA: '/networks/ethereum.svg',
    BDAG_MAINNET: '/networks/bdag.svg',
    BDAG_TESTNET: '/networks/bdag.svg',
    SOLANA_MAINNET: '/networks/solana.svg',
    SOLANA_DEVNET: '/networks/solana.svg',
    ARBITRUM_ONE: '/networks/arbitrum.svg',
    ARBITRUM_SEPOLIA: '/networks/arbitrum.svg',
    BASE_MAINNET: '/networks/base.svg',
    BASE_SEPOLIA: '/networks/base.svg',
    OPTIMISM_MAINNET: '/networks/optimism.svg',
    BNB_MAINNET: '/networks/bnb.svg',
    BNB_TESTNET: '/networks/bnb.svg',
    POLYGON_MAINNET: '/networks/polygon.svg',
    AVALANCHE_MAINNET: '/networks/avalanche.svg',
    ZKSYNC_MAINNET: '/networks/zksync.svg',
    LINEA_MAINNET: '/networks/linea.svg',
    SEI_MAINNET: '/networks/sei.svg',
  };
  return icons[networkId] || '/networks/default.svg';
}

/**
 * Get display name for network type
 */
export function getNetworkTypeLabel(type: Network['type']): string {
  const labels: Record<Network['type'], string> = {
    EVM: 'EVM Compatible',
    SOLANA: 'Solana',
    MOVE: 'Move VM',
    OTHER: 'Other',
  };
  return labels[type];
}
