# PoC Flows

## 1) Login (OTP)
Actors: Client App ↔ API Gateway ↔ Lambda ↔ Cognito (SNS)

Steps (production-ready):
1. User signs up in Cognito (Hosted UI or CLI) with phone number (+E.164) and email
2. Admin confirms (or user confirms) → Post-Confirmation Lambda → POST ALB `/api/users/sync`
3. Client: POST API GW `/auth/login` action=initiate_auth, phone_number → Cognito sends SMS OTP
4. Client: POST API GW `/auth/login` action=respond_to_challenge, session, otp_code
5. Lambda: returns Cognito tokens

Steps (PoC fallback when user not present):
1. Initiate returns `session: mock_session`, `challenge_name: SMS_MFA`
2. Respond with any OTP → returns mock tokens

Notes:
- Latency target: <400 ms (met)
- Security: CORS, IAM roles; Cognito configured with MFA

## 2) KYC (Pre-sign Upload with Validation Callback)
Actors: Client App ↔ ALB ↔ Fargate (NestJS) ↔ Step Functions ↔ Lambda Callback ↔ NestJS ↔ S3

Steps (PoC):
1. Client: POST ALB `/api/kyc/presign` with `cognitoSub`, receives pre-signed PUT URL + `key`.
2. Client: PUT file to S3 URL.
3. Client: POST ALB `/api/kyc/validate` with `{ cognitoSub, key }` to start SFN.
4. Step Functions: `KycValidator` returns `{ status: 'verified', input }`.
5. Step Functions: invokes `KycCallback` Lambda → POST ALB `/api/kyc/callback` with `{ cognitoSub, key, status }`.
6. NestJS: updates user `kycStatus` accordingly.

Notes:
- Health check path `/api` for ALB
- S3 bucket provisioned; pre-sign and validation will be implemented in onboarding phase
