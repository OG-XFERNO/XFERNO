import { Controller, Get, Post, Param } from '@nestjs/common';
import { GraduationService } from './graduation.service';

@Controller('graduation')
export class GraduationController {
  constructor(private readonly graduationService: GraduationService) {}

  @Get(':tokenId/eligibility')
  async checkEligibility(@Param('tokenId') tokenId: string) {
    return this.graduationService.checkGraduationEligibility(tokenId);
  }

  @Get(':tokenId/estimate')
  async estimate(@Param('tokenId') tokenId: string) {
    return this.graduationService.estimateGraduationCost(tokenId);
  }

  @Post(':tokenId/initiate')
  async initiate(@Param('tokenId') tokenId: string) {
    return this.graduationService.initiateGraduation(tokenId);
  }

  @Get(':tokenId/status')
  async status(@Param('tokenId') tokenId: string) {
    return this.graduationService.getGraduationStatus(tokenId);
  }
}
