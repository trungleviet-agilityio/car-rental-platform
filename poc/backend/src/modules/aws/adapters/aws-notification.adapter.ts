/**
 * AWS notification adapter
 * Implements INotificationProvider using AWS SES and SNS
 */

import { Injectable, Logger } from '@nestjs/common';
import { INotificationProvider } from '../../../services/ports/notification.interface';
import { AwsService } from '../aws.service';

@Injectable()
export class AwsNotificationAdapter implements INotificationProvider {
  private readonly logger = new Logger(AwsNotificationAdapter.name);

  constructor(private readonly aws: AwsService) {}

  /**
   * Send email via AWS SES
   * @param params - Email parameters
   * @returns Message result
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
  }): Promise<{ messageId?: string }> {
    try {
      const result = await this.aws.sendEmail(params);
      this.logger.log(`Email sent to ${params.to} via SES`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send email to ${params.to}`, error);
      throw error;
    }
  }

  /**
   * Send SMS via AWS SNS
   * @param params - SMS parameters
   * @returns Message result
   */
  async sendSms(params: {
    to: string;
    message: string;
    senderId?: string;
  }): Promise<{ messageId?: string }> {
    try {
      const result = await this.aws.sendSms(params);
      this.logger.log(`SMS sent to ${params.to} via SNS`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${params.to}`, error);
      throw error;
    }
  }
}
