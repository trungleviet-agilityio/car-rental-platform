import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { DbService } from '../db/db.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [KycController],
  providers: [DbService],
})
export class KycModule {}
