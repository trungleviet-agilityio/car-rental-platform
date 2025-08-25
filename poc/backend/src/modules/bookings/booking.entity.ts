/**
 * Booking entity
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'bookings' })
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  cognitoSub!: string; // renter identifier

  @Column()
  carId!: string;

  @Column({ type: 'datetime' })
  startDate!: Date;

  @Column({ type: 'datetime' })
  endDate!: Date;

  @Column({ type: 'integer' })
  totalPrice!: number; // in cents

  @Column({ default: 'pending' })
  status!: 'pending' | 'accepted' | 'rejected' | 'confirmed' | 'cancelled' | 'paid';

  @Column({ nullable: true })
  notificationStatus?: 'none' | 'sms_success' | 'sms_failed' | 'email_success' | 'email_failed';

  @Column({ nullable: true })
  ownerDecision?: 'accepted' | 'rejected';

  @Column({ type: 'datetime', nullable: true })
  ownerDecisionAt?: Date;

  @Column({ nullable: true })
  paymentIntentId?: string;

  @Column({ nullable: true })
  renterNotificationStatus?: 'none' | 'sms_success' | 'sms_failed' | 'email_success' | 'email_failed';

  @Column({ type: 'integer', default: 0 })
  notificationRetryCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
