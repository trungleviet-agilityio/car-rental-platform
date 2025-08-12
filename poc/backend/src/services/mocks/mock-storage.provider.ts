/**
 * Mock storage provider
 */

import { IStorageProvider } from '../ports/storage.interface';

export class MockStorageProvider implements IStorageProvider {
  /**
   * Create a presigned PUT URL
   * @param _ - The bucket name
   * @param key - The key for the object
   * @param __ - The content type
   * @param expiresSeconds - The expiration time in seconds
   * @returns The presigned URL
   */
  async createPresignedPutUrl(
    _: string,
    key: string,
    __ = 'image/jpeg',
    expiresSeconds = 900,
  ): Promise<{ uploadUrl: string; key: string; method: 'PUT'; expiresIn: number }> {
    return { 
      uploadUrl: `https://car-rental-storage-demo.s3.amazonaws.com/${key}?X-Amz-Signature=mock`,
      key,
      method: 'PUT',
      expiresIn: expiresSeconds,
    };
  }
}
