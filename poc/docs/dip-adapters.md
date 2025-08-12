# Implementing Interfaces for Mocking Third-Party Services in NestJS

- Project: Peer-to-Peer Car Rental Platform (PoC)
- Status: Done
- Scope: Map DIP/Adapter design to current `backend/` code; how to switch providers.

## Design Principles
- Dependency Inversion: business logic depends on interfaces (ports) not vendors
- Adapter Pattern: real SDKs wrapped via adapters implementing our interfaces

## Where in Code
- Ports (interfaces): `backend/src/services/ports/*.ts`
- Tokens: `backend/src/services/ports/tokens.ts`
- Mocks: `backend/src/services/mocks/*.ts`
- Real AWS adapters: `backend/src/modules/aws/adapters/*.ts`
- Provider wiring: `backend/src/modules/providers/providers.module.ts`

## Switching Providers
- Set `PROVIDER_MODE=mock` (default) or `PROVIDER_MODE=aws`
- In CI/infra fast mode, container gets `DB_DISABLE=true` to use in-memory SQLite

## Fast Mode (Infra)
- `./scripts/deploy.sh fast` passes `-c fast=true` to CDK
- Fargate task env:
  - `DB_DISABLE=true` (backend uses sqlite `:memory:`)
  - No RDS or NAT created; faster/cheaper PoC deploys

## Test Notes
- Postman collection under `poc/postman/`
- Health: `GET /api` via ALB
- Auth: `POST /api/auth/login`
- KYC presign: `POST /api/kyc/presign`
