/**
 * OTP entry interface
 */

export interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}