/**
 * Main file
 * The entry point for the application
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.server.port', 3000);
  const nodeEnv = configService.get<string>('app.environment.nodeEnv', 'development');

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // Compression middleware
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin:
      nodeEnv === 'production' ? ['https://yourproductiondomain.com'] : true, // Allow all origins in development
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API versioning
  app.setGlobalPrefix('api/v1');

  // Swagger documentation (only in development/staging)
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Car Rental Platform API')
      .setDescription(
        'A comprehensive car rental platform backend API with user onboarding, KYC verification, and booking management',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag(
        'Authentication',
        'User signup, verification, and profile management',
      )
      .addTag('Users', 'User profile and management endpoints')
      .addTag('KYC', 'Know Your Customer verification and document management')
      .addTag('Health', 'Application health and monitoring endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(
      `📚 Swagger documentation available at: http://localhost:${port}/api/docs`,
    );
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);

  logger.log(
    `🚀 Car Rental Platform backend is running on: http://localhost:${port}/api/v1`,
  );
  logger.log(`🌍 Environment: ${nodeEnv}`);

  if (nodeEnv === 'development') {
    logger.log(
      `🔧 Development mode enabled - enhanced logging and debugging available`,
    );
  }
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application', error);
  process.exit(1);
});
