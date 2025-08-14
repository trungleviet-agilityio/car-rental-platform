/**
 * Payment Service
 * Business logic for payment processing
 * Depends only on IPaymentProvider abstraction
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { PAYMENT_PROVIDER } from '../../interfaces/tokens';
import { IPaymentProvider } from '../../interfaces/payment.interface';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @Inject(PAYMENT_PROVIDER) private readonly payment: IPaymentProvider,
  ) {}

  async createPaymentIntent(amount: number, currency: string, metadata?: Record<string, string>) {
    try {
      const result = await this.payment.createPaymentIntent(amount, currency, metadata);
      this.logger.log(`Payment intent created: ${result.id} for ${amount} ${currency}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create payment intent for ${amount} ${currency}`, error);
      throw error;
    }
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId: string) {
    try {
      const result = await this.payment.confirmPayment(paymentIntentId, paymentMethodId);
      this.logger.log(`Payment confirmed: ${paymentIntentId} with status ${result.status}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to confirm payment ${paymentIntentId}`, error);
      throw error;
    }
  }

  async refundPayment(paymentIntentId: string, amount?: number) {
    try {
      const result = await this.payment.refundPayment(paymentIntentId, amount);
      this.logger.log(`Refund created: ${result.id} for ${result.amount}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to refund payment ${paymentIntentId}`, error);
      throw error;
    }
  }

  async getPaymentStatus(paymentIntentId: string) {
    try {
      const result = await this.payment.getPaymentStatus(paymentIntentId);
      this.logger.log(`Payment status retrieved: ${paymentIntentId} - ${result.status}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get payment status ${paymentIntentId}`, error);
      throw error;
    }
  }
}
