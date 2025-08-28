/**
 * App Module
 * The main entry point for the application
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Configuration
import { appConfig, validate } from './config/app.config';

// Shared
import { SharedModule } from './shared/shared.module';

// Infrastructure  
import { InfrastructureModule } from './infrastructure/infrastructure.module';

// Domain Modules
import { AuthModule } from './modules/auth/auth.module';

// App Controllers and Services
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate,
      envFilePath: ['.env.local', '.env'],
    }),

    // Core modules
    SharedModule,
    InfrastructureModule,

    // Domain modules
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
