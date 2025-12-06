import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NetworksService } from './networks.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('networks')
export class NetworksController {
  constructor(private readonly networksService: NetworksService) {}

  /**
   * Get all networks
   */
  @Get()
  async getAllNetworks() {
    const networks = await this.networksService.getAllNetworks();
    return {
      success: true,
      data: networks,
    };
  }

  /**
   * Get networks available for base chain deployment
   */
  @Get('base')
  async getBaseNetworks() {
    const networks = await this.networksService.getBaseNetworks();
    return {
      success: true,
      data: networks,
    };
  }

  /**
   * Get networks available for split deployment
   */
  @Get('split')
  async getSplitNetworks() {
    const networks = await this.networksService.getSplitNetworks();
    return {
      success: true,
      data: networks,
    };
  }

  /**
   * Estimate deployment costs for a multi-chain launch
   */
  @Get('estimate')
  @UseGuards(JwtAuthGuard)
  async estimateDeployment(
    @Query('baseNetwork') baseNetwork: string,
    @Query('splitNetworks') splitNetworks: string,
  ) {
    const splitNetworkIds = splitNetworks ? splitNetworks.split(',').filter(Boolean) : [];
    
    const estimate = await this.networksService.estimateMultiNetworkDeployment(
      baseNetwork,
      splitNetworkIds,
    );

    return {
      success: true,
      data: {
        baseNetwork: {
          networkId: estimate.baseNetwork.networkId,
          estimatedCost: estimate.baseNetwork.estimate?.estimatedCost?.toString() || '0',
        },
        splitNetworks: estimate.splitNetworks.map((n) => ({
          networkId: n.networkId,
          estimatedCost: n.estimate?.estimatedCost?.toString() || '0',
        })),
        totalEstimatedCost: estimate.totalEstimatedCost.toString(),
      },
    };
  }

  /**
   * Get a single network by ID
   */
  @Get(':id')
  async getNetwork(@Param('id') id: string) {
    const network = await this.networksService.getNetwork(id);
    return {
      success: true,
      data: network,
    };
  }
}
