import { registerAs } from '@nestjs/config';
import { IsString, IsNumber, IsOptional, IsEnum, validateSync } from 'class-validator';
import { plainToInstance, Transform } from 'class-transformer';
enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}
class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number = 3000;
  // Database
  @IsString()
  DATABASE_URL: string;
  // AWS Configuration
  @IsString()
  AWS_REGION: string;
  @IsString()
  COGNITO_USER_POOL_ID: string;
  @IsString()
  COGNITO_CLIENT_ID: string;
  @IsString()
  ONBOARDING_STATE_MACHINE_ARN: string;
  @IsString()
  SES_FROM_EMAIL: string;
  @IsString()
  S3_KYC_BUCKET: string;
  // Twilio
  @IsString()
  TWILIO_ACCOUNT_SID: string;
  @IsString()
  TWILIO_AUTH_TOKEN: string;
  @IsString()
  TWILIO_VERIFY_SERVICE_SID: string;
  // JWT
  @IsString()
  JWT_SECRET: string;
  @IsString()
  JWT_EXPIRES_IN: string = '1h';
  // Redis
  @IsString()
  REDIS_HOST: string = 'localhost';
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  REDIS_PORT: number = 6379;
  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;
  // Rate Limiting
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_TTL: number = 60;
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_MAX: number = 10;
}
export function validate(config: Record<string, unknown>): EnvironmentVariables {
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
export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  aws: {
    region: process.env.AWS_REGION,
    cognito: {
      userPoolId: process.env.COGNITO_USER_POOL_ID,
      clientId: process.env.COGNITO_CLIENT_ID,
    },
    stepFunctions: {
      onboardingStateMachineArn: process.env.ONBOARDING_STATE_MACHINE_ARN,
    },
    ses: {
      fromEmail: process.env.SES_FROM_EMAIL,
    },
    s3: {
      kycBucket: process.env.S3_KYC_BUCKET,
    },
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '10', 10),
  },
}));
