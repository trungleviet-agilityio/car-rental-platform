# Architecture (PoC)

## Components
- Cognito User Pool (MFA/OTP), Identity Pool
- API Gateway → Lambda (Node.js) for `/auth/login`
- ECS Fargate (NestJS backend) behind ALB
- S3 Bucket (KYC storage, future)
- ECR Repository (backend container)

## Flows
1. Login (API Gateway → Lambda)
   - Initiate OTP → (PoC simulates SMS)
   - Respond OTP → returns mock tokens
2. Backend (ALB → Fargate → NestJS)
   - `/api` health
   - `/api/auth/login` mirrors Lambda PoC
3. Storage (future)
   - Pre-signed URLs for KYC uploads to S3

## Deployment
- Infrastructure via CDK (stacks: Auth, Api, Storage, Fargate)
- Images built locally and pushed to ECR
- Fargate service uses ECR `latest` image

## Security
- IAM roles for Lambda/ECS
- S3 encryption and CORS
- CORS on API Gateway
- Private subnets for ECS tasks (public ALB)

## Performance Targets
- Auth via Lambda: <400 ms
- Fargate endpoints: health 200, steady 1 task
