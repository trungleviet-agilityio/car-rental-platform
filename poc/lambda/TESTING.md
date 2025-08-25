# Lambda Functions Testing Guide

## Overview

This guide covers testing all Lambda functions in both mock and real AWS service modes.

## Lambda Functions

1. **`login_handler`** - API Gateway authentication (OTP, password)
2. **`post_confirmation`** - Cognito post-confirmation trigger
3. **`kyc_validator`** - Document validation for Step Functions
4. **`kyc_callback`** - KYC status callback from Step Functions

## Automated Testing

### Run All Tests (Mock Mode)
```bash
cd poc/lambda
node test-lambdas.js
```

### Individual Function Testing
```bash
# Test login handler only
cd login_handler
node -e "
const handler = require('./login_handler.js');
const event = {
  body: JSON.stringify({action: 'initiate_auth', phone_number: '+1234567890'}),
  headers: {'Content-Type': 'application/json'}
};
handler.lambda_handler(event, {}).then(console.log);
"
```

## Manual Testing with Real AWS Services

### 1. Login Handler (API Gateway)

Set environment variables for real mode:
```bash
export USER_POOL_ID=ap-southeast-1_xxxxxxx
export USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxx
export AWS_REGION=ap-southeast-1
# MOCK_MODE not set = real mode
```

Test initiate auth:
```bash
curl -X POST $API_GATEWAY_URL/auth/login \
-H 'Content-Type: application/json' \
-d '{"action":"initiate_auth","phone_number":"+84123456789"}'
```

Test respond to challenge:
```bash
curl -X POST $API_GATEWAY_URL/auth/login \
-H 'Content-Type: application/json' \
-d '{"action":"respond_to_challenge","session":"REAL_SESSION","otp_code":"123456"}'
```

Test password auth:
```bash
curl -X POST $API_GATEWAY_URL/auth/login \
-H 'Content-Type: application/json' \
-d '{"action":"password","username":"test@example.com","password":"TestPass123!"}'
```

### 2. Post Confirmation (Cognito Trigger)

This Lambda is automatically triggered by Cognito. To test manually:

```bash
# Set backend URL
export BACKEND_URL=http://your-alb-dns/api

# Test with mock event
node -e "
const handler = require('./post_confirmation/index.js');
const event = {
  request: {
    userAttributes: {
      sub: 'real-cognito-sub-uuid',
      email: 'test@example.com',
      phone_number: '+84123456789'
    }
  },
  userName: 'test@example.com'
};
handler.handler(event, {}).then(console.log);
"
```

### 3. KYC Validator (Step Functions)

Test document validation:
```bash
# Set S3 bucket for real validation
export S3_BUCKET_NAME=your-s3-bucket-name
export VALIDATION_DELAY_MS=2000

node -e "
const handler = require('./kyc_validator/index.js');
const event = {
  cognitoSub: 'real-user-sub',
  key: 'kyc/real-user-sub/1672531200000-document.jpg'
};
handler.handler(event, {}).then(console.log);
"
```

### 4. KYC Callback (Step Functions)

Test status callback:
```bash
# Set backend URL
export BACKEND_URL=http://your-alb-dns/api

node -e "
const handler = require('./kyc_callback/index.js');
const event = {
  cognitoSub: 'real-user-sub',
  key: 'kyc/real-user-sub/1672531200000-document.jpg',
  status: 'verified'
};
handler.handler(event, {}).then(console.log);
"
```

## Testing Complete Flows

### Flow 1: Onboarding + KYC

1. **Sign up via Cognito CLI:**
```bash
aws cognito-idp sign-up \
  --region ap-southeast-1 \
  --client-id $USER_POOL_CLIENT_ID \
  --username test@example.com \
  --password TestPass123! \
  --user-attributes Name=email,Value=test@example.com Name=phone_number,Value=+84123456789
```

2. **Confirm signup:**
```bash
aws cognito-idp confirm-sign-up \
  --region ap-southeast-1 \
  --client-id $USER_POOL_CLIENT_ID \
  --username test@example.com \
  --confirmation-code 123456
```
   *(Post-confirmation Lambda automatically triggers)*

3. **Test KYC presign:**
```bash
curl -X POST http://your-alb/api/kyc/presign \
-H 'Content-Type: application/json' \
-d '{"cognitoSub":"real-cognito-sub","contentType":"image/jpeg"}'
```

4. **Upload document to S3:**
```bash
# Use the uploadUrl from step 3
curl -X PUT "PRESIGNED_URL" \
-H 'Content-Type: image/jpeg' \
--data-binary @test-document.jpg
```

5. **Start KYC validation:**
```bash
curl -X POST http://your-alb/api/kyc/validate \
-H 'Content-Type: application/json' \
-d '{"cognitoSub":"real-cognito-sub","key":"kyc/path/to/document.jpg"}'
```
   *(Step Functions + Lambdas automatically execute)*

### Flow 2: Authentication

1. **OTP via API Gateway:**
```bash
# Initiate
curl -X POST $API_GATEWAY_URL/auth/login \
-H 'Content-Type: application/json' \
-d '{"action":"initiate_auth","phone_number":"+84123456789"}'

# Respond with OTP received via SMS
curl -X POST $API_GATEWAY_URL/auth/login \
-H 'Content-Type: application/json' \
-d '{"action":"respond_to_challenge","session":"REAL_SESSION","otp_code":"REAL_OTP"}'
```

2. **Password via ALB:**
```bash
curl -X POST http://your-alb/api/auth/login \
-H 'Content-Type: application/json' \
-d '{"action":"password","username":"test@example.com","password":"TestPass123!"}'
```

## Environment Configuration

### Mock Mode (Default)
```bash
export MOCK_MODE=true
# All functions return simulated responses
```

### Real AWS Mode
```bash
# Unset MOCK_MODE or set to false
unset MOCK_MODE

# Required for login_handler
export USER_POOL_ID=ap-southeast-1_xxxxxxx
export USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxx
export AWS_REGION=ap-southeast-1

# Required for post_confirmation and kyc_callback
export BACKEND_URL=http://your-alb-dns/car-rental/v1

# Required for kyc_validator (real S3 validation)
export S3_BUCKET_NAME=your-s3-bucket-name
```

## Expected Results

### Mock Mode
- All functions return predefined responses
- No AWS service calls are made
- Suitable for local development and CI/CD

### Real Mode
- Functions interact with actual AWS services
- Requires proper IAM permissions and resource setup
- Returns real data from Cognito, S3, etc.

## Troubleshooting

### Common Issues

1. **Module not found errors:**
   ```bash
   cd function-directory
   npm install
   ```

2. **Permission errors:**
   - Ensure Lambda execution role has required permissions
   - Check VPC/security group settings for network access

3. **Timeout errors:**
   - Increase Lambda timeout settings
   - Check network connectivity to external services

4. **Real vs Mock confusion:**
   - Check `MOCK_MODE` environment variable
   - Verify required AWS credentials and config

### Debug Mode

Enable detailed logging:
```bash
export DEBUG=true
node test-lambdas.js
```

View CloudWatch logs for deployed functions:
```bash
aws logs tail /aws/lambda/function-name --follow
```
