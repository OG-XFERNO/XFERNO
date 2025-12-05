import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TradingService } from './trading.service';

@Controller('trading')
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Post(':tokenId/buy')
  async buy(
    @Param('tokenId') tokenId: string,
    @Body() body: { amount: string; userAddress: string }
  ) {
    return this.tradingService.buy(tokenId, body.amount, body.userAddress);
  }

  @Post(':tokenId/sell')
  async sell(
    @Param('tokenId') tokenId: string,
    @Body() body: { amount: string; userAddress: string }
  ) {
    return this.tradingService.sell(tokenId, body.amount, body.userAddress);
  }

  @Get(':tokenId/price')
  async getPrice(@Param('tokenId') tokenId: string) {
    return this.tradingService.getPrice(tokenId);
  }

  @Get(':tokenId/quote')
  async getQuote(
    @Param('tokenId') tokenId: string,
    @Query('amount') amount: string,
    @Query('side') side: 'buy' | 'sell'
  ) {
    return this.tradingService.getQuote(tokenId, amount, side);
  }
}
