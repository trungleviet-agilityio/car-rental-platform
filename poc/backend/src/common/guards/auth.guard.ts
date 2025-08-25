/**
 * Enhanced Auth Guard
 * Validates authentication tokens with proper security
 * Follows DIP principles with dependency injection
 */

import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AUTH_TOKEN_VALIDATOR } from '../../interfaces/tokens';
import { IAuthTokenValidator } from '../../interfaces/auth-token.interface';
import { RequestWithAuth } from '../types/auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    @Inject(AUTH_TOKEN_VALIDATOR) private readonly tokenValidator: IAuthTokenValidator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const auth = req.headers['authorization'] as string | undefined;

    if (!auth || !auth.startsWith('Bearer ')) {
      this.logger.warn('Missing or invalid Authorization header');
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    try {
      const claims = await this.tokenValidator.validate(auth);
      req.auth = claims;
      this.logger.debug(`Authentication successful for user: ${claims.sub}`);
      return true;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}
