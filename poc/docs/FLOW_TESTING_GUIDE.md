# 🧪 Flow Testing Guide - Step by Step

## 🎯 Overview

This guide walks you through testing each flow in both **Mock Mode** and **AWS Mode**, demonstrating our Dependency Inversion Principle (DIP) implementation.

## 🏗️ Setup

### Prerequisites
1. **Backend running**: `cd poc/backend && npm run start:dev`
2. **Check provider mode**: `curl http://localhost:3000/api`

### Provider Mode Switching
```bash
# Mock Mode (Default)
export PROVIDER_MODE=mock
npm run start:dev

# AWS Mode  
export PROVIDER_MODE=aws
export USER_POOL_ID=ap-southeast-1_xxxxxxx
export USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxx
export S3_BUCKET_NAME=your-s3-bucket
npm run start:dev
```

---

## 📋 Flow 1: Registration & Onboarding

### 🎭 Mock Mode Testing

#### Step 1: Check Health & Provider Status
```bash
curl http://localhost:3000/api
```
**Expected Response:**
```json
{
  "status": "ok",
  "providers": {
    "mode": "mock",
    "auth": "mock",
    "database": "in-memory"
  }
}
```

#### Step 2: Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
-H 'Content-Type: application/json' \
-d '{
  "username": "test@example.com",
  "password": "StrongPass!23",
  "phone_number": "+84123456789"
}'
```
**Expected Response:**
```json
{
  "message": "Sign up initiated (simulated). User automatically confirmed in mock mode."
}
```

#### Step 3: Confirm Registration (Mock - Always Succeeds)
```bash
curl -X POST http://localhost:3000/api/auth/confirm \
-H 'Content-Type: application/json' \
-d '{
  "username": "test@example.com",
  "code": "123456"
}'
```
**Expected Response:**
```json
{
  "message": "Sign up confirmed (simulated)"
}
```

#### Step 4: Sync User to Database
```bash
curl -X POST http://localhost:3000/api/users/sync \
-H 'Content-Type: application/json' \
-d '{
  "cognitoSub": "mock-cognito-sub-123",
  "username": "test@example.com",
  "phoneNumber": "+84123456789",
  "email": "test@example.com"
}'
```
**Expected Response:**
```json
{
  "id": "uuid-generated",
  "cognitoSub": "mock-cognito-sub-123"
}
```

### 🌐 AWS Mode Testing

#### Step 1: Switch to AWS Mode
```bash
# Stop current server (Ctrl+C)
export PROVIDER_MODE=aws
export USER_POOL_ID=ap-southeast-1_xxxxxxx
export USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxx
npm run start:dev
```

#### Step 2: Verify AWS Mode
```bash
curl http://localhost:3000/api
```
**Expected Response:**
```json
{
  "status": "ok",
  "providers": {
    "mode": "aws",
    "auth": "cognito",
    "storage": "s3"
  }
}
```

#### Step 3: Register User (Real Cognito)
```bash
curl -X POST http://localhost:3000/api/auth/register \
-H 'Content-Type: application/json' \
-d '{
  "username": "real-user@example.com",
  "password": "RealPass!23",
  "phone_number": "+84987654321"
}'
```
**Expected Response:**
```json
{
  "message": "Sign up initiated. Please confirm the code."
}
```

#### Step 4: Check Email for Confirmation Code
- Check your email inbox for the confirmation code
- Use the real code from AWS Cognito

#### Step 5: Confirm with Real Code
```bash
curl -X POST http://localhost:3000/api/auth/confirm \
-H 'Content-Type: application/json' \
-d '{
  "username": "real-user@example.com",
  "code": "REAL_CODE_FROM_EMAIL"
}'
```
**Expected Response:**
```json
{
  "message": "Sign up confirmed"
}
```

---

## 🔐 Flow 2: Authentication Testing

### 🎭 Mock Mode - Custom OTP (New DIP Feature)

#### Step 1: Initiate OTP via Email
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H 'Content-Type: application/json' \
-d '{
  "action": "otp_initiate",
  "channel": "email",
  "email": "test@example.com"
}'
```
**Expected Response:**
```json
{
  "message": "OTP sent",
  "channel": "email",
  "debugOtp": "123456"
}
```

#### Step 2: Verify OTP
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H 'Content-Type: application/json' \
-d '{
  "action": "otp_verify",
  "channel": "email",
  "email": "test@example.com",
  "otp_code": "123456"
}'
```
**Expected Response:**
```json
{
  "message": "Login successful",
  "tokens": {
    "AccessToken": "custom_mock_access_token",
    "IdToken": "custom_mock_id_token",
    "RefreshToken": "custom_mock_refresh_token",
    "TokenType": "Bearer",
    "ExpiresIn": 3600
  }
}
```

#### Step 3: Test SMS OTP
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H 'Content-Type: application/json' \
-d '{
  "action": "otp_initiate",
  "channel": "sms",
  "phone_number": "+84123456789"
}'
```

### 🌐 AWS Mode - Real Email/SMS

#### Step 1: Initiate OTP via Real Email (SES)
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H 'Content-Type: application/json' \
-d '{
  "action": "otp_initiate",
  "channel": "email",
  "email": "your-verified-email@example.com"
}'
```
**Response:** Check your email for the real OTP code

#### Step 2: Verify Real OTP
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H 'Content-Type: application/json' \
-d '{
  "action": "otp_verify",
  "channel": "email",
  "email": "your-verified-email@example.com",
  "otp_code": "REAL_OTP_FROM_EMAIL"
}'
```

### 🔑 Password Authentication

