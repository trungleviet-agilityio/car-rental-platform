/**
 * Stripe Payment Adapter
 * Implements IPaymentProvider using Stripe for payment processing
 */

import { Injectable, Logger } from '@nestjs/common';
import { IPaymentProvider } from '../../interfaces/payment.interface';

@Injectable()
export class StripePaymentAdapter implements IPaymentProvider {
  private readonly logger = new Logger(StripePaymentAdapter.name);
  private stripe: any;

  constructor() {
    // Lazy initialization to make Stripe optional
    this.initializeStripe();
  }

  private initializeStripe() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    try {
      // Lazy require to make stripe package optional
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Stripe = require('stripe');
      this.stripe = new Stripe(secretKey);
      this.logger.log('Stripe initialized successfully');
    } catch (error) {
      throw new Error('Stripe package not installed. Run: npm install stripe');
    }
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<{
    id: string;
    clientSecret: string;
    amount: number;
    currency: string;
    status: 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded';
  }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: currency.toLowerCase(),
        metadata: metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(`Stripe payment intent created: ${paymentIntent.id} for ${amount} ${currency}`);

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: this.mapStripeStatus(paymentIntent.status),
      };
    } catch (error) {
      this.logger.error('Failed to create Stripe payment intent', error);
      throw error;
    }
  }

  async confirmPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<{
    id: string;
    status: 'succeeded' | 'failed' | 'requires_action';
    amount: number;
    currency: string;
    failureReason?: string;
  }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      this.logger.log(`Stripe payment ${paymentIntentId} confirmed with status: ${paymentIntent.status}`);

      return {
        id: paymentIntent.id,
        status: this.mapConfirmStatus(paymentIntent.status),
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        failureReason: paymentIntent.last_payment_error?.message,
      };
    } catch (error) {
      this.logger.error(`Failed to confirm Stripe payment ${paymentIntentId}`, error);
      throw error;
    }
  }

  async refundPayment(
    paymentIntentId: string,
    amount?: number
  ): Promise<{
    id: string;
    amount: number;
    status: 'pending' | 'succeeded' | 'failed';
    reason?: string;
  }> {
    try {
      const refundParams: any = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = amount;
      }

      const refund = await this.stripe.refunds.create(refundParams);

      this.logger.log(`Stripe refund created: ${refund.id} for amount ${refund.amount}`);

      return {
        id: refund.id,
        amount: refund.amount,
        status: this.mapRefundStatus(refund.status),
        reason: refund.reason,
      };
    } catch (error) {
      this.logger.error(`Failed to create Stripe refund for ${paymentIntentId}`, error);
      throw error;
    }
  }

  async getPaymentStatus(paymentIntentId: string): Promise<{
    id: string;
    status: string;
    amount: number;
    currency: string;
  }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve Stripe payment ${paymentIntentId}`, error);
      throw error;
    }
  }

  private mapStripeStatus(stripeStatus: string): 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded' {
    switch (stripeStatus) {
      case 'requires_payment_method':
        return 'requires_payment_method';
      case 'requires_confirmation':
        return 'requires_confirmation';
      case 'processing':
        return 'processing';
      case 'succeeded':
        return 'succeeded';
      default:
        return 'requires_payment_method';
    }
  }

  private mapConfirmStatus(stripeStatus: string): 'succeeded' | 'failed' | 'requires_action' {
    switch (stripeStatus) {
      case 'succeeded':
        return 'succeeded';
      case 'requires_action':
        return 'requires_action';
      case 'canceled':
      case 'payment_failed':
        return 'failed';
      default:
        return 'failed';
    }
  }

  private mapRefundStatus(stripeStatus: string): 'pending' | 'succeeded' | 'failed' {
    switch (stripeStatus) {
      case 'pending':
        return 'pending';
      case 'succeeded':
        return 'succeeded';
      case 'failed':
        return 'failed';
      default:
        return 'pending';
    }
  }
}
