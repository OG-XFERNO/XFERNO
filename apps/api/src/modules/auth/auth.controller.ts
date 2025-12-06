import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService, RegisterDto, LoginDto, WalletLoginDto } from './auth.service';
import { JwtAuthGuard } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
