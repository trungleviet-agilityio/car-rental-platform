/**
 * Storage Service
 * Business logic for file storage operations
 * Depends only on IStorageProvider abstraction
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { STORAGE_PROVIDER } from '../../interfaces/tokens';
import { IStorageProvider } from '../../interfaces/storage.interface';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  async createUploadUrl(params: {
    bucket: string;
    key: string;
    contentType?: string;
    expiresSeconds?: number;
  }) {
    try {
      const result = await this.storage.createPresignedPutUrl(
        params.bucket,
        params.key,
        params.contentType,
        params.expiresSeconds
      );
      
      this.logger.log(`Upload URL created for ${params.key}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create upload URL for ${params.key}`, error);
      throw error;
    }
  }

  async createKycUploadUrl(userId: string, contentType = 'image/jpeg') {
    const bucket = process.env.S3_BUCKET_NAME || 'default-bucket';
    const key = `kyc/${userId}/${Date.now()}-document.jpg`;
    
    return this.createUploadUrl({
      bucket,
      key,
      contentType,
      expiresSeconds: 900, // 15 minutes
    });
  }
}
