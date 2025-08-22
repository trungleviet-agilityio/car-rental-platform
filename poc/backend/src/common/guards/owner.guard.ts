/**
 * Owner Guard
 * Checks if the user is an owner or admin
 */

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class OwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (process.env.DISABLE_AUTH === 'true') return true;
    const req = context.switchToHttp().getRequest();
    const claims = (req as any).auth as { roles?: string[] } | undefined;
    const roles = claims?.roles || [];
    return roles.includes('owner') || roles.includes('admin');
  }
}
