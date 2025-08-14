/**
 * AWS SES/SNS Notification Adapter
 * Implements INotificationProvider using AWS SES for email and SNS for SMS
 */

import { Injectable, Logger } from '@nestjs/common';
import { INotificationProvider } from '../../interfaces/notification.interface';
import AWS from 'aws-sdk';

@Injectable()
export class AwsNotificationAdapter implements INotificationProvider {
  private readonly logger = new Logger(AwsNotificationAdapter.name);
  private readonly ses: AWS.SES;
  private readonly sns: AWS.SNS;

  constructor() {
    const region = process.env.AWS_REGION || 'ap-southeast-1';
    this.ses = new AWS.SES({ region });
    this.sns = new AWS.SNS({ region });
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
  }): Promise<{ messageId?: string }> {
    try {
      const source = params.from || process.env.EMAIL_FROM || 'no-reply@carrentalplatform.com';
      
      await this.ses.sendEmail({
        Source: source,
        Destination: { ToAddresses: [params.to] },
        Message: {
          Subject: { Data: params.subject },
          Body: params.html 
            ? { Html: { Data: params.html } } 
            : { Text: { Data: params.text || '' } },
        },
      }).promise();

      this.logger.log(`Email sent to ${params.to} via SES`);
      return { messageId: 'ses-success' };
    } catch (error) {
      this.logger.error(`Failed to send email to ${params.to}`, error);
      throw error;
    }
  }

  async sendSms(params: {
    to: string;
    message: string;
    senderId?: string;
  }): Promise<{ messageId?: string }> {
    try {
      const messageParams: AWS.SNS.PublishInput = {
        PhoneNumber: params.to,
        Message: params.message,
      };

      if (params.senderId || process.env.SMS_SENDER_ID) {
        messageParams.MessageAttributes = {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: params.senderId || process.env.SMS_SENDER_ID!,
          },
        };
      }

      await this.sns.publish(messageParams).promise();
      this.logger.log(`SMS sent to ${params.to} via SNS`);
      return { messageId: 'sns-success' };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${params.to}`, error);
      throw error;
    }
  }
}
