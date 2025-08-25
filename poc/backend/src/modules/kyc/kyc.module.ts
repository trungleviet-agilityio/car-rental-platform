/**
 * KYC Module - Lambda integration with DIP
 */

import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';
import { ProvidersModule } from '../../providers/providers.module';
import { GuardsModule } from '../../common/guards/guards.module';

@Module({
  imports: [
    StorageModule,
    UsersModule,
    ProvidersModule,
    GuardsModule,
  ],
  controllers: [KycController],
})
export class KycModule {}
