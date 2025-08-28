/**
 * File Storage Service Interface
 * Abstract interface for file upload and management (S3, etc.)
 */

export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  userId: string;
  documentType: string;
}

export interface PresignedUrlResponse {
  success: boolean;
  uploadUrl?: string;
  fileKey?: string;
  expiresIn?: number;
  errorMessage?: string;
}

export interface DeleteFileRequest {
  fileKey: string;
  bucket?: string;
}

export interface DeleteFileResponse {
  success: boolean;
  errorMessage?: string;
}

export interface FileMetadata {
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  bucket: string;
}

export interface GetFileInfoRequest {
  fileKey: string;
  bucket?: string;
}

export interface GetFileInfoResponse {
  success: boolean;
  metadata?: FileMetadata;
  errorMessage?: string;
}

export interface IFileStorageService {
  /**
   * Generate presigned URL for file upload
   * @param request Upload request details
   * @returns Promise with presigned URL
   */
  generatePresignedUrl(
    request: PresignedUrlRequest,
  ): Promise<PresignedUrlResponse>;

  /**
   * Delete a file from storage
   * @param request Delete request
   * @returns Promise with deletion result
   */
  deleteFile(request: DeleteFileRequest): Promise<DeleteFileResponse>;

  /**
   * Get file metadata and information
   * @param request File info request
   * @returns Promise with file information
   */
  getFileInfo(request: GetFileInfoRequest): Promise<GetFileInfoResponse>;

  /**
   * Health check for the file storage service
   * @returns Promise with health status
   */
  healthCheck(): Promise<{ status: string; timestamp: Date }>;
}
