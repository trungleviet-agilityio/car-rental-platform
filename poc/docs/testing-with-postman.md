# Testing with Postman - Complete DIP Architecture Guide

## 🎯 Overview

This guide covers comprehensive testing of the Car Rental Platform using the updated Postman collection that demonstrates **Dependency Inversion Principle (DIP)** with multiple provider support.

## 📥 Import Collection

1. **Open Postman**
2. **Import file**: `poc/postman/CarRental-PoC.postman_collection.json`
3. **Create Environment**: Set up environment variables for different testing scenarios

## 🔧 Environment Setup

### Local Development (Mock Providers)
```json
{
  "local_base": "http://localhost:3000/api",
  "debug_otp": "",
  "access_token": "",
  "user_id": "",
  "document_key": "",
  "payment_intent_id": ""
}
```

### Production Environment (Real Providers)
```json
{
  "alb_base": "http://your-alb-dns-name.ap-southeast-1.elb.amazonaws.com",
  "api_gateway_base": "https://your-api-id.execute-api.ap-southeast-1.amazonaws.com/prod"
}
```

## 📁 Collection Structure

The collection is organized into three main sections:

### 🏠 Local Development (Mock Providers)
**Purpose**: Fast development and testing with simulated services
**Provider Mode**: All services set to `mock`
**Use Case**: Daily development, unit testing, CI/CD validation

### ☁️ Production Environment (Real Providers)  
**Purpose**: Production validation with real AWS/third-party services
**Provider Mode**: Real providers (AWS Cognito, SES/SNS, S3, Stripe, Twilio)
**Use Case**: End-to-end testing, production validation, performance testing

### 🧪 Legacy API Gateway (Lambda)
**Purpose**: Backward compatibility with existing Lambda endpoints
**Use Case**: Migration testing, legacy system integration

## 🧪 Testing Strategy

### 1. Start with Local Development (Mock Mode)
- ✅ **Fast iteration** and development
- ✅ **No external dependencies** 
- ✅ **Predictable responses** for debugging
- ✅ **100% success rate** for reliable testing
- ✅ **Instant feedback** for rapid development

### 2. Validate with Production Environment (Real Providers)
- ✅ **Real service integrations** (AWS, Stripe, Twilio)
- ✅ **Production behavior** validation
- ✅ **End-to-end testing** with actual services
- ✅ **Performance benchmarking**
- ✅ **Error handling** validation

### 3. Automated Testing
- ✅ **test-complete-flow.sh** script for automated validation
- ✅ **12 main scenarios** covered automatically
- ✅ **Variable chaining** between requests
- ✅ **Comprehensive reporting** with pass/fail status

## 📋 Complete Flow Scenarios

The collection covers **12 main scenarios** that represent complete user journeys:

### 🏠 Local Development Scenarios (Mock Providers)

#### **📊 System Health**
1. **Health Check** - Verify system status and provider configuration

#### **🔐 Authentication Flow** 
2. **Register User** - Create new user account
3. **OTP Initiate (Email)** - Send OTP via email notification
4. **OTP Verify** - Authenticate with OTP code
5. **User Sync** - Synchronize user data to database

#### **📄 KYC Document Flow**
6. **KYC Presign Upload URL** - Generate document upload URL
7. **KYC Callback (Simulate Verification)** - Process document verification

#### **📧 Notification Services**
8. **Email Notification** - Send email via DIP providers
9. **SMS Notification** - Send SMS via DIP providers  
10. **OTP Notification (Unified)** - Send OTP via unified endpoint

#### **💳 Payment Processing**
11. **Payment Intent Creation** - Create payment intent for booking
12. **Payment Confirmation** - Confirm payment transaction
13. **Payment Status Check** - Check payment status
14. **Payment Refund** - Process payment refund

### ☁️ Production Environment Scenarios (Real Providers)

#### **📊 System Health**
- **Health Check (ALB)** - Production health verification

#### **🔐 Authentication Flow (Real AWS)**
- **Register User (Cognito)** - Real AWS Cognito registration
- **OTP Initiate (Real SES)** - Real email via AWS SES
- **OTP Verify (Real Code)** - Verify real OTP codes

#### **📄 KYC Flow (Real S3)**
- **KYC Presign (Real S3)** - Real S3 presigned URLs
- **KYC Validate (Step Functions)** - Real Step Functions workflow

