/**
 * Notification provider interface
 */

export interface INotificationProvider {
  /** Send a plain email */
  sendEmail(params: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
  }): Promise<{ messageId?: string }>;

  /** Send an SMS */
  sendSms(params: {
    to: string;
    message: string;
    senderId?: string;
  }): Promise<{ messageId?: string }>;
}
