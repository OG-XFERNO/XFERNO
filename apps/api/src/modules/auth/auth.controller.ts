import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    // TODO: Implement
    return { message: 'Login endpoint' };
  }

  @Post('register')
  async register(@Body() body: any) {
    // TODO: Implement
    return { message: 'Register endpoint' };
  }

  @Get('me')
  async me() {
    // TODO: Implement with auth guard
    return { message: 'Me endpoint' };
  }
}
