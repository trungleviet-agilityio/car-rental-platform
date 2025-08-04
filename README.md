# Car Rental Platform

## Table of Contents
- [Overview](#overview)  
- [Project Goals](#project-goals)  
- [Repository Structure](#repository-structure)  
- [Getting Started](#getting-started)  
- [Development Guidelines](#development-guidelines)  
- [PoC Scope](#poc-scope)  
- [Contact](#contact)  

---

## Overview

The **Car Rental Platform** is a peer-to-peer mobile application designed to connect car owners with renters. It offers features such as:

- User registration  
- Car booking  
- Secure payments  

This repository currently focuses on backend development, with a **Proof of Concept (PoC)** phase validating key functionalities using **AWS services**, **NestJS**, and **AWS CDK**.

---

## Project Goals

- Build a scalable backend to support up to **500,000 users** and **1 TB of storage**  
- Ensure **GDPR/CCPA compliance** with end-to-end encryption for user data  
- Validate core backend features in the **PoC phase**

---

## Repository Structure

```
car-rental-platform/
│
├── poc/                   # PoC code and backend documentation
│   ├── backend/           # AWS CDK stacks, Lambda functions, NestJS APIs
│   ├── shared/            # API specs, mock data
│   └── docs/              # Architecture, setup, and PoC-related docs
│
├── src/                   # (Future) Production backend source code
├── docker/                # Docker configurations for deployment
├── .gitignore             # Git ignored files
└── LICENSE                # Project license (TBD)
```

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd car-rental-platform
git checkout poc
```

### 2. Set Up AWS Credentials

Ensure the AWS CLI is installed and configured:

```bash
aws configure
```

### 3. Install Dependencies

#### AWS CDK

```bash
cd poc/backend/cdk
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

#### NestJS

```bash
cd poc/backend
npm install
```

### 4. Deploy CDK Stacks

```bash
cd poc/backend/cdk
cdk bootstrap
cdk deploy
```

### 5. Run NestJS Locally

```bash
cd poc/backend
npm run start:dev
```

### 6. Set Environment Variables

Create a `.env` file in `poc/backend/` (refer to `.env.example`).

---

## Development Guidelines

### Branching Strategy

- Use the `poc` branch for PoC development  
- Create feature branches as `poc/feature/your-feature-name`  
- Create bugfix branches as `poc/bugfix/your-bug-name`  
- Merge changes via pull requests with code reviews  

### Commit Messages

Format:  
```bash
(type): description
```

Examples:
- `feat(auth): add Cognito OTP`
- `fix(api): handle token expiration`

### Testing

- Add tests in `poc/backend/tests/`  
- Ensure all tests pass before merging  

### Documentation

- Update `poc/docs/` for any architecture or setup changes

---

## PoC Scope

The Proof of Concept validates:

- OTP-based authentication with **AWS Cognito** and **Lambda**  
- Secure KYC photo uploads using **S3 pre-signed URLs**  
- Performance benchmarks: **latency** and **throughput**  

See `poc/docs/` for more details.

---

## Contact

For support, reach out to the backend team at:  
📧 [trung.leviet@asnet.com.vn](mailto:trung.leviet@asnet.com.vn)
