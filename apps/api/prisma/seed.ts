import { PrismaClient, NetworkType, TokenStandard } from '@prisma/client';

const prisma = new PrismaClient();

// ============== NETWORK SEED DATA ==============

const networks = [
  // ============== BASE NETWORKS ==============
  {
    id: 'ETH_MAINNET',
    name: 'Ethereum',
    chainId: 1,
    type: NetworkType.EVM,
    symbol: 'ETH',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
    wsUrl: 'wss://mainnet.infura.io/ws/v3/YOUR_KEY',
    explorerUrl: 'https://etherscan.io',
    isEnabledForBase: true,
    isEnabledForSplit: true,
    gasToken: 'ETH',
    avgBlockTimeMs: 12000,
    iconUrl: '/networks/ethereum.svg',
  },
  {
    id: 'ETH_SEPOLIA',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    type: NetworkType.EVM,
    symbol: 'ETH',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
    wsUrl: null,
    explorerUrl: 'https://sepolia.etherscan.io',
    isEnabledForBase: true,
    isEnabledForSplit: true,
    gasToken: 'ETH',
    avgBlockTimeMs: 12000,
    iconUrl: '/networks/ethereum.svg',
  },
  {
    id: 'BDAG_MAINNET',
    name: 'BlockDAG',
    chainId: 1337, // Placeholder - update with actual chain ID
    type: NetworkType.EVM,
    symbol: 'BDAG',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://rpc.blockdag.network', // Placeholder
    wsUrl: 'wss://ws.blockdag.network',
    explorerUrl: 'https://explorer.blockdag.network',
    isEnabledForBase: true,
    isEnabledForSplit: true,
    gasToken: 'BDAG',
    avgBlockTimeMs: 1000,
    iconUrl: '/networks/bdag.svg',
  },
  {
    id: 'BDAG_TESTNET',
    name: 'BlockDAG Testnet',
    chainId: 1338, // Placeholder
    type: NetworkType.EVM,
    symbol: 'BDAG',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://testnet-rpc.blockdag.network',
    wsUrl: null,
    explorerUrl: 'https://testnet-explorer.blockdag.network',
    isEnabledForBase: true,
    isEnabledForSplit: true,
    gasToken: 'BDAG',
    avgBlockTimeMs: 1000,
    iconUrl: '/networks/bdag.svg',
  },
  {
    id: 'SOLANA_MAINNET',
    name: 'Solana',
    chainId: null, // Solana doesn't use chain IDs
    type: NetworkType.SOLANA,
    symbol: 'SOL',
    tokenStandard: TokenStandard.SPL,
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    wsUrl: 'wss://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
    isEnabledForBase: true,
    isEnabledForSplit: true,
    gasToken: 'SOL',
    avgBlockTimeMs: 400,
    iconUrl: '/networks/solana.svg',
  },
  {
    id: 'SOLANA_DEVNET',
    name: 'Solana Devnet',
    chainId: null,
    type: NetworkType.SOLANA,
    symbol: 'SOL',
    tokenStandard: TokenStandard.SPL,
    rpcUrl: 'https://api.devnet.solana.com',
    wsUrl: 'wss://api.devnet.solana.com',
    explorerUrl: 'https://solscan.io?cluster=devnet',
    isEnabledForBase: true,
    isEnabledForSplit: true,
    gasToken: 'SOL',
    avgBlockTimeMs: 400,
    iconUrl: '/networks/solana.svg',
  },

  // ============== SPLIT NETWORKS (Wave 1) ==============
  {
    id: 'ARBITRUM_ONE',
    name: 'Arbitrum One',
    chainId: 42161,
    type: NetworkType.EVM,
    symbol: 'ETH',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    wsUrl: 'wss://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    isEnabledForBase: false,
    isEnabledForSplit: true,
    gasToken: 'ETH',
    avgBlockTimeMs: 250,
    iconUrl: '/networks/arbitrum.svg',
  },
  {
    id: 'ARBITRUM_SEPOLIA',
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    type: NetworkType.EVM,
    symbol: 'ETH',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    wsUrl: null,
    explorerUrl: 'https://sepolia.arbiscan.io',
    isEnabledForBase: false,
    isEnabledForSplit: true,
    gasToken: 'ETH',
    avgBlockTimeMs: 250,
    iconUrl: '/networks/arbitrum.svg',
  },
  {
    id: 'BASE_MAINNET',
    name: 'Base',
    chainId: 8453,
    type: NetworkType.EVM,
    symbol: 'ETH',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://mainnet.base.org',
    wsUrl: 'wss://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    isEnabledForBase: false,
    isEnabledForSplit: true,
    gasToken: 'ETH',
    avgBlockTimeMs: 2000,
    iconUrl: '/networks/base.svg',
  },
  {
    id: 'BASE_SEPOLIA',
    name: 'Base Sepolia',
    chainId: 84532,
    type: NetworkType.EVM,
    symbol: 'ETH',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://sepolia.base.org',
    wsUrl: null,
    explorerUrl: 'https://sepolia.basescan.org',
    isEnabledForBase: false,
    isEnabledForSplit: true,
    gasToken: 'ETH',
    avgBlockTimeMs: 2000,
    iconUrl: '/networks/base.svg',
  },
  {
    id: 'OPTIMISM_MAINNET',
    name: 'Optimism',
    chainId: 10,
    type: NetworkType.EVM,
    symbol: 'ETH',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://mainnet.optimism.io',
    wsUrl: 'wss://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    isEnabledForBase: false,
    isEnabledForSplit: true,
    gasToken: 'ETH',
    avgBlockTimeMs: 2000,
    iconUrl: '/networks/optimism.svg',
  },
  {
    id: 'BNB_MAINNET',
    name: 'BNB Chain',
    chainId: 56,
    type: NetworkType.EVM,
    symbol: 'BNB',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    wsUrl: 'wss://bsc-ws-node.nariox.org',
    explorerUrl: 'https://bscscan.com',
    isEnabledForBase: false,
    isEnabledForSplit: true,
    gasToken: 'BNB',
    avgBlockTimeMs: 3000,
    iconUrl: '/networks/bnb.svg',
  },
  {
    id: 'BNB_TESTNET',
    name: 'BNB Chain Testnet',
    chainId: 97,
    type: NetworkType.EVM,
    symbol: 'BNB',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    wsUrl: null,
    explorerUrl: 'https://testnet.bscscan.com',
    isEnabledForBase: false,
    isEnabledForSplit: true,
    gasToken: 'BNB',
    avgBlockTimeMs: 3000,
    iconUrl: '/networks/bnb.svg',
  },
  {
    id: 'POLYGON_MAINNET',
    name: 'Polygon',
    chainId: 137,
    type: NetworkType.EVM,
    symbol: 'MATIC',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://polygon-rpc.com',
    wsUrl: 'wss://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    isEnabledForBase: false,
    isEnabledForSplit: true,
    gasToken: 'MATIC',
    avgBlockTimeMs: 2000,
    iconUrl: '/networks/polygon.svg',
  },
  {
    id: 'AVALANCHE_MAINNET',
    name: 'Avalanche C-Chain',
    chainId: 43114,
    type: NetworkType.EVM,
    symbol: 'AVAX',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    wsUrl: 'wss://api.avax.network/ext/bc/C/ws',
    explorerUrl: 'https://snowtrace.io',
    isEnabledForBase: false,
    isEnabledForSplit: true,
    gasToken: 'AVAX',
    avgBlockTimeMs: 2000,
    iconUrl: '/networks/avalanche.svg',
  },

  // ============== SPLIT NETWORKS (Wave 2) ==============
  {
    id: 'ZKSYNC_MAINNET',
    name: 'zkSync Era',
    chainId: 324,
    type: NetworkType.EVM,
    symbol: 'ETH',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://mainnet.era.zksync.io',
    wsUrl: 'wss://mainnet.era.zksync.io/ws',
    explorerUrl: 'https://explorer.zksync.io',
    isEnabledForBase: false,
    isEnabledForSplit: true,
    gasToken: 'ETH',
    avgBlockTimeMs: 1000,
    iconUrl: '/networks/zksync.svg',
  },
  {
    id: 'LINEA_MAINNET',
    name: 'Linea',
    chainId: 59144,
    type: NetworkType.EVM,
    symbol: 'ETH',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://rpc.linea.build',
    wsUrl: 'wss://rpc.linea.build',
    explorerUrl: 'https://lineascan.build',
    isEnabledForBase: false,
    isEnabledForSplit: true,
    gasToken: 'ETH',
    avgBlockTimeMs: 2000,
    iconUrl: '/networks/linea.svg',
  },
  {
    id: 'SEI_MAINNET',
    name: 'Sei',
    chainId: 1329,
    type: NetworkType.EVM,
    symbol: 'SEI',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://evm-rpc.sei-apis.com',
    wsUrl: null,
    explorerUrl: 'https://seitrace.com',
    isEnabledForBase: false,
    isEnabledForSplit: true,
    gasToken: 'SEI',
    avgBlockTimeMs: 400,
    iconUrl: '/networks/sei.svg',
  },
  {
    id: 'HYPER_EVM',
    name: 'Hyper EVM',
    chainId: 999, // Placeholder - update with actual chain ID
    type: NetworkType.EVM,
    symbol: 'HYPE',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://rpc.hyperliquid.xyz', // Placeholder
    wsUrl: null,
    explorerUrl: 'https://explorer.hyperliquid.xyz',
    isEnabledForBase: false,
    isEnabledForSplit: false, // Disabled until mainnet
    gasToken: 'HYPE',
    avgBlockTimeMs: 1000,
    iconUrl: '/networks/hyperliquid.svg',
  },
  {
    id: 'MONAD_MAINNET',
    name: 'Monad',
    chainId: null, // Not launched yet
    type: NetworkType.EVM,
    symbol: 'MON',
    tokenStandard: TokenStandard.ERC20,
    rpcUrl: 'https://rpc.monad.xyz', // Placeholder
    wsUrl: null,
    explorerUrl: 'https://explorer.monad.xyz',
    isEnabledForBase: false,
    isEnabledForSplit: false, // Disabled until mainnet
    gasToken: 'MON',
    avgBlockTimeMs: 1000,
    iconUrl: '/networks/monad.svg',
  },
];

