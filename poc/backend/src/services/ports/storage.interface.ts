/**
 * Storage provider interface
 */

export interface IStorageProvider {
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
