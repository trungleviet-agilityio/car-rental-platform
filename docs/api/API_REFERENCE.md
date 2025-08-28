# 🔗 API Reference Guide

Comprehensive reference for the Car Rental Platform REST API. All endpoints, request/response formats, authentication, and examples.

## 📋 API Overview

- **Base URL**: `http://localhost:3000/api/v1`
- **Protocol**: HTTPS (production), HTTP (development)
- **Authentication**: JWT Bearer tokens
- **Content Type**: `application/json`
- **API Version**: v1

## 🔐 Authentication

### **Authentication Flow**
1. **User Registration**: Create account via signup
2. **Phone Verification**: Verify phone number with SMS code
3. **JWT Token**: Receive access token for authenticated requests
4. **Token Usage**: Include in Authorization header

### **Authentication Header**
```bash
Authorization: Bearer <jwt_token>
```

### **Token Expiration**
- **Access Token**: 24 hours (configurable)
- **Refresh Token**: 7 days (configurable)

## 🚀 Quick Start

### **Example Request**
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup/start \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890"
  }'
```

### **Example Response**
```json
{
  "userId": "cmev8buqp00093babzxwoxgp2",
  "executionArn": "arn:aws:states:us-east-1:123456789:execution:OnboardingFlow:abc123",
  "nextStep": "PHONE_VERIFICATION",
  "message": "Account created successfully. Please check your phone for verification code."
}
```

## 🔄 API Endpoints

### **1. Authentication Endpoints**

#### **Start User Signup**
```http
POST /api/v1/auth/signup/start
```

**Description**: Initiates user registration and onboarding workflow.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Response**:
```json
{
  "userId": "uuid",
  "executionArn": "string",
  "nextStep": "PHONE_VERIFICATION",
  "message": "Account created successfully."
}
```

**Status Codes**:
- `201`: User created successfully
- `400`: Invalid input data
- `409`: Email already exists

---

#### **Send Phone Verification Code**
```http
POST /api/v1/auth/phone/send-code
```

**Description**: Sends SMS verification code to user's phone.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response**:
```json
{
  "message": "Verification code sent successfully",
  "verificationSid": "VA1234567890abcdef"
}
```

---

#### **Verify Phone Number**
```http
POST /api/v1/auth/phone/verify
```

**Description**: Verifies phone number with SMS code.

**Request Body**:
```json
{
  "phoneNumber": "+1234567890",
  "code": "123456"
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "RENTER"
  },
  "nextStep": "PROFILE_COMPLETION"
}
```

---

#### **Complete Profile**
```http
POST /api/v1/auth/profile/complete
```

**Description**: Complete user profile information.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "driverLicense": "DL123456789",
  "dateOfBirth": "1990-01-01",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "ST",
    "zipCode": "12345",
    "country": "US"
  }
}
```

**Response**:
```json
{
  "message": "Profile completed successfully",
  "nextStep": "KYC_UPLOAD",
  "completionPercentage": 75
}
```

---

#### **Get Onboarding Status**
```http
GET /api/v1/auth/onboarding/status
```

**Description**: Get current onboarding progress.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "currentStep": "KYC_UPLOAD",
  "completedSteps": ["PHONE_VERIFICATION", "PROFILE_COMPLETION"],
  "completionPercentage": 75,
  "canActivate": false
}
```

---

#### **Get User Profile**
```http
GET /api/v1/auth/profile
```

**Description**: Get current user profile information.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "role": "RENTER",
  "kycStatus": "PENDING",
  "isActive": true,
  "emailVerified": true,
  "createdAt": "2023-08-28T10:00:00Z",
  "updatedAt": "2023-08-28T10:00:00Z"
}
```

### **2. KYC Endpoints**

#### **Get Presigned URL for Document Upload**
```http
POST /api/v1/kyc/presigned-url
```

**Description**: Get presigned S3 URL for secure document upload.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "documentType": "DRIVER_LICENSE",
  "fileName": "license_front.jpg",
  "fileSize": 1024000
}
```

**Response**:
```json
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/path?X-Amz-Signature=...",
  "downloadUrl": "https://s3.amazonaws.com/bucket/path",
  "fields": {
    "key": "documents/user-id/license_front.jpg",
    "AWSAccessKeyId": "...",
    "policy": "...",
    "signature": "..."
  },
  "expiresIn": 3600
}
```

---

#### **Submit KYC Documents**
```http
POST /api/v1/kyc/upload-documents
```

**Description**: Submit uploaded documents for KYC verification.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "documents": [
    {
      "type": "DRIVER_LICENSE",
      "frontImageUrl": "https://s3.amazonaws.com/bucket/license_front.jpg",
      "backImageUrl": "https://s3.amazonaws.com/bucket/license_back.jpg"
    },
    {
      "type": "PASSPORT",
      "frontImageUrl": "https://s3.amazonaws.com/bucket/passport.jpg"
    }
  ]
}
```

**Response**:
```json
{
  "message": "Documents submitted for verification",
  "submissionId": "sub_1234567890",
  "estimatedProcessingTime": "24-48 hours",
  "nextStep": "ACCOUNT_ACTIVATION"
}
```

---

#### **Get KYC Status**
```http
GET /api/v1/kyc/status
```

