/**
 * Payment provider interface (Future DIP Implementation)
 * Abstracts payment processing services like Stripe, PayPal, etc.
 */

export interface IPaymentProvider {
  /**
   * Create a payment intent
   * @param amount - Amount in smallest currency unit (e.g., cents)
   * @param currency - Currency code (e.g., 'usd', 'sgd')
   * @param metadata - Additional payment metadata
   * @returns Payment intent with client secret
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
   * @param paymentIntentId - Payment intent ID
   * @param paymentMethodId - Payment method ID
   * @returns Payment result
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
   * @param paymentIntentId - Payment intent ID to refund
   * @param amount - Amount to refund (optional, defaults to full amount)
   * @returns Refund result
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
   * @param paymentIntentId - Payment intent ID
   * @returns Current payment status
   */
  getPaymentStatus(paymentIntentId: string): Promise<{
    id: string;
    status: string;
    amount: number;
    currency: string;
  }>;
}
