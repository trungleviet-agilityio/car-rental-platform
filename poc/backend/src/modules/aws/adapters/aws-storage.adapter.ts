/**
 * AWS storage adapter
 */

import { Injectable } from '@nestjs/common';
import { IStorageProvider } from '../../../services/ports/storage.interface';
import { AwsService } from '../aws.service';

@Injectable()
export class AwsStorageAdapter implements IStorageProvider {
  constructor(private readonly aws: AwsService) {}

  /**
   * Create presigned PUT URL
   * @param bucket - The bucket
   * @param key - The key
   * @param contentType - The content type
   * @param expiresSeconds - The expires seconds
   * @returns The presigned PUT URL
   */
  createPresignedPutUrl(
    bucket: string,
    key: string,
    contentType?: string,
    expiresSeconds?: number,
  ) {
    return this.aws.createPresignedPutUrl(bucket, key, contentType, expiresSeconds);
  }
}