#### **📧 Notifications (Real Services)**
- **Email (Real SES)** - Production email delivery
- **SMS (Real SNS/Twilio)** - Production SMS delivery

#### **💳 Payments (Real Stripe)**
- **Payment Intent (Stripe)** - Real Stripe payment processing
- **Payment Confirm (Stripe)** - Real payment confirmation

### 🧪 Legacy API Gateway (Lambda)
- **Initiate Login (Lambda)** - Legacy Lambda authentication
- **Respond OTP (Lambda)** - Legacy OTP verification

## 🚀 Automated Testing

### Running Complete Flow Test
```bash
cd poc/backend
chmod +x test-complete-flow.sh
./test-complete-flow.sh
```

**Expected Output:**
```
🚀 Car Rental Platform - Complete Flow Testing
Total Tests: 12
Passed: 12
Failed: 0

🎉 ALL TESTS PASSED! The DIP architecture is working perfectly!
```

### Environment Variable Chaining
The collection automatically chains variables between requests:
- `debug_otp` ← Extracted from OTP Initiate response
- `user_id` ← Extracted from User Sync response  
- `document_key` ← Extracted from KYC Presign response
- `payment_intent_id` ← Extracted from Payment Intent response

## 💡 Testing Tips

### Local Development (Mock Mode)
- ✅ **Fast execution** - All responses < 100ms
- ✅ **Predictable results** - 100% success rate
- ✅ **No external dependencies** - Works offline
- ✅ **Debug information** - OTP codes provided in responses

### Production Testing (Real Providers)
- ✅ **Real service validation** - Test actual AWS/Stripe/Twilio
- ✅ **Performance benchmarking** - Measure real response times
- ✅ **Error handling** - Test with real failure scenarios
- ✅ **End-to-end validation** - Complete user journey testing

### KYC Document Upload
For real S3 upload testing:
1. Use the returned `uploadUrl` in a new Postman request
2. Method: PUT
3. URL: `uploadUrl` value from KYC Presign response
4. Headers: `Content-Type` should match requested type (e.g., `image/jpeg`)
5. Body: binary → select a small image file
6. Expected: 200/204 from S3 on success

## Bodies
- ALB - Auth Register
```
POST {{alb_base}}/api/auth/register
{ "username": "email@example.com", "password": "StrongPass!23", "phone_number": "+84..." }
```

- ALB - Auth Confirm
```
POST {{alb_base}}/api/auth/confirm
{ "username": "email@example.com", "code": "123456" }
```

- Sign up/confirm via AWS CLI (alternative to test Cognito directly)
```
REGION=ap-southeast-1
POOL_ID=ap-southeast-1_yxpT8GqB7
CLIENT_ID=4laht6e08tmov66rpsfoo7t5sg
PHONE="+84xxxxxxxxx"

aws cognito-idp admin-create-user \
  --region $REGION \
  --user-pool-id $POOL_ID \
  --username $PHONE \
  --user-attributes Name=phone_number,Value=$PHONE Name=phone_number_verified,Value=true

aws cognito-idp admin-set-user-password \
  --region $REGION \
  --user-pool-id $POOL_ID \
  --username $PHONE \
  --password 'dummy_password' \
  --permanent
```

- Users Sync (from Post-Confirmation Lambda)
```
{ "cognitoSub": "uuid", "username": "name", "phoneNumber": "+123", "email": "user@example.com" }
```

- KYC Presign
```
{ "cognitoSub": "uuid", "contentType": "image/jpeg" }
```

- KYC Validate
```
{ "cognitoSub": "uuid", "key": "kyc/...jpg" }
```

- KYC Callback
```
{ "cognitoSub": "uuid", "key": "kyc/...jpg", "status": "verified" }
```

### 🆕 Payment Services (DIP Feature)

- Payment Intent Creation
```
POST {{local_base}}/payment/intent
{
  "amount": 5000,
  "currency": "usd",
  "metadata": {
    "bookingId": "booking-123",
    "carModel": "Tesla Model 3",
    "rentalDays": "3"
  }
}
```

- Payment Confirmation
```
POST {{local_base}}/payment/confirm
{
  "paymentIntentId": "pi_mock_1234567890_abcdef",
  "paymentMethodId": "pm_mock_card_visa"
}
```

