/**
 * Auth User Decorator
 * Extracts authentication claims from the request
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthClaims } from '../../interfaces/auth-token.interface';
import { RequestWithAuth } from '../types/auth.types';

export const AuthUser = createParamDecorator((data: unknown, ctx: ExecutionContext): AuthClaims | undefined => {
  const request = ctx.switchToHttp().getRequest<RequestWithAuth>();
  return request.auth;
});
