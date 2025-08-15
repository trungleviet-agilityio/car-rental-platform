/**
 * Application Configuration Service
 * Centralized configuration management with type safety
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfig {
  constructor(private readonly configService: ConfigService) {}

  // Environment configuration
  readonly environment = {
    nodeEnv: this.configService.get('NODE_ENV', 'development'),
    isDevelopment: this.configService.get('NODE_ENV') === 'development',
    isProduction: this.configService.get('NODE_ENV') === 'production',
    isTest: this.configService.get('NODE_ENV') === 'test',
  };

  // Provider configuration
  readonly providers = {
    auth: {
      provider: this.configService.get('AUTH_PROVIDER', 'mock'),
      cognito: {
        userPoolId: this.configService.get('USER_POOL_ID'),
        clientId: this.configService.get('USER_POOL_CLIENT_ID'),
        region: this.configService.get('AWS_REGION', 'ap-southeast-1'),
      },
      otp: {
        ttl: this.configService.get('OTP_TTL_MS', 300000), // 5 minutes
        maxAttempts: this.configService.get('OTP_MAX_ATTEMPTS', 5),
        debugInclude: this.configService.get('DEBUG_INCLUDE_OTP', 'false') === 'true',
      },
    },
    storage: {
      provider: this.configService.get('STORAGE_PROVIDER', 'mock'),
      s3: {
        bucketName: this.configService.get('S3_BUCKET_NAME'),
        region: this.configService.get('AWS_REGION', 'ap-southeast-1'),
        presignedUrlExpiry: this.configService.get('S3_PRESIGNED_URL_EXPIRY', 3600), // 1 hour
      },
    },
    notification: {
      provider: this.configService.get('NOTIFICATION_PROVIDER', 'mock'),
      aws: {
        region: this.configService.get('AWS_REGION', 'ap-southeast-1'),
        ses: {
          fromEmail: this.configService.get('SES_FROM_EMAIL'),
          region: this.configService.get('AWS_REGION', 'ap-southeast-1'),
        },
        sns: {
          region: this.configService.get('AWS_REGION', 'ap-southeast-1'),
        },
      },
      twilio: {
        accountSid: this.configService.get('TWILIO_ACCOUNT_SID'),
        authToken: this.configService.get('TWILIO_AUTH_TOKEN'),
        fromNumber: this.configService.get('TWILIO_FROM_NUMBER'),
        messagingServiceSid: this.configService.get('TWILIO_MESSAGING_SERVICE_SID'),
      },
    },
    payment: {
      provider: this.configService.get('PAYMENT_PROVIDER', 'mock'),
      stripe: {
        secretKey: this.configService.get('STRIPE_SECRET_KEY'),
        publishableKey: this.configService.get('STRIPE_PUBLISHABLE_KEY'),
        webhookSecret: this.configService.get('STRIPE_WEBHOOK_SECRET'),
      },
    },
    lambda: {
      provider: this.configService.get('LAMBDA_PROVIDER', 'mock'),
      aws: {
        region: this.configService.get('AWS_REGION', 'ap-southeast-1'),
        presignedUrlFunction: this.configService.get('GENERATE_PRESIGNED_URL_LAMBDA'),
        kycStateMachine: this.configService.get('KYC_STATE_MACHINE_ARN'),
      },
    },
  };

  // Database configuration
  readonly database = {
    type: this.configService.get('DB_DISABLE') === 'true' ? 'sqlite' : 'postgres',
    postgres: {
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USER', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: this.configService.get('DB_NAME', 'car_rental'),
      ssl: this.configService.get('DB_SSL') === 'true',
    },
    sqlite: {
      database: ':memory:',
    },
    migrations: {
      runOnStartup: true,
      synchronize: this.configService.get('DB_DISABLE') === 'true', // Only for SQLite
    },
  };

  // Server configuration
  readonly server = {
    port: this.configService.get('PORT', 3000),
    host: this.configService.get('HOST', '0.0.0.0'),
    cors: {
      origin: this.configService.get('CORS_ORIGIN', '*'),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
  };

  // Security configuration
  readonly security = {
    jwt: {
      secret: this.configService.get('JWT_SECRET', 'your-secret-key'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '1h'),
    },
    rateLimit: {
      windowMs: this.configService.get('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
      max: this.configService.get('RATE_LIMIT_MAX', 100), // limit each IP to 100 requests per windowMs
    },
  };

  // Monitoring configuration
  readonly monitoring = {
    logging: {
      level: this.configService.get('LOG_LEVEL', 'info'),
      format: this.configService.get('LOG_FORMAT', 'json'),
    },
    metrics: {
      enabled: this.configService.get('METRICS_ENABLED', 'true') === 'true',
      port: this.configService.get('METRICS_PORT', 9090),
    },
  };

  // AWS configuration
  readonly aws = {
    region: this.configService.get('AWS_REGION', 'ap-southeast-1'),
    accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
    secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
  };

  // Helper methods
  isProviderEnabled(service: keyof typeof this.providers, provider: string): boolean {
    return this.providers[service].provider === provider;
  }

  isMockMode(service: keyof typeof this.providers): boolean {
    return this.providers[service].provider === 'mock';
  }

  isAwsMode(service: keyof typeof this.providers): boolean {
    return this.providers[service].provider === 'aws' || this.providers[service].provider === 's3';
  }

  getProviderConfig<T>(service: keyof typeof this.providers): T {
    const provider = this.providers[service].provider;
    switch (service) {
      case 'auth':
        return (provider === 'aws' ? this.providers.auth.cognito : {}) as T;
      case 'storage':
        return (provider === 's3' ? this.providers.storage.s3 : {}) as T;
      case 'notification':
        return (provider === 'aws' ? this.providers.notification.aws : 
               provider === 'twilio' ? this.providers.notification.twilio : {}) as T;
      case 'payment':
        return (provider === 'stripe' ? this.providers.payment.stripe : {}) as T;
      case 'lambda':
        return (provider === 'aws' ? this.providers.lambda.aws : {}) as T;
      default:
        return {} as T;
    }
  }
}
