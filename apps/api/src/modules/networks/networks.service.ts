import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NetworkType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  INetworkAdapter,
  NetworkConfig,
  GasEstimate,
} from './interfaces/network-adapter.interface';
import { EVMAdapter, BDAGAdapter, EthereumAdapter } from './adapters/evm.adapter';
import { SolanaAdapter } from './adapters/solana.adapter';

/**
 * Networks Service
 * Manages network configurations and provides access to network adapters
 */
@Injectable()
export class NetworksService implements OnModuleInit {
  private readonly logger = new Logger(NetworksService.name);
  private adapters: Map<string, INetworkAdapter> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.initializeAdapters();
  }

  /**
   * Initialize adapters for all enabled networks
   */
  private async initializeAdapters(): Promise<void> {
    this.logger.log('Initializing network adapters...');

    const networks = await this.prisma.network.findMany({
      where: {
        OR: [{ isEnabledForBase: true }, { isEnabledForSplit: true }],
      },
    });

    for (const network of networks) {
      try {
        const adapter = this.createAdapter(network);
        if (adapter) {
          await adapter.initialize(network as NetworkConfig);
          this.adapters.set(network.id, adapter);
          this.logger.log(`Initialized adapter for ${network.name}`);
        }
      } catch (error) {
        this.logger.error(`Failed to initialize adapter for ${network.name}:`, error);
      }
    }

    this.logger.log(`Initialized ${this.adapters.size} network adapters`);
  }

  /**
   * Create the appropriate adapter for a network
   */
  private createAdapter(network: any): INetworkAdapter | null {
    switch (network.type) {
      case NetworkType.EVM:
        // Use specific adapters for known networks
        if (network.id.startsWith('ETH_')) {
          return new EthereumAdapter(network.id, network.chainId);
        }
        if (network.id.startsWith('BDAG_')) {
          return new BDAGAdapter(network.id, network.chainId);
        }
        // Generic EVM adapter for other chains
        return new EVMAdapter(network.id, network.chainId);

      case NetworkType.SOLANA:
        return new SolanaAdapter(network.id);

      case NetworkType.MOVE:
        // TODO: Implement MoveAdapter for Sui/Aptos
        this.logger.warn(`Move adapter not yet implemented for ${network.name}`);
        return null;

      default:
        this.logger.warn(`Unknown network type for ${network.name}`);
        return null;
    }
  }

  /**
   * Get an adapter for a specific network
   */
  getAdapter(networkId: string): INetworkAdapter | null {
    return this.adapters.get(networkId) || null;
  }

  /**
   * Get all available adapters
   */
  getAllAdapters(): Map<string, INetworkAdapter> {
    return this.adapters;
  }

  /**
   * Get all networks available for base chain deployment
   */
  async getBaseNetworks() {
    return this.prisma.network.findMany({
      where: { isEnabledForBase: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get all networks available for split deployment
   */
  async getSplitNetworks() {
    return this.prisma.network.findMany({
      where: { isEnabledForSplit: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a single network by ID
   */
  async getNetwork(id: string) {
    return this.prisma.network.findUnique({ where: { id } });
  }

  /**
   * Get all networks
   */
  async getAllNetworks() {
    return this.prisma.network.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Toggle network enabled status
   */
  async toggleNetwork(id: string, enabledForBase?: boolean, enabledForSplit?: boolean) {
    const updateData: any = {};
    if (enabledForBase !== undefined) updateData.isEnabledForBase = enabledForBase;
    if (enabledForSplit !== undefined) updateData.isEnabledForSplit = enabledForSplit;

    const network = await this.prisma.network.update({
      where: { id },
      data: updateData,
    });

    // Reinitialize adapters if network was enabled
    if (enabledForBase || enabledForSplit) {
      await this.initializeAdapters();
    }

    return network;
  }

  /**
   * Estimate total gas costs for deploying to multiple networks
   */
  async estimateMultiNetworkDeployment(
    baseNetworkId: string,
    splitNetworkIds: string[],
  ): Promise<{
    baseNetwork: { networkId: string; estimate: GasEstimate | null };
    splitNetworks: { networkId: string; estimate: GasEstimate | null }[];
    totalEstimatedCost: bigint;
  }> {
    let totalCost = BigInt(0);

    // Estimate base network
    const baseAdapter = this.getAdapter(baseNetworkId);
    let baseEstimate: GasEstimate | null = null;
    if (baseAdapter) {
      try {
        baseEstimate = await baseAdapter.estimateDeployToken({
          name: 'Test',
          symbol: 'TEST',
          decimals: 18,
          totalSupply: BigInt('1000000000000000000000000'),
          owner: '0x0000000000000000000000000000000000000000',
        });
        totalCost += baseEstimate.estimatedCost;
      } catch (error) {
        this.logger.error(`Failed to estimate for ${baseNetworkId}:`, error);
      }
    }

    // Estimate split networks
    const splitEstimates: { networkId: string; estimate: GasEstimate | null }[] = [];
    for (const networkId of splitNetworkIds) {
      const adapter = this.getAdapter(networkId);
      let estimate: GasEstimate | null = null;
      if (adapter) {
        try {
          estimate = await adapter.estimateDeployToken({
            name: 'Test',
            symbol: 'TEST',
            decimals: 18,
            totalSupply: BigInt('1000000000000000000000000'),
            owner: '0x0000000000000000000000000000000000000000',
          });
          totalCost += estimate.estimatedCost;
        } catch (error) {
          this.logger.error(`Failed to estimate for ${networkId}:`, error);
        }
      }
      splitEstimates.push({ networkId, estimate });
    }

    return {
      baseNetwork: { networkId: baseNetworkId, estimate: baseEstimate },
      splitNetworks: splitEstimates,
      totalEstimatedCost: totalCost,
    };
  }
}
