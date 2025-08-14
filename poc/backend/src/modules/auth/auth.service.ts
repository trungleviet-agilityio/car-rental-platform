/**
 * Authentication Service
 * Business logic for authentication flows
 * Depends only on IAuthProvider and INotificationProvider abstractions
 */

import { Inject, Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { AUTH_PROVIDER, NOTIFICATION_PROVIDER } from '../../interfaces/tokens';
import { IAuthProvider, TokenResponse, AuthTokens } from '../../interfaces/auth.interface';
import { INotificationProvider } from '../../interfaces/notification.interface';
import { OtpEntry } from './interfaces/otp-entry.interface';

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

  // Provider-based authentication methods
  async initiateAuth(phone: string) {
    return this.auth.initiateAuth(phone);
  }

  async respondToChallenge(session: string, otpCode: string, phone?: string) {
    return this.auth.respondToChallenge(session, otpCode, phone);
  }

  async passwordLogin(username: string, password: string) {
    const res = await this.auth.passwordAuth(username, password);
    return res?.tokens ? res : { error: 'Invalid credentials' };
  }

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

  // Custom OTP flow using notification providers
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

  // Private helper methods
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

  private shouldIncludeDebugOtp(): boolean {
    if (process.env.DEBUG_INCLUDE_OTP) return process.env.DEBUG_INCLUDE_OTP === 'true';
    return process.env.NODE_ENV !== 'production';
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
}