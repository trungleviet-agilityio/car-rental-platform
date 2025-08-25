# 🔌 API Documentation - Car Rental Platform

Complete API documentation demonstrating **Dependency Inversion Principle (DIP)** with multiple provider support and **comprehensive security implementation**.

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

## 🔐 **Security Implementation**

### **Authentication & Authorization**
- ✅ **Bearer Token Authentication**: All protected endpoints require `Authorization: Bearer <token>`
- ✅ **Role-Based Access Control**: Owner/admin roles for sensitive operations
- ✅ **Resource Ownership**: Users can only access their own data
- ✅ **Security Guards**: Comprehensive protection with proper error handling

### **Security Headers**
```bash
# Required for all protected endpoints
Authorization: Bearer <your-token>

# Example with curl
curl -H "Authorization: Bearer mock-auth-token-123" \
     http://localhost:3000/car-rental/v1/cars
```

### **Role-Based Access**
- **User Token** (`mock-auth-token-123`): Regular user with 'renter' role
- **Owner Token** (`mock-owner-token-456`): Owner/admin with 'owner' and 'admin' roles
- **Resource Ownership**: Users can only access their own bookings, KYC data, etc.

## 🔧 **Base Configuration**

### **Environment URLs**
- **Local Development**: `http://localhost:3000/car-rental/v1`
- **API Gateway** (Lambda): Use CloudFormation outputs + `/car-rental/v1`
- **ALB** (Fargate): Use AWS Load Balancer DNS + `/car-rental/v1`

### **Health Check**
```bash
curl http://localhost:3000/car-rental/v1

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
    "cars": "internal",
    "database": "in-memory"
  }
}
```

## 🔐 **Authentication API**

### **Provider Support**
- **Mock**: `AUTH_PROVIDER=mock` - Fast development, simulated responses
- **AWS Cognito**: `AUTH_PROVIDER=aws` - Production authentication, SMS MFA

### **Updated Authentication Endpoints**

#### **Sign Up New User**
```http
POST /car-rental/v1/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "phone": "+84123456789"
}
```

**Response:**
```json
{
  "message": "Sign up initiated (simulated). User automatically confirmed in mock mode."
}
```

#### **Confirm Sign Up**
```http
POST /car-rental/v1/auth/signup/confirm
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

#### **Initiate OTP (Phone-Based)**
```http
POST /car-rental/v1/auth/otp/initiate
Content-Type: application/json

{
  "phoneNumber": "+84123456789"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully (simulated)",
  "session": "mock_session",
  "challenge_name": "SMS_MFA"
}
```

#### **Verify OTP**
```http
POST /car-rental/v1/auth/otp/verify
Content-Type: application/json

