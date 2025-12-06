import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenStatus, DeploymentStatus, LaunchMode } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { NetworksService } from '../networks/networks.service';

export interface GraduationEligibility {
  eligible: boolean;
  reason: string;
  raisedAmount: string;
  graduationTarget: string;
  progress: number;
  remainingAmount: string;
}

export interface GraduationCostEstimate {
  totalCost: string;
  breakdown: {
    network: string;
    tokenDeployment: string;
    poolCreation: string;
    liquiditySeeding: string;
    bridgeDeployment?: string;
    total: string;
  }[];
  estimatedTime: number; // minutes
}

export interface GraduationProgress {
  status: string;
  progress: number;
  steps: {
    name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    txHash?: string;
    error?: string;
  }[];
  startedAt?: Date;
  completedAt?: Date;
}

@Injectable()
export class GraduationService {
  private readonly logger = new Logger(GraduationService.name);

  // Estimated gas costs in ETH (simplified)
  private readonly GAS_ESTIMATES = {
    tokenDeployment: '0.005',
    poolCreation: '0.01',
    liquiditySeeding: '0.002',
    bridgeDeployment: '0.015',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly networksService: NetworksService,
  ) {}

  /**
   * Check if a token is eligible for graduation
   */
  async checkGraduationEligibility(tokenId: string): Promise<GraduationEligibility> {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    const raisedAmount = token.raisedAmount;
    const graduationTarget = token.graduationTarget;
    const progress = raisedAmount.div(graduationTarget).mul(100).toNumber();
    const remaining = graduationTarget.sub(raisedAmount);

    // Check eligibility
    if (token.status !== TokenStatus.PRESALE_ACTIVE && token.status !== TokenStatus.GRADUATION_PENDING) {
      return {
        eligible: false,
        reason: `Token status must be PRESALE_ACTIVE or GRADUATION_PENDING, current: ${token.status}`,
        raisedAmount: raisedAmount.toString(),
        graduationTarget: graduationTarget.toString(),
        progress: Math.min(progress, 100),
        remainingAmount: remaining.isNegative() ? '0' : remaining.toString(),
      };
    }

    const eligible = raisedAmount.gte(graduationTarget);

    return {
      eligible,
      reason: eligible ? 'Token has reached graduation target' : 'Token has not reached graduation target',
      raisedAmount: raisedAmount.toString(),
      graduationTarget: graduationTarget.toString(),
      progress: Math.min(progress, 100),
      remainingAmount: remaining.isNegative() ? '0' : remaining.toString(),
    };
  }

  /**
   * Estimate total cost for graduation
   */
  async estimateGraduationCost(tokenId: string): Promise<GraduationCostEstimate> {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
      include: {
        baseChain: true,
      },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    const breakdown: GraduationCostEstimate['breakdown'] = [];
    let totalCost = new Decimal(0);

    // Base chain deployment
    const baseCost = new Decimal(this.GAS_ESTIMATES.tokenDeployment)
      .add(this.GAS_ESTIMATES.poolCreation)
      .add(this.GAS_ESTIMATES.liquiditySeeding);

    breakdown.push({
      network: token.baseChain.name,
      tokenDeployment: this.GAS_ESTIMATES.tokenDeployment,
      poolCreation: this.GAS_ESTIMATES.poolCreation,
      liquiditySeeding: this.GAS_ESTIMATES.liquiditySeeding,
      total: baseCost.toString(),
    });
    totalCost = totalCost.add(baseCost);

    // Split network deployments
    if (token.splitNetworkIds.length > 0) {
      const splitNetworks = await this.prisma.network.findMany({
        where: { id: { in: token.splitNetworkIds } },
      });

      for (const network of splitNetworks) {
        const networkCost = new Decimal(this.GAS_ESTIMATES.tokenDeployment)
          .add(this.GAS_ESTIMATES.poolCreation)
          .add(this.GAS_ESTIMATES.liquiditySeeding)
          .add(this.GAS_ESTIMATES.bridgeDeployment);

        breakdown.push({
          network: network.name,
          tokenDeployment: this.GAS_ESTIMATES.tokenDeployment,
          poolCreation: this.GAS_ESTIMATES.poolCreation,
          liquiditySeeding: this.GAS_ESTIMATES.liquiditySeeding,
          bridgeDeployment: this.GAS_ESTIMATES.bridgeDeployment,
          total: networkCost.toString(),
        });
        totalCost = totalCost.add(networkCost);
      }
    }

    // Estimate time: ~5 minutes per network
    const estimatedTime = (1 + token.splitNetworkIds.length) * 5;

    return {
      totalCost: totalCost.toString(),
      breakdown,
      estimatedTime,
    };
  }

