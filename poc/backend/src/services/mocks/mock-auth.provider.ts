/**
 * Mock auth provider
 */

import { IAuthProvider } from '../ports/auth.interface';
export class MockAuthProvider implements IAuthProvider {
  /**
   * Initiate authentication
   * @param _ - The phone number
   * @returns The authentication response
   */
  async initiateAuth(_: string): Promise<{ message: string; session: string; challenge_name: string }> { return { message: 'OTP sent successfully (simulated)', session: 'mock_session', challenge_name: 'SMS_MFA' }; }
    
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
  ): Promise<{
    message: string;
    tokens: {
      AccessToken: string;
      IdToken: string;
      RefreshToken: string;
      TokenType: string; ExpiresIn: number;
    };
  }> {
    if (session === 'mock_session') {
      return {
        message: 'Login successful',
        tokens: {
          AccessToken: 'mock_access_token',
          IdToken: 'mock_id_token',
          RefreshToken: 'mock_refresh_token',
          TokenType: 'Bearer', ExpiresIn: 3600,
        },
      };
    }
    return { 
      message: 'Invalid OTP code', 
      tokens: { 
        AccessToken: 'mock_access_token', 
        IdToken: 'mock_id_token', 
        RefreshToken: 'mock_refresh_token', 
        TokenType: 'Bearer', ExpiresIn: 3600,
      },
    };
  }

  /**
   * Password authentication
   * @param _ - The username
   * @param __ - The password
   * @returns The authentication response
   */
  async passwordAuth(_: string, __: string): Promise<{
    message: string;
    tokens: {
      AccessToken: string;
      IdToken: string;
      RefreshToken: string;
      TokenType: string;
      ExpiresIn: number;
    };
  }> { return { 
    message: 'Login successful (simulated)', 
    tokens: { 
      AccessToken: 'mock', 
      IdToken: 'mock', 
      RefreshToken: 'mock', 
      TokenType: 'Bearer', 
      ExpiresIn: 3600,
    },
    };
  }
}

