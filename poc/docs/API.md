# 🔌 API Documentation - Car Rental Platform

Complete API documentation demonstrating **Dependency Inversion Principle (DIP)** with multiple provider support.

## 🎯 **Provider-Based Architecture**

The API supports multiple provider modes through **Dependency Inversion Principle (DIP)**:

### **Provider Configuration**
```bash
# Development: Fast iteration with mocks
AUTH_PROVIDER=mock STORAGE_PROVIDER=mock NOTIFICATION_PROVIDER=mock PAYMENT_PROVIDER=mock LAMBDA_PROVIDER=mock

# Production: Real AWS services
AUTH_PROVIDER=aws STORAGE_PROVIDER=s3 NOTIFICATION_PROVIDER=aws PAYMENT_PROVIDER=stripe LAMBDA_PROVIDER=aws

# Mixed: Test specific integrations
AUTH_PROVIDER=aws STORAGE_PROVIDER=mock NOTIFICATION_PROVIDER=twilio PAYMENT_PROVIDER=mock
```

### **Supported Providers**
| Service | Mock | AWS | Third-Party |
|---------|------|-----|-------------|
| **Authentication** | Mock responses | Cognito | - |
| **Storage** | In-memory | S3 | - |
| **Notifications** | Console logs | SES/SNS | Twilio |
| **Payments** | Mock transactions | - | Stripe |
| **Lambda** | Mock functions | Lambda | - |

## 🔧 **Base Configuration**

### **Environment URLs**
- **Local Development**: `http://localhost:3000/api`
- **API Gateway** (Lambda): Use CloudFormation outputs
- **ALB** (Fargate): Use AWS Load Balancer DNS

### **Health Check**
```bash
curl http://localhost:3000/api

# Response:
{
  "status": "ok",
  "timestamp": "2025-08-14T07:47:25.939Z",
  "environment": "development",
  "providers": {
    "auth": "mock",
    "storage": "mock", 
    "notifications": "mock",
    "payment": "mock",
    "lambda": "mock",
    "database": "postgresql"
  }
}
```

## 🔐 **Authentication API**

### **Provider Support**
- **Mock**: `AUTH_PROVIDER=mock` - Fast development, simulated responses
- **AWS Cognito**: `AUTH_PROVIDER=aws` - Production authentication, SMS MFA

### **OTP-Based Authentication**

#### **Initiate OTP**
```http
POST /api/auth/login
Content-Type: application/json

{
  "action": "initiate_auth",
  "phone_number": "+1234567890"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "session": "mock_session",
  "challenge_name": "SMS_MFA"
}
```

#### **Verify OTP**
```http
POST /api/auth/login
Content-Type: application/json

{
  "action": "respond_to_challenge",
  "session": "mock_session",
  "otp_code": "123456",
  "phone_number": "+1234567890"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "tokens": {
    "AccessToken": "eyJhbGciOiJIUzI1NiIs...",
    "IdToken": "eyJhbGciOiJIUzI1NiIs...", 
    "RefreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "TokenType": "Bearer",
    "ExpiresIn": 3600
  }
}
```

### **Custom OTP Flow (Email/SMS)**

#### **Initiate Custom OTP**
```http
POST /api/auth/login
Content-Type: application/json

{
  "action": "otp_initiate",
  "channel": "email",
  "email": "user@example.com"
}
```

#### **Verify Custom OTP**
```http
POST /api/auth/login
Content-Type: application/json

{
  "action": "otp_verify",
  "channel": "email", 
  "email": "user@example.com",
  "otp_code": "123456"
}
```

### **User Registration**

#### **Register New User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "SecurePassword123!",
  "phone_number": "+1234567890"
}
```

#### **Confirm Registration**
```http
POST /api/auth/confirm
Content-Type: application/json

{
  "username": "user@example.com",
  "code": "123456"
}
```

## 📄 **KYC & File Upload API**

### **Lambda Integration**
The KYC flow integrates with AWS Lambda and Step Functions as per sequence diagrams:

### **Generate Presigned URL (via Lambda)**
```http
POST /api/kyc/presign
Content-Type: application/json

{
  "cognitoSub": "user-123",
  "contentType": "image/jpeg"
}
```

**Response:**
```json
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/kyc/user-123/document.jpg?signature=...",
  "key": "kyc/user-123/1234567890-document.jpg",
  "method": "PUT",
  "expiresIn": 900
}
```

### **Start KYC Validation (via Step Functions)**
```http
POST /api/kyc/validate
Content-Type: application/json

{
  "cognitoSub": "user-123",
  "key": "kyc/user-123/document.jpg"
}
```

**Response:**
```json
{
  "executionArn": "arn:aws:states:ap-southeast-1:123456789012:execution:kyc-validation:abc123",
  "status": "RUNNING"
}
```

### **KYC Callback (Lambda Callback)**
```http
POST /api/kyc/callback
Content-Type: application/json

