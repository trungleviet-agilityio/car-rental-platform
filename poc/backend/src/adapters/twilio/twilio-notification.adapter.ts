/**
 * Twilio Notification Adapter
 * Implements INotificationProvider using Twilio for SMS (email not supported)
 */

import { Injectable, Logger } from '@nestjs/common';
import { INotificationProvider } from '../../interfaces/notification.interface';

@Injectable()
export class TwilioNotificationAdapter implements INotificationProvider {
  private readonly logger = new Logger(TwilioNotificationAdapter.name);

  async sendEmail(): Promise<{ messageId?: string }> {
    throw new Error('Email not supported by Twilio adapter. Use AWS SES or mock provider.');
  }

  async sendSms(params: {
    to: string;
    message: string;
    senderId?: string;
  }): Promise<{ messageId?: string }> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
      throw new Error(
        'Twilio configuration missing. Provide TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and either TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID'
      );
    }

    try {
      // Lazy require to make twilio optional
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);

      const messageOptions: any = {
        to: params.to,
        body: params.message,
      };

      if (messagingServiceSid) {
        messageOptions.messagingServiceSid = messagingServiceSid;
      } else {
        messageOptions.from = fromNumber;
      }

      const result = await client.messages.create(messageOptions);
      this.logger.log(`SMS sent to ${params.to} via Twilio`);
      
      return { messageId: result.sid };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${params.to} via Twilio`, error);
      throw error;
    }
  }
}
