/**
 * KYC Module
 * Contains KYC verification business logic
 */

import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { UsersModule } from '../users/users.module';
import { StorageModule } from '../storage/storage.module';
import { ProvidersModule } from '../../providers/providers.module';

@Module({
  imports: [UsersModule, StorageModule, ProvidersModule],
  controllers: [KycController],
})
export class KycModule {}