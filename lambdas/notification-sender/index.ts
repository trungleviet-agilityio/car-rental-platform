/*
  This lambda is the Handler of the Lambda function that sends the notifications to the user.
  It supports both email and SMS notifications.
*/

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const ses = new SESClient();
const sns = new SNSClient();
const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient());

interface NotificationEvent {
  userId?: string;
  notificationType: string;
  email?: string;
  phoneNumber?: string;
  template?: string;
  rejectionReason?: string;
}

interface EmailTemplate {
  subject: string;
  body: string;
}

const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  WELCOME_EMAIL: {
    subject: 'Welcome to Car Rental Platform',
    body: 'Thank you for joining our platform. Please complete your profile to continue.'
  },
  ACCOUNT_ACTIVATED: {
    subject: 'Your Car Rental Account is Activated',
    body: 'Congratulations! Your account has been verified and activated.'
  },
  KYC_REJECTED: {
    subject: 'KYC Verification Failed',
    body: 'Your KYC verification was rejected. Please re-upload your documents.'
  },
  PROFILE_COMPLETION_REMINDER: {
    subject: 'Complete Your Profile',
    body: 'Please complete your profile to unlock all features.'
  },
  KYC_UPLOAD_REMINDER: {
    subject: 'Upload Your Documents',
    body: 'Please upload your verification documents to activate your account.'
  }
};

interface NotificationResult {
  success: boolean;
}

export const handler = async (event: NotificationEvent): Promise<NotificationResult> => {
  try {
    console.log('Processing notification', JSON.stringify(event));
    
    const { userId, notificationType, email, phoneNumber, template, rejectionReason } = event;
    
    // Get user if userId is provided but email/phone is not
    let userEmail = email;
    let userPhone = phoneNumber;
    
    if (userId && (!userEmail || !userPhone)) {
      const userParams = {
        TableName: process.env.USERS_TABLE!,
        Key: { id: userId }
      };
      
      const userResult = await dynamodb.send(new GetCommand(userParams));
      
      if (userResult.Item) {
        userEmail = userEmail || userResult.Item.email;
        userPhone = userPhone || userResult.Item.phoneNumber;
      }
    }
    
    // Send email if template is provided
    if (template && userEmail) {
      const emailTemplate = EMAIL_TEMPLATES[template];
      
      if (!emailTemplate) {
        throw new Error(`Email template not found: ${template}`);
      }
      
      let emailBody = emailTemplate.body;
      
      // Add rejection reason if available
      if (template === 'KYC_REJECTED' && rejectionReason) {
        emailBody += `\n\nReason: ${rejectionReason}`;
      }
      
      await ses.send(new SendEmailCommand({
        Source: process.env.FROM_EMAIL!,
        Destination: { ToAddresses: [userEmail] },
        Message: {
          Subject: { Data: emailTemplate.subject },
          Body: {
            Text: { Data: emailBody }
          }
        }
      }));
    }
    
    // Send SMS if notification type requires it
    if (['PHONE_VERIFICATION_FAILED', 'KYC_REJECTED'].includes(notificationType) && userPhone) {
      let smsMessage = '';
      
      switch (notificationType) {
        case 'PHONE_VERIFICATION_FAILED':
          smsMessage = 'Phone verification failed. Please try again.';
          break;
        case 'KYC_REJECTED':
          smsMessage = `KYC verification rejected. ${rejectionReason || 'Please re-upload your documents.'}`;
          break;
      }
      
      if (smsMessage) {
        await sns.send(new PublishCommand({
          PhoneNumber: userPhone,
          Message: smsMessage
        }));
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};
