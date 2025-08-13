/**
 * Auth service
 */

import { Inject, Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { AUTH_PROVIDER, NOTIFICATION_PROVIDER } from '../../services/ports/tokens';
import { IAuthProvider, TokenResponse, AuthTokens } from '../../services/ports/auth.interface';
import { INotificationProvider } from '../../services/ports/notification.interface';

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly customOtpStore = new Map<string, OtpEntry>();
  private readonly OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_OTP_ATTEMPTS = 5;

  constructor(
    @Inject(AUTH_PROVIDER) private readonly auth: IAuthProvider,
    @Inject(NOTIFICATION_PROVIDER) private readonly notifier: INotificationProvider,
  ) {}

  private createOtpKey(channel: 'email' | 'sms', email?: string, phone?: string) {
    if (channel === 'email') {
      if (!email) throw new BadRequestException('email required for channel=email');
      return `email:${email.toLowerCase()}`;
    }
    if (!phone) throw new BadRequestException('phone_number required for channel=sms');
    return `sms:${phone}`;
  }

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Initiate authentication
   * @param phone - The phone number
   * @returns The authentication response
   */
  initiateAuth(phone: string) { return this.auth.initiateAuth(phone); }

  /**
   * Respond to a challenge
   * @param session - The session ID
   * @param otpCode - The OTP code
   * @param phone - The phone number (optional)
   * @returns The authentication response
   */
  async respondToChallenge(
    session: string,
    otpCode: string,
    phone?: string,
  ) {
    return this.auth.respondToChallenge(session, otpCode, phone);
  }
  
  /**
   * Password login
   * @param username - The username
   * @param password - The password
   * @returns The authentication response
   */
  async passwordLogin(username: string, password: string) {
    const res = await this.auth.passwordAuth(username, password);
    return res?.tokens ? res : { error: 'Invalid credentials' };
  }

  /**
   * Custom OTP initiate via notification provider
   */
  async customOtpInitiate(channel: 'email' | 'sms', email?: string, phone?: string) {
    const key = this.createOtpKey(channel, email, phone);
    const code = this.generateOtpCode();
    
    this.customOtpStore.set(key, { 
      code, 
      expiresAt: Date.now() + this.OTP_TTL_MS, 
      attempts: 0 
    });

    try {
      if (channel === 'email') {
        await this.notifier.sendEmail({
          to: email!,
          subject: 'Your login code',
          text: `Your one-time code is ${code}. It expires in 5 minutes.`,
        });
        this.logger.log(`OTP sent via email to ${email}`);
      } else {
        await this.notifier.sendSms({ 
          to: phone!, 
          message: `Code: ${code} (expires in 5m)` 
        });
        this.logger.log(`OTP sent via SMS to ${phone}`);
      }

      return {
        message: 'OTP sent',
        channel,
        ...(this.shouldIncludeDebugOtp() ? { debugOtp: code } : {}),
      };
    } catch (error) {
      this.logger.error(`Failed to send OTP via ${channel}`, error);
      this.customOtpStore.delete(key);
      throw new BadRequestException(`Failed to send OTP via ${channel}`);
    }
  }

  private shouldIncludeDebugOtp(): boolean {
    return process.env.PROVIDER_MODE !== 'aws' || process.env.NODE_ENV !== 'production';
  }

  /**
   * Custom OTP verify
   */
  async customOtpVerify(channel: 'email' | 'sms', code: string, email?: string, phone?: string): Promise<TokenResponse> {
    const key = this.createOtpKey(channel, email, phone);
    const entry = this.customOtpStore.get(key);
    
    if (!entry) {
      throw new UnauthorizedException('OTP not found. Please initiate again.');
    }
    
    if (Date.now() > entry.expiresAt) {
      this.customOtpStore.delete(key);
      throw new UnauthorizedException('OTP expired');
    }
    
    entry.attempts += 1;
    
    if (entry.attempts > this.MAX_OTP_ATTEMPTS) {
      this.customOtpStore.delete(key);
      throw new UnauthorizedException('Too many attempts');
    }
    
    if (entry.code !== code) {
      throw new UnauthorizedException('Invalid code');
    }
    
    this.customOtpStore.delete(key);
    this.logger.log(`OTP verified successfully for ${channel}: ${email || phone}`);

    return {
      message: 'Login successful',
      tokens: this.createMockTokens(),
    };
  }

  private createMockTokens(): AuthTokens {
    return {
      AccessToken: 'custom_mock_access_token',
      IdToken: 'custom_mock_id_token',
      RefreshToken: 'custom_mock_refresh_token',
      TokenType: 'Bearer',
      ExpiresIn: 3600,
    };
  }

  /**
   * Register onboarding
   * @param username - The username
   * @param password - The password
   * @param phone - The phone number
   * @returns The authentication response
   */
  async registerOnboarding(username: string, password: string, phone: string): Promise<{ message: string }> {
    const email = username.includes('@') ? username : undefined;
    
    if (this.auth.signUp) {
      try {
        const result = await this.auth.signUp(username, password, phone, email);
        this.logger.log(`User registration initiated for ${username}`);
        return result;
      } catch (error) {
        this.logger.error(`Registration failed for ${username}`, error);
        throw new BadRequestException('Registration failed');
      }
    }
    
    throw new BadRequestException('Sign up not supported in current provider mode');
  }
}
