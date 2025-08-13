/**
 * Tokens for dependency injection
 * Following Dependency Inversion Principle (DIP)
 */

export const AUTH_PROVIDER = Symbol('AUTH_PROVIDER');
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
export const KYC_WORKFLOW = Symbol('KYC_WORKFLOW');
export const NOTIFICATION_PROVIDER = Symbol('NOTIFICATION_PROVIDER');

// Future DIP tokens for third-party services
export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
export const INSURANCE_PROVIDER = Symbol('INSURANCE_PROVIDER');
export const GPS_PROVIDER = Symbol('GPS_PROVIDER');
export const PUSH_PROVIDER = Symbol('PUSH_PROVIDER');
