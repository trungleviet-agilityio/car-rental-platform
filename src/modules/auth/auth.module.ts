/*
 * Auth Module - Authentication and onboarding module
 * Implements proper Dependency Inversion Principle (DIP) with service abstractions
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

// Application Layer
import { AuthService } from './application/services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

// Presentation Layer
import { AuthController } from './presentation/auth.controller';

// Infrastructure
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';

// Shared
import { SharedModule } from '@/shared/shared.module';  

@Module({
  imports: [
    SharedModule,
    InfrastructureModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService) => ({
        secret: configService.get('JWT_SECRET') || 'default-secret',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '1h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
