import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ========== DASHBOARD STATS ==========

  async getDashboardStats() {
    const [
      totalUsers,
      totalTokens,
      totalTrades,
      activePresales,
      graduatedTokens,
      pendingKyc,
      verifiedKyc,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.token.count(),
      this.prisma.trade.count(),
      this.prisma.token.count({ where: { status: 'PRESALE_ACTIVE' } }),
      this.prisma.token.count({ where: { status: 'LIVE_MULTICHAIN' } }),
      this.prisma.user.count({ where: { kycStatus: 'PENDING' } }),
      this.prisma.user.count({ where: { kycStatus: 'VERIFIED' } }),
    ]);

    // Calculate total volume
    const volumeResult = await this.prisma.trade.aggregate({
      _sum: { ethAmount: true },
    });

    return {
      totalUsers,
      totalTokens,
      totalTrades,
      activePresales,
      graduatedTokens,
      pendingKyc,
      verifiedKyc,
      totalVolume: volumeResult._sum.ethAmount?.toString() || '0',
    };
  }

  // ========== USER MANAGEMENT ==========

  async getUsers(page = 1, limit = 20, filters?: { role?: string; kycStatus?: string; accountType?: string }) {
    // Cap limit at 100 to prevent abuse
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;
    const where: any = {};

    if (filters?.role) where.role = filters.role;
    if (filters?.kycStatus) where.kycStatus = filters.kycStatus;
    if (filters?.accountType) where.accountType = filters.accountType;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          accountType: true,
          kycStatus: true,
          emailVerified: true,
          twoFactorEnabled: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              createdTokens: true,
              wallets: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
        createdTokens: {
          select: {
            id: true,
            name: true,
            symbol: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            presaleContributions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserRole(userId: string, role: 'USER' | 'CREATOR' | 'ADMIN') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Can't change SUPER_ADMIN role
    if (user.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('Cannot modify SUPER_ADMIN role');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  async updateUserKycStatus(userId: string, kycStatus: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus,
        kycVerifiedAt: kycStatus === 'VERIFIED' ? new Date() : null,
      },
    });
  }

  // ========== TOKEN MANAGEMENT ==========

  async getTokens(page = 1, limit = 20, filters?: { status?: string; chainId?: number }) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.chainId) where.chainId = filters.chainId;

    const [tokens, total] = await Promise.all([
      this.prisma.token.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          _count: {
            select: {
              contributions: true,
            },
          },
        },
      }),
      this.prisma.token.count({ where }),
    ]);

    return {
      tokens,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateTokenStatus(tokenId: string, status: string) {
    const token = await this.prisma.token.findUnique({ where: { id: tokenId } });
    if (!token) throw new NotFoundException('Token not found');

    return this.prisma.token.update({
      where: { id: tokenId },
      data: { status: status as any },
    });
  }

  // ========== NETWORK MANAGEMENT ==========

  async getNetworks() {
    return this.prisma.network.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async updateNetwork(networkId: string, data: { isEnabledForBase?: boolean; isEnabledForSplit?: boolean; rpcUrl?: string }) {
    const network = await this.prisma.network.findUnique({ where: { id: networkId } });
    if (!network) throw new NotFoundException('Network not found');

    return this.prisma.network.update({
      where: { id: networkId },
      data,
    });
  }

  // ========== ADMIN LOGS ==========

  async createAdminLog(adminId: string, action: string, targetType: string, targetId: string, details?: any) {
    return this.prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        details,
      },
    });
  }

  async getAdminLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.adminLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adminLog.count(),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
