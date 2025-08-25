/**
 * Enhanced Owner Guard
 * Checks if the user has owner or admin privileges
 * Follows DIP principles with proper error handling
 */

import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { RequestWithAuth } from '../types/auth.types';
import { AuthClaims } from '../../interfaces/auth-token.interface';

@Injectable()
export class OwnerGuard implements CanActivate {
  private readonly logger = new Logger(OwnerGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const claims = req.auth as AuthClaims | undefined;
    
    if (!claims || !claims.roles) {
      this.logger.warn('No authentication claims found for owner guard');
      throw new ForbiddenException('Authentication required for owner access');
    }

    const hasOwnerRole = claims.roles.includes('owner') || claims.roles.includes('admin');
    
    if (!hasOwnerRole) {
      this.logger.warn(`User ${claims.sub} attempted owner access without proper role`);
      throw new ForbiddenException('Owner or admin role required');
    }

    this.logger.debug(`Owner access granted for user: ${claims.sub}`);
    return true;
  }
}
