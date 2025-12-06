import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

// Admin guard to check for ADMIN or SUPER_ADMIN role
function checkAdminRole(req: any) {
  if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    throw new ForbiddenException('Admin access required');
  }
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ========== DASHBOARD ==========

  @Get('dashboard')
  async dashboard(@Request() req: any) {
    checkAdminRole(req);
    return this.adminService.getDashboardStats();
  }

  // ========== USER MANAGEMENT ==========

  @Get('users')
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
  async getUser(@Request() req: any, @Param('id') id: string) {
    checkAdminRole(req);
    return this.adminService.getUser(id);
  }

  @Put('users/:id/role')
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
  async getNetworks(@Request() req: any) {
    checkAdminRole(req);
    return this.adminService.getNetworks();
  }

  @Put('networks/:id')
  async updateNetwork(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { isEnabled?: boolean; rpcUrl?: string },
  ) {
    checkAdminRole(req);
    const result = await this.adminService.updateNetwork(id, body);
    await this.adminService.createAdminLog(req.user.id, 'UPDATE_NETWORK', 'NETWORK', id, body);
    return result;
  }

  // ========== ADMIN LOGS ==========

  @Get('logs')
  async getAdminLogs(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    checkAdminRole(req);
    return this.adminService.getAdminLogs(parseInt(page || '1'), parseInt(limit || '50'));
  }
}
