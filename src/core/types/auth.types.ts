/**
 * Authentication Types
 * Core types for authentication and authorization
 */

import { UserRole, OnboardingStep } from '@prisma/client';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  cognitoSub: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  cognitoSub: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isActive: boolean;
  emailVerified: boolean;
  profileCompleted: boolean;
  kycStatus: string;
  currentOnboardingStep?: OnboardingStep;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
  expiresIn: number;
}

export interface SignupRequest {
  email: string;
  password: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface SignupResponse {
  userId: string;
  cognitoSub: string;
  verificationRequired: boolean;
  onboardingStep: OnboardingStep;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  email: string;
  resetCode: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  email: string;
  verificationCode: string;
}

export interface PhoneVerificationRequest {
  phoneNumber: string;
}

export interface PhoneVerificationConfirmRequest {
  phoneNumber: string;
  verificationCode: string;
}

export interface OnboardingStatus {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  isComplete: boolean;
  nextStep?: OnboardingStep;
  progress: number; // Percentage complete
}

export interface UserSession {
  sessionId: string;
  userId: string;
  deviceInfo?: DeviceInfo;
  location?: LocationInfo;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

export interface DeviceInfo {
  userAgent: string;
  platform?: string;
  browser?: string;
  version?: string;
  mobile?: boolean;
}

export interface LocationInfo {
  ipAddress: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface SecurityEvent {
  type: SecurityEventType;
  userId: string;
  sessionId?: string;
  ipAddress: string;
  userAgent?: string;
  details?: Record<string, any>;
  severity: SecuritySeverity;
  timestamp: Date;
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  PHONE_VERIFIED = 'PHONE_VERIFIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export interface AuthContext {
  user: AuthenticatedUser;
  session: UserSession;
  permissions: string[];
  roles: UserRole[];
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isKycVerified: boolean;
  canAccessResource: (resource: string, action: string) => boolean;
}