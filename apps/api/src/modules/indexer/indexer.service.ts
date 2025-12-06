import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TradeType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  createPublicClient,
  http,
  webSocket,
  parseAbiItem,
  formatEther,
  type Log,
  type PublicClient,
  type WatchEventReturnType,
} from 'viem';
import { sepolia, mainnet } from 'viem/chains';
import { EventEmitter2 } from '@nestjs/event-emitter';

// BondingCurve events
const TOKENS_BOUGHT_EVENT = parseAbiItem(
  'event TokensBought(address indexed buyer, address indexed token, uint256 ethAmount, uint256 tokenAmount, uint256 newPrice)'
);
const TOKENS_SOLD_EVENT = parseAbiItem(
  'event TokensSold(address indexed seller, address indexed token, uint256 tokenAmount, uint256 ethAmount, uint256 newPrice)'
);
const TOKEN_GRADUATED_EVENT = parseAbiItem(
  'event TokenGraduated(address indexed token, address indexed dexPool, uint256 ethLiquidity, uint256 tokenLiquidity)'
);

// Contract addresses by chain - V2
const CONTRACTS: Record<number, { bondingCurve: `0x${string}` }> = {
  11155111: {
    bondingCurve: '0x66C9032Cc141Ce85d5f5D497e452c646548dEd2F',
  },
};

// Candle intervals in milliseconds
const CANDLE_INTERVALS: Record<string, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
};

interface TradeEvent {
  tokenAddress: string;
  traderAddress: string;
  tradeType: TradeType;
  ethAmount: bigint;
  tokenAmount: bigint;
  newPrice: bigint;
  txHash: string;
  blockNumber: bigint;
  blockTimestamp: Date;
  logIndex: number;
  chainId: number;
}

