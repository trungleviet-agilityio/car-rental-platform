/**
 * Shared Types for Car Rental Platform
 * Central location for all application types and enums
 */

// Re-export Prisma types for consistency
export type {
  User,
  Vehicle,
  Booking,
  Payment,
  Review,
  OnboardingProgress,
  KYCDocument,
  PhoneVerification,
  NotificationTemplate,
  Notification,
  NotificationLog,
  AuditLog,
  SystemSetting,
} from '@prisma/client';

// Import types for use in interfaces
import type { KYCStatus, UserRole } from '@prisma/client';
  
// Re-export Prisma enums
export {
  KYCStatus,
  UserRole,
  OnboardingStep,
  DocumentType,
  PaymentType,
  PaymentStatus,
  NotificationType,
  Priority,
  BookingStatus,
  VehicleStatus,
  FuelType,
  TransmissionType,
} from '@prisma/client';

// Authentication types
export interface AuthenticatedUser {
  id: string;
  cognitoSub: string;
  email: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  profileCompleted: boolean;
  kycStatus: KYCStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// JWT payload interface
export interface JwtPayload {
  sub: string; // user id
  email: string;
  cognitoSub: string;
  iat?: number;
  exp?: number;
}

// Common response interfaces
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Error types
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

// Utility types
export type NonNullable<T> = T extends null | undefined ? never : T;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Re-export error utilities
export * from '../utils/error-handler';
