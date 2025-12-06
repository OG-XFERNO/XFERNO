import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { KYCStatus, UserRole } from '@prisma/client';

export interface SubmitKycDto {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  documentType: 'passport' | 'driver_license' | 'id_card';
  documentCountry: string;
}

export interface AdminReviewDto {
  approved: boolean;
  rejectionReason?: string;
}

// Didit KYC types
export interface DiditSession {
  sessionId: string;
  sessionUrl: string;
  expiresAt: string;
}

export interface DiditWebhookPayload {
  sessionId: string;
  status: 'approved' | 'rejected' | 'pending';
  userId?: string;
  reason?: string;
  verificationData?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    documentType?: string;
    documentCountry?: string;
  };
}

@Injectable()
export class KycService {
  private readonly diditAppId: string;
  private readonly diditApiKey: string;
  private readonly diditApiUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.diditAppId = this.configService.get<string>('DIDIT_APP_ID', '');
    this.diditApiKey = this.configService.get<string>('DIDIT_API_KEY', '');
    this.diditApiUrl = this.configService.get<string>('DIDIT_API_URL', 'https://apx.didit.me/v2');
  }

  /**
   * Check if Didit is configured
   */
  isDiditConfigured(): boolean {
    return !!this.diditAppId && !!this.diditApiKey;
  }

  /**
   * Create a Didit KYC session for a user
   */
  async createDiditSession(userId: string): Promise<DiditSession> {
    if (!this.isDiditConfigured()) {
      throw new BadRequestException('Didit KYC is not configured. Using manual verification.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // TODO: Implement actual Didit API call
    // This is a placeholder for the Didit session creation
    // In production, you would:
    // 1. Call Didit API to create a session
    // 2. Store the session ID in KycVerification
    // 3. Return the session URL for the user to complete KYC

    throw new BadRequestException(
      'Didit integration pending. Please configure DIDIT_CLIENT_ID and DIDIT_CLIENT_SECRET environment variables, ' +
      'then implement the Didit API integration. For now, use manual KYC verification.'
    );
  }

  /**
   * Handle Didit webhook callback
   */
  async handleDiditWebhook(payload: DiditWebhookPayload): Promise<void> {
    if (!this.isDiditConfigured()) {
      throw new BadRequestException('Didit KYC is not configured');
    }

    // Find the verification by Didit session ID
    const verification = await this.prisma.kycVerification.findFirst({
      where: { externalId: payload.sessionId, provider: 'didit' },
    });

    if (!verification) {
      throw new NotFoundException('Verification session not found');
    }

    const newStatus = payload.status === 'approved' 
      ? KYCStatus.VERIFIED 
      : payload.status === 'rejected'
        ? KYCStatus.REJECTED
        : KYCStatus.PENDING;

    // Update verification record
    await this.prisma.kycVerification.update({
      where: { id: verification.id },
      data: {
        status: newStatus,
        rejectionReason: payload.reason,
        firstName: payload.verificationData?.firstName,
        lastName: payload.verificationData?.lastName,
        dateOfBirth: payload.verificationData?.dateOfBirth 
          ? new Date(payload.verificationData.dateOfBirth) 
          : undefined,
        documentType: payload.verificationData?.documentType,
        documentCountry: payload.verificationData?.documentCountry,
        verifiedAt: newStatus === KYCStatus.VERIFIED ? new Date() : null,
      },
    });

    // Update user's KYC status
    await this.prisma.user.update({
      where: { id: verification.userId },
      data: {
        kycStatus: newStatus,
        kycVerifiedAt: newStatus === KYCStatus.VERIFIED ? new Date() : null,
        role: newStatus === KYCStatus.VERIFIED ? UserRole.CREATOR : undefined,
      },
    });
  }

  /**
   * Get user's KYC status and verification history
   */
  async getKycStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        kycStatus: true,
        kycVerifiedAt: true,
        kycVerifications: {
          orderBy: { submittedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            status: true,
            documentType: true,
            documentCountry: true,
            rejectionReason: true,
            submittedAt: true,
            verifiedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      status: user.kycStatus,
      verifiedAt: user.kycVerifiedAt,
      verifications: user.kycVerifications,
    };
  }

  /**
   * Submit KYC verification request
   */
  async submitKyc(userId: string, data: SubmitKycDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already verified
    if (user.kycStatus === KYCStatus.VERIFIED) {
      throw new BadRequestException('KYC already verified');
    }

    // Check if there's a pending verification
    const pending = await this.prisma.kycVerification.findFirst({
      where: {
        userId,
        status: KYCStatus.PENDING,
      },
    });

    if (pending) {
      throw new BadRequestException('You already have a pending KYC verification');
    }

    // Create verification record
    const verification = await this.prisma.kycVerification.create({
      data: {
        userId,
        provider: 'manual',
        status: KYCStatus.PENDING,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        documentType: data.documentType,
        documentCountry: data.documentCountry,
      },
    });

    // Update user's KYC status to pending
    await this.prisma.user.update({
      where: { id: userId },
      data: { kycStatus: KYCStatus.PENDING },
    });

    return {
      message: 'KYC verification submitted successfully',
      verificationId: verification.id,
      status: KYCStatus.PENDING,
    };
  }

  /**
   * Admin: Get all pending KYC verifications
   */
  async getPendingVerifications(adminId: string) {
    // Verify admin role
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || (admin.role !== UserRole.ADMIN && admin.role !== UserRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Admin access required');
    }

    return this.prisma.kycVerification.findMany({
      where: { status: KYCStatus.PENDING },
      orderBy: { submittedAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            wallets: {
              select: {
                address: true,
                networkType: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Admin: Review KYC verification
   */
  async reviewVerification(adminId: string, verificationId: string, review: AdminReviewDto) {
    // Verify admin role
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || (admin.role !== UserRole.ADMIN && admin.role !== UserRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Admin access required');
    }

    const verification = await this.prisma.kycVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    if (verification.status !== KYCStatus.PENDING) {
      throw new BadRequestException('Verification already processed');
    }

    const newStatus = review.approved ? KYCStatus.VERIFIED : KYCStatus.REJECTED;
    const now = new Date();

    // Update verification
    await this.prisma.kycVerification.update({
      where: { id: verificationId },
      data: {
        status: newStatus,
        rejectionReason: review.approved ? null : review.rejectionReason,
        verifiedAt: review.approved ? now : null,
      },
    });

    // Update user's KYC status
    await this.prisma.user.update({
      where: { id: verification.userId },
      data: {
        kycStatus: newStatus,
        kycVerifiedAt: review.approved ? now : null,
        // Upgrade to CREATOR role if approved
        role: review.approved ? UserRole.CREATOR : undefined,
      },
    });

    // Log admin action
    await this.prisma.adminLog.create({
      data: {
        adminId,
        action: review.approved ? 'KYC_APPROVED' : 'KYC_REJECTED',
        targetType: 'KycVerification',
        targetId: verificationId,
        details: {
          userId: verification.userId,
          rejectionReason: review.rejectionReason,
        },
      },
    });

    return {
      message: review.approved ? 'KYC approved successfully' : 'KYC rejected',
      status: newStatus,
    };
  }

  /**
   * Get KYC requirements info
   */
  getKycRequirements() {
    return {
      required: true,
      documentTypes: ['passport', 'driver_license', 'id_card'],
      supportedCountries: ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP', 'KR', 'SG', 'OTHER'],
      benefits: [
        'Create and launch tokens',
        'Higher trading limits',
        'Access to premium features',
        'Verified badge on profile',
      ],
      restrictions: {
        minAge: 18,
        bannedCountries: ['KP', 'IR', 'CU', 'SY'],
      },
    };
  }
}