- Payment Refund
```
POST {{local_base}}/payment/refund
{
  "paymentIntentId": "pi_mock_1234567890_abcdef",
  "amount": 2500
}
```

- Payment Status Check
```
GET {{local_base}}/payment/status/pi_mock_1234567890_abcdef
```

### 🆕 Notification Services (DIP Feature)

- Email Notification
```
POST {{local_base}}/notify/email
{
  "to": "test@example.com",
  "subject": "Car Rental Confirmation",
  "text": "Your car rental booking has been confirmed!"
}
```

- SMS Notification
```
POST {{local_base}}/notify/sms
{
  "to": "+84123456789",
  "message": "Your car rental is confirmed! Pickup time: 2PM today."
}
```

- Unified OTP Notification
```
POST {{local_base}}/notify/otp
{
  "channel": "email",
  "to": "test@example.com",
  "code": "123456"
}
```
{ "cognitoSub": "uuid", "key": "kyc/...jpg" }
```

- KYC Callback (simulate)

### Email/Password login
```
POST {{alb_base}}/api/auth/login
{
  "action": "password",
  "username": "email@example.com",
  "password": "StrongPass!23"
}
```

### 🆕 Custom OTP Authentication (DIP Feature)

#### Initiate OTP via Email
```
POST {{local_base}}/auth/login
{
  "action": "otp_initiate",
  "channel": "email",
  "email": "test@example.com"
}
```

#### Initiate OTP via SMS
```
POST {{local_base}}/auth/login
{
  "action": "otp_initiate", 
  "channel": "sms",
  "phone_number": "+84987654321"
}
```

#### Verify OTP
```
POST {{local_base}}/auth/login
{
  "action": "otp_verify",
  "channel": "email",
  "email": "test@example.com",
  "otp_code": "123456"
}
```

### 🆕 Notification Services

#### Send Email
```
POST {{local_base}}/notify/email
{
  "to": "test@example.com",
  "subject": "DIP Test Email",
  "text": "Testing notification service via DIP"
}
```

#### Send SMS
```
POST {{local_base}}/notify/sms
{
  "to": "+84987654321",
  "message": "DIP Test SMS: Your car rental is confirmed!"
}
```

### Local equivalents
Use the same bodies but replace the base with `{{local_base}}` (for example `POST {{local_base}}/auth/register`).
```
{ "cognitoSub": "uuid", "key": "kyc/...jpg", "status": "verified" }
```

## Environment variables to set in Postman
- `api_gateway_base`: `https://10cfmotrh3.execute-api.ap-southeast-1.amazonaws.com/prod`
- `alb_base`: `http://CarRen-CarRe-Td7VZnrzQil5-127104625.ap-southeast-1.elb.amazonaws.com`

## 🎯 Expected Results

### Local Development (Mock Mode)
- ✅ **All requests return 200/201** status codes
- ✅ **Response times < 100ms** for all endpoints
- ✅ **100% success rate** with predictable responses
- ✅ **Debug information** included (OTP codes, mock IDs)
- ✅ **No external dependencies** - works completely offline

### Production Environment (Real Providers)
- ✅ **All requests return 200/201** status codes
- ✅ **Response times < 400ms** for most endpoints
- ✅ **Real service integration** with actual AWS/Stripe/Twilio
- ✅ **Error handling** for network issues and service failures
- ✅ **End-to-end validation** of complete user journeys

### Automated Testing
- ✅ **12/12 scenarios pass** with automated script
- ✅ **Variable chaining** works correctly between requests
- ✅ **Comprehensive reporting** with detailed pass/fail status
- ✅ **Environment isolation** between mock and real providers

## 🏆 Success Criteria

### Mock Mode Validation
- ✅ Health check shows all providers as "mock"
- ✅ Authentication flow completes with mock tokens
- ✅ KYC flow generates mock presigned URLs
- ✅ Notifications return mock message IDs
- ✅ Payments process with mock transaction IDs

### Production Mode Validation  
- ✅ Health check shows real provider configuration
- ✅ Real emails/SMS delivered to verified recipients
- ✅ Real S3 uploads and Step Functions executions
- ✅ Real Stripe payment processing and confirmations
- ✅ Complete end-to-end user journey validation

**The updated Postman collection provides comprehensive testing coverage for the Car Rental Platform's DIP architecture! 🚀**
