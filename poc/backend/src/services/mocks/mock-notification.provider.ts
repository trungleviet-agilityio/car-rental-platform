import { Logger } from '@nestjs/common';
import { INotificationProvider } from '../ports/notification.interface';

export class MockNotificationProvider implements INotificationProvider {
  private readonly logger = new Logger(MockNotificationProvider.name);

  async sendEmail(params: { to: string; subject: string; text?: string; html?: string; from?: string }) {
    this.logger.log(`Mock email sent to ${params.to}: ${params.subject}`);
    return { messageId: 'mock-email-id' };
  }
  
  async sendSms(params: { to: string; message: string; senderId?: string }) {
    this.logger.log(`Mock SMS sent to ${params.to}: ${params.message.substring(0, 50)}...`);
    return { messageId: 'mock-sms-id' };
  }
}
