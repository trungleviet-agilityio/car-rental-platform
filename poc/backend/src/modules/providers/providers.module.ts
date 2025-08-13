/**
 * Providers module
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AwsModule } from '../aws/aws.module';
import { AUTH_PROVIDER, STORAGE_PROVIDER, KYC_WORKFLOW, NOTIFICATION_PROVIDER } from '../../services/ports/tokens';
import { MockAuthProvider } from '../../services/mocks/mock-auth.provider';
import { AwsAuthAdapter } from '../aws/adapters/aws-auth.adapter';
import { AwsKycAdapter } from '../aws/adapters/aws-kyc.adapter';
import { AwsStorageAdapter } from '../aws/adapters/aws-storage.adapter';
import { AwsNotificationAdapter } from '../aws/adapters/aws-notification.adapter';
import { AwsService } from '../aws/aws.service';
import { MockKycProvider } from '../../services/mocks/mock-kyc.provider';
import { MockStorageProvider } from '../../services/mocks/mock-storage.provider';
import { MockNotificationProvider } from '../../services/mocks/mock-notification.provider';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AwsModule],
  providers: [
    {
      provide: AUTH_PROVIDER,
      inject: [ConfigService, AwsService],
      useFactory: (cfg: ConfigService, aws: AwsService) =>
        cfg.get('PROVIDER_MODE', 'mock') === 'aws' ? new AwsAuthAdapter(aws) : new MockAuthProvider(),
    },
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService, AwsService],
      useFactory: (cfg: ConfigService, aws: AwsService) =>
        cfg.get('PROVIDER_MODE', 'mock') === 'aws' ? new AwsStorageAdapter(aws) : new MockStorageProvider(),
    },
    {
      provide: KYC_WORKFLOW,
      inject: [ConfigService, AwsService],
      useFactory: (cfg: ConfigService, aws: AwsService) =>
        cfg.get('PROVIDER_MODE', 'mock') === 'aws' ? new AwsKycAdapter(aws) : new MockKycProvider(),
    },
    {
      provide: NOTIFICATION_PROVIDER,
      inject: [ConfigService, AwsService],
      useFactory: (cfg: ConfigService, aws: AwsService) =>
        cfg.get('PROVIDER_MODE', 'mock') === 'aws'
          ? new AwsNotificationAdapter(aws)
          : new MockNotificationProvider(),
    },
  ],
  exports: [AUTH_PROVIDER, STORAGE_PROVIDER, KYC_WORKFLOW, NOTIFICATION_PROVIDER],
})
export class ProvidersModule {}
