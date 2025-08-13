/**
 * Mock auth provider
 */

import { Logger } from '@nestjs/common';
import { IAuthProvider, AuthResponse, TokenResponse, AuthTokens } from '../ports/auth.interface';
export class MockAuthProvider implements IAuthProvider {
  private readonly logger = new Logger(MockAuthProvider.name);

  /**
   * Initiate authentication
   * @param phoneNumber - The phone number
   * @returns The authentication response
   */
  async initiateAuth(phoneNumber: string): Promise<AuthResponse> { 
    this.logger.log(`Mock auth initiated for ${phoneNumber}`);
    return { 
      message: 'OTP sent successfully (simulated)', 
      session: 'mock_session', 
      challenge_name: 'SMS_MFA' 
    }; 
  }

  /**
   * Sign up a new user (mock implementation)
   * @param username - The username
   * @param password - The password
   * @param phone - The phone number
   * @param email - The email
   * @returns Mock signup response
   */
  async signUp(username: string, password: string, phone?: string, email?: string): Promise<{ message: string }> {
    this.logger.log(`Mock signup initiated for ${username}`);
    return { message: 'Sign up initiated (simulated). User automatically confirmed in mock mode.' };
  }

  /**
   * Confirm sign up (mock implementation)
   * @param username - The username
   * @param code - The confirmation code
   * @returns Mock confirmation response
   */
  async confirmSignUp(username: string, code: string): Promise<{ message: string }> {
    this.logger.log(`Mock confirmation for ${username} with code ${code}`);
    return { message: 'Sign up confirmed (simulated)' };
  }
    
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
  ): Promise<TokenResponse> {
    this.logger.log(`Mock challenge response for session ${session}`);
    
    const tokens: AuthTokens = {
      AccessToken: 'mock_access_token',
      IdToken: 'mock_id_token',
      RefreshToken: 'mock_refresh_token',
      TokenType: 'Bearer',
      ExpiresIn: 3600,
    };

    if (session === 'mock_session') {
      return {
        message: 'Login successful',
        tokens,
      };
    }
    
    return { 
      message: 'Invalid OTP code', 
      tokens,
    };
  }

  /**
   * Password authentication
   * @param username - The username
   * @param password - The password
   * @returns The authentication response
   */
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
}

