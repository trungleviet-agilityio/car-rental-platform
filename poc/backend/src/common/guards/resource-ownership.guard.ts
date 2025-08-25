/**
 * Resource Ownership Guard
 * Ensures users can only access resources they own
 * Follows DIP principles and implements proper authorization
 */

import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { RequestWithAuth } from '../types/auth.types';
import { AuthClaims } from '../../interfaces/auth-token.interface';

@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  private readonly logger = new Logger(ResourceOwnershipGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const claims = req.auth as AuthClaims | undefined;
    
    if (!claims) {
      this.logger.warn('No authentication claims found for resource ownership guard');
      throw new ForbiddenException('Authentication required for resource access');
    }

    // Extract the resource owner identifier from request
    const resourceOwnerId = this.extractResourceOwnerId(req);
    
    if (!resourceOwnerId) {
      this.logger.warn('No resource owner identifier found in request');
      throw new ForbiddenException('Resource owner identifier required');
    }

    // Check if the authenticated user owns the resource
    if (claims.sub !== resourceOwnerId) {
      this.logger.warn(`User ${claims.sub} attempted to access resource owned by ${resourceOwnerId}`);
      throw new ForbiddenException('Cannot access resource owned by another user');
    }

    this.logger.debug(`Resource access granted for user: ${claims.sub}`);
    return true;
  }

  private extractResourceOwnerId(req: RequestWithAuth): string | null {
    // Check path parameters first (e.g., /bookings/:cognitoSub)
    if (req.params.cognitoSub) {
      return req.params.cognitoSub;
    }

    // Check request body (e.g., POST /bookings with cognitoSub in body)
    if (req.body?.cognitoSub) {
      return req.body.cognitoSub;
    }

    // Check query parameters (e.g., /users?cognitoSub=...)
    if (req.query?.cognitoSub) {
      return req.query.cognitoSub as string;
    }

    return null;
  }
}
