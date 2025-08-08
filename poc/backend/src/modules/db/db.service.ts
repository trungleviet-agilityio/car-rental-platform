import { Injectable } from '@nestjs/common';

export type UserRecord = {
  userId: string;
  phoneNumber?: string;
  kycStatus?: 'unverified' | 'pending' | 'verified';
  kycKey?: string;
};

@Injectable()
export class DbService {
  private users = new Map<string, UserRecord>();

  upsertUser(user: UserRecord): UserRecord {
    const existing = this.users.get(user.userId) || { userId: user.userId, kycStatus: 'unverified' };
    const merged = { ...existing, ...user };
    this.users.set(user.userId, merged);
    return merged;
  }

  getUser(userId: string): UserRecord | undefined {
    return this.users.get(userId);
  }
}
