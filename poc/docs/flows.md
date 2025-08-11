# PoC Flows

## 1) Login (OTP)
Actors: Client App ↔ API Gateway ↔ Lambda ↔ Cognito (SNS simulated)

Steps (PoC):
1. Client: POST API GW `/auth/login` action=initiate_auth, phone_number
2. Lambda: calls Cognito AdminInitiateAuth (PoC simulates OTP if user not present)
3. Client: receives `session: mock_session`, `challenge_name: SMS_MFA`
4. Client: POST API GW `/auth/login` action=respond_to_challenge, session, otp_code
5. Lambda: returns mock tokens (PoC)

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
