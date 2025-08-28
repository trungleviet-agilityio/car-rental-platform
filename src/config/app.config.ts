/**
 * Configuration for the application
 * @module app.config
 */

import { registerAs } from '@nestjs/config';
import awsConfig from './aws.config';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  validateSync,
} from 'class-validator';
import { plainToInstance, Transform } from 'class-transformer';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  // Environment
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  // Server
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number = 3000;

  @IsString()
  HOST: string = '0.0.0.0';

  // Database
  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  @IsOptional()
  @IsString()
  DB_HOST?: string = 'localhost';

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  DB_PORT?: number = 5432;

  @IsOptional()
  @IsString()
  DB_USER?: string = 'postgres';

  @IsOptional()
  @IsString()
  DB_PASSWORD?: string = 'postgres';

  @IsOptional()
  @IsString()
  DB_NAME?: string = 'car_rental';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  DB_SSL?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  DB_DISABLE?: boolean = false;

  // AWS Configuration
  @IsOptional()
  @IsString()
  AWS_REGION?: string = 'ap-southeast-1';

  @IsOptional()
  @IsString()
  AWS_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  AWS_SECRET_ACCESS_KEY?: string;

  // Auth Provider
  @IsOptional()
  @IsString()
  AUTH_PROVIDER?: string = 'mock';

  @IsOptional()
  @IsString()
  COGNITO_USER_POOL_ID?: string;

  @IsOptional()
  @IsString()
  COGNITO_CLIENT_ID?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  OTP_TTL_MS?: number = 300000;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  OTP_MAX_ATTEMPTS?: number = 5;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  DEBUG_INCLUDE_OTP?: boolean = false;

  // Storage Provider
  @IsOptional()
  @IsString()
  STORAGE_PROVIDER?: string = 'mock';

  @IsOptional()
  @IsString()
  S3_BUCKET_NAME?: string;

  @IsOptional()
  @IsString()
  S3_KYC_BUCKET?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  S3_PRESIGNED_URL_EXPIRY?: number = 3600;

  // Notification Provider
  @IsOptional()
  @IsString()
  NOTIFICATION_PROVIDER?: string = 'mock';

  @IsOptional()
  @IsString()
  SES_FROM_EMAIL?: string;

  @IsOptional()
  @IsString()
  TWILIO_ACCOUNT_SID?: string;

  @IsOptional()
  @IsString()
  TWILIO_AUTH_TOKEN?: string;

  @IsOptional()
  @IsString()
  TWILIO_FROM_NUMBER?: string;

  @IsOptional()
  @IsString()
  TWILIO_MESSAGING_SERVICE_SID?: string;

  @IsOptional()
  @IsString()
  TWILIO_VERIFY_SERVICE_SID?: string;

  // Payment Provider
  @IsOptional()
  @IsString()
  PAYMENT_PROVIDER?: string = 'mock';

  @IsOptional()
  @IsString()
  STRIPE_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_PUBLISHABLE_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_WEBHOOK_SECRET?: string;

  // Lambda Provider
  @IsOptional()
  @IsString()
  LAMBDA_PROVIDER?: string = 'mock';

  @IsOptional()
  @IsString()
  ONBOARDING_STATE_MACHINE_ARN?: string;

  @IsOptional()
  @IsString()
  KYC_STATE_MACHINE_ARN?: string;

  @IsOptional()
  @IsString()
  GENERATE_PRESIGNED_URL_LAMBDA?: string;

  // JWT
  @IsOptional()
  @IsString()
  JWT_SECRET?: string = 'your-secret-key';

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string = '1h';

  // Redis
  @IsOptional()
  @IsString()
  REDIS_HOST?: string = 'localhost';

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  REDIS_PORT?: number = 6379;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  // Rate Limiting
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_TTL?: number = 60;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_MAX?: number = 10;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_WINDOW_MS?: number = 900000;

  // CORS
  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string = '*';

  // Monitoring
  @IsOptional()
  @IsString()
  LOG_LEVEL?: string = 'info';

  @IsOptional()
  @IsString()
  LOG_FORMAT?: string = 'json';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  METRICS_ENABLED?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  METRICS_PORT?: number = 9090;
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.toString()}`);
  }
  return validatedConfig;
}

export const appConfig = registerAs('app', () => {
  const env = process.env;
  
  return {
    // Environment configuration
    environment: {
      nodeEnv: env.NODE_ENV || 'development',
      isDevelopment: env.NODE_ENV === 'development',
      isProduction: env.NODE_ENV === 'production',
      isTest: env.NODE_ENV === 'test',
    },

    // Server configuration
    server: {
      port: parseInt(env.PORT || '3000', 10),
      host: env.HOST || '0.0.0.0',
      cors: {
        origin: env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      },
    },

    // Database configuration
    database: {
      type: env.DB_DISABLE === 'true' ? 'sqlite' : 'postgres',
      url: env.DATABASE_URL,
      postgres: {
        host: env.DB_HOST || 'localhost',
        port: parseInt(env.DB_PORT || '5432', 10),
        username: env.DB_USER || 'postgres',
        password: env.DB_PASSWORD || 'postgres',
        database: env.DB_NAME || 'car_rental',
        ssl: env.DB_SSL === 'true',
      },
      sqlite: {
        database: ':memory:',
      },
      migrations: {
        runOnStartup: true,
        synchronize: env.DB_DISABLE === 'true',
      },
    },

    // Provider configuration
    providers: {
      auth: {
        provider: env.AUTH_PROVIDER || 'mock',
        cognito: {
          userPoolId: env.COGNITO_USER_POOL_ID,
          clientId: env.COGNITO_CLIENT_ID,
          region: env.AWS_REGION || 'ap-southeast-1',
        },
        otp: {
          ttl: parseInt(env.OTP_TTL_MS || '300000', 10),
          maxAttempts: parseInt(env.OTP_MAX_ATTEMPTS || '5', 10),
          debugInclude: env.DEBUG_INCLUDE_OTP === 'true',
        },
      },
      storage: {
        provider: env.STORAGE_PROVIDER || 'mock',
        s3: {
          bucketName: env.S3_BUCKET_NAME,
          kycBucket: env.S3_KYC_BUCKET,
          region: env.AWS_REGION || 'ap-southeast-1',
          presignedUrlExpiry: parseInt(env.S3_PRESIGNED_URL_EXPIRY || '3600', 10),
        },
      },
      notification: {
        provider: env.NOTIFICATION_PROVIDER || 'mock',
        aws: {
          region: env.AWS_REGION || 'ap-southeast-1',
          ses: {
            fromEmail: env.SES_FROM_EMAIL,
            region: env.AWS_REGION || 'ap-southeast-1',
          },
          sns: {
            region: env.AWS_REGION || 'ap-southeast-1',
          },
        },
        twilio: {
          accountSid: env.TWILIO_ACCOUNT_SID,
          authToken: env.TWILIO_AUTH_TOKEN,
          fromNumber: env.TWILIO_FROM_NUMBER,
          messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
          verifyServiceSid: env.TWILIO_VERIFY_SERVICE_SID,
        },
      },
      payment: {
        provider: env.PAYMENT_PROVIDER || 'mock',
        stripe: {
          secretKey: env.STRIPE_SECRET_KEY,
          publishableKey: env.STRIPE_PUBLISHABLE_KEY,
          webhookSecret: env.STRIPE_WEBHOOK_SECRET,
        },
      },
      lambda: {
        provider: env.LAMBDA_PROVIDER || 'mock',
        aws: {
          region: env.AWS_REGION || 'ap-southeast-1',
          presignedUrlFunction: env.GENERATE_PRESIGNED_URL_LAMBDA,
          kycStateMachine: env.KYC_STATE_MACHINE_ARN,
          onboardingStateMachine: env.ONBOARDING_STATE_MACHINE_ARN,
        },
      },
    },

    // AWS configuration
    aws: {
      region: env.AWS_REGION || 'ap-southeast-1',
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },

    // Security configuration
    security: {
      jwt: {
        secret: env.JWT_SECRET || 'your-secret-key',
        expiresIn: env.JWT_EXPIRES_IN || '1h',
      },
      rateLimit: {
        ttl: parseInt(env.RATE_LIMIT_TTL || '60', 10),
        max: parseInt(env.RATE_LIMIT_MAX || '10', 10),
        windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      },
    },

    // Redis configuration
    redis: {
      host: env.REDIS_HOST || 'localhost',
      port: parseInt(env.REDIS_PORT || '6379', 10),
      password: env.REDIS_PASSWORD,
    },

    // Monitoring configuration
    monitoring: {
      logging: {
        level: env.LOG_LEVEL || 'info',
        format: env.LOG_FORMAT || 'json',
      },
      metrics: {
        enabled: env.METRICS_ENABLED === 'true',
        port: parseInt(env.METRICS_PORT || '9090', 10),
      },
    },
  };
});
