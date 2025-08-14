/**
 * Providers Module
 * Configures dependency injection for third-party service adapters
 * Following Dependency Inversion Principle (DIP)
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// DI Tokens
import { 
  AUTH_PROVIDER, 
  NOTIFICATION_PROVIDER, 
  STORAGE_PROVIDER, 
  PAYMENT_PROVIDER 
} from '../interfaces/tokens';

// Mock Adapters
import { MockAuthAdapter } from '../adapters/mock/mock-auth.adapter';
import { MockNotificationAdapter } from '../adapters/mock/mock-notification.adapter';
import { MockStorageAdapter } from '../adapters/mock/mock-storage.adapter';
import { MockPaymentAdapter } from '../adapters/mock/mock-payment.adapter';

// AWS Adapters
import { AwsAuthAdapter } from '../adapters/aws/aws-auth.adapter';
import { AwsNotificationAdapter } from '../adapters/aws/aws-notification.adapter';
import { AwsStorageAdapter } from '../adapters/aws/aws-storage.adapter';

// Twilio Adapters
import { TwilioNotificationAdapter } from '../adapters/twilio/twilio-notification.adapter';

// Stripe Adapters
import { StripePaymentAdapter } from '../adapters/stripe/stripe-payment.adapter';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    // Auth Provider Factory
    {
      provide: AUTH_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const provider = config.get('AUTH_PROVIDER', 'mock');
        
        switch (provider) {
          case 'aws':
            return new AwsAuthAdapter();
          default:
            return new MockAuthAdapter();
        }
      },
    },

    // Notification Provider Factory
    {
      provide: NOTIFICATION_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const provider = config.get('NOTIFICATION_PROVIDER', 'mock');
        
        switch (provider) {
          case 'aws':
            return new AwsNotificationAdapter();
          case 'twilio':
            return new TwilioNotificationAdapter();
          default:
            return new MockNotificationAdapter();
        }
      },
    },

    // Storage Provider Factory
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const provider = config.get('STORAGE_PROVIDER', 'mock');
        
        switch (provider) {
          case 's3':
          case 'aws':
            return new AwsStorageAdapter();
          default:
            return new MockStorageAdapter();
        }
      },
    },

    // Payment Provider Factory
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const provider = config.get('PAYMENT_PROVIDER', 'mock');
        
        switch (provider) {
          case 'stripe':
            return new StripePaymentAdapter();
          default:
            return new MockPaymentAdapter();
        }
      },
    },
  ],
  exports: [AUTH_PROVIDER, NOTIFICATION_PROVIDER, STORAGE_PROVIDER, PAYMENT_PROVIDER],
})
export class ProvidersModule {}