{
  "phoneNumber": "+84123456789",
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "OTP verified successfully",
  "tokens": {
    "AccessToken": "eyJhbGciOiJIUzI1NiIs...",
    "IdToken": "eyJhbGciOiJIUzI1NiIs...", 
    "RefreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "TokenType": "Bearer",
    "ExpiresIn": 3600
  }
}
```

#### **Sign In with Email/Password**
```http
POST /car-rental/v1/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Sign in successful",
  "tokens": {
    "AccessToken": "eyJhbGciOiJIUzI1NiIs...",
    "IdToken": "eyJhbGciOiJIUzI1NiIs...", 
    "RefreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## 🚗 **Car Management API (Protected)**

### **Add Car (Owner Role Required)**
```http
POST /car-rental/v1/cars
Authorization: Bearer <owner-token>
Content-Type: application/json

{
  "make": "Toyota",
  "model": "Camry",
  "seats": 5,
  "pricePerDayCents": 5000,
  "depositCents": 50000,
  "owner": {
    "email": "owner@example.com",
    "phone": "+12345678901"
  }
}
```

**Response:**
```json
{
  "id": "car-1756112235087",
  "make": "Toyota",
  "model": "Camry",
  "seats": 5,
  "pricePerDayCents": 5000,
  "depositCents": 50000,
  "owner": {
    "email": "owner@example.com",
    "phone": "+12345678901"
  }
}
```

### **List Available Cars (Authentication Required)**
```http
GET /car-rental/v1/cars
Authorization: Bearer <user-token>
```

**Response:**
```json
[
  {
    "id": "car-1",
    "make": "Toyota",
    "model": "Corolla",
    "seats": 5,
    "pricePerDayCents": 4500,
    "depositCents": 10000,
    "owner": {
      "email": "owner1@example.com"
    }
  }
]
```

## 📒 **Booking API (Protected)**

### **Create Booking (Authentication Required)**
```http
POST /car-rental/v1/bookings
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "cognitoSub": "mock-auth-token-123",
  "carId": "car-1756112235087",
  "startDate": "2030-01-01T10:00:00Z",
  "endDate": "2030-01-02T10:00:00Z",
  "totalPrice": 5000
}
```

**Response:**
```json
{
  "message": "Booking created successfully",
  "status": "pending_owner_decision",
  "booking": {
    "id": "25a977b4-1d1d-4fc7-97c9-88ab15e899b7",
    "status": "pending"
  }
}
```

### **Owner Decision (Owner Role Required)**
```http
POST /car-rental/v1/bookings/decision
Authorization: Bearer <owner-token>
Content-Type: application/json

{
  "bookingId": "25a977b4-1d1d-4fc7-97c9-88ab15e899b7",
  "decision": "accepted",
  "renter": {
    "email": "renter@example.com",
    "phone": "+1555666777"
  }
}
```

**Response:**
```json
{
  "message": "Booking accepted successfully",
  "booking": {
    "id": "25a977b4-1d1d-4fc7-97c9-88ab15e899b7",
    "status": "accepted",
    "ownerDecision": "accepted"
  },
  "renterNotified": true
}
```

### **Get User Bookings (Resource Ownership)**
```http
GET /car-rental/v1/bookings/mock-auth-token-123
Authorization: Bearer <user-token>
```

### **Create Payment Intent for Booking (Authentication Required)**
```http
POST /car-rental/v1/bookings/25a977b4-1d1d-4fc7-97c9-88ab15e899b7/payment/intent
Authorization: Bearer <user-token>
```

**Response:**
```json
{
  "id": "pi_mock_1756112235635_3mbjbwap2",
  "clientSecret": "pi_mock_1756112235635_3mbjbwap2_secret_mock",
  "amount": 5000,
  "currency": "usd",
  "status": "requires_payment_method"
}
```

### **Confirm Booking Payment (Authentication Required)**
```http
POST /car-rental/v1/bookings/25a977b4-1d1d-4fc7-97c9-88ab15e899b7/payment/confirm
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "paymentIntentId": "pi_mock_1756112235635_3mbjbwap2",
  "paymentMethodId": "pm_mock_card_visa"
}
```

**Response:**
```json
{
  "message": "Payment confirmed successfully",
  "booking": {
    "status": "paid"
  },
  "payment": {
    "status": "succeeded"
  }
}
```

## 📄 **KYC & File Upload API (Protected)**

### **Lambda Integration**
The KYC flow integrates with AWS Lambda and Step Functions as per sequence diagrams:

⚠️ **Important:** User must be created first via `/users/sync` before KYC operations.

### **Create User for KYC (Required First Step)**
```http
POST /car-rental/v1/users/sync
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "cognitoSub": "mock-auth-token-123",
  "username": "testuser",
  "phoneNumber": "+84123456789",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "id": "uuid-generated",
  "cognitoSub": "mock-auth-token-123"
}
```

### **Generate Presigned URL (via Lambda)**
```http
POST /car-rental/v1/kyc/presign
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "cognitoSub": "mock-auth-token-123",
  "contentType": "image/jpeg"
}
```

**Response:**
```json
{
  "message": "Presigned URL generated successfully",
  "uploadUrl": "https://mock-storage.example.com/kyc-documents/kyc/mock-auth-token-123/1756112235809.jpeg?expires=1756115835910",
  "documentKey": "kyc/mock-auth-token-123/1756112235809.jpeg"
}
```

### **Start KYC Validation (via Step Functions)**
```http
POST /car-rental/v1/kyc/validate
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "cognitoSub": "mock-auth-token-123",
  "key": "kyc/mock-auth-token-123/1756112235809.jpeg"
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
POST /car-rental/v1/kyc/callback
Content-Type: application/json

{
  "cognitoSub": "mock-auth-token-123",
  "key": "kyc/mock-auth-token-123/1756112235809.jpeg",
  "status": "verified"
}
```

**Response:**
```json
{
  "cognitoSub": "mock-auth-token-123",
  "kycStatus": "verified"
}
```

## 📧 **Notification API (Protected)**

### **Provider Support**
- **Mock**: `NOTIFICATION_PROVIDER=mock` - Console logs
- **AWS**: `NOTIFICATION_PROVIDER=aws` - SES/SNS
- **Twilio**: `NOTIFICATION_PROVIDER=twilio` - SMS only

### **Email Notification**
```http
POST /car-rental/v1/notify/email
Authorization: Bearer <user-token>
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
POST /car-rental/v1/notify/sms
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "to": "+84123456789",
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
POST /car-rental/v1/notify/otp
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "to": "+84123456789",
  "code": "123456"
}
```

## 💳 **Payment API (Protected)**

### **Provider Support**
- **Mock**: `PAYMENT_PROVIDER=mock` - Simulated transactions
- **Stripe**: `PAYMENT_PROVIDER=stripe` - Real payment processing

### **Create Payment Intent**
```http
POST /car-rental/v1/payment/intent
Authorization: Bearer <user-token>
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
POST /car-rental/v1/payment/confirm
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "paymentIntentId": "pi_mock_1234567890",
  "paymentMethodId": "pm_mock_card_visa"
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
POST /car-rental/v1/payment/refund
Authorization: Bearer <user-token>
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

## 👥 **User Management API (Protected)**

### **User Synchronization**
```http
POST /car-rental/v1/users/sync
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "cognitoSub": "mock-auth-token-123",
  "username": "user@example.com",
  "phoneNumber": "+84123456789",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "id": "uuid-generated",
  "cognitoSub": "mock-auth-token-123",
  "username": "user@example.com",
  "kycStatus": "unverified"
}
```

## 🧪 **Testing Examples**

### **Complete Authentication Flow**
```bash
# 1. Health check
curl http://localhost:3000/car-rental/v1

