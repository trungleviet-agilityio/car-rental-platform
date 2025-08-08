import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [KycController],
})
export class KycModule {}
