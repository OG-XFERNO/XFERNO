import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Headers,
  RawBodyRequest,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import { KycService, SubmitKycDto, AdminReviewDto, DiditWebhookPayload } from './kyc.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { Request as ExpressRequest, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('kyc')
export class KycController {
  private readonly logger = new Logger(KycController.name);
  private readonly appUrl: string;

  constructor(
    private readonly kycService: KycService,
    private readonly configService: ConfigService,
  ) {
    this.appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
  }

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
   * Didit callback redirect (GET)
   * User is redirected here after completing verification on Didit
   */
  @Get('didit/webhook')
  async handleDiditCallback(
    @Query('verificationSessionId') sessionId: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    this.logger.log(`Didit callback redirect: sessionId=${sessionId}, status=${status}`);
    
    // Process the verification result if we have the session ID
    if (sessionId && status) {
      try {
        await this.kycService.handleDiditCallback(sessionId, status);
      } catch (error) {
        this.logger.error('Error processing Didit callback:', error);
      }
    }
    
    // Redirect user back to KYC page with status
    const redirectUrl = `${this.appUrl}/kyc?status=${status?.toLowerCase() || 'complete'}`;
    return res.redirect(redirectUrl);
  }

  /**
   * Didit webhook callback (POST)
   * Receives verification status updates from Didit server-to-server
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
   * Refresh KYC status by polling Didit API
   * Use when webhook isn't working
   */
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refreshStatus(@Request() req: any) {
    return this.kycService.refreshKycStatus(req.user.id);
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
   * Dismiss the KYC verified banner
   */
  @Post('banner/dismiss')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async dismissBanner(@Request() req: any) {
    return this.kycService.dismissKycBanner(req.user.id);
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
