import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

class InitiateAuthDto {
  phone_number!: string;
}

class RespondToChallengeDto {
  session!: string;
  otp_code!: string;
  phone_number?: string;
}
class PasswordLoginDto {
  username!: string;
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    if (body.action === 'initiate_auth') {
      const dto = body as InitiateAuthDto;
      return this.authService.initiateAuth(dto.phone_number);
    }
    if (body.action === 'respond_to_challenge') {
      const dto = body as RespondToChallengeDto;
      return this.authService.respondToChallenge(dto.session, dto.otp_code, dto.phone_number);
    }
    if (body.action === 'password') {
      const dto = body as PasswordLoginDto;
      return this.authService.passwordLogin(dto.username, dto.password);
    }
    return { error: 'Invalid action' };
  }
}
