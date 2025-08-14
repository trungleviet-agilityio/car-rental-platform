/**
 * Notification Provider Interface
 * Abstracts notification services (AWS SES/SNS, Twilio, SendGrid, etc.)
 */

export interface INotificationProvider {
  /**
   * Send email notification
   */
  sendEmail(params: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
  }): Promise<{ messageId?: string }>;

  /**
   * Send SMS notification
   */
  sendSms(params: {
    to: string;
    message: string;
    senderId?: string;
  }): Promise<{ messageId?: string }>;
}
