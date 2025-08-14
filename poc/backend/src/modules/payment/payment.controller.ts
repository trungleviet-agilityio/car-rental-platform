/**
 * Payment Controller
 * Handles payment processing via DIP payment providers
 */

import { Body, Controller, Post, Get, Param, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('intent')
  async createPaymentIntent(@Body() body: {
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
  }) {
    return this.paymentService.createPaymentIntent(body.amount, body.currency, body.metadata);
  }

  @Post('confirm')
  async confirmPayment(@Body() body: {
    paymentIntentId: string;
    paymentMethodId: string;
  }) {
    return this.paymentService.confirmPayment(body.paymentIntentId, body.paymentMethodId);
  }

  @Post('refund')
  async refundPayment(@Body() body: {
    paymentIntentId: string;
    amount?: number;
  }) {
    return this.paymentService.refundPayment(body.paymentIntentId, body.amount);
  }

  @Get('status/:paymentIntentId')
  async getPaymentStatus(@Param('paymentIntentId') paymentIntentId: string) {
    return this.paymentService.getPaymentStatus(paymentIntentId);
  }
}
