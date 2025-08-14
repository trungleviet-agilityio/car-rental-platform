/**
 * Payment Provider Interface
 * Abstracts payment processing services (Stripe, PayPal, etc.)
 */

export interface IPaymentProvider {
  /**
   * Create a payment intent
   */
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<{
    id: string;
    clientSecret: string;
    amount: number;
    currency: string;
    status: 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded';
  }>;

  /**
   * Confirm a payment
   */
  confirmPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<{
    id: string;
    status: 'succeeded' | 'failed' | 'requires_action';
    amount: number;
    currency: string;
    failureReason?: string;
  }>;

  /**
   * Refund a payment
   */
  refundPayment(
    paymentIntentId: string,
    amount?: number
  ): Promise<{
    id: string;
    amount: number;
    status: 'pending' | 'succeeded' | 'failed';
    reason?: string;
  }>;

  /**
   * Get payment status
   */
  getPaymentStatus(paymentIntentId: string): Promise<{
    id: string;
    status: string;
    amount: number;
    currency: string;
  }>;
}
