# API Documentation (PoC)

## Base URLs

- API Gateway: https://84qkccpqzf.execute-api.ap-southeast-1.amazonaws.com/prod/
- ALB (Fargate): http://CarRen-CarRe-zaalzSGsst3V-564137089.ap-southeast-1.elb.amazonaws.com/

## Health

- GET `/api`
  - Response: `{ "status": "ok" }`

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
  - Body: `{ "cognitoSub": "uuid", "username": "name", "phoneNumber": "+123" }`

## KYC

- POST `/api/kyc/presign`
  - Body: `{ "cognitoSub": "uuid", "contentType": "image/jpeg" }`
  - Returns: `{ "uploadUrl": "...", "key": "kyc/...jpg", "method": "PUT", "expiresIn": 900 }`

- POST `/api/kyc/validate`
  - Body: `{ "cognitoSub": "uuid", "key": "kyc/...jpg" }`
  - Returns: `{ "executionArn": "..." }`

## Notes
- API Gateway is backed by Lambda for auth PoC.
- ALB routes to Fargate service running the NestJS backend.
- Health check path is `/api` (200–399 accepted).