#### Mock Mode
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H 'Content-Type: application/json' \
-d '{
  "action": "password",
  "username": "test@example.com",
  "password": "any-password"
}'
```

#### AWS Mode
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H 'Content-Type: application/json' \
-d '{
  "action": "password",
  "username": "real-user@example.com",
  "password": "RealPass!23"
}'
```

---

## 📄 Flow 3: KYC Document Processing

### 🎭 Mock Mode

#### Step 1: Get Presigned Upload URL
```bash
curl -X POST http://localhost:3000/api/kyc/presign \
-H 'Content-Type: application/json' \
-d '{
  "cognitoSub": "mock-user-123",
  "contentType": "image/jpeg"
}'
```
**Expected Response:**
```json
{
  "uploadUrl": "https://car-rental-storage-demo.s3.amazonaws.com/kyc/mock-user-123/...?X-Amz-Signature=mock",
  "key": "kyc/mock-user-123/...-document.jpg",
  "method": "PUT",
  "expiresIn": 900
}
```

#### Step 2: Simulate Document Upload (Mock)
```bash
# Mock URLs don't actually upload - this is expected behavior
echo "Mock upload completed"
```

#### Step 3: Start KYC Validation
```bash
curl -X POST http://localhost:3000/api/kyc/validate \
-H 'Content-Type: application/json' \
-d '{
  "cognitoSub": "mock-user-123",
  "key": "kyc/mock-user-123/1672531200000-document.jpg"
}'
```
**Expected Response:**
```json
{
  "executionArn": "arn:aws:states:mock:execution"
}
```

#### Step 4: Simulate KYC Callback
```bash
curl -X POST http://localhost:3000/api/kyc/callback \
-H 'Content-Type: application/json' \
-d '{
  "cognitoSub": "mock-user-123",
  "key": "kyc/mock-user-123/1672531200000-document.jpg",
  "status": "verified"
}'
```
**Expected Response:**
```json
{
  "cognitoSub": "mock-user-123",
  "kycStatus": "verified"
}
```

### 🌐 AWS Mode

#### Step 1: Get Real S3 Presigned URL
```bash
curl -X POST http://your-alb-dns/api/kyc/presign \
-H 'Content-Type: application/json' \
-d '{
  "cognitoSub": "real-cognito-sub",
  "contentType": "image/jpeg"
}'
```

#### Step 2: Upload Real Document
```bash
# Use the real uploadUrl from step 1
curl -X PUT "REAL_PRESIGNED_URL" \
-H 'Content-Type: image/jpeg' \
--data-binary @document.jpg
```

#### Step 3: Start Real Step Functions
```bash
curl -X POST http://your-alb-dns/api/kyc/validate \
-H 'Content-Type: application/json' \
-d '{
  "cognitoSub": "real-cognito-sub",
  "key": "kyc/real-cognito-sub/...-document.jpg"
}'
```

---

## 🧪 Notification Service Testing

### 🎭 Mock Mode

#### Test Email Notification
```bash
curl -X POST http://localhost:3000/api/notify/email \
-H 'Content-Type: application/json' \
-d '{
  "to": "test@example.com",
  "subject": "DIP Test Email",
  "text": "Testing dependency inversion principle"
}'
```
**Expected Response:**
```json
{
  "ok": true,
  "messageId": "mock-email-id"
}
```

#### Test SMS Notification
```bash
curl -X POST http://localhost:3000/api/notify/sms \
-H 'Content-Type: application/json' \
-d '{
  "to": "+84123456789",
  "message": "DIP Test SMS: Your car rental is confirmed!"
}'
```
**Expected Response:**
```json
{
  "ok": true,
  "messageId": "mock-sms-id"
}
```

### 🌐 AWS Mode

#### Test Real Email (SES)
```bash
curl -X POST http://your-alb-dns/api/notify/email \
-H 'Content-Type: application/json' \
-d '{
  "to": "verified-email@example.com",
  "subject": "Real SES Test",
  "text": "This email sent via AWS SES"
}'
```
**Note:** Email must be verified in SES console

#### Test Real SMS (SNS)
```bash
curl -X POST http://your-alb-dns/api/notify/sms \
-H 'Content-Type: application/json' \
-d '{
  "to": "+84123456789",
  "message": "Real SMS via AWS SNS"
}'
```

---

## 🎯 Postman Testing

### Import and Setup
1. Import `poc/postman/CarRental-PoC.postman_collection.json`
2. Create environment with:
   - `local_base`: `http://localhost:3000/api`
   - `provider_mode`: `mock` or `aws`

### Test Sequence
1. **Health Check** → Verify provider mode
2. **Registration Flow** → Register → Confirm → Sync
3. **Authentication Flow** → Custom OTP or Password
4. **KYC Flow** → Presign → Upload → Validate → Callback
5. **Notification Flow** → Email and SMS tests

---

## 🐛 Troubleshooting

### Common Issues

**Mock Mode:**
- All tests should pass with simulated responses
- No external dependencies required
- Fast execution (< 1 second per request)

**AWS Mode:**
- Requires proper AWS credentials and permissions
- Email recipients must be verified in SES (sandbox mode)
- Real costs may apply for SNS/SES usage

### Debug Commands
```bash
# Check current configuration
curl http://localhost:3000/api

# Monitor server logs
tail -f server.log

# Test specific provider
PROVIDER_MODE=mock node test-dip.js
```

---

## ✅ Success Criteria

### Mock Mode
- ✅ All requests return 200 status
- ✅ Responses contain mock data
- ✅ No external service calls
- ✅ Fast execution times

### AWS Mode  
- ✅ Real emails/SMS received
- ✅ Cognito users created
- ✅ S3 uploads successful
- ✅ Step Functions executions logged

This testing approach demonstrates the power of Dependency Inversion Principle - the same business logic works seamlessly with both mock and real implementations! 🚀
