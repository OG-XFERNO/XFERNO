import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { GraduationService } from './graduation.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('graduation')
export class GraduationController {
  constructor(private readonly graduationService: GraduationService) {}

  /**
   * Get all tokens pending graduation (admin)
   */
  @Get('pending')
  @UseGuards(JwtAuthGuard)
  async getPending() {
    const tokens = await this.graduationService.getPendingGraduations();
    return { success: true, data: tokens };
  }

  @Get(':tokenId/eligibility')
  async checkEligibility(@Param('tokenId') tokenId: string) {
    const result = await this.graduationService.checkGraduationEligibility(tokenId);
    return { success: true, data: result };
  }

  @Get(':tokenId/estimate')
  async estimate(@Param('tokenId') tokenId: string) {
    const result = await this.graduationService.estimateGraduationCost(tokenId);
    return { success: true, data: result };
  }

  @Post(':tokenId/initiate')
  @UseGuards(JwtAuthGuard)
  async initiate(@Param('tokenId') tokenId: string) {
    const result = await this.graduationService.initiateGraduation(tokenId);
    return { success: true, data: result };
  }

  @Get(':tokenId/status')
  async status(@Param('tokenId') tokenId: string) {
    const result = await this.graduationService.getGraduationStatus(tokenId);
    return { success: true, data: result };
  }

  /**
   * Deploy token to all networks in parallel
   */
  @Post(':tokenId/deploy')
  @UseGuards(JwtAuthGuard)
  async deploy(@Param('tokenId') tokenId: string) {
    const result = await this.graduationService.deployToAllNetworks(tokenId);
    return { success: result.success, data: result };
  }

  /**
   * Retry a failed deployment for a specific network
   */
  @Post(':tokenId/retry/:networkId')
  @UseGuards(JwtAuthGuard)
  async retry(
    @Param('tokenId') tokenId: string,
    @Param('networkId') networkId: string,
  ) {
    const result = await this.graduationService.retryDeployment(tokenId, networkId);
    return { success: result.success, data: result };
  }
}
