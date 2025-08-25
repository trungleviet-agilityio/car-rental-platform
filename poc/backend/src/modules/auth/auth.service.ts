/**
 * Authentication Service - Simple POC implementation with DIP
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AUTH_PROVIDER } from '../../interfaces/tokens';
import { IAuthProvider } from '../../interfaces/auth.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(AUTH_PROVIDER) private readonly authProvider: IAuthProvider,
    private readonly usersService: UsersService,
  ) {}

  // OTP Authentication Flow (from sequence diagram)
  async initiateOtpAuth(phoneNumber: string) {
    return this.authProvider.initiateAuth(phoneNumber);
  }

  async verifyOtp(phoneNumber: string, code: string) {
    const result = await this.authProvider.respondToChallenge('mock_session', code, phoneNumber);
    
    // Create or update user
    const cognitoSub = `user_${phoneNumber.replace(/\D/g, '')}`;
    await this.usersService.upsertByCognitoSub({
      cognitoSub,
      phoneNumber,
      username: phoneNumber,
    });
    
    return result;
  }

  // Email/Password Authentication Flow (from sequence diagram)
  async signUp(email: string, password: string, phone?: string) {
    if (!this.authProvider.signUp) {
      throw new Error('Sign up not supported by current auth provider');
    }
    
    const result = await this.authProvider.signUp(email, password, phone);
    
    // Create user in our database
    const cognitoSub = `user_${Date.now()}`;
    await this.usersService.upsertByCognitoSub({
      cognitoSub,
      email,
      username: email,
      ...(phone && { phoneNumber: phone }),
    });
    
    return result;
  }

  async confirmSignUp(email: string, code: string) {
    if (!this.authProvider.confirmSignUp) {
      throw new Error('Sign up confirmation not supported by current auth provider');
    }
    
    return this.authProvider.confirmSignUp(email, code);
  }

  async signIn(email: string, password: string) {
    return this.authProvider.passwordAuth(email, password);
  }
}
