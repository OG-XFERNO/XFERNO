import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

export interface RegisterDto {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface WalletLoginDto {
  address: string;
  signature: string;
  message: string;
  networkType: 'EVM' | 'SOLANA' | 'MOVE';
}

export interface JwtPayload {
  sub: string;
  email?: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email?: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    role: UserRole;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user with email/password
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Check if username is taken
    if (data.username) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { username: data.username.toLowerCase() },
      });
      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        username: data.username?.toLowerCase(),
        displayName: data.displayName || data.username,
        role: UserRole.USER,
      },
    });

    // Generate JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email || undefined,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email || undefined,
        username: user.username || undefined,
        displayName: user.displayName || undefined,
        avatarUrl: user.avatarUrl || undefined,
        role: user.role,
      },
    };
  }

  /**
   * Login with email/password
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email || undefined,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email || undefined,
        username: user.username || undefined,
        displayName: user.displayName || undefined,
        avatarUrl: user.avatarUrl || undefined,
        role: user.role,
      },
    };
  }

  /**
   * Login or register with wallet signature
   */
  async walletLogin(data: WalletLoginDto): Promise<AuthResponse> {
    // Verify signature (simplified - in production use ethers/viem)
    const isValidSignature = await this.verifySignature(
      data.address,
      data.signature,
      data.message,
    );

    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Find or create user by wallet
    let wallet = await this.prisma.wallet.findFirst({
      where: {
        address: data.address.toLowerCase(),
        networkType: data.networkType,
      },
      include: { user: true },
    });

    let user;

    if (!wallet) {
      // Create new user with wallet
      user = await this.prisma.user.create({
        data: {
          role: UserRole.USER,
          wallets: {
            create: {
              address: data.address.toLowerCase(),
              networkType: data.networkType,
              isPrimary: true,
            },
          },
        },
      });
    } else {
      user = wallet.user;
      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // Generate JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email || undefined,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email || undefined,
        username: user.username || undefined,
        displayName: user.displayName || undefined,
        avatarUrl: user.avatarUrl || undefined,
        role: user.role,
      },
    };
  }

  /**
   * Validate JWT payload and return user
   */
  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        wallets: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: {
          select: {
            id: true,
            address: true,
            networkType: true,
            isPrimary: true,
          },
        },
        _count: {
          select: {
            createdTokens: true,
            presaleContributions: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role,
      kycStatus: user.kycStatus,
      twoFactorEnabled: user.twoFactorEnabled,
      wallets: user.wallets,
      stats: {
        tokensCreated: user._count.createdTokens,
        tradesCount: user._count.presaleContributions,
      },
      createdAt: user.createdAt,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: { displayName?: string; username?: string; bio?: string; avatarUrl?: string },
  ) {
    if (data.username) {
      const existing = await this.prisma.user.findFirst({
        where: {
          username: data.username.toLowerCase(),
          NOT: { id: userId },
        },
      });
      if (existing) {
        throw new ConflictException('Username already taken');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: data.displayName,
        username: data.username?.toLowerCase(),
        bio: data.bio,
        avatarUrl: data.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
      },
    });
  }

  /**
   * Add wallet to user account
   */
  async addWallet(userId: string, data: { address: string; networkType: 'EVM' | 'SOLANA' | 'MOVE' }) {
    // Check if wallet already linked
    const existing = await this.prisma.wallet.findFirst({
      where: {
        address: data.address.toLowerCase(),
        networkType: data.networkType,
      },
    });

    if (existing) {
      throw new ConflictException('Wallet already linked to an account');
    }

    return this.prisma.wallet.create({
      data: {
        userId,
        address: data.address.toLowerCase(),
        networkType: data.networkType,
      },
    });
  }

  /**
   * Remove wallet from user account
   */
  async removeWallet(userId: string, walletId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    // Ensure user has at least one wallet or email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallets: true },
    });

    if (!user?.email && user?.wallets.length === 1) {
      throw new BadRequestException('Cannot remove last wallet without email');
    }

    return this.prisma.wallet.delete({
      where: { id: walletId },
    });
  }

  /**
   * Verify wallet signature (simplified)
   * In production, use ethers.verifyMessage or viem
   */
  private async verifySignature(
    address: string,
    signature: string,
    message: string,
  ): Promise<boolean> {
    // TODO: Implement proper signature verification
    // For now, accept any signature for development
    return signature.length > 0 && message.includes('XFERNO');
  }
}
