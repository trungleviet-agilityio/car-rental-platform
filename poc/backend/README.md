# Car Rental Backend (NestJS)

Minimal NestJS backend for the Car Rental Platform PoC.

## Quick Start

```bash
cd poc/backend
# create .env (see variables below)
npm install
npm run start:dev
# http://localhost:3000/api
```

## Environment Variables
- `PORT` (default 3000)
- `AWS_REGION` (e.g., ap-southeast-1)
- `USER_POOL_ID`, `USER_POOL_CLIENT_ID` (for real Cognito)
- `S3_BUCKET_NAME` (for real S3 presign)
 - `PROVIDER_MODE` (`mock` | `aws`) to switch providers via DI
 - `DB_DISABLE` (`true` to use in-memory SQLite; auto-set in fast infra mode)

## Endpoints

- POST `/api/auth/login`
  - initiate `{ "action": "initiate_auth", "phone_number": "+1234567890" }`
  - respond `{ "action": "respond_to_challenge", "session": "mock_session", "otp_code": "123456" }`

- POST `/api/kyc/presign`
  - body: `{ "userId": "u-123", "contentType": "image/jpeg" }`
  - returns pre-signed PUT URL (real if `S3_BUCKET_NAME` set; mock otherwise)

- POST `/api/kyc/upload` (skeleton)

## Implementation Notes
- In-memory `DbService` stores KYC key + status (`pending`).
- `AwsService` implements Cognito admin APIs and S3 pre-signed PUT URL.

## Docker
```bash
docker build -t car-rental-backend:dev .
docker run -p 3000:3000 --env-file .env car-rental-backend:dev
```

## Provider Abstractions (DIP + Adapters)
- Business logic depends on interfaces in `src/services/ports/*`.
- DI tokens in `src/services/ports/tokens.ts`.
- Mock providers in `src/services/mocks/*` for fast local/E2E.
- Real AWS adapters in `src/modules/aws/adapters/*` behind `AwsService`.
- Choose provider at runtime via `PROVIDER_MODE` in `src/modules/providers/providers.module.ts`.
