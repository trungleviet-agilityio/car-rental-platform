import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/shared/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    const request = context.switchToHttp().getRequest<Request>();

    // Log authentication attempts for audit
    this.logger.debug(`Authentication attempt for ${request.url}`, {
      ip: request.ip,
      userAgent: request.get('User-Agent'),
      hasUser: !!user,
      error: err?.message,
      info: info?.message,
    });

    if (err || !user) {
      this.logger.warn(
        `Authentication failed: ${err?.message || info?.message || 'Unknown error'}`,
        {
          ip: request.ip,
          url: request.url,
        },
      );

      throw (
        err ||
        new UnauthorizedException(info?.message || 'Authentication required')
      );
    }

    return user;
  }
}
