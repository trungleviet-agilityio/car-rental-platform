# AWS Step Functions Setup for Asynchronous User Onboarding

## Overview
This document explains how to set up AWS Step Functions for asynchronous user onboarding workflows, allowing users to continue using the app while KYC verification is processed in the background.

## Architecture

```
User Registration → Phone Verification → Continue Using App
                                      ↓
                         Step Functions Workflow (Background)
                                      ↓
                    Profile Check → KYC Verification → Notifications
```

## Step Functions Workflow

The workflow (`src/infrastructure/workflows/step-function-definitions/user-onboarding.json`) handles:

1. **Phone Verification** - Initial verification step
2. **Profile Completion Check** - Wait for user to complete profile
3. **KYC Document Processing** - Asynchronous verification
4. **Manual Approval Wait** - Human review step (up to 7 days)
5. **Notification Dispatch** - Welcome/rejection notifications

## Key Features

### ✅ Non-Blocking User Experience
- Users can continue using the app immediately after phone verification
- KYC processing happens in the background
- Notifications sent when verification completes

### ✅ Robust Error Handling
- Automatic retries for transient failures
- Timeout handling for long-running processes
- Error notifications to users and admins

### ✅ Multiple Notification Channels
- Email notifications via AWS SES
- SMS notifications via AWS SNS
- Parallel notification delivery

## AWS Resources Required

### 1. Step Functions State Machine
```bash
aws stepfunctions create-state-machine \
  --name "user-onboarding" \
  --definition file://src/infrastructure/workflows/step-function-definitions/user-onboarding.json \
  --role-arn "arn:aws:iam::ACCOUNT:role/step-functions-execution-role"
```

### 2. Lambda Functions
Create these Lambda functions for the workflow:
- `user-onboarding-phone-verification`
- `user-onboarding-check-profile`
- `user-onboarding-start-kyc`
- `user-onboarding-kyc-approved`
- `user-onboarding-kyc-rejected`
- `user-onboarding-kyc-timeout`
- `user-onboarding-error-handler`

### 3. SNS Topics
- `user-notifications` - User-facing notifications
- `admin-alerts` - Admin alerts for failures

### 4. SES Configuration
- Verified sender email addresses
- Email templates for welcome/rejection messages

## Environment Configuration

Copy `env.example.aws` to your `.env` file and update:

```bash
# Enable Step Functions
WORKFLOW_PROVIDER=step-functions

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Step Functions ARN
AWS_STEP_FUNCTIONS_ONBOARDING_ARN=arn:aws:states:region:account:stateMachine:user-onboarding
```

## Development vs Production

### Development Mode
```bash
WORKFLOW_PROVIDER=mock  # Uses MockWorkflowService
```

### Production Mode
```bash
WORKFLOW_PROVIDER=step-functions  # Uses real AWS Step Functions
```

## How It Works

### 1. User Registration
```javascript
// User signs up
POST /auth/signup/start
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "phoneNumber": "+1234567890"
}

// Step Function workflow starts automatically
// User gets immediate response and can continue using app
```

### 2. Background Processing
```
Step Function Workflow:
├── Phone Verification ✅ (immediate)
├── Wait for Profile Completion (5 min intervals)
├── Start KYC Process
├── Wait for Manual Approval (up to 7 days)
└── Send Notifications (parallel email + SMS)
```

### 3. KYC Approval/Rejection
```javascript
// When KYC team approves/rejects
stepFunctionsService.sendTaskSuccess(taskToken, { approved: true });

// Or rejects
stepFunctionsService.sendTaskFailure(executionArn, taskToken, { 
  name: 'KYC_REJECTED', 
  cause: 'Invalid documents' 
});
```

## Testing

### 1. Mock Mode (Development)
```bash
npm run start:dev
# Uses MockWorkflowService - immediate responses
```

### 2. Step Functions Mode
```bash
WORKFLOW_PROVIDER=step-functions npm run start:dev
# Uses real AWS Step Functions
```

### 3. Test Script
```bash
./test-phase1.sh  # Tests the complete flow
```

## Monitoring

### CloudWatch Logs
- Step Functions execution logs
- Lambda function logs
- Error tracking and alerts

### Metrics
- Workflow success/failure rates
- KYC approval times
- User completion rates

## Benefits

1. **User Experience** - No blocking waits for KYC
2. **Scalability** - Handles thousands of concurrent workflows
3. **Reliability** - Built-in retry and error handling
4. **Visibility** - Full audit trail of user onboarding
5. **Flexibility** - Easy to modify workflow steps

## Next Steps

1. Deploy the Step Functions state machine
2. Create the Lambda functions
3. Set up SNS/SES for notifications
4. Configure environment variables
5. Test end-to-end workflow