@Injectable()
export class IndexerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndexerService.name);
  private clients: Map<number, PublicClient> = new Map();
  private watchers: Map<number, WatchEventReturnType> = new Map();
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing blockchain indexer...');
    await this.initializeClients();
    await this.startIndexing();
  }

  async onModuleDestroy() {
    this.logger.log('Stopping blockchain indexer...');
    await this.stopIndexing();
  }

  private async initializeClients() {
    // Initialize Sepolia client
    const sepoliaRpcUrl = this.config.get<string>('SEPOLIA_RPC_URL');
    const sepoliaWsUrl = this.config.get<string>('SEPOLIA_WS_URL');

    this.logger.log(`SEPOLIA_RPC_URL: ${sepoliaRpcUrl ? 'configured' : 'NOT SET!'}`);
    this.logger.log(`SEPOLIA_WS_URL: ${sepoliaWsUrl ? 'configured' : 'not set'}`);

    if (sepoliaRpcUrl) {
      try {
        const transport = sepoliaWsUrl ? webSocket(sepoliaWsUrl) : http(sepoliaRpcUrl);
        const client = createPublicClient({
          chain: sepolia,
          transport,
        });
        
        // Test connection
        const blockNumber = await client.getBlockNumber();
        this.logger.log(`✅ Sepolia connected! Current block: ${blockNumber}`);
        
        this.clients.set(11155111, client);
        this.logger.log(`Watching BondingCurve at: ${CONTRACTS[11155111].bondingCurve}`);
      } catch (error) {
        this.logger.error(`❌ Failed to connect to Sepolia: ${error}`);
      }
    } else {
      this.logger.warn('⚠️ SEPOLIA_RPC_URL not configured - indexer will not run!');
    }
  }

  async startIndexing() {
    if (this.isRunning) {
      this.logger.warn('Indexer is already running');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting event indexing...');

    for (const [chainId, client] of this.clients) {
      const contracts = CONTRACTS[chainId];
      if (!contracts) continue;

      // Get or create indexer state
      let state = await this.prisma.indexerState.findUnique({
        where: { chainId },
      });

      if (!state) {
        const currentBlock = await client.getBlockNumber();
        state = await this.prisma.indexerState.create({
          data: {
            chainId,
            lastBlockNumber: currentBlock - BigInt(1000), // Start from 1000 blocks back
            isRunning: true,
          },
        });
      }

      // Backfill historical events
      await this.backfillEvents(chainId, client, contracts.bondingCurve, state.lastBlockNumber);

      // Watch for new events
      this.watchEvents(chainId, client, contracts.bondingCurve);
    }
  }

  async stopIndexing() {
    this.isRunning = false;

    // Unwatch all events
    for (const [chainId, unwatch] of this.watchers) {
      unwatch();
      this.logger.log(`Stopped watching events for chain ${chainId}`);
    }
    this.watchers.clear();

    // Update state
    for (const chainId of this.clients.keys()) {
      await this.prisma.indexerState.update({
        where: { chainId },
        data: { isRunning: false },
      });
    }
  }

  private async backfillEvents(
    chainId: number,
    client: PublicClient,
    bondingCurve: `0x${string}`,
    fromBlock: bigint,
  ) {
    const currentBlock = await client.getBlockNumber();
    const batchSize = BigInt(2000);

    this.logger.log(`Backfilling events from block ${fromBlock} to ${currentBlock}`);

    for (let start = fromBlock; start < currentBlock; start += batchSize) {
      const end = start + batchSize > currentBlock ? currentBlock : start + batchSize;

      try {
        // Fetch buy events
        const buyLogs = await client.getLogs({
          address: bondingCurve,
          event: TOKENS_BOUGHT_EVENT,
          fromBlock: start,
          toBlock: end,
        });

        // Fetch sell events
        const sellLogs = await client.getLogs({
          address: bondingCurve,
          event: TOKENS_SOLD_EVENT,
          fromBlock: start,
          toBlock: end,
        });

        // Process events
        for (const log of buyLogs) {
          await this.processBuyEvent(chainId, client, log);
        }

        for (const log of sellLogs) {
          await this.processSellEvent(chainId, client, log);
        }

        // Update indexer state
        await this.prisma.indexerState.update({
          where: { chainId },
          data: { lastBlockNumber: end },
        });

        this.logger.log(
          `Blocks ${start}-${end}: ${buyLogs.length} buys, ${sellLogs.length} sells`,
        );
      } catch (error) {
        this.logger.error(`Error backfilling blocks ${start}-${end}:`, error);
        await this.prisma.indexerState.update({
          where: { chainId },
          data: { lastError: String(error) },
        });
      }
    }

    this.logger.log(`Backfill complete for chain ${chainId}`);
  }

  private watchEvents(chainId: number, client: PublicClient, bondingCurve: `0x${string}`) {
    // Watch buy events
    const unwatchBuy = client.watchEvent({
      address: bondingCurve,
      event: TOKENS_BOUGHT_EVENT,
      onLogs: async (logs) => {
        for (const log of logs) {
          await this.processBuyEvent(chainId, client, log);
        }
      },
    });

    // Watch sell events
    const unwatchSell = client.watchEvent({
      address: bondingCurve,
      event: TOKENS_SOLD_EVENT,
      onLogs: async (logs) => {
        for (const log of logs) {
          await this.processSellEvent(chainId, client, log);
        }
      },
    });

    // Store combined unwatch function
    this.watchers.set(chainId, () => {
      unwatchBuy();
      unwatchSell();
    });

    this.logger.log(`Watching events for chain ${chainId}`);
  }

  private async processBuyEvent(chainId: number, client: PublicClient, log: any) {
    if (!log.args?.buyer || !log.args?.token) return;

    const block = await client.getBlock({ blockNumber: log.blockNumber! });
    
    const trade: TradeEvent = {
      tokenAddress: log.args.token.toLowerCase(),
      traderAddress: log.args.buyer.toLowerCase(),
      tradeType: TradeType.BUY,
      ethAmount: log.args.ethAmount!,
      tokenAmount: log.args.tokenAmount!,
      newPrice: log.args.newPrice!,
      txHash: log.transactionHash!,
      blockNumber: log.blockNumber!,
      blockTimestamp: new Date(Number(block.timestamp) * 1000),
      logIndex: log.logIndex!,
      chainId,
    };

    await this.saveTrade(trade);
  }

  private async processSellEvent(chainId: number, client: PublicClient, log: any) {
    if (!log.args?.seller || !log.args?.token) return;

    const block = await client.getBlock({ blockNumber: log.blockNumber! });
    
    const trade: TradeEvent = {
      tokenAddress: log.args.token.toLowerCase(),
      traderAddress: log.args.seller.toLowerCase(),
      tradeType: TradeType.SELL,
      ethAmount: log.args.ethAmount!,
      tokenAmount: log.args.tokenAmount!,
      newPrice: log.args.newPrice!,
      txHash: log.transactionHash!,
      blockNumber: log.blockNumber!,
      blockTimestamp: new Date(Number(block.timestamp) * 1000),
      logIndex: log.logIndex!,
      chainId,
    };

    await this.saveTrade(trade);
  }

  private async saveTrade(trade: TradeEvent) {
    try {
      // Calculate price per token
      const pricePerToken = trade.tokenAmount > 0n
        ? new Decimal(trade.ethAmount.toString()).div(new Decimal(trade.tokenAmount.toString()))
        : new Decimal(0);

      // Save trade
      const savedTrade = await this.prisma.trade.upsert({
        where: { txHash: trade.txHash },
        create: {
          tokenAddress: trade.tokenAddress,
          traderAddress: trade.traderAddress,
          tradeType: trade.tradeType,
          ethAmount: new Decimal(trade.ethAmount.toString()),
          tokenAmount: new Decimal(trade.tokenAmount.toString()),
          pricePerToken,
          txHash: trade.txHash,
          blockNumber: trade.blockNumber,
          blockTimestamp: trade.blockTimestamp,
          logIndex: trade.logIndex,
          chainId: trade.chainId,
        },
        update: {}, // Don't update if exists
      });

      // Update candles for all intervals
      await this.updateCandles(trade, pricePerToken);

      // Update token stats
      await this.updateTokenStats(trade, pricePerToken);

      // Emit event for WebSocket
      this.eventEmitter.emit('trade.new', {
        ...savedTrade,
        ethAmount: savedTrade.ethAmount.toString(),
        tokenAmount: savedTrade.tokenAmount.toString(),
        pricePerToken: savedTrade.pricePerToken.toString(),
      });

      this.logger.debug(`Saved ${trade.tradeType} trade: ${trade.txHash}`);
    } catch (error) {
      if ((error as any).code !== 'P2002') {
        // Ignore unique constraint violations (duplicate)
        this.logger.error(`Error saving trade ${trade.txHash}:`, error);
      }
    }
  }

  private async updateCandles(trade: TradeEvent, pricePerToken: Decimal) {
    const price = pricePerToken;
    const volume = new Decimal(trade.ethAmount.toString());

    for (const [interval, ms] of Object.entries(CANDLE_INTERVALS)) {
      const openTime = new Date(Math.floor(trade.blockTimestamp.getTime() / ms) * ms);
      const closeTime = new Date(openTime.getTime() + ms);

      await this.prisma.priceCandle.upsert({
        where: {
          tokenAddress_chainId_interval_openTime: {
            tokenAddress: trade.tokenAddress,
            chainId: trade.chainId,
            interval,
            openTime,
          },
        },
        create: {
          tokenAddress: trade.tokenAddress,
          chainId: trade.chainId,
          interval,
          openTime,
          closeTime,
          open: price,
          high: price,
          low: price,
          close: price,
          volume,
          tradeCount: 1,
        },
        update: {
          high: { set: price }, // Will use raw SQL for MAX
          low: { set: price },  // Will use raw SQL for MIN
          close: price,
          volume: { increment: volume },
          tradeCount: { increment: 1 },
        },
      });

      // Fix high/low with raw query
      await this.prisma.$executeRaw`
        UPDATE "PriceCandle"
        SET 
          high = GREATEST(high, ${price}),
          low = LEAST(low, ${price})
        WHERE 
          "tokenAddress" = ${trade.tokenAddress}
          AND "chainId" = ${trade.chainId}
          AND interval = ${interval}
          AND "openTime" = ${openTime}
      `;
    }
  }

  private async updateTokenStats(trade: TradeEvent, pricePerToken: Decimal) {
    const volume = new Decimal(trade.ethAmount.toString());
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get 24h stats
    const stats24h = await this.prisma.trade.aggregate({
      where: {
        tokenAddress: trade.tokenAddress,
        chainId: trade.chainId,
        blockTimestamp: { gte: dayAgo },
      },
      _sum: { ethAmount: true },
      _count: true,
    });

    // Get price from 24h ago for change calculation
    const oldTrade = await this.prisma.trade.findFirst({
      where: {
        tokenAddress: trade.tokenAddress,
        chainId: trade.chainId,
        blockTimestamp: { lte: dayAgo },
      },
      orderBy: { blockTimestamp: 'desc' },
    });

    const priceChange24h = oldTrade
      ? pricePerToken.sub(oldTrade.pricePerToken).div(oldTrade.pricePerToken).mul(100)
      : new Decimal(0);

    await this.prisma.tokenStats.upsert({
      where: {
        tokenAddress_chainId: {
          tokenAddress: trade.tokenAddress,
          chainId: trade.chainId,
        },
      },
      create: {
        tokenAddress: trade.tokenAddress,
        chainId: trade.chainId,
        currentPrice: pricePerToken,
        priceChange24h,
        volume24h: stats24h._sum.ethAmount || new Decimal(0),
        trades24h: stats24h._count,
        totalVolume: volume,
        totalTrades: 1,
        allTimeHigh: pricePerToken,
        allTimeLow: pricePerToken,
      },
      update: {
        currentPrice: pricePerToken,
        priceChange24h,
        volume24h: stats24h._sum.ethAmount || new Decimal(0),
        trades24h: stats24h._count,
        totalVolume: { increment: volume },
        totalTrades: { increment: 1 },
      },
    });

    // Update ATH/ATL
    await this.prisma.$executeRaw`
      UPDATE "TokenStats"
      SET 
        "allTimeHigh" = GREATEST("allTimeHigh", ${pricePerToken}),
        "allTimeLow" = LEAST("allTimeLow", ${pricePerToken})
      WHERE 
        "tokenAddress" = ${trade.tokenAddress}
        AND "chainId" = ${trade.chainId}
    `;
  }

  // Public methods for querying indexed data

  async getRecentTrades(tokenAddress: string, chainId: number, limit = 50) {
    return this.prisma.trade.findMany({
      where: {
        tokenAddress: tokenAddress.toLowerCase(),
        chainId,
      },
      orderBy: { blockTimestamp: 'desc' },
      take: limit,
    });
  }

  async getPriceCandles(
    tokenAddress: string,
    chainId: number,
    interval: string,
    from: Date,
    to: Date,
  ) {
    return this.prisma.priceCandle.findMany({
      where: {
        tokenAddress: tokenAddress.toLowerCase(),
        chainId,
        interval,
        openTime: { gte: from, lte: to },
      },
      orderBy: { openTime: 'asc' },
    });
  }

  async getTokenStats(tokenAddress: string, chainId: number) {
    return this.prisma.tokenStats.findUnique({
      where: {
        tokenAddress_chainId: {
          tokenAddress: tokenAddress.toLowerCase(),
          chainId,
        },
      },
    });
  }

  async getIndexerStatus() {
    const states = await this.prisma.indexerState.findMany();
    return {
      isRunning: this.isRunning,
      chains: states.map((s) => ({
        chainId: s.chainId,
        lastBlockNumber: s.lastBlockNumber.toString(),
        isRunning: s.isRunning,
        lastError: s.lastError,
        updatedAt: s.updatedAt,
      })),
    };
  }

  // ========== USER-SPECIFIC QUERIES ==========

  async getUserTrades(walletAddresses: string[], chainId: number, limit = 50) {
    return this.prisma.trade.findMany({
      where: {
        traderAddress: { in: walletAddresses.map(a => a.toLowerCase()) },
        chainId,
      },
      orderBy: { blockTimestamp: 'desc' },
      take: limit,
    });
  }

  async getWatchlist(userId: string, chainId: number) {
    return this.prisma.watchlist.findMany({
      where: { userId, chainId },
      orderBy: { addedAt: 'desc' },
    });
  }

  async addToWatchlist(userId: string, tokenAddress: string, chainId: number, notes?: string) {
    return this.prisma.watchlist.upsert({
      where: {
        userId_tokenAddress_chainId: { userId, tokenAddress, chainId },
      },
      create: { userId, tokenAddress, chainId, notes },
      update: { notes },
    });
  }

  async removeFromWatchlist(userId: string, tokenAddress: string, chainId: number) {
    return this.prisma.watchlist.deleteMany({
      where: { userId, tokenAddress, chainId },
    });
  }

  async getTrendingTokens(chainId: number, limit = 10) {
    return this.prisma.tokenStats.findMany({
      where: { chainId },
      orderBy: [
        { volume24h: 'desc' },
        { trades24h: 'desc' },
      ],
      take: limit,
    });
  }
}