  /**
   * Initiate the graduation process
   */
  async initiateGraduation(tokenId: string) {
    const eligibility = await this.checkGraduationEligibility(tokenId);

    if (!eligibility.eligible) {
      throw new BadRequestException(eligibility.reason);
    }

    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
      include: { baseChain: true },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    // Update token status
    await this.prisma.token.update({
      where: { id: tokenId },
      data: { status: TokenStatus.GRADUATED_DEPLOYING },
    });

    // Create graduation log
    const graduationLog = await this.prisma.graduationLog.create({
      data: {
        tokenId,
        totalRaised: token.raisedAmount,
        status: 'INITIATED',
        startedAt: new Date(),
        networkBreakdown: {},
      },
    });

    // Create deployment records for all networks
    const networkIds = [token.baseChainId, ...token.splitNetworkIds];
    
    await this.prisma.tokenDeployment.createMany({
      data: networkIds.map((networkId) => ({
        tokenId,
        networkId,
        status: DeploymentStatus.PENDING,
      })),
      skipDuplicates: true,
    });

    this.logger.log(`Graduation initiated for token ${tokenId}`);

    return {
      status: 'initiated',
      graduationLogId: graduationLog.id,
      networksToDeployment: networkIds.length,
    };
  }

  /**
   * Get current graduation status
   */
  async getGraduationStatus(tokenId: string): Promise<GraduationProgress> {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
      include: {
        deployments: {
          include: { network: true },
        },
        graduationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    const graduationLog = token.graduationLogs[0];
    const deployments = token.deployments;

    // Calculate progress
    const totalDeployments = deployments.length || 1;
    const completedDeployments = deployments.filter(
      (d) => d.status === DeploymentStatus.DEPLOYED || d.status === DeploymentStatus.VERIFIED
    ).length;
    const progress = (completedDeployments / totalDeployments) * 100;

    // Build steps
    const steps = deployments.map((deployment) => ({
      name: `Deploy to ${deployment.network.name}`,
      status: this.mapDeploymentStatus(deployment.status),
      txHash: deployment.deploymentTxHash || undefined,
      error: deployment.errorMessage || undefined,
    }));

    // Add pool creation steps
    const poolSteps: GraduationProgress['steps'] = deployments
      .filter((d) => d.status === DeploymentStatus.DEPLOYED || d.status === DeploymentStatus.VERIFIED)
      .map((deployment) => ({
        name: `Create pool on ${deployment.network.name}`,
        status: (deployment.poolAddress ? 'completed' : 'pending') as 'pending' | 'completed',
      }));

    return {
      status: graduationLog?.status || token.status,
      progress: Math.round(progress),
      steps: [...steps, ...poolSteps] as GraduationProgress['steps'],
      startedAt: graduationLog?.startedAt || undefined,
      completedAt: graduationLog?.completedAt || undefined,
    };
  }

  /**
   * Deploy token to a specific network (called by deployment worker)
   */
  async deployToNetwork(tokenId: string, networkId: string) {
    const deployment = await this.prisma.tokenDeployment.findUnique({
      where: {
        tokenId_networkId: { tokenId, networkId },
      },
      include: {
        token: {
          include: {
            creator: {
              include: { wallets: true },
            },
          },
        },
        network: true,
      },
    });

    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }

    // Get the network adapter
    const adapter = this.networksService.getAdapter(networkId);
    if (!adapter) {
      await this.prisma.tokenDeployment.update({
        where: { id: deployment.id },
        data: {
          status: DeploymentStatus.FAILED,
          errorMessage: `No adapter available for network ${deployment.network.name}`,
        },
      });
      throw new BadRequestException(`No adapter available for network ${deployment.network.name}`);
    }

    // Update status to deploying
    await this.prisma.tokenDeployment.update({
      where: { id: deployment.id },
      data: { status: DeploymentStatus.DEPLOYING },
    });

    this.logger.log(`Deploying token ${tokenId} to network ${deployment.network.name}`);

    try {
      // Deploy the token using the network adapter
      const result = await adapter.deployToken({
        name: deployment.token.name,
        symbol: deployment.token.symbol,
        decimals: deployment.token.decimals,
        totalSupply: BigInt(deployment.token.totalSupply.toString()),
        owner: deployment.token.creator.wallets[0]?.address || '',
        isMintable: false,
        isBurnable: true,
      });

      // Update deployment record with token address
      await this.prisma.tokenDeployment.update({
        where: { id: deployment.id },
        data: {
          tokenAddress: result.tokenAddress,
          deploymentTxHash: result.transactionHash,
          status: DeploymentStatus.DEPLOYED,
          deployedAt: new Date(),
        },
      });

      this.logger.log(`Token deployed at ${result.tokenAddress} on ${deployment.network.name}`);

      return {
        deployed: true,
        tokenAddress: result.tokenAddress,
        transactionHash: result.transactionHash,
        deploymentId: deployment.id,
      };
    } catch (error) {
      this.logger.error(`Deployment failed for ${tokenId} on ${networkId}:`, error);

      await this.prisma.tokenDeployment.update({
        where: { id: deployment.id },
        data: {
          status: DeploymentStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Deploy DEX pool for a token on a network
   */
  async deployPool(tokenId: string, networkId: string) {
    const deployment = await this.prisma.tokenDeployment.findUnique({
      where: {
        tokenId_networkId: { tokenId, networkId },
      },
      include: {
        token: true,
        network: true,
      },
    });

    if (!deployment || !deployment.tokenAddress) {
      throw new NotFoundException('Token not deployed on this network');
    }

    const adapter = this.networksService.getAdapter(networkId);
    if (!adapter) {
      throw new BadRequestException(`No adapter available for network ${deployment.network.name}`);
    }

    this.logger.log(`Creating pool for token ${tokenId} on ${deployment.network.name}`);

    try {
      // Calculate initial liquidity based on raised amount and split
      const tokenData = await this.prisma.token.findUnique({
        where: { id: tokenId },
        select: { splitNetworkIds: true },
      });
      const totalNetworks = 1 + (tokenData?.splitNetworkIds.length || 0);

      const raisedAmount = deployment.token.raisedAmount;
      const liquidityPerNetwork = raisedAmount.div(totalNetworks);

      // Deploy the pool
      const result = await adapter.deployPool({
        tokenAddress: deployment.tokenAddress,
        baseAssetAddress: '0x0000000000000000000000000000000000000000', // Native token (WETH wrapper)
        initialTokenAmount: BigInt(deployment.token.totalSupply.div(2).toString()), // 50% to pool
        initialBaseAmount: BigInt(liquidityPerNetwork.mul(1e18).toString()),
      });

      // Update deployment with pool info
      await this.prisma.tokenDeployment.update({
        where: { id: deployment.id },
        data: {
          poolAddress: result.poolAddress,
        },
      });

      this.logger.log(`Pool created at ${result.poolAddress} on ${deployment.network.name}`);

      return {
        poolAddress: result.poolAddress,
        lpTokenAddress: result.lpTokenAddress,
        transactionHash: result.transactionHash,
      };
    } catch (error) {
      this.logger.error(`Pool creation failed for ${tokenId} on ${networkId}:`, error);
      throw error;
    }
  }

  /**
   * Mark deployment as complete (called after on-chain deployment)
   */
  async markDeploymentComplete(
    deploymentId: string,
    data: {
      tokenAddress: string;
      deploymentTxHash: string;
      poolAddress?: string;
      bridgeAddress?: string;
    }
  ) {
    const deployment = await this.prisma.tokenDeployment.update({
      where: { id: deploymentId },
      data: {
        tokenAddress: data.tokenAddress,
        deploymentTxHash: data.deploymentTxHash,
        poolAddress: data.poolAddress,
        bridgeAddress: data.bridgeAddress,
        status: DeploymentStatus.DEPLOYED,
        deployedAt: new Date(),
      },
      include: {
        token: {
          include: {
            deployments: true,
          },
        },
      },
    });

    // Check if all deployments are complete
    const allDeployed = deployment.token.deployments.every(
      (d) => d.status === DeploymentStatus.DEPLOYED || d.status === DeploymentStatus.VERIFIED
    );

    if (allDeployed) {
      // Update token status to live
      await this.prisma.token.update({
        where: { id: deployment.tokenId },
        data: {
          status: TokenStatus.LIVE_MULTICHAIN,
          graduatedAt: new Date(),
        },
      });

      // Update graduation log
      await this.prisma.graduationLog.updateMany({
        where: {
          tokenId: deployment.tokenId,
          completedAt: null,
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      this.logger.log(`Graduation complete for token ${deployment.tokenId}`);
    }

    return deployment;
  }

  /**
   * Get all tokens pending graduation
   */
  async getPendingGraduations() {
    return this.prisma.token.findMany({
      where: {
        status: {
          in: [TokenStatus.GRADUATION_PENDING, TokenStatus.GRADUATED_DEPLOYING],
        },
      },
      include: {
        baseChain: true,
        deployments: {
          include: { network: true },
        },
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  private mapDeploymentStatus(status: DeploymentStatus): 'pending' | 'in_progress' | 'completed' | 'failed' {
    switch (status) {
      case DeploymentStatus.PENDING:
        return 'pending';
      case DeploymentStatus.DEPLOYING:
        return 'in_progress';
      case DeploymentStatus.DEPLOYED:
      case DeploymentStatus.VERIFIED:
        return 'completed';
      case DeploymentStatus.FAILED:
        return 'failed';
      default:
        return 'pending';
    }
  }
}
