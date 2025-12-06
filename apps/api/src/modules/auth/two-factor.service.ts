import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

// Simple TOTP implementation without external dependencies
// Uses HMAC-SHA1 based OTP as per RFC 6238

@Injectable()
export class TwoFactorService {
  private readonly TOTP_STEP = 30; // 30 second window
  private readonly TOTP_DIGITS = 6;
  private readonly RECOVERY_CODE_COUNT = 10;
  private readonly APP_NAME = 'XFERNO';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a new secret for 2FA setup
   */
  generateSecret(): { secret: string; otpauthUrl: string } {
    // Generate 20 random bytes and encode as base32
    const buffer = crypto.randomBytes(20);
    const secret = this.base32Encode(buffer);
    
    return {
      secret,
      otpauthUrl: '', // Will be set by caller with user email
    };
  }

  /**
   * Generate the otpauth URL for QR code
   */
  generateOtpauthUrl(email: string, secret: string): string {
    const encodedEmail = encodeURIComponent(email);
    const encodedIssuer = encodeURIComponent(this.APP_NAME);
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${this.TOTP_DIGITS}&period=${this.TOTP_STEP}`;
  }

  /**
   * Verify a TOTP token
   */
  verifyToken(secret: string, token: string): boolean {
    if (!token || token.length !== this.TOTP_DIGITS) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const counter = Math.floor(now / this.TOTP_STEP);
    
    // Check current window and one window before/after for clock drift
    for (let i = -1; i <= 1; i++) {
      const expectedToken = this.generateTOTP(secret, counter + i);
      if (expectedToken === token) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Generate TOTP for a given counter
   */
  private generateTOTP(secret: string, counter: number): string {
    const decodedSecret = this.base32Decode(secret);
    
    // Convert counter to 8-byte buffer (big endian)
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter));
    
    // Generate HMAC-SHA1
    const hmac = crypto.createHmac('sha1', decodedSecret);
    hmac.update(counterBuffer);
    const hash = hmac.digest();
    
    // Dynamic truncation
    const offset = hash[hash.length - 1] & 0xf;
    const binary = 
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);
    
    // Generate 6-digit code
    const otp = binary % Math.pow(10, this.TOTP_DIGITS);
    return otp.toString().padStart(this.TOTP_DIGITS, '0');
  }

  /**
   * Base32 encode
   */
  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;
    
    for (const byte of buffer) {
      value = (value << 8) | byte;
      bits += 8;
      
      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    
    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31];
    }
    
    return result;
  }

  /**
   * Base32 decode
   */
  private base32Decode(encoded: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanedInput = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
    
    let bits = 0;
    let value = 0;
    const output: number[] = [];
    
    for (const char of cleanedInput) {
      const index = alphabet.indexOf(char);
      if (index === -1) continue;
      
      value = (value << 5) | index;
      bits += 5;
      
      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }
    
    return Buffer.from(output);
  }

  /**
   * Generate recovery codes
   */
  async generateRecoveryCodes(userId: string): Promise<string[]> {
    // Delete existing recovery codes
    await this.prisma.twoFactorRecoveryCode.deleteMany({
      where: { userId },
    });

    const codes: string[] = [];
    const hashedCodes: { userId: string; code: string }[] = [];

    for (let i = 0; i < this.RECOVERY_CODE_COUNT; i++) {
      // Generate readable recovery code: XXXX-XXXX-XXXX
      const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const part3 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const code = `${part1}-${part2}-${part3}`;
      
      codes.push(code);
      hashedCodes.push({
        userId,
        code: await bcrypt.hash(code, 10),
      });
    }

    // Store hashed codes
    await this.prisma.twoFactorRecoveryCode.createMany({
      data: hashedCodes,
    });

    return codes;
  }

  /**
   * Verify a recovery code and mark it as used
   */
  async verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
    const recoveryCodes = await this.prisma.twoFactorRecoveryCode.findMany({
      where: { userId, usedAt: null },
    });

    for (const recoveryCode of recoveryCodes) {
      const isValid = await bcrypt.compare(code, recoveryCode.code);
      if (isValid) {
        // Mark as used
        await this.prisma.twoFactorRecoveryCode.update({
          where: { id: recoveryCode.id },
          data: { usedAt: new Date() },
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Get count of remaining recovery codes
   */
  async getRemainingRecoveryCodeCount(userId: string): Promise<number> {
    return this.prisma.twoFactorRecoveryCode.count({
      where: { userId, usedAt: null },
    });
  }

  /**
   * Enable 2FA for a user
   */
  async enable2FA(userId: string, secret: string, token: string): Promise<{ recoveryCodes: string[] }> {
    // Verify the token first
    if (!this.verifyToken(secret, token)) {
      throw new BadRequestException('Invalid verification code');
    }

    // Generate recovery codes
    const recoveryCodes = await this.generateRecoveryCodes(userId);

    // Update user with 2FA enabled
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    });

    return { recoveryCodes };
  }

  /**
   * Disable 2FA for a user
   */
  async disable2FA(userId: string, token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Verify the token
    if (!this.verifyToken(user.twoFactorSecret, token)) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Delete recovery codes
    await this.prisma.twoFactorRecoveryCode.deleteMany({
      where: { userId },
    });

    // Disable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
  }

  /**
   * Verify 2FA during login
   */
  async verify2FALogin(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    // Try TOTP first
    if (this.verifyToken(user.twoFactorSecret, token)) {
      return true;
    }

    // Try recovery code (format: XXXX-XXXX-XXXX)
    if (token.includes('-')) {
      return this.verifyRecoveryCode(userId, token);
    }

    return false;
  }
}
