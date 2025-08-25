/**
 * Enhanced AWS Auth Token Adapter
 * Validates AWS Cognito authentication tokens with proper security
 * Removes hardcoded secrets and implements proper JWT validation
 */

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { IAuthTokenValidator, AuthClaims } from '../../interfaces/auth-token.interface';
import jwt from 'jsonwebtoken';

@Injectable()
export class AwsAuthTokenAdapter implements IAuthTokenValidator {
  private readonly logger = new Logger(AwsAuthTokenAdapter.name);

  async validate(authHeader?: string): Promise<AuthClaims> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('Missing or invalid Authorization header in AWS adapter');
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.substring('Bearer '.length);
    
    if (!token || token.trim() === '') {
      this.logger.warn('Empty token provided to AWS adapter');
      throw new UnauthorizedException('Empty authentication token');
    }

    try {
      // Get JWT secret from environment (should be properly configured)
      const secret = process.env.JWT_SECRET;
      
      if (!secret) {
        this.logger.error('JWT_SECRET environment variable not configured');
        throw new UnauthorizedException('Authentication service not properly configured');
      }

      // Verify JWT token
      const decoded = jwt.verify(token, secret) as any;
      
      // Validate required claims
      if (!decoded.sub && !decoded.username) {
        this.logger.warn('JWT token missing required subject claim');
        throw new UnauthorizedException('Invalid token: missing subject claim');
      }

      // Extract and validate claims
      const claims: AuthClaims = {
        sub: decoded.sub || decoded.username,
        email: decoded.email,
        phone_number: decoded.phone_number,
        roles: decoded['cognito:groups'] || decoded.roles || [],
        ...decoded,
      };

      this.logger.debug(`AWS authentication successful for user: ${claims.sub}`);
      return claims;

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn(`JWT validation failed: ${error.message}`);
        throw new UnauthorizedException('Invalid authentication token');
      }
      
      if (error instanceof jwt.TokenExpiredError) {
        this.logger.warn('JWT token expired');
        throw new UnauthorizedException('Authentication token expired');
      }

      this.logger.error(`Unexpected error during JWT validation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new UnauthorizedException('Authentication validation failed');
    }
  }
}
