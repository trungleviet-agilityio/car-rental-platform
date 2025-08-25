/**
 * Auth Guard
 * Validates authentication tokens
 */

import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { AUTH_TOKEN_VALIDATOR } from '../../interfaces/tokens';
import { IAuthTokenValidator } from '../../interfaces/auth-token.interface';
import { RequestWithAuth } from '../types/auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_TOKEN_VALIDATOR) private readonly tokenValidator: IAuthTokenValidator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.DISABLE_AUTH === 'true') return true;

    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const auth = req.headers['authorization'] as string | undefined;
    const claims = await this.tokenValidator.validate(auth);
    req.auth = claims;
    return true;
  }
}
