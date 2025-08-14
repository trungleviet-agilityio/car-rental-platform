# API Documentation - Car Rental Platform

## 🎯 Provider-Based Architecture (DIP)

The API supports multiple provider modes through Dependency Inversion Principle:
- **Mock Mode**: `AUTH_PROVIDER=mock NOTIFICATION_PROVIDER=mock STORAGE_PROVIDER=mock PAYMENT_PROVIDER=mock`
- **Mixed Mode**: Mix different providers (e.g., `AUTH_PROVIDER=aws NOTIFICATION_PROVIDER=twilio PAYMENT_PROVIDER=stripe`)
- **Production Mode**: All real providers for production deployment

## Base URLs

- **Local Development**: `http://localhost:3000/api`
- **API Gateway** (Lambda): Use CloudFormation output
- **ALB** (Fargate): Use AWS CLI to discover DNS name

## Health & Status

### GET `/api`
**Description**: Health check and provider status
**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-08-14T06:54:59.733Z",
  "environment": "development",
  "providers": {
    "auth": "mock",
    "storage": "mock", 
    "notifications": "mock",
    "payment": "mock",
    "database": "in-memory"
  }
}
```

## Auth

- POST `/auth/login` (API Gateway)
- POST `/api/auth/login` (ALB → Fargate)

Request: initiate OTP
```json
{ "action": "initiate_auth", "phone_number": "+1234567890" }
```
Response (PoC):
```json
{ "message": "OTP sent successfully (simulated)", "session": "mock_session", "challenge_name": "SMS_MFA" }
```

Request: respond to OTP
```json
{ "action": "respond_to_challenge", "session": "mock_session", "otp_code": "123456" }
```
Response (PoC):
```json
{ "message": "Login successful", "tokens": { "AccessToken": "mock_access_token", "IdToken": "mock_id_token", "RefreshToken": "mock_refresh_token", "TokenType": "Bearer", "ExpiresIn": 3600 } }
```

Request: email/password
```json
{ "action": "password", "username": "user@example.com", "password": "P@ssw0rd!" }
```
Response (PoC):
```json
{ "message": "Login successful (simulated)", "tokens": { "AccessToken": "mock", "IdToken": "mock", "RefreshToken": "mock", "TokenType": "Bearer", "ExpiresIn": 3600 } }
```

## Users

- POST `/api/users/sync`
  - Body: `{ "cognitoSub": "uuid", "username": "name", "phoneNumber": "+123", "email": "user@example.com" }`

## KYC

- POST `/api/kyc/presign`
  - Body: `{ "cognitoSub": "uuid", "contentType": "image/jpeg" }`
  - Returns: `{ "uploadUrl": "...", "key": "kyc/...jpg", "method": "PUT", "expiresIn": 900 }`

- POST `/api/kyc/validate`
  - Body: `{ "cognitoSub": "uuid", "key": "kyc/...jpg" }`
  - Returns: `{ "executionArn": "..." }`

- POST `/api/kyc/callback` (internal, called by Step Functions)
  - Body: `{ "cognitoSub": "uuid", "key": "kyc/...jpg", "status": "verified|rejected" }`
  - Effect: updates user's `kycStatus`

## 📧 Notification Services (DIP Feature)

### POST `/api/notify/email`
**Body**: `{ "to": "user@example.com", "subject": "Subject", "text": "Message" }`
**Response**: `{ "success": true, "messageId": "msg-id" }`

### POST `/api/notify/sms`
**Body**: `{ "to": "+1234567890", "message": "SMS content" }`
**Response**: `{ "success": true, "messageId": "msg-id" }`

### POST `/api/notify/otp`
**Body**: `{ "channel": "email|sms", "to": "recipient", "code": "123456" }`
**Response**: `{ "success": true, "messageId": "msg-id" }`

## 💳 Payment Services (DIP Feature)

### POST `/api/payment/intent`
**Body**: `{ "amount": 5000, "currency": "usd", "metadata": {...} }`
**Response**: `{ "id": "pi_...", "clientSecret": "...", "amount": 5000, "currency": "usd", "status": "requires_payment_method" }`

### POST `/api/payment/confirm`
**Body**: `{ "paymentIntentId": "pi_...", "paymentMethodId": "pm_..." }`
**Response**: `{ "id": "pi_...", "status": "succeeded", "amount": 5000, "currency": "usd" }`

### POST `/api/payment/refund`
**Body**: `{ "paymentIntentId": "pi_...", "amount": 2500 }`
**Response**: `{ "id": "re_...", "amount": 2500, "status": "succeeded" }`

### GET `/api/payment/status/:paymentIntentId`
**Response**: `{ "id": "pi_...", "status": "succeeded", "amount": 5000, "currency": "usd" }`

## Notes
- **DIP Architecture**: All services support mock and real providers
- **Provider Switching**: Change environment variables without code changes  
- **API Gateway**: Lambda-based auth endpoints (legacy)
- **ALB + Fargate**: Full NestJS backend with all features
- **Health Path**: `/api` returns provider status and system health
