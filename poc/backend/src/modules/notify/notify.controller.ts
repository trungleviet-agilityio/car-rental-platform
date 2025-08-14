/**
 * Notification Controller
 * Handles notification API endpoints
 * Uses NotifyService for business logic
 */

import { Body, Controller, Post } from '@nestjs/common';
import { NotifyService } from './notify.service';

@Controller('notify')
export class NotifyController {
  constructor(private readonly notifyService: NotifyService) {}

  @Post('email')
  async email(@Body() body: { to: string; subject?: string; text?: string; html?: string }) {
    return this.notifyService.sendEmail(body);
  }

  @Post('sms')
  async sms(@Body() body: { to: string; message: string; senderId?: string }) {
    return this.notifyService.sendSms(body);
  }

  @Post('otp')
  async otp(@Body() body: { channel: 'email' | 'sms'; to: string; code: string }) {
    return this.notifyService.sendOtp(body);
  }
}