// ============== FEATURE FLAGS ==============

const featureFlags = [
  {
    name: 'ENABLE_BDAG_LAUNCH',
    enabled: true,
    description: 'Enable BDAG as a base network for token launches',
  },
  {
    name: 'ENABLE_SOLANA_LAUNCH',
    enabled: true,
    description: 'Enable Solana as a base network for token launches',
  },
  {
    name: 'ENABLE_SPLIT_NETWORKS',
    enabled: true,
    description: 'Enable multi-chain split token deployments',
  },
  {
    name: 'ENABLE_ZK_MODE',
    enabled: true,
    description: 'Enable ZK rollup integration for token launches',
  },
  {
    name: 'ENABLE_L1_MODE',
    enabled: true,
    description: 'Enable L1-only token launches (no ZK)',
  },
  {
    name: 'ENABLE_GRADUATION',
    enabled: true,
    description: 'Enable automatic graduation from presale to live',
  },
  {
    name: 'ENABLE_POST_HOC_SPLIT',
    enabled: false,
    description: 'Enable upgrading single-chain tokens to multi-chain',
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Seed networks
  console.log('📡 Seeding networks...');
  for (const network of networks) {
    await prisma.network.upsert({
      where: { id: network.id },
      update: network,
      create: network,
    });
    console.log(`  ✓ ${network.name} (${network.id})`);
  }

  // Seed feature flags
  console.log('🚩 Seeding feature flags...');
  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { name: flag.name },
      update: flag,
      create: flag,
    });
    console.log(`  ✓ ${flag.name}`);
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
