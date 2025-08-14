/**
 * Mock Notification Adapter
 * Implements INotificationProvider for development and testing
 */

import { Injectable, Logger } from '@nestjs/common';
import { INotificationProvider } from '../../interfaces/notification.interface';

@Injectable()
export class MockNotificationAdapter implements INotificationProvider {
  private readonly logger = new Logger(MockNotificationAdapter.name);

  async sendEmail(params: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
  }): Promise<{ messageId?: string }> {
    this.logger.log(`Mock email sent to ${params.to}: ${params.subject}`);
    return { messageId: 'mock-email-id' };
  }

  async sendSms(params: {
    to: string;
    message: string;
    senderId?: string;
  }): Promise<{ messageId?: string }> {
    this.logger.log(`Mock SMS sent to ${params.to}: ${params.message.substring(0, 50)}...`);
    return { messageId: 'mock-sms-id' };
  }
}
