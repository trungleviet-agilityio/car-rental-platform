/**
 * Notification Service
 * Business logic for notifications
 * Depends only on INotificationProvider abstraction
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { NOTIFICATION_PROVIDER } from '../../interfaces/tokens';
import { INotificationProvider } from '../../interfaces/notification.interface';

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  constructor(
    @Inject(NOTIFICATION_PROVIDER) private readonly notifier: INotificationProvider,
  ) {}

  async sendEmail(params: {
    to: string;
    subject?: string;
    text?: string;
    html?: string;
  }) {
    const subject = params.subject || 'Car Rental Notification';
    const text = params.text || 'This is a notification from Car Rental Platform.';
    
    try {
      const result = await this.notifier.sendEmail({ 
        to: params.to, 
        subject, 
        text, 
        html: params.html 
      });
      
      this.logger.log(`Email sent to ${params.to}`);
      return { success: true, messageId: result?.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email to ${params.to}`, error);
      throw error;
    }
  }

  async sendSms(params: {
    to: string;
    message: string;
    senderId?: string;
  }) {
    try {
      const result = await this.notifier.sendSms({ 
        to: params.to, 
        message: params.message, 
        senderId: params.senderId 
      });
      
      this.logger.log(`SMS sent to ${params.to}`);
      return { success: true, messageId: result?.messageId };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${params.to}`, error);
      throw error;
    }
  }

  async sendOtp(params: {
    channel: 'email' | 'sms';
    to: string;
    code: string;
  }) {
    const message = `Your one-time code is ${params.code}. It expires in 5 minutes.`;
    
    if (params.channel === 'email') {
      return this.sendEmail({
        to: params.to,
        subject: 'Your login code',
        text: message,
      });
    }
    
    return this.sendSms({
      to: params.to,
      message,
    });
  }
}
