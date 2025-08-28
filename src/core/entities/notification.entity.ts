/**
 * Notification Entity
 * Core domain entity extending Prisma-generated Notification type
 */

import { Notification as PrismaNotification, NotificationType, Priority } from '@prisma/client';

export interface NotificationEntity extends PrismaNotification {
  notificationType: NotificationType;
  priority: Priority;
}

export class NotificationDomainEntity {
  constructor(private notification: NotificationEntity) {}

  get id(): string {
    return this.notification.id;
  }

  get userId(): string {
    return this.notification.userId;
  }

  get type(): NotificationType {
    return this.notification.notificationType;
  }

  get title(): string {
    return this.notification.title;
  }

  get message(): string {
    return this.notification.message;
  }

  get data(): any {
    return this.notification.data;
  }

  get channels(): string[] {
    return Array.isArray(this.notification.channels) ? this.notification.channels as string[] : [];
  }

  get deliveryStatus(): any {
    return this.notification.deliveryStatus;
  }

  get priority(): Priority {
    return this.notification.priority;
  }

  get isRead(): boolean {
    return this.notification.isRead;
  }

  get readAt(): Date | null {
    return this.notification.readAt;
  }

  get expiresAt(): Date | null {
    return this.notification.expiresAt;
  }

  get retryCount(): number {
    return this.notification.retryCount;
  }

  get maxRetries(): number {
    return this.notification.maxRetries;
  }

  get createdAt(): Date {
    return this.notification.createdAt;
  }

  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  get canRetry(): boolean {
    return this.retryCount < this.maxRetries && !this.isExpired;
  }

  get isHighPriority(): boolean {
    return this.priority === Priority.HIGH || this.priority === Priority.URGENT;
  }

  get isUrgent(): boolean {
    return this.priority === Priority.URGENT;
  }

  get isBookingType(): boolean {
    return this.type === NotificationType.BOOKING;
  }

  get isPaymentType(): boolean {
    return this.type === NotificationType.PAYMENT;
  }

  get isReviewType(): boolean {
    return this.type === NotificationType.REVIEW;
  }

  get isSystemType(): boolean {
    return this.type === NotificationType.SYSTEM;
  }

  get shouldSendEmail(): boolean {
    return this.channels.includes('email');
  }

  get shouldSendSMS(): boolean {
    return this.channels.includes('sms');
  }

  get shouldSendPush(): boolean {
    return this.channels.includes('push');
  }

  get shouldShowInApp(): boolean {
    return this.channels.includes('in_app');
  }

  get ageInHours(): number {
    return Math.floor((new Date().getTime() - this.createdAt.getTime()) / (1000 * 60 * 60));
  }

  get displayPriority(): string {
    switch (this.priority) {
      case Priority.URGENT:
        return '🔴 Urgent';
      case Priority.HIGH:
        return '🟠 High';
      case Priority.NORMAL:
        return '🟡 Normal';
      case Priority.LOW:
        return '🟢 Low';
      default:
        return 'Normal';
    }
  }

  getChannelStatus(channel: string): string | null {
    if (!this.deliveryStatus || typeof this.deliveryStatus !== 'object') return null;
    return (this.deliveryStatus as any)[channel] || null;
  }

  isChannelDelivered(channel: string): boolean {
    return this.getChannelStatus(channel) === 'delivered';
  }

  isChannelFailed(channel: string): boolean {
    return this.getChannelStatus(channel) === 'failed';
  }

  toDomainObject() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      title: this.title,
      message: this.message,
      data: this.data,
      channels: this.channels,
      deliveryStatus: this.deliveryStatus,
      priority: this.priority,
      isRead: this.isRead,
      readAt: this.readAt,
      expiresAt: this.expiresAt,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      createdAt: this.createdAt,
      isExpired: this.isExpired,
      canRetry: this.canRetry,
      isHighPriority: this.isHighPriority,
      isUrgent: this.isUrgent,
      ageInHours: this.ageInHours,
      displayPriority: this.displayPriority,
      channelStatuses: {
        email: this.getChannelStatus('email'),
        sms: this.getChannelStatus('sms'),
        push: this.getChannelStatus('push'),
        inApp: this.getChannelStatus('in_app'),
      },
    };
  }
}
