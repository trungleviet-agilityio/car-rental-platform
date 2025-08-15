/**
 * Authentication Service
 * Business logic for authentication flows
 * Depends only on IAuthProvider and INotificationProvider abstractions
 */

import { Inject, Injectable, BadRequestException, UnauthorizedException, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { AUTH_PROVIDER, NOTIFICATION_PROVIDER } from '../../interfaces/tokens';
import { IAuthProvider, TokenResponse, AuthTokens } from '../../interfaces/auth.interface';
import { INotificationProvider } from '../../interfaces/notification.interface';
import { OtpEntry } from './interfaces/otp-entry.interface';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { ExceptionResponse } from '../../common/types/error.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly customOtpStore = new Map<string, OtpEntry>();
  private readonly OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_OTP_ATTEMPTS = 5;

  constructor(
    @Inject(AUTH_PROVIDER) private readonly auth: IAuthProvider,
    @Inject(NOTIFICATION_PROVIDER) private readonly notifier: INotificationProvider,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  // Provider-based authentication methods with enhanced error handling
  async initiateAuth(phone: string) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      this.logger.log('Initiating authentication', {
        phone: this.maskPhone(phone),
        provider: this.configService.get('AUTH_PROVIDER'),
        requestId,
        timestamp: new Date().toISOString()
      });

      const result = await this.auth.initiateAuth(phone);
      
      this.logger.log('Authentication initiated successfully', {
        phone: this.maskPhone(phone),
        provider: this.configService.get('AUTH_PROVIDER'),
        duration: Date.now() - startTime,
        requestId,
        success: true
      });

      return result;
    } catch (error) {
      this.logger.error('Authentication initiation failed', {
        phone: this.maskPhone(phone),
        provider: this.configService.get('AUTH_PROVIDER'),
        error: error.message,
        code: error.code,
        duration: Date.now() - startTime,
        requestId,
        timestamp: new Date().toISOString()
      });

      // Provider-specific error mapping
      if (error.code === 'UserNotFoundException') {
        throw new NotFoundException({
          message: 'User not found',
          error: 'NotFound',
          requestId,
          provider: this.configService.get('AUTH_PROVIDER')
        } as ExceptionResponse);
      }
      if (error.code === 'NotAuthorizedException') {
        throw new UnauthorizedException({
          message: 'Invalid credentials',
          error: 'Unauthorized',
          requestId,
          provider: this.configService.get('AUTH_PROVIDER')
        } as ExceptionResponse);
      }
      if (error.code === 'TooManyRequestsException') {
        throw new BadRequestException({
          message: 'Rate limit exceeded',
          error: 'TooManyRequests',
          requestId,
          provider: this.configService.get('AUTH_PROVIDER')
        } as ExceptionResponse);
      }
      if (error.code === 'LimitExceededException') {
        throw new BadRequestException({
          message: 'Too many authentication attempts',
          error: 'TooManyRequests',
          requestId,
          provider: this.configService.get('AUTH_PROVIDER')
        } as ExceptionResponse);
      }

      // Fallback to generic error
      throw new InternalServerErrorException({
        message: 'Authentication service temporarily unavailable',
        error: 'InternalServerError',
        requestId,
        provider: this.configService.get('AUTH_PROVIDER')
      } as ExceptionResponse);
    }
  }

  async respondToChallenge(session: string, otpCode: string, phone?: string) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      this.logger.log('Responding to authentication challenge', {
        session: this.maskSession(session),
        phone: phone ? this.maskPhone(phone) : undefined,
        provider: this.configService.get('AUTH_PROVIDER'),
        requestId,
        timestamp: new Date().toISOString()
      });

      const result = await this.auth.respondToChallenge(session, otpCode, phone);
      
      this.logger.log('Challenge response successful', {
        session: this.maskSession(session),
        phone: phone ? this.maskPhone(phone) : undefined,
        provider: this.configService.get('AUTH_PROVIDER'),
        duration: Date.now() - startTime,
        requestId,
        success: true
      });

      return result;
    } catch (error) {
      this.logger.error('Challenge response failed', {
        session: this.maskSession(session),
        phone: phone ? this.maskPhone(phone) : undefined,
        provider: this.configService.get('AUTH_PROVIDER'),
        error: error.message,
        code: error.code,
        duration: Date.now() - startTime,
        requestId,
        timestamp: new Date().toISOString()
      });

      // Provider-specific error mapping
      if (error.code === 'NotAuthorizedException') {
        throw new UnauthorizedException({
          message: 'Invalid OTP code',
          error: 'Unauthorized',
          requestId,
          provider: this.configService.get('AUTH_PROVIDER'),
          details: {
            attempts: 1,
            remainingAttempts: this.MAX_OTP_ATTEMPTS - 1
          }
        } as ExceptionResponse);
      }
      if (error.code === 'CodeMismatchException') {
        throw new UnauthorizedException({
          message: 'Invalid OTP code',
          error: 'Unauthorized',
          requestId,
          provider: this.configService.get('AUTH_PROVIDER'),
          details: {
            attempts: 1,
            remainingAttempts: this.MAX_OTP_ATTEMPTS - 1
          }
        } as ExceptionResponse);
      }
      if (error.code === 'ExpiredTokenException') {
        throw new UnauthorizedException({
          message: 'OTP session expired',
          error: 'Unauthorized',
          requestId,
          provider: this.configService.get('AUTH_PROVIDER')
        } as ExceptionResponse);
      }

      throw new InternalServerErrorException({
        message: 'Authentication service temporarily unavailable',
        error: 'InternalServerError',
        requestId,
        provider: this.configService.get('AUTH_PROVIDER')
      } as ExceptionResponse);
    }
  }

  async passwordLogin(username: string, password: string) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      this.logger.log('Password authentication attempt', {
        username: this.maskUsername(username),
        provider: this.configService.get('AUTH_PROVIDER'),
        requestId,
        timestamp: new Date().toISOString()
      });

      const res = await this.auth.passwordAuth(username, password);
      
      if (res?.tokens) {
        this.logger.log('Password authentication successful', {
          username: this.maskUsername(username),
          provider: this.configService.get('AUTH_PROVIDER'),
          duration: Date.now() - startTime,
          requestId,
          success: true
        });
        return res;
      } else {
        throw new UnauthorizedException({
          message: 'Invalid credentials',
          error: 'Unauthorized',
          requestId,
          provider: this.configService.get('AUTH_PROVIDER')
        } as ExceptionResponse);
      }
    } catch (error) {
      this.logger.error('Password authentication failed', {
        username: this.maskUsername(username),
        provider: this.configService.get('AUTH_PROVIDER'),
        error: error.message,
        code: error.code,
        duration: Date.now() - startTime,
        requestId,
        timestamp: new Date().toISOString()
      });

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Authentication service temporarily unavailable',
        error: 'InternalServerError',
        requestId,
        provider: this.configService.get('AUTH_PROVIDER')
      } as ExceptionResponse);
    }
  }

  async registerOnboarding(username: string, password: string, phone: string): Promise<{ message: string }> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const email = username.includes('@') ? username : undefined;
    
    try {
      this.logger.log('User registration initiated', {
        username: this.maskUsername(username),
        phone: this.maskPhone(phone),
        email: email ? this.maskEmail(email) : undefined,
        provider: this.configService.get('AUTH_PROVIDER'),
        requestId,
        timestamp: new Date().toISOString()
      });

      if (this.auth.signUp) {
        const result = await this.auth.signUp(username, password, phone, email);
        
        this.logger.log('User registration successful', {
          username: this.maskUsername(username),
          phone: this.maskPhone(phone),
          provider: this.configService.get('AUTH_PROVIDER'),
          duration: Date.now() - startTime,
          requestId,
          success: true
        });
        
        return result;
      } else {
        throw new BadRequestException({
          message: 'Sign up not supported in current provider mode',
          error: 'BadRequest',
          requestId,
          provider: this.configService.get('AUTH_PROVIDER')
        } as ExceptionResponse);
      }
    } catch (error) {
      this.logger.error('User registration failed', {
        username: this.maskUsername(username),
        phone: this.maskPhone(phone),
        provider: this.configService.get('AUTH_PROVIDER'),
        error: error.message,
        code: error.code,
        duration: Date.now() - startTime,
        requestId,
        timestamp: new Date().toISOString()
      });

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Registration service temporarily unavailable',
        error: 'InternalServerError',
        requestId,
        provider: this.configService.get('AUTH_PROVIDER')
      } as ExceptionResponse);
    }
  }

  // Custom OTP flow using notification providers with enhanced error handling
  async customOtpInitiate(channel: 'email' | 'sms', email?: string, phone?: string) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const key = this.createOtpKey(channel, email, phone);
    const code = this.generateOtpCode();
    
    try {
      this.logger.log('OTP initiation started', {
        channel,
        recipient: email || phone,
        provider: this.configService.get('NOTIFICATION_PROVIDER'),
        requestId,
        timestamp: new Date().toISOString()
      });

      this.customOtpStore.set(key, { 
        code, 
        expiresAt: Date.now() + this.OTP_TTL_MS, 
        attempts: 0 
      });

      if (channel === 'email') {
        await this.notifier.sendEmail({
          to: email!,
          subject: 'Your login code',
          text: `Your one-time code is ${code}. It expires in 5 minutes.`,
        });
        this.logger.log('OTP sent via email', {
          recipient: this.maskEmail(email!),
          provider: this.configService.get('NOTIFICATION_PROVIDER'),
          duration: Date.now() - startTime,
          requestId,
          success: true
        });
      } else {
        await this.notifier.sendSms({ 
          to: phone!, 
          message: `Code: ${code} (expires in 5m)` 
        });
        this.logger.log('OTP sent via SMS', {
          recipient: this.maskPhone(phone!),
          provider: this.configService.get('NOTIFICATION_PROVIDER'),
          duration: Date.now() - startTime,
          requestId,
          success: true
        });
      }

      return {
        message: 'OTP sent',
        channel,
        requestId,
        ...(this.shouldIncludeDebugOtp() ? { debugOtp: code } : {}),
      };
    } catch (error) {
      this.logger.error(`Failed to send OTP via ${channel}`, {
        channel,
        recipient: email || phone,
        provider: this.configService.get('NOTIFICATION_PROVIDER'),
        error: error.message,
        code: error.code,
        duration: Date.now() - startTime,
        requestId,
        timestamp: new Date().toISOString()
      });

      this.customOtpStore.delete(key);
      
      throw new InternalServerErrorException({
        message: `Failed to send OTP via ${channel}`,
        error: 'InternalServerError',
        requestId,
        provider: this.configService.get('NOTIFICATION_PROVIDER')
      } as ExceptionResponse);
    }
  }

  async customOtpVerify(channel: 'email' | 'sms', code: string, email?: string, phone?: string): Promise<TokenResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const key = this.createOtpKey(channel, email, phone);
    const entry = this.customOtpStore.get(key);
    
    try {
      this.logger.log('OTP verification attempt', {
        channel,
        recipient: email || phone,
        provider: this.configService.get('NOTIFICATION_PROVIDER'),
        requestId,
        timestamp: new Date().toISOString()
      });

      if (!entry) {
        throw new UnauthorizedException({
          message: 'OTP not found. Please initiate again.',
          error: 'Unauthorized',
          requestId,
          provider: this.configService.get('NOTIFICATION_PROVIDER')
        } as ExceptionResponse);
      }
      
      if (Date.now() > entry.expiresAt) {
        this.customOtpStore.delete(key);
        throw new UnauthorizedException({
          message: 'OTP expired',
          error: 'Unauthorized',
          requestId,
          provider: this.configService.get('NOTIFICATION_PROVIDER')
        } as ExceptionResponse);
      }
      
      entry.attempts += 1;
      
      if (entry.attempts > this.MAX_OTP_ATTEMPTS) {
        this.customOtpStore.delete(key);
        throw new BadRequestException({
          message: 'Too many attempts',
          error: 'TooManyRequests',
          requestId,
          provider: this.configService.get('NOTIFICATION_PROVIDER'),
          details: {
            attempts: entry.attempts,
            maxAttempts: this.MAX_OTP_ATTEMPTS
          }
        } as ExceptionResponse);
      }

      if (entry.code !== code) {
        throw new UnauthorizedException({
          message: 'Invalid code',
          error: 'Unauthorized',
          requestId,
          provider: this.configService.get('NOTIFICATION_PROVIDER'),
          details: {
            attempts: entry.attempts,
            remainingAttempts: this.MAX_OTP_ATTEMPTS - entry.attempts
          }
        } as ExceptionResponse);
      }
      
      this.customOtpStore.delete(key);
      this.logger.log('OTP verified successfully', {
        channel,
        recipient: email || phone,
        provider: this.configService.get('NOTIFICATION_PROVIDER'),
        duration: Date.now() - startTime,
        requestId,
        success: true
      });

      // Create or update user in database for both mock and real providers
      const userIdentifier = email || phone!;
      const cognitoSub = this.generateCognitoSub(userIdentifier);
      
      await this.usersService.upsertByCognitoSub({
        cognitoSub,
        username: email || phone,
        email,
        phoneNumber: phone,
      });

      return {
        message: 'Login successful',
        tokens: this.createMockTokens()
      };
    } catch (error) {
      this.logger.error('OTP verification failed', {
        channel,
        recipient: email || phone,
        provider: this.configService.get('NOTIFICATION_PROVIDER'),
        error: error.message,
        duration: Date.now() - startTime,
        requestId,
        timestamp: new Date().toISOString()
      });

      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'OTP verification service temporarily unavailable',
        error: 'InternalServerError',
        requestId,
        provider: this.configService.get('NOTIFICATION_PROVIDER')
      } as ExceptionResponse);
    }
  }

  // Private helper methods with security enhancements
  private createOtpKey(channel: 'email' | 'sms', email?: string, phone?: string) {
    return `${channel}:${email || phone}`;
  }

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateCognitoSub(identifier: string): string {
    return `mock_${identifier.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;
  }

  private createMockTokens(): AuthTokens {
    return {
      AccessToken: `mock_access_${Date.now()}`,
      IdToken: `mock_id_${Date.now()}`,
      RefreshToken: `mock_refresh_${Date.now()}`,
      TokenType: 'Bearer',
      ExpiresIn: 3600,
    };
  }

  private shouldIncludeDebugOtp(): boolean {
    return this.configService.get('DEBUG_INCLUDE_OTP', 'false') === 'true';
  }

  // Security helper methods for logging
  private maskPhone(phone: string): string {
    if (!phone) return 'undefined';
    return phone.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{4})/, '$1***$3$4');
  }

  private maskEmail(email: string): string {
    if (!email) return 'undefined';
    const [local, domain] = email.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  }

  private maskUsername(username: string): string {
    if (!username) return 'undefined';
    if (username.includes('@')) {
      return this.maskEmail(username);
    }
    return username.substring(0, 2) + '***';
  }

  private maskSession(session: string): string {
    if (!session) return 'undefined';
    return session.substring(0, 8) + '***';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}