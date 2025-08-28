/**
 * KYC Verification Service Interface
 * Abstract interface for KYC document verification services
 */

import { DocumentType, KYCStatus } from '@prisma/client';

export interface VerifyDocumentRequest {
  documentId: string;
  documentType: DocumentType;
  fileKey: string;
  fileName: string;
  userId: string;
  userDetails: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    address: string;
  };
}

export interface VerifyDocumentResponse {
  success: boolean;
  verificationId?: string;
  status: KYCStatus;
  confidenceScore?: number;
  extractedData?: Record<string, any>;
  rejectionReason?: string;
  estimatedProcessingTime?: number; // in minutes
  errorMessage?: string;
}

export interface GetVerificationStatusRequest {
  verificationId: string;
  documentId: string;
}

export interface GetVerificationStatusResponse {
  success: boolean;
  status?: KYCStatus;
  confidenceScore?: number;
  rejectionReason?: string;
  completedAt?: Date;
  errorMessage?: string;
}

export interface WebhookData {
  verificationId: string;
  status: KYCStatus;
  confidenceScore?: number;
  rejectionReason?: string;
  extractedData?: Record<string, any>;
  completedAt: Date;
}

export interface ProcessWebhookRequest {
  payload: WebhookData;
  signature?: string;
  timestamp: Date;
}

export interface ProcessWebhookResponse {
  success: boolean;
  documentUpdated: boolean;
  errorMessage?: string;
}

export interface IKYCVerificationService {
  /**
   * Submit document for verification
   * @param request Document verification request
   * @returns Promise with verification result
   */
  verifyDocument(
    request: VerifyDocumentRequest,
  ): Promise<VerifyDocumentResponse>;

  /**
   * Get verification status for a document
   * @param request Status request
   * @returns Promise with status result
   */
  getVerificationStatus(
    request: GetVerificationStatusRequest,
  ): Promise<GetVerificationStatusResponse>;

  /**
   * Process webhook callback from KYC provider
   * @param request Webhook data
   * @returns Promise with processing result
   */
  processWebhook(
    request: ProcessWebhookRequest,
  ): Promise<ProcessWebhookResponse>;

  /**
   * Cancel an ongoing verification
   * @param verificationId Verification ID
   * @returns Promise with cancellation result
   */
  cancelVerification(verificationId: string): Promise<{ success: boolean }>;

  /**
   * Health check for the KYC verification service
   * @returns Promise with health status
   */
  healthCheck(): Promise<{ status: string; timestamp: Date }>;
}
