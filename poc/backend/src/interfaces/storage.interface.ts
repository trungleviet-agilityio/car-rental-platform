/**
 * Storage Provider Interface
 * Abstracts file storage services (AWS S3, Google Cloud Storage, etc.)
 */

export interface IStorageProvider {
  /**
   * Create a presigned URL for file upload
   */
  createPresignedPutUrl(
    bucket: string,
    key: string,
    contentType?: string,
    expiresSeconds?: number,
  ): Promise<{
    uploadUrl: string;
    key: string;
    method: 'PUT';
    expiresIn: number;
  }>;
}
