import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TradingService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: Implement trading methods
  async buy(tokenId: string, amount: string, userAddress: string) {
    return null;
  }

  async sell(tokenId: string, amount: string, userAddress: string) {
    return null;
  }

  async getPrice(tokenId: string) {
    return null;
  }

  async getQuote(tokenId: string, amount: string, side: 'buy' | 'sell') {
    return null;
  }
}
