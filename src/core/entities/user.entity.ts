/**
 * User Entity
 * Core domain entity extending Prisma-generated User type
 */

import { User as PrismaUser, UserRole, KYCStatus } from '@prisma/client';

export interface UserEntity extends Omit<PrismaUser, 'role' | 'kycStatus'> {
  role: UserRole;
  kycStatus: KYCStatus;
}

export class UserDomainEntity {
  constructor(private user: UserEntity) {}

  get id(): string {
    return this.user.id;
  }

  get email(): string {
    return this.user.email;
  }

  get fullName(): string {
    return `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim();
  }

  get isProfileComplete(): boolean {
    return this.user.profileCompleted;
  }

  get isKYCVerified(): boolean {
    return this.user.kycStatus === KYCStatus.VERIFIED;
  }

  get canRentVehicles(): boolean {
    return this.isProfileComplete && this.isKYCVerified && this.user.isActive;
  }

  get canOwnVehicles(): boolean {
    return this.canRentVehicles && 
           (this.user.role === UserRole.OWNER || this.user.role === UserRole.BOTH);
  }

  get isAdmin(): boolean {
    return this.user.role === UserRole.ADMIN;
  }

  public toPublicProfile() {
    return {
      id: this.user.id,
      email: this.user.email,
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      role: this.user.role,
      profileCompleted: this.user.profileCompleted,
      kycStatus: this.user.kycStatus,
      createdAt: this.user.createdAt,
    };
  }
}
