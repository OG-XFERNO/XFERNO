import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { KYCStatus, UserRole } from '@prisma/client';
import * as crypto from 'crypto';

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
  session_id: string;
  url: string;
  expires_at?: string;
}

export interface DiditSessionResponse {
  session_id: string;
  url: string;
  status?: string;
}

// Didit webhook payload based on their API
export interface DiditWebhookPayload {
  session_id: string;
  status: 'Approved' | 'Declined' | 'pending' | 'completed' | 'failed';
  vendor_data?: string; // Our userId
  created_at?: string;
  updated_at?: string;
  decision?: {
    kyc?: {
      verified: boolean;
      document?: {
        type?: string;
        country?: string;
        first_name?: string;
        last_name?: string;
        date_of_birth?: string;
      };
    };
    aml?: {
      verified: boolean;
    };
  };
  error?: {
    code?: string;
    message?: string;
  };
}

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);
  private readonly diditApiKey: string;
  private readonly diditWorkflowId: string;
  private readonly diditApiUrl: string;
  private readonly diditWebhookSecret: string;
  private readonly webhookCallbackUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.diditApiKey = this.configService.get<string>('DIDIT_API_KEY', '');
    this.diditWorkflowId = this.configService.get<string>('DIDIT_WORKFLOW_ID', '');
    // Use the correct Didit verification API URL
    this.diditApiUrl = this.configService.get<string>('DIDIT_API_URL', 'https://verification.didit.me/v2');
    this.diditWebhookSecret = this.configService.get<string>('DIDIT_WEBHOOK_SECRET', '');
    this.webhookCallbackUrl = this.configService.get<string>(
      'DIDIT_WEBHOOK_URL',
      'http://localhost:3002/api/kyc/didit/webhook'
    );
  }

  /**
   * Check if Didit is configured
   */
  isDiditConfigured(): boolean {
    return !!this.diditWorkflowId && !!this.diditApiKey;
  }

  /**
   * Create a Didit KYC session for a user
   */
  async createDiditSession(userId: string): Promise<DiditSession> {
    if (!this.isDiditConfigured()) {
      throw new BadRequestException('Didit KYC is not configured. Please set DIDIT_WORKFLOW_ID and DIDIT_API_KEY.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if already verified
    if (user.kycStatus === KYCStatus.VERIFIED) {
      throw new BadRequestException('KYC already verified');
    }

    // Check if there's already a pending Didit session
    const existingSession = await this.prisma.kycVerification.findFirst({
      where: {
        userId,
        provider: 'didit',
        status: KYCStatus.PENDING,
      },
    });

    if (existingSession?.externalId) {
      // Return existing session - user can continue verification
      return {
        session_id: existingSession.externalId,
        url: `https://verify.didit.me/session/${existingSession.externalId}`,
      };
    }

    try {
      this.logger.log(`Creating Didit session for user ${userId}`);
      this.logger.log(`API URL: ${this.diditApiUrl}/session/`);
      this.logger.log(`Callback URL: ${this.webhookCallbackUrl}`);

      // Call Didit API to create a verification session
      // Using the correct endpoint: POST /v2/session/ at verification.didit.me
      const response = await fetch(`${this.diditApiUrl}/session/`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.diditApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // workflow_id is required - create a KYC workflow at https://business.didit.me
          workflow_id: this.diditWorkflowId,
          callback: this.webhookCallbackUrl,
          vendor_data: userId, // Pass our userId for webhook callback
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Didit session creation failed: ${response.status} - ${errorText}`);
        throw new BadRequestException(`Failed to create Didit session: ${response.status} - ${errorText}`);
      }

      const sessionData: DiditSessionResponse = await response.json();
      this.logger.log(`Didit session created: ${sessionData.session_id}, URL: ${sessionData.url}`);

      // Create KycVerification record
      await this.prisma.kycVerification.create({
        data: {
          userId,
          provider: 'didit',
          externalId: sessionData.session_id,
          status: KYCStatus.PENDING,
        },
      });

      // Update user status to pending
      await this.prisma.user.update({
        where: { id: userId },
        data: { kycStatus: KYCStatus.PENDING },
      });

      return {
        session_id: sessionData.session_id,
        url: sessionData.url,
      };
    } catch (error) {
      this.logger.error('Failed to create Didit session:', error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to create verification session. Please try again later.');
    }
  }

  /**
   * Verify Didit webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.diditWebhookSecret) {
      // If no secret configured, skip verification (dev mode)
      this.logger.warn('DIDIT_WEBHOOK_SECRET not configured - skipping signature verification');
      return true;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.diditWebhookSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      this.logger.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Handle Didit webhook callback
   */
  async handleDiditWebhook(payload: DiditWebhookPayload, rawBody?: string, signature?: string): Promise<void> {
    this.logger.log(`Received Didit webhook for session: ${payload.session_id}, status: ${payload.status}`);

    // Verify signature if provided
    if (signature && rawBody && !this.verifyWebhookSignature(rawBody, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Find the verification by Didit session ID
    const verification = await this.prisma.kycVerification.findFirst({
      where: { externalId: payload.session_id, provider: 'didit' },
    });

    if (!verification) {
      // Try to find by vendor_data (userId)
      if (payload.vendor_data) {
        const userVerification = await this.prisma.kycVerification.findFirst({
          where: { userId: payload.vendor_data, provider: 'didit', status: KYCStatus.PENDING },
        });
        if (userVerification) {
          // Update with the session ID
          await this.prisma.kycVerification.update({
            where: { id: userVerification.id },
            data: { externalId: payload.session_id },
          });
        }
      }
      this.logger.warn(`Verification session not found: ${payload.session_id}`);
      throw new NotFoundException('Verification session not found');
    }

    // Map Didit status to our KYCStatus
    let newStatus: KYCStatus;
    let rejectionReason: string | null = null;

    switch (payload.status.toLowerCase()) {
      case 'approved':
      case 'completed':
        newStatus = KYCStatus.VERIFIED;
        break;
      case 'declined':
      case 'failed':
        newStatus = KYCStatus.REJECTED;
        rejectionReason = payload.error?.message || 'Verification failed';
        break;
      default:
        newStatus = KYCStatus.PENDING;
    }

    // Extract document data from decision
    const docData = payload.decision?.kyc?.document;

    // Update verification record
    await this.prisma.kycVerification.update({
      where: { id: verification.id },
      data: {
        status: newStatus,
        rejectionReason,
        firstName: docData?.first_name || verification.firstName,
        lastName: docData?.last_name || verification.lastName,
        dateOfBirth: docData?.date_of_birth ? new Date(docData.date_of_birth) : verification.dateOfBirth,
        documentType: docData?.type || verification.documentType,
        documentCountry: docData?.country || verification.documentCountry,
        verifiedAt: newStatus === KYCStatus.VERIFIED ? new Date() : null,
      },
    });

    // Update user's KYC status
    await this.prisma.user.update({
      where: { id: verification.userId },
      data: {
        kycStatus: newStatus,
        kycVerifiedAt: newStatus === KYCStatus.VERIFIED ? new Date() : null,
        diditId: newStatus === KYCStatus.VERIFIED ? payload.session_id : undefined,
        role: newStatus === KYCStatus.VERIFIED ? UserRole.CREATOR : undefined,
      },
    });

    this.logger.log(`KYC status updated for user ${verification.userId}: ${newStatus}`);
  }

  /**
   * Get Didit session status
   */
  async getDiditSessionStatus(sessionId: string): Promise<any> {
    if (!this.isDiditConfigured()) {
      throw new BadRequestException('Didit KYC is not configured');
    }

    try {
      const response = await fetch(`${this.diditApiUrl}/session/${sessionId}/`, {
        method: 'GET',
        headers: {
          'X-Api-Key': this.diditApiKey,
        },
      });

      if (!response.ok) {
        throw new BadRequestException(`Failed to get session status: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      this.logger.error('Failed to get Didit session status:', error);
      throw new BadRequestException('Failed to get session status');
    }
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