# 2. Sign up user
curl -X POST http://localhost:3000/car-rental/v1/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"StrongPass!23","phone":"+84123456789"}'

# 3. Initiate OTP
curl -X POST http://localhost:3000/car-rental/v1/auth/otp/initiate \
  -H 'Content-Type: application/json' \
  -d '{"phoneNumber":"+84123456789"}'

# 4. Verify OTP  
curl -X POST http://localhost:3000/car-rental/v1/auth/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"phoneNumber":"+84123456789","code":"123456"}'

# 5. Sign in with email/password
curl -X POST http://localhost:3000/car-rental/v1/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"StrongPass!23"}'
```

### **KYC Flow with Lambda Integration**
```bash
# 1. Create user first (required)
curl -X POST http://localhost:3000/car-rental/v1/users/sync \
  -H 'Authorization: Bearer mock-auth-token-123' \
  -H 'Content-Type: application/json' \
  -d '{"cognitoSub":"mock-auth-token-123","username":"testuser","phoneNumber":"+84123456789","email":"test@example.com"}'

# 2. Generate presigned URL
curl -X POST http://localhost:3000/car-rental/v1/kyc/presign \
  -H 'Authorization: Bearer mock-auth-token-123' \
  -H 'Content-Type: application/json' \
  -d '{"cognitoSub":"mock-auth-token-123","contentType":"image/jpeg"}'

