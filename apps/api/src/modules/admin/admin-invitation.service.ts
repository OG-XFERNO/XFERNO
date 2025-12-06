import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

@Injectable()
export class AdminInvitationService {
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
  }

  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Create admin invitation and send email
   */
  async createInvitation(
    inviterUserId: string | null,
    email: string,
    role: 'ADMIN' | 'SUPER_ADMIN' = 'ADMIN',
  ) {
    // Check if user already exists with admin role
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && ['ADMIN', 'SUPER_ADMIN'].includes(existingUser.role)) {
      throw new ConflictException('User is already an admin');
    }

    // Check for existing pending invitation
    const existingInvite = await this.prisma.adminInvitation.findUnique({
      where: { email },
    });

    if (existingInvite && !existingInvite.acceptedAt) {
      // Delete old invitation and create new one
      await this.prisma.adminInvitation.delete({
        where: { id: existingInvite.id },
      });
    }

    // Generate token and expiration (7 days)
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create invitation
    const invitation = await this.prisma.adminInvitation.create({
      data: {
        email,
        role,
        invitedById: inviterUserId,
        token,
        expiresAt,
      },
    });

    // Get inviter name if available
    let inviterName: string | undefined;
    if (inviterUserId) {
      const inviter = await this.prisma.user.findUnique({
        where: { id: inviterUserId },
        select: { displayName: true, username: true },
      });
      inviterName = inviter?.displayName || inviter?.username || undefined;
    }

    // Send invitation email
    const inviteUrl = `${this.appUrl}/admin/accept-invite?token=${token}`;
    await this.emailService.sendAdminInvitationEmail({
      email,
      inviterName,
      role,
      inviteUrl,
      expiresIn: '7 days',
    });

    return {
      success: true,
      message: `Admin invitation sent to ${email}`,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    };
  }

  /**
   * Verify invitation token is valid
   */
  async verifyInvitation(token: string) {
    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Invitation has already been used');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    return {
      valid: true,
      email: invitation.email,
      role: invitation.role,
    };
  }

  /**
   * Accept invitation and upgrade user to admin
   */
  async acceptInvitation(token: string, userId: string) {
    // Verify token
    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Invitation has already been used');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify email matches (or allow if user is accepting for their account)
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException(
        'Your account email does not match the invitation email. Please sign in with the correct account.',
      );
    }

    // Update user role
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: invitation.role },
    });

    // Mark invitation as accepted
    await this.prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: {
        acceptedAt: new Date(),
        acceptedById: userId,
      },
    });

    return {
      success: true,
      message: 'Welcome to XFERNO Staff!',
      role: invitation.role,
    };
  }

  /**
   * List all invitations (for super admins)
   */
  async listInvitations(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [invitations, total] = await Promise.all([
      this.prisma.adminInvitation.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adminInvitation.count(),
    ]);

    return {
      invitations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Revoke/cancel an invitation
   */
  async revokeInvitation(invitationId: string) {
    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Cannot revoke an accepted invitation');
    }

    await this.prisma.adminInvitation.delete({
      where: { id: invitationId },
    });

    return { success: true, message: 'Invitation revoked' };
  }

  /**
   * Check if a user is staff (has matching admin invitation)
   */
  async isStaff(email: string): Promise<boolean> {
    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { email },
    });

    return !!invitation && !!invitation.acceptedAt;
  }

  /**
   * Get staff status for user profile
   */
  async getStaffStatus(userId: string): Promise<{
    isStaff: boolean;
    staffRole?: string;
    staffSince?: Date;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true },
    });

    if (!user || !user.email) {
      return { isStaff: false };
    }

    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { email: user.email },
    });

    if (!invitation || !invitation.acceptedAt) {
      return { isStaff: false };
    }

    return {
      isStaff: true,
      staffRole: invitation.role,
      staffSince: invitation.acceptedAt,
    };
  }
}
