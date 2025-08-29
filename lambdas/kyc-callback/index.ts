/*
  This lambda is the Handler of the Lambda function that updates the user table with the status of the KYC processing.
  It also sends a task success to the Step Functions workflow.
*/

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SFNClient, SendTaskSuccessCommand } from '@aws-sdk/client-sfn';

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient());
const stepfunctions = new SFNClient();

interface APIGatewayProxyEvent {
  body: string;
}

interface APIGatewayProxyResult {
  statusCode: number;
  body: string;
}

interface User {
  id: string;
  email: string;
  kycStatus: string;
  kycRejectionReason: string;
  kycTaskToken: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Processing KYC callback', JSON.stringify(event));
    
    // 1. Parse webhook body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    
    const { verificationId, result, rejectionReason } = body;
    
    // 2. Get user by verification ID
    const userParams = {
      TableName: process.env.USERS_TABLE!,
      IndexName: 'kycVerificationId-index',
      KeyConditionExpression: 'kycVerificationId = :vid',
      ExpressionAttributeValues: {
        ':vid': verificationId
      }
    };
    
    const userResult = await dynamodb.send(new QueryCommand(userParams));
    
    if (!userResult.Items || userResult.Items.length === 0) {
      throw new Error(`No user found with verification ID: ${verificationId}`);
    }
    
    const user = userResult.Items[0] as User;
    
    // 3. Update user's KYC status
    await dynamodb.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE!,
      Key: { id: user.id },
      UpdateExpression: 'set kycStatus = :status, kycRejectionReason = :reason',
      ExpressionAttributeValues: {
        ':status': result === 'approved' ? 'VERIFIED' : 'REJECTED',
        ':reason': rejectionReason || null
      }
    }));
    
    // 4. Send task success to Step Functions
    await stepfunctions.send(new SendTaskSuccessCommand({   
      taskToken: user.kycTaskToken,
      output: JSON.stringify({
        userId: user.id,
        email: user.email,
        kycResult: result,
        rejectionReason
      })
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Error processing KYC callback:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: (error as Error).message })
    };
  }
};
