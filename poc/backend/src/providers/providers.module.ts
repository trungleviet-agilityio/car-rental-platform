/**
 * Providers Module
 * Configures dependency injection for third-party service adapters
 * Following Dependency Inversion Principle (DIP)
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Auth providers
import { MockAuthAdapter } from '../adapters/mock/mock-auth.adapter';
import { AwsAuthAdapter } from '../adapters/aws/aws-auth.adapter';

// Notification providers
import { MockNotificationAdapter } from '../adapters/mock/mock-notification.adapter';
import { AwsNotificationAdapter } from '../adapters/aws/aws-notification.adapter';
import { TwilioNotificationAdapter } from '../adapters/twilio/twilio-notification.adapter';

// Storage providers
import { MockStorageAdapter } from '../adapters/mock/mock-storage.adapter';
import { AwsStorageAdapter } from '../adapters/aws/aws-storage.adapter';

// Payment providers
import { MockPaymentAdapter } from '../adapters/mock/mock-payment.adapter';
import { StripePaymentAdapter } from '../adapters/stripe/stripe-payment.adapter';

// Lambda providers
import { MockLambdaAdapter } from '../adapters/mock/mock-lambda.adapter';
import { AwsLambdaAdapter } from '../adapters/aws/aws-lambda.adapter';

// Interfaces
import { IAuthProvider } from '../interfaces/auth.interface';
import { INotificationProvider } from '../interfaces/notification.interface';
import { IStorageProvider } from '../interfaces/storage.interface';
import { IPaymentProvider } from '../interfaces/payment.interface';
import { ILambdaProvider } from '../interfaces/lambda.interface';

// Tokens
import { 
  AUTH_PROVIDER, 
  NOTIFICATION_PROVIDER, 
  STORAGE_PROVIDER, 
  PAYMENT_PROVIDER,
  LAMBDA_PROVIDER 
} from '../interfaces/tokens';

@Module({
  imports: [ConfigModule],
  providers: [
    // Auth provider
    {
      provide: AUTH_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get('AUTH_PROVIDER', 'mock');
        switch (provider) {
          case 'aws':
            return new AwsAuthAdapter();
          case 'mock':
          default:
            return new MockAuthAdapter();
        }
      },
      inject: [ConfigService],
    },

    // Notification provider
    {
      provide: NOTIFICATION_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get('NOTIFICATION_PROVIDER', 'mock');
        switch (provider) {
          case 'aws':
            return new AwsNotificationAdapter();
          case 'twilio':
            return new TwilioNotificationAdapter();
          case 'mock':
          default:
            return new MockNotificationAdapter();
        }
      },
      inject: [ConfigService],
    },

    // Storage provider
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get('STORAGE_PROVIDER', 'mock');
        switch (provider) {
          case 's3':
            return new AwsStorageAdapter();
          case 'mock':
          default:
            return new MockStorageAdapter();
        }
      },
      inject: [ConfigService],
    },

    // Payment provider
    {
      provide: PAYMENT_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get('PAYMENT_PROVIDER', 'mock');
        switch (provider) {
          case 'stripe':
            return new StripePaymentAdapter();
          case 'mock':
          default:
            return new MockPaymentAdapter();
        }
      },
      inject: [ConfigService],
    },

    // Lambda provider
    {
      provide: LAMBDA_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get('LAMBDA_PROVIDER', 'mock');
        switch (provider) {
          case 'aws':
            return new AwsLambdaAdapter();
          case 'mock':
          default:
            return new MockLambdaAdapter();
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [AUTH_PROVIDER, NOTIFICATION_PROVIDER, STORAGE_PROVIDER, PAYMENT_PROVIDER, LAMBDA_PROVIDER],
})
export class ProvidersModule {}
