/**
 * Mock Payment Adapter
 * Implements IPaymentProvider for development and testing
 */

import { Injectable, Logger } from '@nestjs/common';
import { IPaymentProvider } from '../../interfaces/payment.interface';

@Injectable()
export class MockPaymentAdapter implements IPaymentProvider {
  private readonly logger = new Logger(MockPaymentAdapter.name);
  private payments = new Map<string, any>();

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
    const id = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `${id}_secret_mock`;
    
    const payment = {
      id,
      clientSecret,
      amount,
      currency,
      status: 'requires_payment_method' as const,
      metadata: metadata || {},
      createdAt: new Date().toISOString()
    };
    
    this.payments.set(id, payment);
    this.logger.log(`Mock payment intent created: ${id} for ${amount} ${currency}`);
    
    return {
      id,
      clientSecret,
      amount,
      currency,
      status: payment.status
    };
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<{
    id: string;
    status: 'succeeded' | 'failed' | 'requires_action';
    amount: number;
    currency: string;
    failureReason?: string;
  }> {
    const payment = this.payments.get(paymentIntentId);
    
    if (!payment) {
      throw new Error('Payment intent not found');
    }

    const shouldSucceed = Math.random() > 0.1; // 90% success rate
    const status = shouldSucceed ? 'succeeded' : 'failed';
    
    payment.status = status;
    payment.paymentMethodId = paymentMethodId;
    this.payments.set(paymentIntentId, payment);
    
    this.logger.log(`Mock payment ${paymentIntentId} ${status}`);
    
    return {
      id: paymentIntentId,
      status,
      amount: payment.amount,
      currency: payment.currency,
      failureReason: shouldSucceed ? undefined : 'Card declined (mock)'
    };
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<{
    id: string;
    amount: number;
    status: 'pending' | 'succeeded' | 'failed';
    reason?: string;
  }> {
    const payment = this.payments.get(paymentIntentId);
    
    if (!payment) {
      throw new Error('Payment intent not found');
    }

    if (payment.status !== 'succeeded') {
      throw new Error('Cannot refund unsuccessful payment');
    }

    const refundAmount = amount || payment.amount;
    const refundId = `re_mock_${Date.now()}`;
    
    this.logger.log(`Mock refund ${refundId} created for ${refundAmount}`);
    
    return {
      id: refundId,
      amount: refundAmount,
      status: 'succeeded',
      reason: 'Requested by customer'
    };
  }

  async getPaymentStatus(paymentIntentId: string): Promise<{
    id: string;
    status: string;
    amount: number;
    currency: string;
  }> {
    const payment = this.payments.get(paymentIntentId);
    
    if (!payment) {
      throw new Error('Payment intent not found');
    }
    
    return {
      id: paymentIntentId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency
    };
  }
}
