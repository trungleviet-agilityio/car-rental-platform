/**
 * KYC Module
 * Contains KYC verification business logic
 */

import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { UsersModule } from '../users/users.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [UsersModule, StorageModule],
  controllers: [KycController],
})
export class KycModule {}