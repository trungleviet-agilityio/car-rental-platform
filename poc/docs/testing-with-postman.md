# Testing with Postman (Updated for DIP Implementation)

## Import Collection
1. Open Postman.
2. Import file: `poc/postman/CarRental-PoC.postman_collection.json`.

## Set Variables
Create a Postman environment (or use collection variables) with:

### Mock Mode (Local Development)
- `local_base`: `http://localhost:3000/api`
- `provider_mode`: `mock`

### AWS Mode (Production)
- `api_gateway_base`: e.g., `https://84qkccpqzf.execute-api.ap-southeast-1.amazonaws.com/prod`
- `alb_base`: e.g., `http://CarRen-CarRe-zaalzSGsst3V-564137089.ap-southeast-1.elb.amazonaws.com`
- `provider_mode`: `aws`

## Testing Strategy

### 1. Start with Mock Mode
- Fast iteration and development
- No external AWS dependencies
- Predictable responses for debugging

### 2. Validate with AWS Mode  
- Test real service integrations
- Verify production behavior
- End-to-end validation

## Requests (organized by category)

### Health & Provider Status
- Local - Health
- ALB - Health

### Authentication Flow
- Local - Auth Register
- Local - Auth Confirm  
- Local - Auth Password Login
- **Local - Custom OTP Initiate (Email)** 🆕
- **Local - Custom OTP Initiate (SMS)** 🆕
- **Local - Custom OTP Verify** 🆕
- ALB - Auth Register
- ALB - Auth Confirm
- ALB - Auth Password Login
- **ALB - Custom OTP Initiate (Email)** 🆕
- **ALB - Custom OTP Verify** 🆕

### Legacy Cognito OTP (API Gateway)
- API Gateway - Initiate Login
- API Gateway - Respond OTP

### User Management
- Local - Users Sync
- ALB - Users Sync

### KYC Document Processing
- Local - KYC Presign
- Local - KYC Validate
- **Local - KYC Callback** 🆕
- ALB - KYC Presign
- ALB - KYC Validate
- ALB - KYC Callback

### Notification Services (DIP Feature) 🆕
- **Local - Notification Email**
- **Local - Notification SMS**
- **ALB - Notification Email**
- **ALB - Notification SMS**

## Tips
- For KYC upload: use the returned `uploadUrl` in a new Postman request:
  - Method: PUT
  - URL: `uploadUrl` value
  - Headers: `Content-Type` should match you requested (e.g., `image/jpeg`)
  - Body: binary → select a small image file
- Expected 200/204 from S3 on success.

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

## Expected results
- All requests return 200/201
- First API GW initiate may take up to ~2s (cold start), others <400ms on average
