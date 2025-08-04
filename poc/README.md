# Car Rental Platform PoC

This folder contains the **Proof of Concept (PoC)** for the Car Rental Platform backend, demonstrating scalable, secure, and modular architecture using AWS CDK, Lambda, and NestJS.

---

## Contents

- [Backend Structure](#backend-structure)
- [Key Design Decisions](#key-design-decisions)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Documentation](#documentation)
- [Support](#support)

---

## Backend Structure

```
poc/
├── backend/      # CDK stacks, Lambda functions, NestJS APIs
│   ├── cdk/      # AWS infrastructure as code (Python CDK)
│   ├── lambda/   # Lambda functions (OTP, S3 pre-signed URLs)
│   ├── src/      # NestJS backend (controllers, services, models, etc.)
│   ├── tests/    # Unit and integration tests
│   ├── package.json, tsconfig.json, README.md
├── shared/       # API specs, mocks, and scripts
├── docs/         # Architecture, API, and setup documentation
├── docker/       # Dockerfile and compose for backend services
```

### Highlights

- **cdk/**: Infrastructure code, with `stacks/` for resources (Cognito, S3, Lambda, Fargate) and `constructs/` for reusable components.
- **lambda/**: Isolated Lambda functions for Cognito OTP and S3 pre-signed URLs.
- **src/**: Modular NestJS codebase (controllers, services, models, routes, middleware, config, utils).
- **shared/**: OpenAPI specs, Cognito mocks, and DB seed scripts.
- **docs/**: Architecture diagrams, API docs, and setup guides.

---

## Key Design Decisions

- **Modularity & Isolation**: Clear separation between infrastructure, Lambda, and application code to reduce misconfiguration risks.
- **Reusable Constructs**: CDK constructs for Cognito and S3 simplify onboarding and maintenance.
- **Testing**: Dedicated folders for unit and integration tests ensure reliability.
- **Documentation**: Extensive docs for team members new to AWS/CDK.

---

## Getting Started

1. **Set up AWS credentials**  
   Configure AWS CLI:  
   ```bash
   aws configure
   ```

2. **Install CDK dependencies**  
   ```bash
   cd backend/cdk
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Install NestJS dependencies**  
   ```bash
   cd ../
   npm install
   ```

4. **Deploy infrastructure**  
   ```bash
   cd cdk
   cdk bootstrap
   cdk deploy
   ```

5. **Run backend locally**  
   ```bash
   cd ..
   npm run start:dev
   ```

6. **Set environment variables**  
   Copy `.env.example` to `.env` and update values as needed.

---

## Testing

- Add and run tests in `backend/tests/` and `backend/lambda/*/tests/`.
- Ensure all tests pass before merging changes.

---

## Documentation

- See [`docs/`](docs/) for architecture, API, and setup details.
- Update docs for any significant changes.

---

## Support

For questions or support, contact the backend team:  
📧 [trung.leviet@asnet.com.vn](mailto:trung.leviet@asnet.com.vn)
