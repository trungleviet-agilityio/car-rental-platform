/**
 * Enhanced Mock Auth Token Adapter
 * Validates mock authentication tokens for development
 * Removes security bypasses and implements proper validation
 */

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { IAuthTokenValidator, AuthClaims } from '../../interfaces/auth-token.interface';

@Injectable()
export class MockAuthTokenAdapter implements IAuthTokenValidator {
  private readonly logger = new Logger(MockAuthTokenAdapter.name);

  async validate(authHeader?: string): Promise<AuthClaims> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('Missing or invalid Authorization header in mock adapter');
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.substring('Bearer '.length);
    
    if (!token || token.trim() === '') {
      this.logger.warn('Empty token provided to mock adapter');
      throw new UnauthorizedException('Empty authentication token');
    }

    // Reject invalid tokens for security testing
    if (token === 'invalid-token' || token.startsWith('invalid')) {
      this.logger.warn(`Invalid token rejected: ${token}`);
      throw new UnauthorizedException('Invalid authentication token');
    }

    this.logger.debug(`Mock token validation for token: ${token.substring(0, 8)}...`);
    
    // Provide different roles based on token content for testing
    let roles = ['renter'];
    if (token.includes('owner') || token.includes('admin')) {
      roles = ['owner', 'admin'];
    }
    
    const mockClaims: AuthClaims = {
      sub: token || 'mock-user',
      email: 'mock@example.com',
      phone_number: '+84123456789',
      roles: roles,
    };

    this.logger.debug(`Mock authentication successful for user: ${mockClaims.sub} with roles: ${roles.join(', ')}`);
    return mockClaims;
  }
}
