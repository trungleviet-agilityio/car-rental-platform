/*
  This lambda is the Handler of the Lambda function that starts the KYC processing. 
  It sends to S3 to upload the documents and update the document table.
  It also updates the user table with the status of the KYC processing.
*/

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SFNClient } from '@aws-sdk/client-sfn';
import { KYCDocument } from '@prisma/client';

interface StartKYCEvent {
  userId: string;
  documentIds: string[];
}

interface StartKYCResult {
  userId: string;
  verificationId: string;
  status: string;
}

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const stepfunctions = new SFNClient();
const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient());

export const handler = async (event: StartKYCEvent): Promise<StartKYCResult> => {
  try {
    console.log('Processing KYC documents', JSON.stringify(event));
    
    const { userId, documentIds } = event;
    
    // 1. Get document metadata from DynamoDB
    const documentsMetadata = await Promise.all(
      documentIds.map(async (docId: string) => {
        const params = {
          TableName: process.env.DOCUMENTS_TABLE!,
          Key: { id: docId }
        };
        const result = await dynamodb.send(new GetCommand(params));
        return result.Item;
      })
    );

    // Filter out undefined items and type as KYCDocument
    const validDocuments = documentsMetadata.filter((doc): doc is KYCDocument => doc !== undefined);
    
    // 2. Get document content from S3
    const documents = await Promise.all(
      validDocuments.map(async (doc: KYCDocument) => {
        const getObjectParams = {
          Bucket: process.env.KYC_BUCKET!,
          Key: doc.s3Key
        };
        const response = await s3Client.send(new GetObjectCommand(getObjectParams));
        return {
          metadata: doc,
          content: response.Body
        };
      })
    );
    
    // 3. Send to KYC verification service (mock for now)
    const verificationId = `kyc-${Date.now()}-${userId}`;
    
    // 4. Update database with verification ID
    await dynamodb.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE!,
      Key: { id: userId },
      UpdateExpression: 'set kycVerificationId = :vid, kycStatus = :status',
      ExpressionAttributeValues: {
        ':vid': verificationId,
        ':status': 'PENDING'
      }
    }));
    
    // 5. Return verification ID
    return {
      userId,
      verificationId,
      status: 'PENDING'
    };
  } catch (error) {
    console.error('Error processing KYC documents:', error);
    throw error;
  }
};
