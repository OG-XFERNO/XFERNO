import { Controller, Get, Query, Param } from '@nestjs/common';
import { IndexerService } from './indexer.service';

@Controller('indexer')
export class IndexerController {
  constructor(private readonly indexerService: IndexerService) {}

  @Get('status')
  async getStatus() {
    return this.indexerService.getIndexerStatus();
  }

  @Get('trades/:tokenAddress')
  async getRecentTrades(
    @Param('tokenAddress') tokenAddress: string,
    @Query('chainId') chainId: string,
    @Query('limit') limit?: string,
  ) {
    const trades = await this.indexerService.getRecentTrades(
      tokenAddress,
      parseInt(chainId) || 11155111,
      parseInt(limit || '50'),
    );

    return {
      trades: trades.map((t) => ({
        id: t.id,
        tokenAddress: t.tokenAddress,
        traderAddress: t.traderAddress,
        tradeType: t.tradeType,
        ethAmount: t.ethAmount.toString(),
        tokenAmount: t.tokenAmount.toString(),
        pricePerToken: t.pricePerToken.toString(),
        txHash: t.txHash,
        blockNumber: t.blockNumber.toString(),
        blockTimestamp: t.blockTimestamp.toISOString(),
      })),
    };
  }

  @Get('candles/:tokenAddress')
  async getPriceCandles(
    @Param('tokenAddress') tokenAddress: string,
    @Query('chainId') chainId: string,
    @Query('interval') interval: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const candles = await this.indexerService.getPriceCandles(
      tokenAddress,
      parseInt(chainId) || 11155111,
      interval || '5m',
      new Date(from || Date.now() - 24 * 60 * 60 * 1000),
      new Date(to || Date.now()),
    );

    return {
      candles: candles.map((c) => ({
        time: Math.floor(c.openTime.getTime() / 1000),
        open: parseFloat(c.open.toString()),
        high: parseFloat(c.high.toString()),
        low: parseFloat(c.low.toString()),
        close: parseFloat(c.close.toString()),
        volume: parseFloat(c.volume.toString()),
      })),
    };
  }

  @Get('stats/:tokenAddress')
  async getTokenStats(
    @Param('tokenAddress') tokenAddress: string,
    @Query('chainId') chainId: string,
  ) {
    const stats = await this.indexerService.getTokenStats(
      tokenAddress,
      parseInt(chainId) || 11155111,
    );

    if (!stats) {
      return { stats: null };
    }

    return {
      stats: {
        tokenAddress: stats.tokenAddress,
        chainId: stats.chainId,
        currentPrice: stats.currentPrice.toString(),
        priceChange24h: parseFloat(stats.priceChange24h.toString()),
        volume24h: stats.volume24h.toString(),
        trades24h: stats.trades24h,
        totalVolume: stats.totalVolume.toString(),
        totalTrades: stats.totalTrades,
        allTimeHigh: stats.allTimeHigh.toString(),
        allTimeLow: stats.allTimeLow.toString(),
        updatedAt: stats.updatedAt.toISOString(),
      },
    };
  }
}
