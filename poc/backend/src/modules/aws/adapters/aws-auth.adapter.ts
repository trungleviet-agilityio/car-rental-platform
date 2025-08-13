/**
 * AWS auth adapter
 */

import { Injectable } from '@nestjs/common';
import { IAuthProvider, AuthResponse, TokenResponse } from '../../../services/ports/auth.interface';
import { AwsService } from '../aws.service';

@Injectable()
export class AwsAuthAdapter implements IAuthProvider {
  constructor(private readonly aws: AwsService) {}

  /**
   * Initiate auth
   * @param phoneNumber - The phone number
   * @returns The initiate auth response
   */
  async initiateAuth(phoneNumber: string): Promise<AuthResponse> {
    return this.aws.initiateAuth(phoneNumber);
  }

  /**
   * Respond to challenge
   * @param session - The session
   * @param otpCode - The OTP code
   * @param phone - The phone number
   * @returns The respond to challenge response
   */
  async respondToChallenge(session: string, otpCode: string, phone?: string): Promise<TokenResponse> {
    return this.aws.respondToChallenge(session, otpCode, phone);
  }

  /**
   * Password auth
   * @param username - The username
   * @param password - The password
   * @returns The password auth response
   */
  async passwordAuth(username: string, password: string): Promise<TokenResponse> {
    return this.aws.passwordAuth(username, password);
  }

  /** Sign up */
  async signUp(username: string, password: string, phone?: string, email?: string): Promise<{ message: string }> {
    return this.aws.signUp(username, password, phone, email);
  }

  /** Confirm sign up */
  async confirmSignUp(username: string, code: string): Promise<{ message: string }> {
    return this.aws.confirmSignUp(username, code);
  }
}
