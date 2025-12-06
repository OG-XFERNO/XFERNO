import { Controller, Get, Post, Delete, Query, Param, Body, UseGuards, Request } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

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

  // ========== USER-SPECIFIC ENDPOINTS ==========

  @Get('user/trades')
  @UseGuards(JwtAuthGuard)
  async getUserTrades(
    @Request() req: any,
    @Query('chainId') chainId: string,
    @Query('limit') limit?: string,
  ) {
    const wallets = req.user.wallets || [];
    const addresses = wallets.map((w: any) => w.address.toLowerCase());
    
    if (addresses.length === 0) {
      return { trades: [] };
    }

    const trades = await this.indexerService.getUserTrades(
      addresses,
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

  @Get('watchlist')
  @UseGuards(JwtAuthGuard)
  async getWatchlist(
    @Request() req: any,
    @Query('chainId') chainId: string,
  ) {
    const items = await this.indexerService.getWatchlist(
      req.user.id,
      parseInt(chainId) || 11155111,
    );

    return { watchlist: items };
  }

  @Post('watchlist')
  @UseGuards(JwtAuthGuard)
  async addToWatchlist(
    @Request() req: any,
    @Body() body: { tokenAddress: string; chainId: number; notes?: string },
  ) {
    const item = await this.indexerService.addToWatchlist(
      req.user.id,
      body.tokenAddress.toLowerCase(),
      body.chainId,
      body.notes,
    );

    return { success: true, item };
  }

  @Delete('watchlist/:tokenAddress')
  @UseGuards(JwtAuthGuard)
  async removeFromWatchlist(
    @Request() req: any,
    @Param('tokenAddress') tokenAddress: string,
    @Query('chainId') chainId: string,
  ) {
    await this.indexerService.removeFromWatchlist(
      req.user.id,
      tokenAddress.toLowerCase(),
      parseInt(chainId) || 11155111,
    );

    return { success: true };
  }

  @Get('trending')
  async getTrendingTokens(
    @Query('chainId') chainId: string,
    @Query('limit') limit?: string,
  ) {
    const tokens = await this.indexerService.getTrendingTokens(
      parseInt(chainId) || 11155111,
      parseInt(limit || '10'),
    );

    return {
      tokens: tokens.map((t) => ({
        tokenAddress: t.tokenAddress,
        chainId: t.chainId,
        currentPrice: t.currentPrice.toString(),
        priceChange24h: parseFloat(t.priceChange24h.toString()),
        volume24h: t.volume24h.toString(),
        trades24h: t.trades24h,
        totalTrades: t.totalTrades,
      })),
    };
  }
}
