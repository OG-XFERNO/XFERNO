import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService, RegisterDto, LoginDto, WalletLoginDto } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerificationEmail(body.email);
  }

  @Post('wallet')
  @HttpCode(HttpStatus.OK)
  async walletLogin(@Body() body: WalletLoginDto) {
    return this.authService.walletLogin(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: any,
    @Body() body: { displayName?: string; username?: string; bio?: string; avatarUrl?: string },
  ) {
    return this.authService.updateProfile(req.user.id, body);
  }

  @Post('wallet/add')
  @UseGuards(JwtAuthGuard)
  async addWallet(
    @Request() req: any,
    @Body() body: { address: string; networkType: 'EVM' | 'SOLANA' | 'MOVE' },
  ) {
    return this.authService.addWallet(req.user.id, body);
  }

  @Delete('wallet/:walletId')
  @UseGuards(JwtAuthGuard)
  async removeWallet(@Request() req: any, @Param('walletId') walletId: string) {
    return this.authService.removeWallet(req.user.id, walletId);
  }

  @Put('account-type')
  @UseGuards(JwtAuthGuard)
  async upgradeAccountType(
    @Request() req: any,
    @Body() body: { accountType: 'SOCIAL' | 'TRADER' | 'CREATOR' },
  ) {
    return this.authService.upgradeAccountType(req.user.id, body.accountType);
  }

  // ========== TWO-FACTOR AUTHENTICATION ==========

  @Get('2fa/setup')
  @UseGuards(JwtAuthGuard)
  async setup2FA(@Request() req: any) {
    const user = await this.authService.getProfile(req.user.id);
    if (user.twoFactorEnabled) {
      return { 
        message: '2FA is already enabled',
        enabled: true,
      };
    }

    const { secret } = this.twoFactorService.generateSecret();
    const otpauthUrl = this.twoFactorService.generateOtpauthUrl(user.email || req.user.id, secret);
    
    return {
      secret,
      otpauthUrl,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`,
    };
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async enable2FA(
    @Request() req: any,
    @Body() body: { secret: string; token: string },
  ) {
    const result = await this.twoFactorService.enable2FA(req.user.id, body.secret, body.token);
    return {
      message: '2FA has been enabled',
      recoveryCodes: result.recoveryCodes,
    };
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disable2FA(
    @Request() req: any,
    @Body() body: { token: string },
  ) {
    await this.twoFactorService.disable2FA(req.user.id, body.token);
    return { message: '2FA has been disabled' };
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verify2FA(
    @Body() body: { userId: string; token: string },
  ) {
    const isValid = await this.twoFactorService.verify2FALogin(body.userId, body.token);
    if (!isValid) {
      return { success: false, message: 'Invalid verification code' };
    }
    
    // Generate new access token after 2FA verification
    const authResponse = await this.authService.generateTokenAfter2FA(body.userId);
    return {
      success: true,
      ...authResponse,
    };
  }

  @Get('2fa/recovery-codes')
  @UseGuards(JwtAuthGuard)
  async getRecoveryCodes(@Request() req: any) {
    const remainingCount = await this.twoFactorService.getRemainingRecoveryCodeCount(req.user.id);
    return { remainingCount };
  }

  @Post('2fa/recovery-codes/regenerate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async regenerateRecoveryCodes(
    @Request() req: any,
    @Body() body: { token: string },
  ) {
    // Verify current 2FA token first
    const isValid = await this.twoFactorService.verify2FALogin(req.user.id, body.token);
    if (!isValid) {
      return { success: false, message: 'Invalid verification code' };
    }

    const recoveryCodes = await this.twoFactorService.generateRecoveryCodes(req.user.id);
    return {
      success: true,
      recoveryCodes,
    };
  }
}
