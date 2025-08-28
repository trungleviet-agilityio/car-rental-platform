/**
 * AWS Configuration
 * Centralized configuration for all AWS services
 */

import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  
  // Step Functions Configuration
  stepFunctions: {
    onboardingStateMachine: process.env.AWS_STEP_FUNCTIONS_ONBOARDING_ARN || 
      'arn:aws:states:us-east-1:123456789012:stateMachine:user-onboarding',
    
    // Lambda Functions for onboarding workflow
    lambdaFunctions: {
      phoneVerification: process.env.AWS_LAMBDA_PHONE_VERIFICATION || 
        'user-onboarding-phone-verification',
      checkProfile: process.env.AWS_LAMBDA_CHECK_PROFILE || 
        'user-onboarding-check-profile',
      startKYC: process.env.AWS_LAMBDA_START_KYC || 
        'user-onboarding-start-kyc',
      kycApproved: process.env.AWS_LAMBDA_KYC_APPROVED || 
        'user-onboarding-kyc-approved',
      kycRejected: process.env.AWS_LAMBDA_KYC_REJECTED || 
        'user-onboarding-kyc-rejected',
      kycTimeout: process.env.AWS_LAMBDA_KYC_TIMEOUT || 
        'user-onboarding-kyc-timeout',
      errorHandler: process.env.AWS_LAMBDA_ERROR_HANDLER || 
        'user-onboarding-error-handler',
    }
  },

  // Cognito Configuration
  cognito: {
    userPoolId: process.env.AWS_COGNITO_USER_POOL_ID || '',
    userPoolClientId: process.env.AWS_COGNITO_USER_POOL_CLIENT_ID || '',
    region: process.env.AWS_COGNITO_REGION || process.env.AWS_REGION || 'us-east-1',
  },

  // SNS Configuration (for notifications)
  sns: {
    region: process.env.AWS_SNS_REGION || process.env.AWS_REGION || 'us-east-1',
    topicArns: {
      userNotifications: process.env.AWS_SNS_USER_NOTIFICATIONS_TOPIC || 
        'arn:aws:sns:us-east-1:123456789012:user-notifications',
      adminAlerts: process.env.AWS_SNS_ADMIN_ALERTS_TOPIC || 
        'arn:aws:sns:us-east-1:123456789012:admin-alerts',
    }
  },

  // SES Configuration (for emails)
  ses: {
    region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'us-east-1',
    fromEmail: process.env.AWS_SES_FROM_EMAIL || 'noreply@carrentals.com',
    supportEmail: process.env.AWS_SES_SUPPORT_EMAIL || 'support@carrentals.com',
  },

  // S3 Configuration (for document storage)
  s3: {
    region: process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1',
    buckets: {
      documents: process.env.AWS_S3_DOCUMENTS_BUCKET || 'carrentals-documents',
      avatars: process.env.AWS_S3_AVATARS_BUCKET || 'carrentals-avatars',
    }
  },

  // Lambda Configuration
  lambda: {
    region: process.env.AWS_LAMBDA_REGION || process.env.AWS_REGION || 'us-east-1',
    timeout: parseInt(process.env.AWS_LAMBDA_TIMEOUT || '30'),
    memorySize: parseInt(process.env.AWS_LAMBDA_MEMORY_SIZE || '256'),
  }
}));
