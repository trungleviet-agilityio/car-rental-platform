/**
 * Auth module
 */

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ProvidersModule } from '../providers/providers.module';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [ProvidersModule, AwsModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
