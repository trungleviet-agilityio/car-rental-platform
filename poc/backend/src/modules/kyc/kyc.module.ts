/**
 * KYC module
 */

import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [AuthModule, UsersModule, ProvidersModule],
  controllers: [KycController],
})
export class KycModule {}
