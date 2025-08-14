# 🛠️ Car Rental Platform - Scripts

Organized automation scripts for the Car Rental Platform deployment, testing, and utilities.

## 📁 Scripts Structure

```
scripts/
├── 🚀 deploy/           # Deployment scripts
│   ├── deploy.sh        # Complete AWS deployment with backend config
│   ├── deploy-app.sh    # Fast app-only deployment
│   ├── deploy-stack.sh  # Single stack deployment
│   └── destroy.sh       # Infrastructure cleanup
├── 🧪 test/             # Testing scripts
│   ├── smoke-test.sh    # Basic system testing
│   ├── test-aws-integration.sh # AWS provider integration tests
│   ├── test-complete-flow.sh   # Complete flow testing
│   ├── test-registration-flow.sh # Registration flow testing
│   └── test-dip.js          # DIP implementation testing
├── 🔧 utils/            # Utility scripts
│   ├── health-check.sh  # System health verification
│   ├── diff.sh          # CDK diff check
│   └── setup-local-db.sh # Local database setup
└── 📖 README.md         # This file
```

## 🚀 **Deployment Scripts**

### **`deploy/deploy.sh` - Complete AWS Deployment**
**One-command deployment with automatic backend configuration.**

```bash
# Deploy complete infrastructure + configure backend
./scripts/deploy/deploy.sh

# What it does:
# ✅ Deploys all CDK infrastructure (Storage, Fargate, Auth, API)
# ✅ Extracts resource IDs automatically
# ✅ Configures backend environment (.env.aws)
# ✅ Creates deployment summary
# ✅ Ready for production use
```

### **`deploy/deploy-app.sh` - Fast App Deployment**
**Deploy only the NestJS application (no infrastructure changes).**

```bash
# Deploy app changes only (2-3 minutes)
./scripts/deploy/deploy-app.sh

# What it does:
# ✅ Builds Docker image with git SHA tag
# ✅ Pushes to ECR
# ✅ Updates ECS task definition
# ✅ Forces new deployment
# ✅ Perfect for daily development
```

### **`deploy/deploy-stack.sh` - Single Stack Deployment**
**Deploy specific CDK stack for targeted updates.**

```bash
# Deploy specific stack
./scripts/deploy/deploy-stack.sh CarRentalFargateStack

# With fast mode (no RDS/NAT)
./scripts/deploy/deploy-stack.sh CarRentalFargateStack fast

# With custom image tag
./scripts/deploy/deploy-stack.sh CarRentalFargateStack --image-tag abc123
```

### **`deploy/destroy.sh` - Infrastructure Cleanup**
**Destroy all CDK stacks and clean up resources.**

```bash
# Destroy all infrastructure
./scripts/deploy/destroy.sh

# ⚠️ Requires confirmation
# ✅ Destroys stacks in correct order
# ✅ Cleans up local CDK files
```

## 🧪 **Testing Scripts**

### **`test/smoke-test.sh` - System Testing**
**Basic system health and functionality testing.**

```bash
# Run basic system tests
./scripts/test/smoke-test.sh

# What it tests:
# ✅ Infrastructure health
# ✅ API endpoints
# ✅ Provider status
# ✅ Basic functionality
```

### **`test/test-aws-integration.sh` - AWS Integration Testing**
**Test backend with real AWS services.**

```bash
# Test AWS provider integration
./scripts/test/test-aws-integration.sh

# What it tests:
# ✅ AWS Auth (Cognito) integration
# ✅ AWS Storage (S3) integration
# ✅ AWS Lambda integration
# ✅ AWS Notifications (SES/SNS) integration
# ✅ Real service connectivity
```

### **`test/test-complete-flow.sh` - Complete Flow Testing**
**Test all 12 main scenarios from Postman collection.**

```bash
# Test complete application flows
./scripts/test/test-complete-flow.sh

# What it tests:
# ✅ Authentication flows (register, OTP, login)
# ✅ KYC document processing
# ✅ Notification services (email, SMS, OTP)
# ✅ Payment processing
# ✅ User management
```

### **`test/test-registration-flow.sh` - Registration Flow Testing**
**Test complete user registration process.**

```bash
# Test registration flow
./scripts/test/test-registration-flow.sh

# What it tests:
# ✅ User registration
# ✅ Email confirmation
# ✅ Database sync
# ✅ Custom OTP flow
# ✅ Notification integration
```