# 3. Start validation
curl -X POST http://localhost:3000/car-rental/v1/kyc/validate \
  -H 'Authorization: Bearer mock-auth-token-123' \
  -H 'Content-Type: application/json' \
  -d '{"cognitoSub":"mock-auth-token-123","key":"kyc/mock-auth-token-123/document.jpg"}'

# 4. Process callback
curl -X POST http://localhost:3000/car-rental/v1/kyc/callback \
  -H 'Content-Type: application/json' \
  -d '{"cognitoSub":"mock-auth-token-123","key":"kyc/mock-auth-token-123/document.jpg","status":"verified"}'
```

## ❌ **Error Handling**

### **Security Error Responses**
```json
// Missing authentication
{
  "statusCode": 401,
  "message": "Missing or invalid Authorization header",
  "error": "Unauthorized"
}

// Insufficient permissions
{
  "statusCode": 403,
  "message": "Owner or admin role required",
  "error": "Forbidden"
}

// Resource ownership violation
{
  "statusCode": 403,
  "message": "Cannot access resource owned by another user",
  "error": "Forbidden"
}

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

## 🧪 **Automated Testing**

### **Complete Test Script**
Run all API endpoints automatically:
```bash
# Run comprehensive automated tests
./poc/scripts/test/test-postman-collection-complete.sh

# What it tests:
# ✅ System Health (5 endpoints)
# ✅ Car Management (2 endpoints) 
# ✅ Complete Booking Flow (5 endpoints)
# ✅ KYC with Lambda Integration (4 endpoints)
# ✅ Authentication Flow (5 endpoints)
# ✅ Notification Services (3 endpoints)
# Total: 24 automated tests with data chaining
```

### **Updated Postman Collection**
- **File:** `poc/postman/CarRental-PoC.postman_collection.json`
- **Base URL:** `http://localhost:3000/car-rental/v1` ✅ (corrected)
- **Endpoints:** All updated to match actual implementation ✅
- **Tests:** 18 comprehensive test scenarios with validation ✅
- **Security:** All protected endpoints include authentication headers ✅

## 🔗 **Related Documentation**

- [**Architecture Overview**](ARCHITECTURE.md) - System design and DIP implementation
- [**Testing Guide**](TESTING.md) - Complete testing strategies  
- [**Deployment Guide**](DEPLOYMENT.md) - Infrastructure setup
- [**Security Implementation Summary**](../SECURITY_IMPLEMENTATION_SUMMARY.md) - Security features
- [**Automated Testing Report**](../AUTOMATED_TESTING_REPORT.md) - Complete test results
- [**Updated Postman Collection**](../postman/CarRental-PoC.postman_collection.json) - Corrected API testing

## 🎯 **Quick Testing Guide**

### **1. Start the Server**
```bash
cd poc/backend
npm install
npm run start:dev
# ✅ Server runs on http://localhost:3000/car-rental/v1
```

### **2. Verify System Health**
```bash
curl http://localhost:3000/car-rental/v1
# Expected: {"status":"ok","providers":{"auth":"mock",...}}
```

### **3. Run Complete Automated Tests**
```bash
# 🚀 One command tests all 24 endpoints with data chaining
./poc/scripts/test/test-postman-collection-complete.sh
```

### **4. Test Individual Flows**
```bash
# Authentication
curl -X POST http://localhost:3000/car-rental/v1/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"StrongPass!23","phone":"+84123456789"}'

# KYC (user creation required first)
curl -X POST http://localhost:3000/car-rental/v1/users/sync \
  -H 'Authorization: Bearer mock-auth-token-123' \
  -H 'Content-Type: application/json' \
  -d '{"cognitoSub":"mock-auth-token-123","username":"testuser","phoneNumber":"+84123456789","email":"test@example.com"}'

curl -X POST http://localhost:3000/car-rental/v1/kyc/presign \
  -H 'Authorization: Bearer mock-auth-token-123' \
  -H 'Content-Type: application/json' \
  -d '{"cognitoSub":"mock-auth-token-123","contentType":"image/jpeg"}'

# Notifications
curl -X POST http://localhost:3000/car-rental/v1/notify/email \
  -H 'Authorization: Bearer mock-auth-token-123' \
  -H 'Content-Type: application/json' \
  -d '{"to":"test@example.com","subject":"Test","text":"Hello!"}'
```

