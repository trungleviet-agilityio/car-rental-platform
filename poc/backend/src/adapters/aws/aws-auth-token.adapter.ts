/**
 * AWS Auth Token Adapter
 * Validates AWS Cognito authentication tokens
 */

import { Injectable } from '@nestjs/common';
import { IAuthTokenValidator, AuthClaims } from '../../interfaces/auth-token.interface';
import jwt from 'jsonwebtoken';

@Injectable()
export class AwsAuthTokenAdapter implements IAuthTokenValidator {
  async validate(authHeader?: string): Promise<AuthClaims> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid Authorization header');
    }
    const token = authHeader.substring('Bearer '.length);

    // Minimal JWT verification for PoC (in real use JWKS/Cognito jwk)
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as any;
    return {
      sub: decoded.sub || decoded.username || 'unknown',
      email: decoded.email,
      phone_number: decoded.phone_number,
      roles: decoded['cognito:groups'] || decoded.roles || [],
      ...decoded,
    };
  }
}