{
  "cognitoSub": "user-123",
  "key": "kyc/user-123/document.jpg",
  "status": "verified"
}
```

**Response:**
```json
{
  "cognitoSub": "user-123",
  "kycStatus": "verified"
}
```

## 📧 **Notification API**

### **Provider Support**
- **Mock**: `NOTIFICATION_PROVIDER=mock` - Console logs
- **AWS**: `NOTIFICATION_PROVIDER=aws` - SES/SNS
- **Twilio**: `NOTIFICATION_PROVIDER=twilio` - SMS only

### **Email Notification**
```http
POST /api/notify/email
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Welcome to Car Rental",
  "text": "Thank you for joining us!"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "mock-email-id-123"
}
```

### **SMS Notification**
```http
POST /api/notify/sms
Content-Type: application/json

{
  "to": "+1234567890",
  "message": "Your verification code is: 123456"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "mock-sms-id-456"
}
```

### **Unified OTP Notification**
```http
POST /api/notify/otp
Content-Type: application/json

{
  "channel": "email",
  "to": "user@example.com",
  "code": "123456"
}
```

## 💳 **Payment API**

### **Provider Support**
- **Mock**: `PAYMENT_PROVIDER=mock` - Simulated transactions
- **Stripe**: `PAYMENT_PROVIDER=stripe` - Real payment processing

### **Create Payment Intent**
```http
POST /api/payment/create-intent
Content-Type: application/json

{
  "amount": 5000,
  "currency": "usd",
  "description": "Car rental booking"
}
```

**Response:**
```json
{
  "id": "pi_mock_1234567890",
  "clientSecret": "pi_mock_1234567890_secret_abc123",
  "amount": 5000,
  "currency": "usd",
  "status": "requires_payment_method"
}
```

### **Confirm Payment**
```http
POST /api/payment/confirm
Content-Type: application/json

{
  "paymentIntentId": "pi_mock_1234567890",
  "paymentMethod": "pm_mock_1234567890"
}
```

**Response:**
```json
{
  "id": "pi_mock_1234567890",
  "status": "succeeded",
  "amount": 5000,
  "currency": "usd"
}
```

### **Process Refund**
```http
POST /api/payment/refund
Content-Type: application/json

{
  "paymentIntentId": "pi_mock_1234567890",
  "amount": 2500
}
```

**Response:**
```json
{
  "id": "re_mock_1234567890",
  "amount": 2500,
  "status": "succeeded"
}
```

## 👥 **User Management API**

### **User Synchronization**
```http
POST /api/users/sync
Content-Type: application/json

{
  "cognitoSub": "mock-cognito-sub-123",
  "username": "user@example.com",
  "phoneNumber": "+1234567890",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "id": "uuid-generated",
  "cognitoSub": "mock-cognito-sub-123",
  "username": "user@example.com",
  "kycStatus": "unverified"
}
```

## 🧪 **Testing Examples**

### **Complete Authentication Flow**
```bash
# 1. Health check
curl http://localhost:3000/api

# 2. Initiate OTP
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"action":"initiate_auth","phone_number":"+1234567890"}'

# 3. Verify OTP  
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"action":"respond_to_challenge","session":"mock_session","otp_code":"123456"}'
```

### **KYC Flow with Lambda Integration**
```bash
# 1. Generate presigned URL
curl -X POST http://localhost:3000/api/kyc/presign \
  -H 'Content-Type: application/json' \
  -d '{"cognitoSub":"user-123","contentType":"image/jpeg"}'

# 2. Start validation
curl -X POST http://localhost:3000/api/kyc/validate \
  -H 'Content-Type: application/json' \
  -d '{"cognitoSub":"user-123","key":"kyc/user-123/document.jpg"}'

# 3. Process callback
curl -X POST http://localhost:3000/api/kyc/callback \
  -H 'Content-Type: application/json' \
  -d '{"cognitoSub":"user-123","key":"kyc/user-123/document.jpg","status":"verified"}'
```

## ❌ **Error Handling**

### **Common Error Responses**
```json
// Invalid OTP
{
  "statusCode": 401,
  "message": "Invalid code"
}

// User not found
{
  "statusCode": 404,
  "message": "User not found"
}

// Provider error
{
  "statusCode": 500,
  "message": "Service temporarily unavailable"
}
```

## 🔗 **Related Documentation**

- [**Architecture Overview**](ARCHITECTURE.md) - System design and DIP implementation
- [**Testing Guide**](TESTING.md) - Complete testing strategies
- [**Deployment Guide**](DEPLOYMENT.md) - Infrastructure setup
- [**Postman Collection**](../postman/CarRental-PoC.postman_collection.json) - API testing

---

**API documentation covers all endpoints with both mock and real provider examples.**
