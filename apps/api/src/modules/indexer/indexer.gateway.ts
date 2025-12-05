import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IndexerService } from './indexer.service';

interface SubscriptionData {
  tokenAddress: string;
  chainId: number;
}

interface TradeEvent {
  id: string;
  tokenAddress: string;
  traderAddress: string;
  tradeType: string;
  ethAmount: string;
  tokenAmount: string;
  pricePerToken: string;
  txHash: string;
  blockNumber: string;
  blockTimestamp: string;
  chainId: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/trading',
})
export class IndexerGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(IndexerGateway.name);
  private subscriptions: Map<string, Set<string>> = new Map(); // tokenAddress -> Set<socketId>

  constructor(private readonly indexerService: IndexerService) {}

  afterInit() {
    this.logger.log('Trading WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
    // Remove from all subscriptions
    for (const [tokenAddress, subscribers] of this.subscriptions) {
      subscribers.delete(client.id);
      if (subscribers.size === 0) {
        this.subscriptions.delete(tokenAddress);
      }
    }
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubscriptionData,
  ) {
    const key = `${data.tokenAddress.toLowerCase()}_${data.chainId}`;
    
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    this.subscriptions.get(key)!.add(client.id);

    // Join room for this token
    client.join(key);

    this.logger.debug(`Client ${client.id} subscribed to ${key}`);

    return { success: true, subscribed: key };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubscriptionData,
  ) {
    const key = `${data.tokenAddress.toLowerCase()}_${data.chainId}`;
    
    this.subscriptions.get(key)?.delete(client.id);
    client.leave(key);

    this.logger.debug(`Client ${client.id} unsubscribed from ${key}`);

    return { success: true, unsubscribed: key };
  }

  @SubscribeMessage('getRecentTrades')
  async handleGetRecentTrades(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubscriptionData & { limit?: number },
  ) {
    const trades = await this.indexerService.getRecentTrades(
      data.tokenAddress,
      data.chainId,
      data.limit || 50,
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

  // Listen for new trades from indexer and broadcast to subscribers
  @OnEvent('trade.new')
  handleNewTrade(trade: TradeEvent) {
    const key = `${trade.tokenAddress.toLowerCase()}_${trade.chainId}`;
    
    // Broadcast to all subscribers of this token
    this.server.to(key).emit('trade', {
      id: trade.id,
      tokenAddress: trade.tokenAddress,
      traderAddress: trade.traderAddress,
      tradeType: trade.tradeType,
      ethAmount: trade.ethAmount,
      tokenAmount: trade.tokenAmount,
      pricePerToken: trade.pricePerToken,
      txHash: trade.txHash,
      blockTimestamp: trade.blockTimestamp,
    });

    this.logger.debug(`Broadcasted trade to ${key}`);
  }
}
