import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TradingService, TradeRecordDto, TradeHistoryFilter } from './trading.service';

@Controller('trading')
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Post('buy')
  async recordBuy(@Body() body: TradeRecordDto) {
    return this.tradingService.recordBuy(body);
  }

  @Post('sell')
  async recordSell(@Body() body: TradeRecordDto) {
    return this.tradingService.recordSell(body);
  }

  @Get(':tokenId/price')
  async getPrice(@Param('tokenId') tokenId: string) {
    return this.tradingService.getPrice(tokenId);
  }

  @Get(':tokenId/quote')
  async getQuote(
    @Param('tokenId') tokenId: string,
    @Query('amount') amount: string,
    @Query('side') side: 'buy' | 'sell',
    @Query('slippage') slippage?: string,
  ) {
    return this.tradingService.getQuote(
      tokenId,
      amount,
      side,
      slippage ? parseFloat(slippage) : undefined,
    );
  }

  @Get('history')
  async getTradeHistory(@Query() filters: TradeHistoryFilter) {
    return this.tradingService.getTradeHistory(filters);
  }

  @Get(':tokenId/history')
  async getTokenTradeHistory(
    @Param('tokenId') tokenId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tradingService.getTradeHistory({
      tokenId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':tokenId/holdings/:userId')
  async getUserHoldings(
    @Param('tokenId') tokenId: string,
    @Param('userId') userId: string,
  ) {
    return this.tradingService.getUserHoldings(userId, tokenId);
  }

  @Get(':tokenId/top-traders')
  async getTopTraders(
    @Param('tokenId') tokenId: string,
    @Query('limit') limit?: string,
  ) {
    return this.tradingService.getTopTraders(tokenId, limit ? parseInt(limit) : 10);
  }
}
