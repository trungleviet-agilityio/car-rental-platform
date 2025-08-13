/**
 * Notification controller
 * Demonstrates DIP - depends on INotificationProvider interface, not concrete implementation
 */

import { Body, Controller, Inject, Post } from '@nestjs/common';
import { NOTIFICATION_PROVIDER } from '../../services/ports/tokens';
import { INotificationProvider } from '../../services/ports/notification.interface';

@Controller('notify')
export class NotifyController {
  constructor(@Inject(NOTIFICATION_PROVIDER) private readonly notifier: INotificationProvider) {}

  @Post('email')
  async email(@Body() body: { to: string; subject?: string; text?: string; html?: string }) {
    const subject = body.subject || 'Car Rental - Test Email';
    const text = body.text || 'This is a test email from Car Rental PoC.';
    const res = await this.notifier.sendEmail({ to: body.to, subject, text, html: body.html });
    return { ok: true, messageId: res?.messageId };
  }

  @Post('sms')
  async sms(@Body() body: { to: string; message: string; senderId?: string }) {
    const res = await this.notifier.sendSms({ to: body.to, message: body.message, senderId: body.senderId });
    return { ok: true, messageId: res?.messageId };
  }
}
