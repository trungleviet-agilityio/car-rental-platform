import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/shared/database/prisma.service';
import { JwtPayload, AuthenticatedUser } from '@/core/types/auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const { sub, email, cognitoSub } = payload;

    if (!sub || !email || !cognitoSub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Find user by ID and ensure they're active
    const user = await this.prismaService.user.findFirst({
      where: {
        id: sub,
        cognitoSub,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Verify email matches
    if (user.email !== email) {
      throw new UnauthorizedException('Token email mismatch');
    }

    // Update last login
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Return user without sensitive fields for AuthenticatedUser type
    return {
      id: user.id,
      cognitoSub: user.cognitoSub,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      role: user.role,
      isActive: user.isActive,
      profileCompleted: user.profileCompleted,
      kycStatus: user.kycStatus,
      emailVerified: user.emailVerified,
    };
  }
}
