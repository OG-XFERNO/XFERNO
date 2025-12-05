import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BridgeService } from './bridge.service';

@Controller('bridge')
export class BridgeController {
  constructor(private readonly bridgeService: BridgeService) {}

  @Post()
  async bridge(@Body() body: any) {
    return this.bridgeService.bridge(body);
  }

  @Get(':bridgeId/status')
  async status(@Param('bridgeId') bridgeId: string) {
    return this.bridgeService.getBridgeStatus(bridgeId);
  }

  @Get(':tokenId/routes')
  async routes(@Param('tokenId') tokenId: string) {
    return this.bridgeService.getSupportedRoutes(tokenId);
  }
}
