/**
 * User Profile Response DTO
 * Represents the profile information for a user
 */

import { ApiProperty } from '@nestjs/swagger';
import { KYCStatus, UserRole } from '@prisma/client';

export class UserProfileResponseDto {
  @ApiProperty({ description: 'User ID' })
  id!: string;

  @ApiProperty({ description: 'Email address' })
  email!: string;

  @ApiProperty({ description: 'Phone number' })
  phoneNumber!: string;

  @ApiProperty({ description: 'First name' })
  firstName!: string;

  @ApiProperty({ description: 'Last name' })
  lastName!: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  role!: UserRole;

  @ApiProperty({ description: 'Whether profile is completed' })
  profileCompleted!: boolean;

  @ApiProperty({ description: 'KYC verification status', enum: KYCStatus })
  kycStatus!: KYCStatus;

  @ApiProperty({ description: 'Whether account is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Account creation date' })
  createdAt!: Date;
}

export class ActivateAccountResponseDto {
  @ApiProperty({ description: 'Whether activation was successful' })
  success!: boolean;

  @ApiProperty({ description: 'Activation message' })
  message!: string;

  @ApiProperty({ description: 'Updated user profile' })
  user!: UserProfileResponseDto;
}