### **`test/test-dip.js` - DIP Implementation Testing**
**Test Dependency Inversion Principle implementation.**

```bash
# Test DIP architecture
node scripts/test/test-dip.js

# What it tests:
# ✅ Provider abstraction
# ✅ Mock vs real provider switching
# ✅ Interface compliance
# ✅ Dependency injection
```

## 🔧 **Utility Scripts**

### **`utils/health-check.sh` - System Health**
**Verify system status and provider configuration.**

```bash
# Check system health
./scripts/utils/health-check.sh

# What it checks:
# ✅ AWS infrastructure status
# ✅ ECS service health
# ✅ Database connectivity
# ✅ Provider configuration
```

### **`utils/diff.sh` - CDK Changes**
**Check what CDK changes will be deployed.**

```bash
# Check infrastructure changes
./scripts/utils/diff.sh

# What it shows:
# ✅ CDK diff output
# ✅ Resource changes
# ✅ Deployment impact
```

### **`utils/setup-local-db.sh` - Local Database**
**Setup local PostgreSQL database for development.**

```bash
# Setup local database
./scripts/utils/setup-local-db.sh

# What it does:
# ✅ Creates PostgreSQL database
# ✅ Sets up user and permissions
# ✅ Provides environment variables
# ✅ Ready for local development
```

## 🎯 **Quick Start Commands**

### **First-Time Setup**
```bash
# 1. Setup local database
./scripts/utils/setup-local-db.sh

# 2. Deploy complete infrastructure
./scripts/deploy/deploy.sh

# 3. Verify deployment
./scripts/utils/health-check.sh
```

### **Daily Development**
```bash
# 1. Check system health
./scripts/utils/health-check.sh

# 2. Deploy app changes
./scripts/deploy/deploy-app.sh

# 3. Run smoke tests
./scripts/test/smoke-test.sh
```

### **Infrastructure Changes**
```bash
# 1. Check what will change
./scripts/utils/diff.sh

# 2. Deploy specific stack
./scripts/deploy/deploy-stack.sh CarRentalFargateStack

# 3. Verify changes
./scripts/utils/health-check.sh
```

## 📊 **Script Metrics**

| Category | Scripts | Lines | Purpose |
|----------|---------|-------|---------|
| **🚀 Deployment** | 4 scripts | ~730 lines | Infrastructure & app deployment |
| **🧪 Testing** | 1 script | ~209 lines | System validation |
| **🔧 Utilities** | 3 scripts | ~316 lines | Health, diff, setup |
| **📖 Documentation** | 1 file | ~150 lines | Script guide |

**Total: 9 files, ~1,405 lines** (organized, focused, no duplication)

## 🔧 **Prerequisites**

### **Required Tools**
```bash
# AWS CLI
aws configure

# Python 3.10+
python3 --version

# Node.js 18+
node --version

# CDK CLI
npm install -g aws-cdk

# Docker
docker --version
```

### **Environment Setup**
```bash
# 1. Clone repository
git clone <repository>
cd car-rental-platform/poc

# 2. Setup local database
./scripts/utils/setup-local-db.sh

# 3. Configure backend environment
cp backend/env.example backend/.env
# Edit .env with your preferences
```

## 🚨 **Troubleshooting**

### **Common Issues**
| Issue | Solution |
|-------|----------|
| **AWS credentials** | Run `aws configure` |
| **CDK bootstrap** | Run `cdk bootstrap` in cdk directory |
| **Database connection** | Run `./scripts/utils/setup-local-db.sh` |
| **Permission denied** | Run `chmod +x scripts/**/*.sh` |

### **Debug Commands**
```bash
# Check AWS configuration
aws sts get-caller-identity

# Check CDK status
cd cdk && cdk doctor

# Check system health
./scripts/utils/health-check.sh

# View recent changes
./scripts/utils/diff.sh
```

## 🔗 **Related Documentation**

- [**Deployment Guide**](../docs/DEPLOYMENT.md) - Complete deployment documentation
- [**Testing Guide**](../docs/TESTING.md) - Testing strategies
- [**API Documentation**](../docs/API.md) - Service endpoints
- [**Architecture Overview**](../docs/ARCHITECTURE.md) - System design

---

**Scripts are organized for clarity, maintainability, and ease of use.**
