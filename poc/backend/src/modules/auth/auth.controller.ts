/**
 * Auth controller
 */

import { Body, Controller, Post, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginActionDto } from './dto/login.dto';
import { RegisterOnboardingDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login
   * @param body - The login action
   * @returns The login response
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginActionDto) {
    // New custom OTP flows using notification adapters
    if (body.action === 'otp_initiate') {
      const channel = (body.channel || (body.email ? 'email' : 'sms')) as 'email' | 'sms';
      return this.authService.customOtpInitiate(channel, body.email, body.phone_number);
    }
    if (body.action === 'otp_verify') {
      const channel = (body.channel || (body.email ? 'email' : 'sms')) as 'email' | 'sms';
      return this.authService.customOtpVerify(channel, body.otp_code!, body.email, body.phone_number);
    }
    if (body.action === 'initiate_auth') {
      return this.authService.initiateAuth(body.phone_number!);
    }
    if (body.action === 'respond_to_challenge') {
      return this.authService.respondToChallenge(body.session!, body.otp_code!, body.phone_number);
    }
    if (body.action === 'password') {
      const res = await this.authService.passwordLogin(body.username!, body.password!);
      if (!('tokens' in res)) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return res;
    }
    return { error: 'Invalid action' };
  }

  /**
   * Register Onboarding
   * @param body - The register onboarding action
   * @returns The register onboarding response
   */
  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() body: RegisterOnboardingDto) {
    return this.authService.registerOnboarding(body.username!, body.password!, body.phone_number!);
  }

  /**
   * Confirm sign up
   */
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(@Body() body: { username: string; code: string }) {
    const authProvider = (this.authService as any).auth;
    if (authProvider?.confirmSignUp) {
      return authProvider.confirmSignUp(body.username, body.code);
    }
    return { error: 'Confirm not supported in current provider mode' };
  }
}
