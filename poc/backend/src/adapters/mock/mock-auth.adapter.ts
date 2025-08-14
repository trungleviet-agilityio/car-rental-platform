/**
 * Mock Authentication Adapter
 * Implements IAuthProvider for development and testing
 */

import { Injectable, Logger } from '@nestjs/common';
import { IAuthProvider, AuthResponse, TokenResponse, AuthTokens } from '../../interfaces/auth.interface';

@Injectable()
export class MockAuthAdapter implements IAuthProvider {
  private readonly logger = new Logger(MockAuthAdapter.name);

  async initiateAuth(phoneNumber: string): Promise<AuthResponse> {
    this.logger.log(`Mock auth initiated for ${phoneNumber}`);
    return {
      message: 'OTP sent successfully (simulated)',
      session: 'mock_session',
      challenge_name: 'SMS_MFA'
    };
  }

  async respondToChallenge(session: string, otpCode: string, phone?: string): Promise<TokenResponse> {
    this.logger.log(`Mock challenge response for session ${session} with code ${otpCode}`);
    
    const tokens: AuthTokens = {
      AccessToken: 'mock_access_token',
      IdToken: 'mock_id_token',
      RefreshToken: 'mock_refresh_token',
      TokenType: 'Bearer',
      ExpiresIn: 3600,
    };

    return {
      message: 'Login successful',
      tokens,
    };
  }

  async passwordAuth(username: string, password: string): Promise<TokenResponse> {
    this.logger.log(`Mock password auth for ${username}`);
    
    return {
      message: 'Login successful (simulated)',
      tokens: {
        AccessToken: 'mock_access_token',
        IdToken: 'mock_id_token',
        RefreshToken: 'mock_refresh_token',
        TokenType: 'Bearer',
        ExpiresIn: 3600,
      },
    };
  }

  async signUp(username: string, password: string, phone?: string, email?: string): Promise<{ message: string }> {
    this.logger.log(`Mock signup for ${username}`);
    return { message: 'Sign up initiated (simulated). User automatically confirmed in mock mode.' };
  }

  async confirmSignUp(username: string, code: string): Promise<{ message: string }> {
    this.logger.log(`Mock confirmation for ${username} with code ${code}`);
    return { message: 'Sign up confirmed (simulated)' };
  }
}
