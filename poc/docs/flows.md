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

## 2) KYC (Pre-sign Upload)
Actors: Client App ↔ ALB ↔ Fargate (NestJS) ↔ S3 (planned)

Steps (PoC):
1. Client: POST ALB `/api/kyc/presign` with userId
2. NestJS: returns mock pre-signed PUT URL + key (PoC)
3. Client: PUT file to S3 URL (simulated)
4. NestJS: (future) callback/verify, update user status

Notes:
- Health check path `/api` for ALB
- S3 bucket provisioned; pre-sign and validation will be implemented in onboarding phase
