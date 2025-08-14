/**
 * AWS S3 Storage Adapter
 * Implements IStorageProvider using AWS S3
 */

import { Injectable, Logger } from '@nestjs/common';
import { IStorageProvider } from '../../interfaces/storage.interface';
import AWS from 'aws-sdk';

@Injectable()
export class AwsStorageAdapter implements IStorageProvider {
  private readonly logger = new Logger(AwsStorageAdapter.name);
  private readonly s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({ 
      region: process.env.AWS_REGION || 'ap-southeast-1',
      signatureVersion: 'v4' 
    });
  }

  async createPresignedPutUrl(
    bucket: string,
    key: string,
    contentType = 'application/octet-stream',
    expiresSeconds = 900,
  ): Promise<{ uploadUrl: string; key: string; method: 'PUT'; expiresIn: number }> {
    try {
      const signedUrl = await this.s3.getSignedUrlPromise('putObject', {
        Bucket: bucket,
        Key: key,
        Expires: expiresSeconds,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
      });

      this.logger.log(`Generated presigned URL for ${key} in bucket ${bucket}`);
      
      return {
        uploadUrl: signedUrl,
        key,
        method: 'PUT',
        expiresIn: expiresSeconds,
      };
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for ${key}`, error);
      throw error;
    }
  }
}
