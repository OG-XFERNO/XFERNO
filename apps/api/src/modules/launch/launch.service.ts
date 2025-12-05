import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenStatus, LaunchMode, BondingCurveType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateTokenDto {
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  launchMode: LaunchMode;
  baseChainId: string;
  splitNetworkIds?: string[];
  totalSupply: string;
  decimals?: number;
  graduationTarget: string;
  graduationAsset?: string;
  bondingCurveType?: BondingCurveType;
  initialPrice?: string;
  priceMultiplier?: number;
  maxPresaleSupply?: string;
  websiteUrl?: string;
  twitterUrl?: string;
  discordUrl?: string;
  telegramUrl?: string;
}

export interface ListTokensDto {
  status?: TokenStatus;
  creatorId?: string;
  launchMode?: LaunchMode;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'raisedAmount' | 'name';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class LaunchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new token
   */
  async createToken(creatorId: string, data: CreateTokenDto) {
    // Validate base chain exists
    const baseChain = await this.prisma.network.findUnique({
      where: { id: data.baseChainId },
    });

    if (!baseChain) {
      throw new BadRequestException('Invalid base chain');
    }

    if (!baseChain.isEnabledForBase) {
      throw new BadRequestException('Selected network cannot be used as base chain');
    }

    // Validate split networks if provided
    if (data.splitNetworkIds?.length) {
      const splitNetworks = await this.prisma.network.findMany({
        where: {
          id: { in: data.splitNetworkIds },
          isEnabledForSplit: true,
        },
      });

      if (splitNetworks.length !== data.splitNetworkIds.length) {
        throw new BadRequestException('One or more split networks are invalid');
      }
    }

    // Create token
    const token = await this.prisma.token.create({
      data: {
        name: data.name,
        symbol: data.symbol.toUpperCase(),
        description: data.description,
        imageUrl: data.imageUrl,
        launchMode: data.launchMode,
        baseChainId: data.baseChainId,
        splitNetworkIds: data.splitNetworkIds || [],
        totalSupply: new Decimal(data.totalSupply),
        decimals: data.decimals || 18,
        graduationTarget: new Decimal(data.graduationTarget),
        graduationAsset: data.graduationAsset || 'ETH',
        bondingCurveType: data.bondingCurveType || BondingCurveType.LINEAR,
        initialPrice: data.initialPrice ? new Decimal(data.initialPrice) : null,
        priceMultiplier: data.priceMultiplier ? new Decimal(data.priceMultiplier) : null,
        maxPresaleSupply: data.maxPresaleSupply ? new Decimal(data.maxPresaleSupply) : null,
        status: TokenStatus.DRAFT,
        creatorId,
        websiteUrl: data.websiteUrl,
        twitterUrl: data.twitterUrl,
        discordUrl: data.discordUrl,
        telegramUrl: data.telegramUrl,
      },
      include: {
        baseChain: true,
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return token;
  }

  /**
   * Get token by ID
   */
  async getToken(id: string) {
    const token = await this.prisma.token.findUnique({
      where: { id },
      include: {
        baseChain: true,
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        deployments: {
          include: {
            network: true,
          },
        },
        _count: {
          select: {
            contributions: true,
          },
        },
      },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    return token;
  }

  /**
   * List tokens with filters and pagination
   */
  async listTokens(filters: ListTokensDto = {}) {
    const {
      status,
      creatorId,
      launchMode,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (creatorId) {
      where.creatorId = creatorId;
    }

    if (launchMode) {
      where.launchMode = launchMode;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { symbol: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tokens, total] = await Promise.all([
      this.prisma.token.findMany({
        where,
        include: {
          baseChain: true,
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              contributions: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.token.count({ where }),
    ]);

    return {
      tokens,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update token (only allowed in DRAFT status)
   */
  async updateToken(id: string, creatorId: string, data: Partial<CreateTokenDto>) {
    const token = await this.prisma.token.findUnique({
      where: { id },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    if (token.creatorId !== creatorId) {
      throw new BadRequestException('Not authorized to update this token');
    }

    if (token.status !== TokenStatus.DRAFT) {
      throw new BadRequestException('Can only update tokens in DRAFT status');
    }

    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.symbol) updateData.symbol = data.symbol.toUpperCase();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;
    if (data.twitterUrl !== undefined) updateData.twitterUrl = data.twitterUrl;
    if (data.discordUrl !== undefined) updateData.discordUrl = data.discordUrl;
    if (data.telegramUrl !== undefined) updateData.telegramUrl = data.telegramUrl;

    return this.prisma.token.update({
      where: { id },
      data: updateData,
      include: {
        baseChain: true,
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Start presale for a token
   */
  async startPresale(tokenId: string, creatorId: string) {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    if (token.creatorId !== creatorId) {
      throw new BadRequestException('Not authorized to start presale');
    }

    if (token.status !== TokenStatus.DRAFT) {
      throw new BadRequestException('Presale can only be started from DRAFT status');
    }

    // Update token status to presale active
    const updatedToken = await this.prisma.token.update({
      where: { id: tokenId },
      data: {
        status: TokenStatus.PRESALE_ACTIVE,
        presaleStartedAt: new Date(),
      },
      include: {
        baseChain: true,
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updatedToken;
  }

  /**
   * Get tokens by creator
   */
  async getTokensByCreator(creatorId: string) {
    return this.prisma.token.findMany({
      where: { creatorId },
      include: {
        baseChain: true,
        _count: {
          select: {
            contributions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get active presale tokens
   */
  async getActivePresales() {
    return this.prisma.token.findMany({
      where: {
        status: TokenStatus.PRESALE_ACTIVE,
      },
      include: {
        baseChain: true,
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            contributions: true,
          },
        },
      },
      orderBy: { presaleStartedAt: 'desc' },
    });
  }

  /**
   * Get recently graduated tokens
   */
  async getGraduatedTokens(limit = 10) {
    return this.prisma.token.findMany({
      where: {
        status: TokenStatus.LIVE_MULTICHAIN,
      },
      include: {
        baseChain: true,
        deployments: {
          include: {
            network: true,
          },
        },
      },
      orderBy: { graduatedAt: 'desc' },
      take: limit,
    });
  }
}
