import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminInvitationService } from './admin-invitation.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

// Admin guard to check for ADMIN or SUPER_ADMIN role
function checkAdminRole(req: any) {
  if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    throw new ForbiddenException('Admin access required');
  }
}

// Super admin only
function checkSuperAdminRole(req: any) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenException('Super admin access required');
  }
}

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly invitationService: AdminInvitationService,
  ) {}

  // ========== DASHBOARD ==========

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async dashboard(@Request() req: any) {
    checkAdminRole(req);
    return this.adminService.getDashboardStats();
  }

  // ========== USER MANAGEMENT ==========

  @Get('users')
  @UseGuards(JwtAuthGuard)
  async getUsers(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('kycStatus') kycStatus?: string,
    @Query('accountType') accountType?: string,
  ) {
    checkAdminRole(req);
    return this.adminService.getUsers(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      { role, kycStatus, accountType },
    );
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard)
  async getUser(@Request() req: any, @Param('id') id: string) {
    checkAdminRole(req);
    return this.adminService.getUser(id);
  }

  @Put('users/:id/role')
  @UseGuards(JwtAuthGuard)
  async updateUserRole(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { role: 'USER' | 'CREATOR' | 'ADMIN' },
  ) {
    checkAdminRole(req);
    const result = await this.adminService.updateUserRole(id, body.role);
    await this.adminService.createAdminLog(req.user.id, 'UPDATE_ROLE', 'USER', id, { newRole: body.role });
    return result;
  }

  @Put('users/:id/kyc')
  @UseGuards(JwtAuthGuard)
  async updateUserKycStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { kycStatus: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED' },
  ) {
    checkAdminRole(req);
    const result = await this.adminService.updateUserKycStatus(id, body.kycStatus);
    await this.adminService.createAdminLog(req.user.id, 'UPDATE_KYC', 'USER', id, { newStatus: body.kycStatus });
    return result;
  }

  // ========== TOKEN MANAGEMENT ==========

  @Get('tokens')
  @UseGuards(JwtAuthGuard)
  async getTokens(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('chainId') chainId?: string,
  ) {
    checkAdminRole(req);
    return this.adminService.getTokens(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      { status, chainId: chainId ? parseInt(chainId) : undefined },
    );
  }

  @Put('tokens/:id/status')
  @UseGuards(JwtAuthGuard)
  async updateTokenStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    checkAdminRole(req);
    const result = await this.adminService.updateTokenStatus(id, body.status);
    await this.adminService.createAdminLog(req.user.id, 'UPDATE_TOKEN_STATUS', 'TOKEN', id, { newStatus: body.status });
    return result;
  }

  // ========== NETWORK MANAGEMENT ==========

  @Get('networks')
  @UseGuards(JwtAuthGuard)
  async getNetworks(@Request() req: any) {
    checkAdminRole(req);
    return this.adminService.getNetworks();
  }

  @Put('networks/:id')
  @UseGuards(JwtAuthGuard)
  async updateNetwork(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { isEnabledForBase?: boolean; isEnabledForSplit?: boolean; rpcUrl?: string },
  ) {
    checkAdminRole(req);
    const result = await this.adminService.updateNetwork(id, body);
    await this.adminService.createAdminLog(req.user.id, 'UPDATE_NETWORK', 'NETWORK', id, body);
    return result;
  }

  // ========== ADMIN LOGS ==========

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  async getAdminLogs(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    checkAdminRole(req);
    return this.adminService.getAdminLogs(parseInt(page || '1'), parseInt(limit || '50'));
  }

  // ========== ADMIN INVITATIONS ==========

  @Post('invitations')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createInvitation(
    @Request() req: any,
    @Body() body: { email: string; role?: 'ADMIN' | 'SUPER_ADMIN' },
  ) {
    checkSuperAdminRole(req); // Only super admins can invite
    const result = await this.invitationService.createInvitation(
      req.user.id,
      body.email,
      body.role || 'ADMIN',
    );
    await this.adminService.createAdminLog(req.user.id, 'CREATE_INVITATION', 'INVITATION', body.email, { role: body.role });
    return result;
  }

  @Get('invitations')
  @UseGuards(JwtAuthGuard)
  async listInvitations(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    checkSuperAdminRole(req);
    return this.invitationService.listInvitations(parseInt(page || '1'), parseInt(limit || '20'));
  }

  @Delete('invitations/:id')
  @UseGuards(JwtAuthGuard)
  async revokeInvitation(@Request() req: any, @Param('id') id: string) {
    checkSuperAdminRole(req);
    const result = await this.invitationService.revokeInvitation(id);
    await this.adminService.createAdminLog(req.user.id, 'REVOKE_INVITATION', 'INVITATION', id);
    return result;
  }

  // Public endpoints for accepting invitations
  @Get('invitations/verify/:token')
  async verifyInvitation(@Param('token') token: string) {
    return this.invitationService.verifyInvitation(token);
  }

  @Post('invitations/accept/:token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(@Request() req: any, @Param('token') token: string) {
    return this.invitationService.acceptInvitation(token, req.user.id);
  }

  // Staff status endpoint (public for profile badges)
  @Get('staff-status/:userId')
  async getStaffStatus(@Param('userId') userId: string) {
    return this.invitationService.getStaffStatus(userId);
  }
}
