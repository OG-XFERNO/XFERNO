import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface TradeRecordDto {
  tokenId: string;
  userId: string;
  networkId: string;
  amount: string;
  tokensReceived: string;
  priceAtPurchase: string;
  txHash: string;
}

export interface TradeQuote {
  tokenId: string;
  side: 'buy' | 'sell';
  inputAmount: string;
  outputAmount: string;
  pricePerToken: string;
  priceImpact: number;
  fee: string;
  slippage: number;
}

export interface TradeHistoryFilter {
  tokenId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class TradingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a buy transaction (called after on-chain tx succeeds)
   */
  async recordBuy(data: TradeRecordDto) {
    const token = await this.prisma.token.findUnique({
      where: { id: data.tokenId },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    if (token.status !== TokenStatus.PRESALE_ACTIVE) {
      throw new BadRequestException('Token is not in presale');
    }

    // Record the contribution
    const contribution = await this.prisma.presaleContribution.create({
      data: {
        tokenId: data.tokenId,
        userId: data.userId,
        networkId: data.networkId,
        amount: new Decimal(data.amount),
        tokensReceived: new Decimal(data.tokensReceived),
        priceAtPurchase: new Decimal(data.priceAtPurchase),
        txHash: data.txHash,
      },
      include: {
        token: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        network: true,
      },
    });

    // Update token raised amount
    const newRaisedAmount = token.raisedAmount.add(new Decimal(data.amount));
    
    await this.prisma.token.update({
      where: { id: data.tokenId },
      data: {
        raisedAmount: newRaisedAmount,
        // Check if graduation target reached
        status: newRaisedAmount.gte(token.graduationTarget)
          ? TokenStatus.GRADUATION_PENDING
          : TokenStatus.PRESALE_ACTIVE,
      },
    });

    return contribution;
  }

  /**
   * Record a sell transaction
   */
  async recordSell(data: TradeRecordDto) {
    const token = await this.prisma.token.findUnique({
      where: { id: data.tokenId },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    if (token.status !== TokenStatus.PRESALE_ACTIVE) {
      throw new BadRequestException('Token is not in presale');
    }

    // Record as negative contribution (sell)
    const contribution = await this.prisma.presaleContribution.create({
      data: {
        tokenId: data.tokenId,
        userId: data.userId,
        networkId: data.networkId,
        amount: new Decimal(data.amount).negated(), // Negative for sells
        tokensReceived: new Decimal(data.tokensReceived).negated(),
        priceAtPurchase: new Decimal(data.priceAtPurchase),
        txHash: data.txHash,
      },
      include: {
        token: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        network: true,
      },
    });

    // Update token raised amount
    await this.prisma.token.update({
      where: { id: data.tokenId },
      data: {
        raisedAmount: token.raisedAmount.sub(new Decimal(data.amount).abs()),
      },
    });

    return contribution;
  }

  /**
   * Get current price for a token (from bonding curve)
   * Note: This is a simplified calculation - actual price comes from smart contract
   */
  async getPrice(tokenId: string) {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
      include: {
        baseChain: true,
      },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    // Calculate current supply sold
    const totalContributions = await this.prisma.presaleContribution.aggregate({
      where: { tokenId },
      _sum: {
        tokensReceived: true,
      },
    });

    const currentSupply = totalContributions._sum.tokensReceived || new Decimal(0);
    
    // Simple linear bonding curve price calculation
    // price = initialPrice + (currentSupply * priceMultiplier)
    const initialPrice = token.initialPrice || new Decimal('0.000001');
    const multiplier = token.priceMultiplier || new Decimal('0.000001');
    
    const currentPrice = initialPrice.add(currentSupply.mul(multiplier));

    return {
      tokenId,
      currentPrice: currentPrice.toString(),
      currentSupply: currentSupply.toString(),
      raisedAmount: token.raisedAmount.toString(),
      graduationTarget: token.graduationTarget.toString(),
      graduationProgress: token.raisedAmount
        .div(token.graduationTarget)
        .mul(100)
        .toFixed(2),
      bondingCurveType: token.bondingCurveType,
    };
  }

  /**
   * Get a quote for buying/selling tokens
   */
  async getQuote(
    tokenId: string,
    amount: string,
    side: 'buy' | 'sell',
    slippage = 0.5
  ): Promise<TradeQuote> {
    const priceInfo = await this.getPrice(tokenId);
    const inputAmount = new Decimal(amount);
    const currentPrice = new Decimal(priceInfo.currentPrice);

    let outputAmount: Decimal;
    let priceImpact: number;
    const feeRate = 0.01; // 1% fee

    if (side === 'buy') {
      // Calculate tokens received for ETH input
      // Simplified: tokens = ethAmount / currentPrice
      const grossOutput = inputAmount.div(currentPrice);
      const fee = grossOutput.mul(feeRate);
      outputAmount = grossOutput.sub(fee);
      
      // Price impact (simplified)
      priceImpact = inputAmount.div(new Decimal(priceInfo.raisedAmount).add(inputAmount)).mul(100).toNumber();
    } else {
      // Calculate ETH received for token input
      const grossOutput = inputAmount.mul(currentPrice);
      const fee = grossOutput.mul(feeRate);
      outputAmount = grossOutput.sub(fee);
      
      // Price impact
      const totalValue = new Decimal(priceInfo.raisedAmount);
      priceImpact = outputAmount.div(totalValue.add(1)).mul(100).toNumber();
    }

    return {
      tokenId,
      side,
      inputAmount: inputAmount.toString(),
      outputAmount: outputAmount.toString(),
      pricePerToken: currentPrice.toString(),
      priceImpact: Math.min(priceImpact, 100),
      fee: outputAmount.mul(feeRate).toString(),
      slippage,
    };
  }

  /**
   * Get trade history for a token or user
   */
  async getTradeHistory(filters: TradeHistoryFilter = {}) {
    const { tokenId, userId, page = 1, limit = 50 } = filters;

    const where: any = {};
    if (tokenId) where.tokenId = tokenId;
    if (userId) where.userId = userId;

    const [trades, total] = await Promise.all([
      this.prisma.presaleContribution.findMany({
        where,
        include: {
          token: {
            select: {
              id: true,
              name: true,
              symbol: true,
              imageUrl: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          network: {
            select: {
              id: true,
              name: true,
              symbol: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.presaleContribution.count({ where }),
    ]);

    return {
      trades: trades.map((trade) => ({
        ...trade,
        side: trade.amount.isPositive() ? 'buy' : 'sell',
        amount: trade.amount.abs().toString(),
        tokensReceived: trade.tokensReceived.abs().toString(),
        priceAtPurchase: trade.priceAtPurchase.toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user's holdings for a specific token
   */
  async getUserHoldings(userId: string, tokenId: string) {
    const contributions = await this.prisma.presaleContribution.findMany({
      where: { userId, tokenId },
    });

    const totalTokens = contributions.reduce(
      (sum, c) => sum.add(c.tokensReceived),
      new Decimal(0)
    );

    const totalInvested = contributions.reduce(
      (sum, c) => sum.add(c.amount),
      new Decimal(0)
    );

    const avgPrice = totalTokens.isZero()
      ? new Decimal(0)
      : totalInvested.div(totalTokens);

    return {
      tokenId,
      userId,
      totalTokens: totalTokens.toString(),
      totalInvested: totalInvested.toString(),
      averagePrice: avgPrice.toString(),
      tradeCount: contributions.length,
    };
  }

  /**
   * Get top traders for a token
   */
  async getTopTraders(tokenId: string, limit = 10) {
    const traders = await this.prisma.presaleContribution.groupBy({
      by: ['userId'],
      where: { tokenId },
      _sum: {
        tokensReceived: true,
        amount: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: limit,
    });

    // Get user details
    const userIds = traders.map((t) => t.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return traders.map((trader) => ({
      user: userMap.get(trader.userId),
      totalInvested: trader._sum.amount?.toString() || '0',
      totalTokens: trader._sum.tokensReceived?.toString() || '0',
      tradeCount: trader._count,
    }));
  }
}
