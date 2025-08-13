/**
 * Mock payment provider for development and testing
 * Implements IPaymentProvider without external dependencies
 */

import { IPaymentProvider } from '../ports/payment.interface';

export class MockPaymentProvider implements IPaymentProvider {
  private payments = new Map<string, any>();

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ) {
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
    
    return {
      id,
      clientSecret,
      amount,
      currency,
      status: payment.status
    };
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId: string) {
    const payment = this.payments.get(paymentIntentId);
    
    if (!payment) {
      throw new Error('Payment intent not found');
    }

    // Simulate payment processing
    const shouldSucceed = Math.random() > 0.1; // 90% success rate
    
    const updatedPayment = {
      ...payment,
      status: shouldSucceed ? 'succeeded' : 'failed',
      paymentMethodId,
      updatedAt: new Date().toISOString()
    };
    
    this.payments.set(paymentIntentId, updatedPayment);
    
    return {
      id: paymentIntentId,
      status: updatedPayment.status,
      amount: payment.amount,
      currency: payment.currency,
      failureReason: shouldSucceed ? undefined : 'Card declined (mock)'
    };
  }

  async refundPayment(paymentIntentId: string, amount?: number) {
    const payment = this.payments.get(paymentIntentId);
    
    if (!payment) {
      throw new Error('Payment intent not found');
    }

    if (payment.status !== 'succeeded') {
      throw new Error('Cannot refund unsuccessful payment');
    }

    const refundAmount = amount || payment.amount;
    const refundId = `re_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update payment with refund info
    const updatedPayment = {
      ...payment,
      refunded: true,
      refundAmount,
      refundId,
      updatedAt: new Date().toISOString()
    };
    
    this.payments.set(paymentIntentId, updatedPayment);
    
    return {
      id: refundId,
      amount: refundAmount,
      status: 'succeeded' as const,
      reason: 'Requested by customer'
    };
  }

  async getPaymentStatus(paymentIntentId: string) {
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
