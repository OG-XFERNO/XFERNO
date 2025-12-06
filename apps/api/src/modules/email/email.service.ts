import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface VerificationEmailData {
  email: string;
  displayName?: string;
  verificationUrl: string;
  expiresIn: string;
}

export interface WelcomeEmailData {
  email: string;
  displayName?: string;
}

export interface PasswordResetEmailData {
  email: string;
  displayName?: string;
  resetUrl: string;
  expiresIn: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly brevoApiKey: string;
  private readonly brevoApiUrl = 'https://api.brevo.com/v3/smtp/email';
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly appUrl: string;
  private readonly logoUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.brevoApiKey = this.configService.get<string>('BREVO_API_KEY', '');
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@xferno.io');
    this.fromName = this.configService.get<string>('EMAIL_FROM_NAME', 'XFERNO');
    this.appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    // Use a placeholder logo or configure EMAIL_LOGO_URL with a publicly accessible URL
    this.logoUrl = this.configService.get<string>('EMAIL_LOGO_URL', '');
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return !!this.brevoApiKey;
  }

  /**
   * Send email via Brevo API
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured()) {
      this.logger.warn('Brevo API key not configured - email not sent');
      this.logger.debug(`Would send email to ${options.to}: ${options.subject}`);
      return false;
    }

    try {
      const response = await fetch(this.brevoApiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.brevoApiKey,
        },
        body: JSON.stringify({
          sender: {
            name: this.fromName,
            email: this.fromEmail,
          },
          to: [{ email: options.to }],
          subject: options.subject,
          htmlContent: options.html,
          textContent: options.text || this.stripHtml(options.html),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Brevo API error: ${response.status} - ${errorText}`);
        return false;
      }

      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
    const html = this.getEmailTemplate({
      title: 'Verify Your Email',
      preheader: 'Confirm your XFERNO account to start trading',
      content: `
        <h2 style="color: #f97316; margin: 0 0 16px 0; font-size: 24px;">Welcome to XFERNO! 🔥</h2>
        <p style="margin: 0 0 16px 0; color: #d1d5db;">
          Hi ${data.displayName || 'there'},
        </p>
        <p style="margin: 0 0 24px 0; color: #d1d5db;">
          Thank you for creating an account with XFERNO. To complete your registration and access all features, please verify your email address by clicking the button below.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Verify Email Address
          </a>
        </div>
        <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px;">
          Or copy and paste this link into your browser:
        </p>
        <p style="margin: 0 0 24px 0; word-break: break-all;">
          <a href="${data.verificationUrl}" style="color: #f97316; font-size: 12px;">${data.verificationUrl}</a>
        </p>
        <p style="margin: 0; color: #9ca3af; font-size: 14px;">
          This link will expire in <strong>${data.expiresIn}</strong>. If you didn't create an account with XFERNO, you can safely ignore this email.
        </p>
      `,
    });

    return this.sendEmail({
      to: data.email,
      subject: '🔥 Verify Your XFERNO Account',
      html,
    });
  }

  /**
   * Send welcome email after verification
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const html = this.getEmailTemplate({
      title: 'Welcome to XFERNO',
      preheader: 'Your account is verified and ready to go!',
      content: `
        <h2 style="color: #f97316; margin: 0 0 16px 0; font-size: 24px;">You're All Set! 🎉</h2>
        <p style="margin: 0 0 16px 0; color: #d1d5db;">
          Hi ${data.displayName || 'there'},
        </p>
        <p style="margin: 0 0 16px 0; color: #d1d5db;">
          Your email has been verified and your XFERNO account is now fully activated. You're ready to explore the world of decentralized token launches!
        </p>
        <h3 style="color: #ffffff; margin: 24px 0 16px 0; font-size: 18px;">What's Next?</h3>
        <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #d1d5db;">
          <li style="margin-bottom: 8px;">Connect your wallet to start trading</li>
          <li style="margin-bottom: 8px;">Complete KYC verification to launch your own tokens</li>
          <li style="margin-bottom: 8px;">Explore trending tokens and discover new projects</li>
          <li style="margin-bottom: 8px;">Join our community on Discord and Twitter</li>
        </ul>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${this.appUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Start Exploring
          </a>
        </div>
      `,
    });

    return this.sendEmail({
      to: data.email,
      subject: '🚀 Welcome to XFERNO - Your Account is Ready!',
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    const html = this.getEmailTemplate({
      title: 'Reset Your Password',
      preheader: 'Password reset request for your XFERNO account',
      content: `
        <h2 style="color: #f97316; margin: 0 0 16px 0; font-size: 24px;">Password Reset Request</h2>
        <p style="margin: 0 0 16px 0; color: #d1d5db;">
          Hi ${data.displayName || 'there'},
        </p>
        <p style="margin: 0 0 24px 0; color: #d1d5db;">
          We received a request to reset the password for your XFERNO account. Click the button below to set a new password.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px;">
          Or copy and paste this link into your browser:
        </p>
        <p style="margin: 0 0 24px 0; word-break: break-all;">
          <a href="${data.resetUrl}" style="color: #f97316; font-size: 12px;">${data.resetUrl}</a>
        </p>
        <p style="margin: 0; color: #9ca3af; font-size: 14px;">
          This link will expire in <strong>${data.expiresIn}</strong>. If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.
        </p>
      `,
    });

    return this.sendEmail({
      to: data.email,
      subject: '🔐 Reset Your XFERNO Password',
      html,
    });
  }

  /**
   * Generate branded email template
   */
  private getEmailTemplate(options: {
    title: string;
    preheader: string;
    content: string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${options.title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Preheader text -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${options.preheader}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <!-- Email wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Email container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #171717; border-radius: 16px; border: 1px solid #262626;">
          
          <!-- Header with logo -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-bottom: 1px solid #262626;">
              ${this.logoUrl ? 
                `<img src="${this.logoUrl}" alt="XFERNO" width="150" style="display: block; margin: 0 auto;" />` :
                `<div style="font-size: 32px; font-weight: bold; color: #f97316; letter-spacing: 2px;">🔥 XFERNO</div>`
              }
            </td>
          </tr>
          
          <!-- Main content -->
          <tr>
            <td style="padding: 40px;">
              ${options.content}
            </td>
          </tr>
          
          <!-- Security warning -->
          <tr>
            <td style="padding: 24px 40px; background-color: #1c1917; border-top: 1px solid #262626;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td width="24" valign="top">
                    <span style="font-size: 20px;">⚠️</span>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="margin: 0 0 8px 0; color: #fbbf24; font-weight: 600; font-size: 14px;">
                      Anti-Phishing Notice
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                      XFERNO will <strong>NEVER</strong> ask you for your password, private keys, seed phrase, or request you to send cryptocurrency via email. Always verify you are on <strong>xferno.io</strong> before entering any sensitive information. Beware of phishing sites that may look similar to ours.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Additional security tips -->
          <tr>
            <td style="padding: 24px 40px; background-color: #171717; border-top: 1px solid #262626;">
              <p style="margin: 0 0 12px 0; color: #ffffff; font-weight: 600; font-size: 14px;">
                🛡️ Security Tips
              </p>
              <ul style="margin: 0; padding-left: 20px; color: #9ca3af; font-size: 12px; line-height: 1.8;">
                <li>Enable two-factor authentication (2FA) on your account</li>
                <li>Never share your login credentials with anyone</li>
                <li>Use a unique, strong password for your XFERNO account</li>
                <li>Verify all transaction details before confirming</li>
                <li>Contact support@xferno.io if you notice suspicious activity</li>
              </ul>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-top: 1px solid #262626;">
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 12px;">
                © ${new Date().getFullYear()} XFERNO. All rights reserved.
              </p>
              <p style="margin: 0 0 16px 0;">
                <a href="${this.appUrl}" style="color: #f97316; text-decoration: none; font-size: 12px; margin: 0 8px;">Website</a>
                <span style="color: #374151;">|</span>
                <a href="${this.appUrl}/terms" style="color: #f97316; text-decoration: none; font-size: 12px; margin: 0 8px;">Terms</a>
                <span style="color: #374151;">|</span>
                <a href="${this.appUrl}/privacy" style="color: #f97316; text-decoration: none; font-size: 12px; margin: 0 8px;">Privacy</a>
                <span style="color: #374151;">|</span>
                <a href="mailto:support@xferno.io" style="color: #f97316; text-decoration: none; font-size: 12px; margin: 0 8px;">Support</a>
              </p>
              <p style="margin: 0; color: #4b5563; font-size: 11px; line-height: 1.6;">
                This email was sent to you because you registered for an XFERNO account.
                <br />
                If you did not register, please ignore this email or contact support.
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Disclaimer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px;">
          <tr>
            <td style="padding: 24px 20px; text-align: center;">
              <p style="margin: 0; color: #4b5563; font-size: 10px; line-height: 1.6;">
                <strong>Risk Disclosure:</strong> Cryptocurrency trading involves significant risk. The value of digital assets can fluctuate widely. Past performance is not indicative of future results. You should carefully consider your investment objectives, level of experience, and risk appetite before trading. Only trade with funds you can afford to lose.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*<\/style>/gi, '')
      .replace(/<script[^>]*>.*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
