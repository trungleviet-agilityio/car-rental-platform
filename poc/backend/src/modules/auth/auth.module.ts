/**
 * Auth Module
 * Contains authentication business logic
 * Imports ProvidersModule for DI
 */

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ProvidersModule } from '../../providers/providers.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ProvidersModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}