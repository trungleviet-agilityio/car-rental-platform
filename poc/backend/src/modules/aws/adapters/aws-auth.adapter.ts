/**
 * AWS auth adapter
 */

import { Injectable } from '@nestjs/common';
import { IAuthProvider } from '../../../services/ports/auth.interface';
import { AwsService } from '../aws.service';

@Injectable()
export class AwsAuthAdapter implements IAuthProvider {
  constructor(private readonly aws: AwsService) {}

  /**
   * Initiate auth
   * @param phoneNumber - The phone number
   * @returns The initiate auth response
   */
  async initiateAuth(phoneNumber: string): Promise<{ message: string; session: string; challenge_name: string }> {
    return this.aws.initiateAuth(phoneNumber) as Promise<{ message: string; session: string; challenge_name: string }>;
  }

  /**
   * Respond to challenge
   * @param session - The session
   * @param otpCode - The OTP code
   * @param phone - The phone number
   * @returns The respond to challenge response
   */
  async respondToChallenge(session: string, otpCode: string, phone?: string): Promise<{ message: string; tokens: { AccessToken: string; IdToken: string; RefreshToken: string; TokenType: string; ExpiresIn: number } }> {
    return this.aws.respondToChallenge(session, otpCode, phone) as Promise<{ message: string; tokens: { AccessToken: string; IdToken: string; RefreshToken: string; TokenType: string; ExpiresIn: number } }>;
  }

  /**
   * Password auth
   * @param username - The username
   * @param password - The password
   * @returns The password auth response
   */
  async passwordAuth(username: string, password: string): Promise<{ message: string; tokens: { AccessToken: string; IdToken: string; RefreshToken: string; TokenType: string; ExpiresIn: number } }> {
    return this.aws.passwordAuth(username, password) as Promise<{ message: string; tokens: { AccessToken: string; IdToken: string; RefreshToken: string; TokenType: string; ExpiresIn: number } }>;
  }
}
