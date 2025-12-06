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
  Headers,
  RawBodyRequest,
  Req,
  Logger,
} from '@nestjs/common';
import { KycService, SubmitKycDto, AdminReviewDto, DiditWebhookPayload } from './kyc.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { Request as ExpressRequest } from 'express';

@Controller('kyc')
export class KycController {
  private readonly logger = new Logger(KycController.name);

  constructor(private readonly kycService: KycService) {}

  /**
   * Get KYC requirements and supported document types
   */
  @Get('requirements')
  getRequirements() {
    return {
      ...this.kycService.getKycRequirements(),
      provider: this.kycService.isDiditConfigured() ? 'didit' : 'manual',
      diditConfigured: this.kycService.isDiditConfigured(),
    };
  }

  /**
   * Create a Didit KYC session
   */
  @Post('didit/session')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createDiditSession(@Request() req: any) {
    return this.kycService.createDiditSession(req.user.id);
  }

  /**
   * Didit webhook callback
   * Receives verification status updates from Didit
   */
  @Post('didit/webhook')
  @HttpCode(HttpStatus.OK)
  async handleDiditWebhook(
    @Body() payload: DiditWebhookPayload,
    @Req() req: RawBodyRequest<ExpressRequest>,
    @Headers('x-didit-signature') signature?: string,
    @Headers('x-webhook-signature') webhookSignature?: string,
  ) {
    this.logger.log(`Didit webhook received: ${JSON.stringify(payload)}`);
    
    // Get raw body for signature verification
    const rawBody = req.rawBody?.toString() || JSON.stringify(payload);
    
    // Use either signature header (Didit may use different header names)
    const sig = signature || webhookSignature;
    
    await this.kycService.handleDiditWebhook(payload, rawBody, sig);
    return { success: true, message: 'Webhook processed' };
  }

  /**
   * Get Didit session status (for polling)
   */
  @Get('didit/session/:sessionId')
  @UseGuards(JwtAuthGuard)
  async getDiditSessionStatus(@Param('sessionId') sessionId: string) {
    return this.kycService.getDiditSessionStatus(sessionId);
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
