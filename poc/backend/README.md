# Car Rental Backend (NestJS)

Minimal NestJS backend for the Car Rental Platform PoC.

## Quick Start

```bash
cd poc/backend
cp .env.example .env # fill USER_POOL_ID and USER_POOL_CLIENT_ID if using real Cognito
npm install
npm run start:dev
# http://localhost:3000/api/auth/login
```

## Endpoints

- POST `/api/auth/login`
  - initiate
    ```json
    { "action": "initiate_auth", "phone_number": "+1234567890" }
    ```
  - respond
    ```json
    { "action": "respond_to_challenge", "session": "mock_session", "otp_code": "123456" }
    ```
- POST `/api/kyc/upload` (skeleton)

## Docker

```bash
docker build -t car-rental-backend:dev .
# example run
docker run -p 3000:3000 --env-file .env car-rental-backend:dev
```
