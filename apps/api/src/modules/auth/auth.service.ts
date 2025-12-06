import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserRole, AccountType } from '@prisma/client';

export type AccountTypeValue = 'SOCIAL' | 'TRADER' | 'CREATOR';

export interface RegisterDto {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
  accountType: AccountTypeValue;
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
  accountType?: AccountType;
  emailVerified?: boolean;
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
    accountType?: AccountType;
    emailVerified?: boolean;
    kycStatus?: string;
  };
}

export interface RegisterResponse {
  message: string;
  userId: string;
  email: string;
  requiresVerification: boolean;
  requiresKyc: boolean;
  accountType: AccountType;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly appUrl: string;
  private readonly verificationTokenExpiry = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
  }

  /**
   * Check if account type requires KYC
   */
  requiresKyc(accountType: AccountTypeValue): boolean {
    return accountType === 'TRADER' || accountType === 'CREATOR';
  }

  /**
   * Register a new user with email/password
   * Sends verification email - user cannot login until verified
   */
  async register(data: RegisterDto): Promise<RegisterResponse> {
    // Validate account type
    const validAccountTypes: AccountTypeValue[] = ['SOCIAL', 'TRADER', 'CREATOR'];
    if (!validAccountTypes.includes(data.accountType)) {
      throw new BadRequestException('Invalid account type. Must be SOCIAL, TRADER, or CREATOR');
    }

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

    // Determine role based on account type
    const role = data.accountType === 'CREATOR' ? UserRole.CREATOR : UserRole.USER;

    // Create user (emailVerified defaults to false)
    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        username: data.username?.toLowerCase(),
        displayName: data.displayName || data.username,
        accountType: data.accountType as AccountType,
        role,
        emailVerified: false,
      },
    });

    // Create verification token and send email
    await this.sendVerificationEmail(user.id, user.email!);

    const needsKyc = this.requiresKyc(data.accountType);
    this.logger.log(`New user registered: ${user.email} (${data.accountType}) - verification email sent, KYC required: ${needsKyc}`);

    let message = 'Registration successful! Please check your email to verify your account.';
    if (needsKyc) {
      message += ' You will need to complete KYC verification to access trading features.';
    }

    return {
      message,
      userId: user.id,
      email: user.email!,
      requiresVerification: true,
      requiresKyc: needsKyc,
      accountType: user.accountType,
    };
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.verificationTokenExpiry);

    // Save token to database
    await this.prisma.emailVerification.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    // Build verification URL
    const verificationUrl = `${this.appUrl}/auth/verify-email?token=${token}`;

    // Get user display name
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Send email
    await this.emailService.sendVerificationEmail({
      email,
      displayName: user?.displayName || user?.username || undefined,
      verificationUrl,
      expiresIn: '24 hours',
    });
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If this email is registered, a verification link has been sent.' };
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Invalidate old tokens
    await this.prisma.emailVerification.deleteMany({
      where: { userId: user.id },
    });

    // Send new verification email
    await this.sendVerificationEmail(user.id, user.email!);

    return { message: 'Verification email sent. Please check your inbox.' };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<AuthResponse> {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      throw new BadRequestException('Invalid verification token');
    }

    if (verification.usedAt) {
      throw new BadRequestException('This verification link has already been used');
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('Verification link has expired. Please request a new one.');
    }

    // Mark token as used
    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    });

    // Update user as verified
    const user = await this.prisma.user.update({
      where: { id: verification.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    this.logger.log(`Email verified for user: ${user.email}`);

    // Send welcome email
    await this.emailService.sendWelcomeEmail({
      email: user.email!,
      displayName: user.displayName || user.username || undefined,
    });

    // Generate JWT for auto-login after verification
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email || undefined,
      role: user.role,
      emailVerified: true,
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
        emailVerified: true,
      },
    };
  }

  /**
   * Login with email/password
   * Blocks login if email not verified
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

    // Check if email is verified
    if (!user.emailVerified) {
      throw new ForbiddenException({
        message: 'Please verify your email before logging in',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
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
      emailVerified: true,
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
        emailVerified: true,
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