### **5. Use Updated Postman Collection**
- **Import:** `poc/postman/CarRental-PoC.postman_collection.json`
- **Base URL:** `http://localhost:3000/car-rental/v1` ✅
- **Run:** Complete collection with 18 test scenarios

### **6. Common Issues & Solutions**

| Issue | Cause | Solution |
|-------|-------|----------|
| **401 Unauthorized** | Missing auth header | Add `Authorization: Bearer <token>` |
| **403 Forbidden** | Insufficient permissions | Use correct role token (user/owner) |
| **404 Not Found** | Wrong base URL | Use `/car-rental/v1` not `/api` |
| **KYC 500 Error** | User not created | Run `/users/sync` first |
| **Phone validation errors** | Wrong format | Use international format: `+84123456789` |

### **✅ Success Indicators**
- **Health Check:** Returns `{"status":"ok"}`
- **All Tests:** 24/24 pass in automated script
- **Postman:** All 18 scenarios pass
- **Security:** All protected endpoints require authentication
- **No 401/403 errors:** Proper authentication and authorization

---

**API documentation covers all endpoints with both mock and real provider examples, including comprehensive security implementation.**

---

## 🚗 Cars API (Internal Catalog)

These endpoints expose a simple internal catalog used by the PoC. They do not impact any existing test flows.

### **Add Car**
```http
POST /car-rental/v1/cars
Content-Type: application/json

{
  "make": "Toyota",
  "model": "Camry",
  "seats": 5,
  "pricePerDayCents": 5000,
  "depositCents": 50000,
  "owner": {
    "email": "owner@example.com",
    "phone": "+12345678901"
  }
}
```

### **List Cars**
```http
GET /car-rental/v1/cars
```

### **Get Car by ID**
```http
GET /car-rental/v1/cars/:id
```

---

## 📒 Bookings API (Flow-Compatible)

The following endpoints align with the booking flow (pending → owner notified → owner decision → optional deposit preauth → renter notified). Adding this section does not change existing tests.

### **Create Booking (Pending)**
```http
POST /car-rental/v1/bookings
Content-Type: application/json

{
  "cognitoSub": "mock-user-renter-123",
  "carId": "car-1756106697638",
  "startDate": "2030-01-01T10:00:00Z",
  "endDate": "2030-01-02T10:00:00Z",
  "totalPrice": 5000
}
```

**Response:**
```json
{
  "message": "Booking created successfully",
  "status": "pending_owner_decision",
  "booking": {
    "id": "uuid-generated",
    "status": "pending"
  }
}
```

### **Owner Decision (Accept/Reject)**
```http
POST /car-rental/v1/bookings/decision
Content-Type: application/json

{
  "bookingId": "<uuid>",
  "decision": "accepted",
  "renter": { 
    "email": "renter@example.com",
    "phone": "+1-555-666-7777"
  }
}
```

### **List Bookings for a Renter**
```http
GET /car-rental/v1/bookings/:cognitoSub
```

### **Booking Payment Flow**

#### **Create Payment Intent for Booking**
```http
POST /car-rental/v1/bookings/:id/payment/intent
```

**Response:**
```json
{
  "id": "pi_mock_1756106716218_72h43sy4h",
  "clientSecret": "pi_mock_..._secret_mock",
  "amount": 5000,
  "currency": "usd",
  "status": "requires_payment_method"
}
```

#### **Confirm Booking Payment**
```http
POST /car-rental/v1/bookings/:id/payment/confirm
Content-Type: application/json

{
  "paymentIntentId": "pi_mock_1756106716218_72h43sy4h",
  "paymentMethodId": "pm_mock_card_visa"
}
```

**Response:**
```json
{
  "message": "Payment confirmed successfully",
  "booking": {
    "status": "paid"
  },
  "payment": {
    "status": "succeeded"
  }
}
```

