import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { KycService, SubmitKycDto, AdminReviewDto } from './kyc.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  /**
   * Get KYC requirements and supported document types
   */
  @Get('requirements')
  getRequirements() {
    return this.kycService.getKycRequirements();
  }

  /**
   * Get current user's KYC status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Request() req: any) {
    return this.kycService.getKycStatus(req.user.id);
  }

  /**
   * Submit KYC verification
   */
  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async submit(@Request() req: any, @Body() body: SubmitKycDto) {
    return this.kycService.submitKyc(req.user.id, body);
  }

  // ========== Admin Endpoints ==========

  /**
   * Admin: Get all pending verifications
   */
  @Get('admin/pending')
  @UseGuards(JwtAuthGuard)
  async getPending(@Request() req: any) {
    return this.kycService.getPendingVerifications(req.user.id);
  }

  /**
   * Admin: Review a verification
   */
  @Post('admin/review/:verificationId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async review(
    @Request() req: any,
    @Param('verificationId') verificationId: string,
    @Body() body: AdminReviewDto,
  ) {
    return this.kycService.reviewVerification(req.user.id, verificationId, body);
  }
}
