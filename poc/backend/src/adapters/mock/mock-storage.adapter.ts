/**
 * Mock Storage Adapter
 * Implements IStorageProvider for development and testing
 */

import { Injectable, Logger } from '@nestjs/common';
import { IStorageProvider } from '../../interfaces/storage.interface';

@Injectable()
export class MockStorageAdapter implements IStorageProvider {
  private readonly logger = new Logger(MockStorageAdapter.name);

  async createPresignedPutUrl(
    bucket: string,
    key: string,
    contentType = 'application/octet-stream',
    expiresSeconds = 900,
  ): Promise<{ uploadUrl: string; key: string; method: 'PUT'; expiresIn: number }> {
    this.logger.log(`Mock presigned URL generated for ${key} in bucket ${bucket}`);
    
    return {
      uploadUrl: `https://mock-storage.example.com/${bucket}/${key}?expires=${Date.now() + expiresSeconds * 1000}`,
      key,
      method: 'PUT',
      expiresIn: expiresSeconds,
    };
  }
}
