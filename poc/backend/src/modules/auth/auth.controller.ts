/**
 * Auth controller
 */

import { Body, Controller, Post } from '@nestjs/common';
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
  async login(@Body() body: LoginActionDto) {
    if (body.action === 'initiate_auth') {
      return this.authService.initiateAuth(body.phone_number!);
    }
    if (body.action === 'respond_to_challenge') {
      return this.authService.respondToChallenge(body.session!, body.otp_code!, body.phone_number);
    }
    if (body.action === 'password') {
      return this.authService.passwordLogin(body.username!, body.password!);
    }
    return { error: 'Invalid action' };
  }

  /**
   * Register Onboarding
   * @param body - The register onboarding action
   * @returns The register onboarding response
   */
  @Post('register')
  async register(@Body() body: RegisterOnboardingDto) {
    return this.authService.registerOnboarding(body.username!, body.password!, body.phone_number!);
  }
}
