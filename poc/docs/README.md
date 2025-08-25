# 📚 Car Rental Platform - Documentation

Complete documentation for the Car Rental Platform demonstrating **Dependency Inversion Principle (DIP)** with AWS integration.

## 🎯 Quick Navigation

| Topic | File | Description |
|-------|------|-------------|
| **🚀 Getting Started** | [QUICK_START.md](../QUICK_START.md) | 5-minute setup guide |
| **🔌 API Reference** | [API.md](API.md) | Complete API documentation |
| **🏗️ Architecture** | [ARCHITECTURE.md](ARCHITECTURE.md) | System design and DIP implementation |
| **🧪 Testing Guide** | [TESTING.md](TESTING.md) | Testing strategies and automation |
| **🚀 Deployment** | [DEPLOYMENT.md](DEPLOYMENT.md) | Infrastructure and deployment guide |

## 🎯 **Key Features**

### **✅ Dependency Inversion Principle (DIP)**
- **Abstract interfaces** for all external services
- **Runtime provider switching** via environment variables
- **Zero business logic coupling** to specific vendors

### **✅ Provider Support**
| Service | Mock | AWS | Third-Party |
|---------|------|-----|-------------|
| **Authentication** | ✅ | Cognito | - |
| **Storage** | ✅ | S3 | - |
| **Notifications** | ✅ | SES/SNS | Twilio |
| **Payments** | ✅ | - | Stripe |
| **Lambda** | ✅ | Lambda | - |

### **✅ AWS Integration**
- **AWS Cognito** for authentication
- **AWS S3** for file storage
- **AWS Lambda** for serverless functions
- **AWS Step Functions** for workflows
- **AWS RDS** for database
- **ECS Fargate** for container orchestration

## 🔧 **Quick Start Commands**

### **Local Development (Mock Providers)**
```bash
cd poc/backend
npm install
npm run start:dev
# Test: curl http://localhost:3000/car-rental/v1
```

### **AWS Deployment (Real Services)**
```bash
cd poc
./scripts/deploy-with-backend-config.sh
# Deploys complete infrastructure + configures backend
```

### **Run Tests**
```bash
# 🆕 Comprehensive automated testing (recommended)
./poc/scripts/test/test-postman-collection-complete.sh

# Individual test scripts
cd poc/backend
./test-complete-flow.sh      # Mock providers
./test-aws-integration.sh    # Real AWS services
```

## 📊 **Documentation Status**

| Document | Status | Lines | Last Updated |
|----------|--------|-------|--------------|
| **API Reference** | ✅ Complete | ~300 | Recent |
| **Architecture** | ✅ Complete | ~400 | Recent |
| **Testing Guide** | ✅ Complete | ~350 | Recent |
| **Deployment** | ✅ Complete | ~400 | Recent |
| **Quick Start** | ✅ Complete | ~100 | Recent |

**Total: 5 files, ~1,550 lines** (70% reduction from 20 files, 4,542 lines)

## 🔗 **Quick Links**

- [**Updated Postman Collection**](../postman/CarRental-PoC-Updated.postman_collection.json) - ✅ Corrected API testing
- [**Automated Testing Report**](../AUTOMATED_TESTING_REPORT.md) - Complete test results
- [**Automated Test Script**](../scripts/test/test-postman-collection-complete.sh) - One-command testing
- [**Backend Code**](../backend/) - Source code
- [**Infrastructure**](../cdk/) - CDK stacks
- [**Scripts**](../scripts/) - Automation scripts

---

**This documentation is concise, focused, and maintained alongside the codebase.**
