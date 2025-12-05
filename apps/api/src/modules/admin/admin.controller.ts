import { Controller, Get, Put, Body, Param, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async dashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('tokens')
  async tokens(@Query() query: any) {
    return this.adminService.getTokens(query);
  }

  @Put('tokens/:id/status')
  async updateTokenStatus(
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    return this.adminService.updateTokenStatus(id, body.status);
  }

  @Get('networks')
  async networks() {
    return this.adminService.getNetworks();
  }

  @Put('networks/:id')
  async updateNetwork(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateNetwork(id, body);
  }
}
