import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AwsService } from '../aws/aws.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AwsService],
})
export class AuthModule {}
