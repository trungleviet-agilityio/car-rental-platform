import 'reflect-metadata';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    app.enableCors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });

    // Global pipes
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

    // Global filters and interceptors - temporarily disabled for debugging
    // app.useGlobalFilters(new GlobalExceptionFilter());
    // app.useGlobalInterceptors(new LoggingInterceptor());

    // API Versioning - car-rental/v1 as requested
    app.setGlobalPrefix('car-rental/v1');

    // Swagger/OpenAPI documentation
    const config = new DocumentBuilder()
      .setTitle('Car Rental Platform API')
      .setDescription('The Car Rental Platform API documentation')
      .setVersion('1.0')
      .addTag('auth', 'Authentication endpoints')
      .addTag('cars', 'Car management endpoints')
      .addTag('bookings', 'Booking management endpoints')
      .addTag('kyc', 'KYC verification endpoints')
      .addTag('payment', 'Payment processing endpoints')
      .addTag('notifications', 'Notification endpoints')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('car-rental/v1/docs', app, document);

    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    const host = process.env.HOST || '0.0.0.0';

    await app.listen(port, host);
    
    logger.log(`🚀 Application is running on: http://${host}:${port}`);
    logger.log(`📊 Health check: http://${host}:${port}/car-rental/v1`);
    logger.log(`📚 API Documentation: http://${host}:${port}/car-rental/v1/docs`);
    logger.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

bootstrap();
