/**
 * Payment Module - DIP implementation
 */

import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ProvidersModule } from '../../providers/providers.module';
import { GuardsModule } from '../../common/guards/guards.module';

@Module({
  imports: [ProvidersModule, GuardsModule], // Import both modules
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
