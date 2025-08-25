/**
 * Mock Auth Token Adapter
 * Validates mock authentication tokens
 */

import { Injectable } from '@nestjs/common';
import { IAuthTokenValidator, AuthClaims } from '../../interfaces/auth-token.interface';

@Injectable()
export class MockAuthTokenAdapter implements IAuthTokenValidator {
  async validate(authHeader?: string): Promise<AuthClaims> {
    // Feature flag to disable auth in PoC
    if (process.env.DISABLE_AUTH === 'true') {
      return { sub: 'mock-user', email: 'mock@example.com', roles: ['renter'] };
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid Authorization header');
    }
    const token = authHeader.substring('Bearer '.length);
    // For PoC, accept any string and map to mock claims
    return { sub: token || 'mock-user', roles: ['renter'] };
  }
}
