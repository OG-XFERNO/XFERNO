export interface GraduationConfig {
  target: bigint;
  asset: 'ETH' | 'BDAG' | 'USDC';
  minLpPerChain?: bigint;
  maxSlippage?: number;
  presaleDuration?: number; // days, 0 = unlimited
}

export interface NetworkDeploymentCost {
  networkId: string;
  deploymentCost: bigint;
  lpSeedAmount: bigint;
  bridgeSetupCost: bigint;
  estimatedGas: bigint;
}

export interface GraduationEstimate {
  totalCost: bigint;
  perNetworkCosts: NetworkDeploymentCost[];
  estimatedLpPerNetwork: bigint;
  treasuryRemainder: bigint;
  isViable: boolean;
  failureReason?: string;
}

export interface GraduationLog {
  id: string;
  tokenId: string;
  totalRaised: bigint;
  gasSpent: bigint;
  lpSeeded: bigint;
  treasuryRemainder: bigint;
  status: GraduationStatus;
  errorMessage?: string;
  networkBreakdown: NetworkGraduationStatus[];
  startedAt: Date;
  completedAt?: Date;
}

export type GraduationStatus = 'started' | 'deploying' | 'completed' | 'failed';

export interface NetworkGraduationStatus {
  networkId: string;
  gasSpent: bigint;
  lpSeeded: bigint;
  status: 'pending' | 'deploying' | 'completed' | 'failed';
  txHash?: string;
  errorMessage?: string;
}

export interface PresaleContribution {
  id: string;
  tokenId: string;
  userId: string;
  networkId: string;
  amount: bigint;
  tokensReceived: bigint;
  priceAtPurchase: bigint;
  txHash?: string;
  createdAt: Date;
}

export interface PresaleStats {
  tokenId: string;
  totalRaised: bigint;
  participantCount: number;
  currentPrice: bigint;
  progressPercent: number;
  tokensRemaining: bigint;
}
