/**
 * Payment Module
 * Contains payment processing business logic
 * Imports ProvidersModule for DI
 */

import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ProvidersModule } from '../../providers/providers.module';

@Module({ 
  imports: [ProvidersModule], 
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
