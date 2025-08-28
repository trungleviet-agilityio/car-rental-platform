/*
 * KYC Module - KYC document verification module
 * Implements proper Clean Architecture with application and presentation layers
 */

import { Module } from '@nestjs/common';

// Application Layer
import { KYCService } from './application/services/kyc.service';

// Presentation Layer
import { KYCController } from './presentation/kyc.controller';

// Shared
import { SharedModule } from '@/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [KYCController],
  providers: [KYCService],
  exports: [KYCService],
})
export class KYCModule {}
