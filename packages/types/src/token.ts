export type LaunchMode =
  | 'ZK_SINGLE_CHAIN'
  | 'ZK_SPLIT_MULTICHAIN'
  | 'L1_SINGLE_CHAIN'
  | 'L1_SPLIT_MULTICHAIN';

export type TokenStatus =
  | 'DRAFT'
  | 'PRESALE_ACTIVE'
  | 'GRADUATION_PENDING'
  | 'GRADUATED_DEPLOYING'
  | 'LIVE_MULTICHAIN'
  | 'PAUSED'
  | 'FAILED';

export type BondingCurveType = 'LINEAR' | 'EXPONENTIAL' | 'SIGMOID' | 'CUSTOM';

export type DeploymentStatus = 'PENDING' | 'DEPLOYING' | 'DEPLOYED' | 'VERIFIED' | 'FAILED';

export interface Token {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;

  // Launch configuration
  launchMode: LaunchMode;
  baseChainId: string;
  splitNetworkIds: string[];

  // Supply
  totalSupply: bigint;
  decimals: number;

  // Graduation
  graduationTarget: bigint;
  graduationAsset: string;
  raisedAmount: bigint;

  // Bonding curve
  bondingCurveType: BondingCurveType;
  initialPrice?: bigint;
  priceMultiplier?: number;
  maxPresaleSupply?: bigint;

  // Status
  status: TokenStatus;

  // Ownership
  creatorId: string;
  creatorMultisig?: string;

  // Social
  websiteUrl?: string;
  twitterUrl?: string;
  discordUrl?: string;
  telegramUrl?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  presaleStartedAt?: Date;
  graduatedAt?: Date;
}

export interface TokenDeployment {
  id: string;
  tokenId: string;
  networkId: string;
  tokenAddress?: string;
  bridgeAddress?: string;
  poolAddress?: string;
  status: DeploymentStatus;
  deploymentTxHash?: string;
  verified: boolean;
  deployedAt?: Date;
}

export interface CreateTokenInput {
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  launchMode: LaunchMode;
  baseChainId: string;
  splitNetworkIds: string[];
  totalSupply: string;
  decimals?: number;
  graduationTarget: string;
  graduationAsset: string;
  bondingCurveType: BondingCurveType;
  initialPrice?: string;
  priceMultiplier?: number;
  maxPresaleSupply?: string;
  websiteUrl?: string;
  twitterUrl?: string;
  discordUrl?: string;
  telegramUrl?: string;
}

export interface BondingCurveConfig {
  type: BondingCurveType;
  initialPrice: bigint;
  priceMultiplier: number;
  maxSupplyInPresale: bigint;
  reserveRatio: number;
  graduationTarget: bigint;
  baseAsset: 'ETH' | 'BDAG' | 'USDC';
}
