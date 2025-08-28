/**
 * Service Tokens for Dependency Injection
 * Centralized injection tokens for all infrastructure services implementing DIP
 */

// Authentication Service Tokens
export const PHONE_VERIFICATION_SERVICE = Symbol('PHONE_VERIFICATION_SERVICE');
export const USER_MANAGEMENT_SERVICE = Symbol('USER_MANAGEMENT_SERVICE');
export const WORKFLOW_SERVICE = Symbol('WORKFLOW_SERVICE');

// Storage Service Tokens
export const FILE_STORAGE_SERVICE = Symbol('FILE_STORAGE_SERVICE');
export const KYC_VERIFICATION_SERVICE = Symbol('KYC_VERIFICATION_SERVICE');

// Communication Service Tokens
export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');
export const SMS_SERVICE = Symbol('SMS_SERVICE');

// Payment Service Tokens
export const PAYMENT_PROCESSOR_SERVICE = Symbol('PAYMENT_PROCESSOR_SERVICE');

// Notification Service Tokens
export const NOTIFICATION_SERVICE = Symbol('NOTIFICATION_SERVICE');
