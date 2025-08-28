/**
 * KYC Document Upload DTO
 * Represents the data required for uploading KYC documents
 */

import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUrl, MaxLength  } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '@prisma/client';

export class DocumentUploadDto {
  @ApiProperty({ description: 'Type of document being uploaded', enum: DocumentType })
  @IsEnum(DocumentType, { message: 'Invalid document type' })
  documentType!: DocumentType;

  @ApiProperty({ description: 'Front side image URL (after S3 upload)' })
  @IsString()
  @IsNotEmpty({ message: 'Front image URL is required' })
  @IsUrl({}, { message: 'Front image must be a valid URL' })
  frontImageUrl!: string;

  @ApiProperty({ description: 'Back side image URL (after S3 upload)', required: false })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Back image must be a valid URL' })
  backImageUrl?: string;

  @ApiProperty({ description: 'Additional notes about the document', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Notes must not exceed 500 characters' })
  notes?: string;
}

export class UploadKYCDocumentsDto {
  @ApiProperty({ description: 'Array of documents to upload', type: [DocumentUploadDto] })
  @IsArray({ message: 'Documents must be an array' })
  @ValidateNested({ each: true })
  @Type(() => DocumentUploadDto)
  documents!: DocumentUploadDto[];
}

export class UploadKYCDocumentsResponseDto {
  @ApiProperty({ description: 'Whether the upload was successful' })
  success!: boolean;

  @ApiProperty({ description: 'Message describing the result' })
  message!: string;

  @ApiProperty({ description: 'Next step in the onboarding process' })
  nextStep!: string;

  @ApiProperty({ description: 'Verification tracking ID' })
  verificationId!: string;
}

export class GetPresignedUrlDto {
  @ApiProperty({ description: 'Type of document for the presigned URL', enum: DocumentType })
  @IsEnum(DocumentType, { message: 'Invalid document type' })
  documentType!: DocumentType;

  @ApiProperty({ description: 'Side of the document (front or back)', enum: ['front', 'back'] })
  @IsEnum(['front', 'back'], { message: 'Side must be either front or back' })
  side!: 'front' | 'back';

  @ApiProperty({ description: 'File extension' })
  @IsString()
  @IsNotEmpty({ message: 'File extension is required' })
  @IsEnum(['jpg', 'jpeg', 'png', 'pdf'], { message: 'File extension must be jpg, jpeg, png, or pdf' })
  fileExtension!: string;
}

export class PresignedUrlResponseDto {
  @ApiProperty({ description: 'Presigned URL for direct S3 upload' })
  presignedUrl!: string;

  @ApiProperty({ description: 'Final URL where the file will be accessible' })
  fileUrl!: string;

  @ApiProperty({ description: 'Expiration time for the presigned URL' })
  expiresAt!: string;

  @ApiProperty({ description: 'Required headers for the upload' })
  requiredHeaders!: Record<string, string>;
}