**Description**: Check current KYC verification status.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "status": "PENDING",
  "submittedAt": "2023-08-28T10:00:00Z",
  "documents": [
    {
      "type": "DRIVER_LICENSE",
      "status": "APPROVED",
      "reviewedAt": "2023-08-28T12:00:00Z"
    },
    {
      "type": "PASSPORT",
      "status": "PENDING",
      "submittedAt": "2023-08-28T10:00:00Z"
    }
  ],
  "rejectionReason": null,
  "estimatedCompletion": "2023-08-29T10:00:00Z"
}
```

### **3. User Management Endpoints**

#### **Get User Profile**
```http
GET /api/v1/users/profile
```

**Description**: Get detailed user profile (same as auth/profile).

**Headers**: `Authorization: Bearer <token>`

---

#### **Activate User Account**
```http
POST /api/v1/users/activate
```

**Description**: Activate user account after KYC completion.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "message": "Account activated successfully",
  "activatedAt": "2023-08-28T15:00:00Z",
  "features": ["RENT_VEHICLES", "LIST_VEHICLES", "FULL_ACCESS"]
}
```

---

#### **Get Onboarding Progress**
```http
GET /api/v1/users/onboarding/progress
```

**Description**: Get detailed onboarding progress.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "overallProgress": 100,
  "phases": [
    {
      "phase": "PHONE_VERIFICATION",
      "status": "COMPLETED",
      "completedAt": "2023-08-28T10:30:00Z"
    },
    {
      "phase": "PROFILE_COMPLETION",
      "status": "COMPLETED",
      "completedAt": "2023-08-28T11:00:00Z"
    },
    {
      "phase": "KYC_UPLOAD",
      "status": "COMPLETED",
      "completedAt": "2023-08-28T12:00:00Z"
    },
    {
      "phase": "ACCOUNT_ACTIVATION",
      "status": "COMPLETED",
      "completedAt": "2023-08-28T15:00:00Z"
    }
  ],
  "canAccessPlatform": true
}
```

## 🔢 HTTP Status Codes

### **Success Codes**
- `200`: OK - Request successful
- `201`: Created - Resource created successfully
- `204`: No Content - Successful deletion

### **Client Error Codes**
- `400`: Bad Request - Invalid request data
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource already exists
- `422`: Unprocessable Entity - Validation failed
- `429`: Too Many Requests - Rate limit exceeded

### **Server Error Codes**
- `500`: Internal Server Error - Server-side error
- `502`: Bad Gateway - Upstream service error
- `503`: Service Unavailable - Service temporarily down

## 🔔 Response Format

### **Success Response**
```json
{
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2023-08-28T10:00:00Z",
    "requestId": "req_1234567890",
    "version": "1.0.0"
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email format is invalid"
      }
    ],
    "timestamp": "2023-08-28T10:00:00Z"
  },
  "meta": {
    "timestamp": "2023-08-28T10:00:00Z",
    "requestId": "req_1234567890",
    "version": "1.0.0"
  }
}
```

## 🔍 Request Validation

### **Common Validations**
- **Email**: Valid email format, max 255 characters
- **Password**: Minimum 8 characters, at least one uppercase, one lowercase, one number
- **Phone**: E.164 format (e.g., +1234567890)
- **Names**: 2-50 characters, letters and spaces only
- **UUID**: Valid UUID v4 format

### **Validation Error Example**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "password",
        "message": "Password must contain at least one uppercase letter"
      },
      {
        "field": "phoneNumber",
        "message": "Phone number must be in E.164 format"
      }
    ]
  }
}
```

## 🔄 Rate Limiting

### **Rate Limits**
- **Default**: 100 requests per minute per IP
- **Authentication**: 10 requests per minute per IP
- **Document Upload**: 5 requests per minute per user

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1693228800
X-RateLimit-Retry-After: 60
```

### **Rate Limit Exceeded Response**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

## 🧪 Testing with Postman

### **Environment Variables**
```json
{
  "baseUrl": "http://localhost:3000/api/v1",
  "accessToken": "{{accessToken}}",
  "userId": "{{userId}}"
}
```

### **Pre-request Script (Auto Token)**
```javascript
// Auto-attach token if available
if (pm.environment.get("accessToken")) {
  pm.request.headers.add({
    key: "Authorization",
    value: "Bearer " + pm.environment.get("accessToken")
  });
}
```

### **Test Script (Save Token)**
```javascript
// Save access token from response
if (pm.response.json().accessToken) {
  pm.environment.set("accessToken", pm.response.json().accessToken);
}

// Test response status
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});
```

## 📊 API Monitoring

### **Health Check Endpoint**
```http
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2023-08-28T10:00:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "aws": "connected"
  }
}
```

### **Metrics Endpoint** (Admin only)
```http
GET /api/v1/admin/metrics
```

**Response**:
```json
{
  "requests": {
    "total": 10000,
    "successful": 9500,
    "failed": 500
  },
  "responseTime": {
    "average": 150,
    "p95": 300,
    "p99": 500
  },
  "endpoints": [
    {
      "path": "/api/v1/auth/signup/start",
      "requests": 1000,
      "averageTime": 200
    }
  ]
}
```

---

**🔗 API Reference complete! Ready for integration and testing.**
