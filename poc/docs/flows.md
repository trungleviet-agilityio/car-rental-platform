# PoC Flows (Updated for DIP Implementation)

## 🎯 Provider Modes

Our implementation follows **Dependency Inversion Principle (DIP)** with two modes:
- **Mock Mode** (`PROVIDER_MODE=mock`): Fast development/testing with simulated services
- **AWS Mode** (`PROVIDER_MODE=aws`): Production-ready with real AWS services

## 0) Onboarding (Register → Confirm → Sync)

### Mock Mode Flow
Actors: Client App ↔ Local NestJS (Mock Providers)

Steps:
1. Client: POST `/api/auth/register` → MockAuthProvider simulates Cognito signUp
2. Client: POST `/api/auth/confirm` → MockAuthProvider simulates confirmation (always succeeds)
3. Client: POST `/api/users/sync` → Direct user creation in database
4. NestJS: User created with KYC status `unverified`

### AWS Mode Flow  
Actors: Client App ↔ ALB ↔ Fargate (NestJS) ↔ Cognito ↔ Post-Confirmation Lambda ↔ NestJS

Steps:
1. Client: POST ALB `/api/auth/register` → AwsAuthAdapter → Cognito signUp
2. Client: POST ALB `/api/auth/confirm` → AwsAuthAdapter → Cognito confirmSignUp
3. Cognito triggers Post-Confirmation Lambda → POST ALB `/api/users/sync` with `cognitoSub`, `username`, `phoneNumber`, `email`
4. NestJS upserts the user; KYC status defaults to `unverified`

Notes:
- Register/confirm can also be performed via Cognito Hosted UI or CLI.
- The sync step happens automatically on confirm via the Lambda trigger in AWS mode.
- Mock mode skips external dependencies for faster development.

## 1) Login Flows

### 1A) Custom OTP via Notification Providers (New DIP Feature)

#### Mock Mode
Actors: Client App ↔ Local NestJS ↔ MockNotificationProvider

Steps:
1. Client: POST `/api/auth/login` `action=otp_initiate`, `channel=email`, `email=test@example.com` → MockNotificationProvider returns debug OTP
2. Client: POST `/api/auth/login` `action=otp_verify`, `email=test@example.com`, `otp_code=123456` → Returns mock tokens

#### AWS Mode  
Actors: Client App ↔ ALB ↔ Fargate (NestJS) ↔ SES/SNS

Steps:
1. Client: POST `/api/auth/login` `action=otp_initiate`, `channel=email`, `email=user@example.com` → Real email sent via SES
2. Client: POST `/api/auth/login` `action=otp_verify`, `email=user@example.com`, `otp_code=REAL_CODE` → Returns tokens

### 1B) Traditional Cognito OTP (Legacy)
Actors: Client App ↔ API Gateway ↔ Lambda ↔ Cognito (SNS)

Steps (production-ready):
1. User signs up in Cognito (Hosted UI or CLI) with phone number (+E.164) and email
2. Admin confirms (or user confirms) → Post-Confirmation Lambda → POST ALB `/api/users/sync`
3. Client: POST API GW `/auth/login` action=initiate_auth, phone_number → Cognito sends SMS OTP
4. Client: POST API GW `/auth/login` action=respond_to_challenge, session, otp_code
5. Lambda: returns Cognito tokens

Notes:
- New custom OTP flow demonstrates DIP with pluggable notification providers
- Legacy Cognito OTP still supported for compatibility

## 1b) Login (Email/Password)
Actors: Client App ↔ ALB ↔ Fargate (NestJS) ↔ Cognito

Steps:
1. User signs up in Cognito with email/password (and phone if required)
2. Confirm code → Post-Confirmation Lambda → POST ALB `/api/users/sync` (with `email`)
3. Client: POST ALB `/api/auth/login` with `{ "action": "password", "username": "email@example.com", "password": "..." }`
4. NestJS calls Cognito AdminInitiateAuth → returns tokens

## 2) KYC (Pre-sign Upload with Validation Callback)

### Mock Mode Flow
Actors: Client App ↔ Local NestJS ↔ Mock Providers

Steps:
1. Client: POST `/api/kyc/presign` with `{ cognitoSub, contentType }` → Mock presigned URL returned
2. Client: Mock file upload (URL simulation only)
3. Client: POST `/api/kyc/validate` with `{ cognitoSub, key }` → MockKycProvider simulates validation
4. Client: POST `/api/kyc/callback` with `{ cognitoSub, key, status }` → User KYC status updated

### AWS Mode Flow
Actors: Client App ↔ ALB ↔ Fargate (NestJS) ↔ Step Functions ↔ Lambda Callback ↔ NestJS ↔ S3

Steps:
1. Client: POST ALB `/api/kyc/presign` with `{ cognitoSub, contentType }` → Real S3 presigned PUT URL + `key`
2. Client: PUT file to S3 URL
3. Client: POST ALB `/api/kyc/validate` with `{ cognitoSub, key }` → Start Step Functions execution
4. Step Functions: `KycValidator` Lambda returns `{ status: 'verified', input }`
5. Step Functions: `KycCallback` Lambda → POST ALB `/api/kyc/callback` with `{ cognitoSub, key, status }`
6. NestJS: Updates user `kycStatus` accordingly

## 3) Notification Services (DIP Feature) 🆕

### Mock Mode Flow
Actors: Client App ↔ Local NestJS ↔ MockNotificationProvider

Steps:
1. Client: POST `/api/notify/email` with `{ to, subject, text }` → MockNotificationProvider logs and returns mock ID
2. Client: POST `/api/notify/sms` with `{ to, message }` → MockNotificationProvider logs and returns mock ID

### AWS Mode Flow  
Actors: Client App ↔ ALB ↔ Fargate (NestJS) ↔ SES/SNS

Steps:
1. Client: POST `/api/notify/email` with `{ to, subject, text }` → Real email sent via AWS SES
2. Client: POST `/api/notify/sms` with `{ to, message }` → Real SMS sent via AWS SNS

Notes:
- Notification services demonstrate DIP with pluggable providers
- Mock mode provides instant feedback for development
- AWS mode requires verified email addresses (SES sandbox) and valid phone numbers
- Health check path `/api` shows current provider status
