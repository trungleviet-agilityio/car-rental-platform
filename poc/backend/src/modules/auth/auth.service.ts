/**
 * Auth service
 */

import { Inject, Injectable } from '@nestjs/common';
import { AUTH_PROVIDER } from '../../services/ports/tokens';
import { IAuthProvider } from '../../services/ports/auth.interface';

@Injectable()
export class AuthService {
  constructor(@Inject(AUTH_PROVIDER) private readonly auth: IAuthProvider) {}

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
   * Register onboarding
   * @param username - The username
   * @param password - The password
   * @param phone - The phone number
   * @returns The authentication response
   */
  async registerOnboarding(username: string, password: string, phone: string) {
    // return { error: 'Not implemented' };
    // pass for now
    return { message: 'Register onboarding successful' };
  }
}
