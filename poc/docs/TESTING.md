# 🧪 Testing Guide - Car Rental Platform

Complete testing strategy for the Car Rental Platform demonstrating **Dependency Inversion Principle (DIP)** with multiple provider support.

## 🎯 **Testing Strategy Overview**

### **3-Tier Testing Approach**

#### **1. Mock Provider Testing (Development)**
- ✅ **Fast iteration** and development
- ✅ **No external dependencies** 
- ✅ **Predictable responses** for debugging
- ✅ **100% success rate** for reliable testing
- ✅ **Instant feedback** for rapid development

#### **2. Real Provider Testing (Integration)**
- ✅ **Real service integrations** (AWS, Stripe, Twilio)
- ✅ **Production behavior** validation
- ✅ **End-to-end testing** with actual services
- ✅ **Performance benchmarking**
- ✅ **Error handling** validation

#### **3. Mixed Provider Testing (Hybrid)**
- ✅ **Targeted testing** of specific integrations
- ✅ **Cost optimization** (real only where needed)
- ✅ **Isolated debugging** of provider issues
- ✅ **Gradual migration** from mock to real

## 🔧 **Testing Tools & Scripts**

### **Automated Test Scripts**
```bash
# 🆕 Complete Postman Collection Testing (All 22 flows)
./poc/scripts/test/test-postman-collection-complete.sh

# Complete flow testing (Mock providers)
./backend/test-complete-flow.sh

# AWS integration testing (Real providers)  
./backend/test-aws-integration.sh

# DIP architecture testing
./backend/test-dip.js

# Registration flow testing
./backend/test-registration-flow.sh
```

### **Updated Postman Collection**
- **✅ 18 comprehensive scenarios** covering all flows (updated)
- **✅ Corrected base URL** to `http://localhost:3000/car-rental/v1`
- **✅ Updated authentication endpoints** to match actual implementation
- **✅ Automated variable chaining** between requests
- **✅ Environment configurations** for different testing modes
- **✅ User creation step** added before KYC testing
- **File:** `poc/postman/CarRental-PoC-Updated.postman_collection.json`

### **Performance Testing**
```bash
# Load testing with Artillery
artillery run tests/artillery.yml

# Performance benchmarking
npm run test:performance
```

## 📊 **Testing Coverage**

### **API Endpoint Testing**
| Endpoint Category | Mock Tests | Real Tests | Integration Tests |
|-------------------|------------|------------|------------------|
| 🏥 **Health & Status** | ✅ | ✅ | ✅ |
| 🔐 **Authentication** | ✅ | ✅ | ✅ |
| 👥 **User Management** | ✅ | ✅ | ✅ |
| 📄 **KYC & File Upload** | ✅ | ✅ | ✅ |
| 📧 **Notifications** | ✅ | ✅ | ✅ |
| 💳 **Payment Processing** | ✅ | ✅ | ✅ |
| 🔧 **Lambda Integration** | ✅ | ✅ | ✅ |

### **Provider Testing Matrix**
| Provider | Mock Mode | Real Mode | Mixed Mode |
|----------|-----------|-----------|------------|
| **Authentication** | Mock Adapter | AWS Cognito | ✅ |
| **Storage** | Mock Adapter | AWS S3 | ✅ |
| **Notifications** | Mock Adapter | AWS SES/SNS, Twilio | ✅ |
| **Payments** | Mock Adapter | Stripe | ✅ |
| **Lambda** | Mock Adapter | AWS Lambda | ✅ |

## 🚀 **Quick Testing Commands**

### **Local Development Testing**
```bash
cd poc/backend

# Start with mock providers
npm run start:dev

# Run basic health check
curl http://localhost:3000/car-rental/v1

# Run complete automated test (recommended)
cd ..
./scripts/test/test-postman-collection-complete.sh

# Run individual flow test
./scripts/test.sh flow
```

### **AWS Integration Testing**
```bash
# Configure AWS credentials
aws configure

# Deploy infrastructure and configure backend
cd poc
./scripts/deploy-with-backend-config.sh

# Test AWS integration
cd backend
./test-aws-integration.sh
```

### **Postman Testing**
```bash
# Import updated collection
# File: poc/postman/CarRental-PoC-Updated.postman_collection.json

# Configure environments:
# - Local (Mock): http://localhost:3000/car-rental/v1 ✅ (corrected)
# - Production (Real): AWS ALB/API Gateway URLs + /car-rental/v1

# Run complete test suite
newman run CarRental-PoC-Updated.postman_collection.json

# Alternative: Use automated script (recommended)
./poc/scripts/test/test-postman-collection-complete.sh
```

## 📈 **Testing Metrics & KPIs**

### **Success Criteria**
- ✅ **100% pass rate** for mock provider tests
- ✅ **>95% pass rate** for real provider tests
- ✅ **<400ms response time** for local API calls
- ✅ **<2s response time** for AWS service calls
- ✅ **Zero data corruption** in database tests

### **Performance Benchmarks**
| Test Type | Target | Current | Status |
|-----------|--------|---------|--------|
| **Mock API Response** | <50ms | ~25ms | ✅ |
| **Real API Response** | <400ms | ~300ms | ✅ |
| **S3 Upload** | <2s | ~1.2s | ✅ |
| **Lambda Cold Start** | <1s | ~800ms | ✅ |
| **Step Functions** | <5s | ~3s | ✅ |

## 🔍 **Testing Best Practices**

### **Test Development Workflow**
1. **Start with mock providers** for fast development
2. **Write comprehensive tests** for each API endpoint
3. **Test with real providers** for integration validation
4. **Use mixed providers** for specific debugging
5. **Automate regression testing** with scripts

### **Provider Testing Guidelines**
- **Always test mock mode first** before real providers
- **Use environment variables** to switch providers
- **Test error scenarios** with both mock and real providers
- **Validate data persistence** across provider switches
- **Monitor performance** differences between providers

### **CI/CD Integration**
```yaml
# Example pipeline
stages:
  - mock-tests:    # Fast feedback
  - real-tests:    # Integration validation  
  - performance:   # Load testing
  - security:      # Security scanning
```

## 🧪 **Complete Flow Testing**

### **Authentication Flow Test (Updated)**
```bash
# 1. Health check
curl http://localhost:3000/car-rental/v1

# 2. Sign up user
curl -X POST http://localhost:3000/car-rental/v1/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"StrongPass!23","phone":"+84123456789"}'

# 3. Initiate OTP
curl -X POST http://localhost:3000/car-rental/v1/auth/otp/initiate \
  -H 'Content-Type: application/json' \
  -d '{"phoneNumber":"+84123456789"}'

# 4. Verify OTP
curl -X POST http://localhost:3000/car-rental/v1/auth/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"phoneNumber":"+84123456789","code":"123456"}'

# 5. Sign in with email/password
curl -X POST http://localhost:3000/car-rental/v1/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"StrongPass!23"}'

# 6. Sync user (for KYC)
curl -X POST http://localhost:3000/car-rental/v1/users/sync \
  -H 'Content-Type: application/json' \
  -d '{"cognitoSub":"mock-cognito-sub-123","username":"test@example.com","phoneNumber":"+84123456789","email":"test@example.com"}'
```

### **KYC Flow Test with Lambda Integration (Updated)**
```bash
# 1. Create user first (required)
curl -X POST http://localhost:3000/car-rental/v1/users/sync \
  -H 'Content-Type: application/json' \
  -d '{"cognitoSub":"user-123","username":"testuser","phoneNumber":"+84123456789","email":"test@example.com"}'

# 2. Generate presigned URL (via Lambda)
curl -X POST http://localhost:3000/car-rental/v1/kyc/presign \
  -H 'Content-Type: application/json' \
  -d '{"cognitoSub":"user-123","contentType":"image/jpeg"}'

# 3. Start validation (via Step Functions)
curl -X POST http://localhost:3000/car-rental/v1/kyc/validate \
  -H 'Content-Type: application/json' \
  -d '{"cognitoSub":"user-123","key":"kyc/user-123/document.jpg"}'

# 4. Process callback (Lambda callback)
curl -X POST http://localhost:3000/car-rental/v1/kyc/callback \
  -H 'Content-Type: application/json' \
  -d '{"cognitoSub":"user-123","key":"kyc/user-123/document.jpg","status":"verified"}'
```

### **Notification Services Test (Updated)**
```bash
# 1. Email notification
curl -X POST http://localhost:3000/car-rental/v1/notify/email \
  -H 'Content-Type: application/json' \
  -d '{"to":"user@example.com","subject":"Welcome","text":"Thank you for joining!"}'

# 2. SMS notification
curl -X POST http://localhost:3000/car-rental/v1/notify/sms \
  -H 'Content-Type: application/json' \
  -d '{"to":"+84123456789","message":"Your code is: 123456"}'

# 3. Unified OTP notification
curl -X POST http://localhost:3000/car-rental/v1/notify/otp \
  -H 'Content-Type: application/json' \
  -d '{"to":"+84123456789","code":"123456"}'
```

### **Payment Processing Test (Updated)**
```bash
# 1. Create payment intent
curl -X POST http://localhost:3000/car-rental/v1/payment/intent \
  -H 'Content-Type: application/json' \
  -d '{"amount":5000,"currency":"usd","description":"Car rental booking"}'

# 2. Confirm payment
curl -X POST http://localhost:3000/car-rental/v1/payment/confirm \
  -H 'Content-Type: application/json' \
  -d '{"paymentIntentId":"pi_mock_1234567890","paymentMethodId":"pm_mock_card_visa"}'

# 3. Process refund
curl -X POST http://localhost:3000/car-rental/v1/payment/refund \
  -H 'Content-Type: application/json' \
  -d '{"paymentIntentId":"pi_mock_1234567890","amount":2500}'
```

## 🐛 **Debugging & Troubleshooting**

### **Common Testing Issues**
- **Provider configuration errors** → Check environment variables
- **Network connectivity issues** → Verify AWS credentials
- **Database connection failures** → Check PostgreSQL status
- **Permission errors** → Validate IAM roles and policies

### **Debug Commands**
```bash
# Check provider status
curl http://localhost:3000/car-rental/v1 | jq '.providers'

# Enable debug logging
export DEBUG=true
npm run start:dev

# Test specific provider
export AUTH_PROVIDER=aws
export STORAGE_PROVIDER=mock
./test-aws-integration.sh
```

### **Provider-Specific Debugging**

#### **Mock Provider Debugging**
```bash
# Mock providers return predictable responses
curl http://localhost:3000/car-rental/v1/auth/otp/initiate \
  -H 'Content-Type: application/json' \
  -d '{"phoneNumber":"+84123456789"}'
# Always returns: {"message":"OTP sent successfully (simulated)","session":"mock_session"}
```

#### **AWS Provider Debugging**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Test AWS service connectivity
aws cognito-idp list-user-pools --max-items 10

# Check CloudWatch logs
aws logs tail /ecs/car-rental-backend --follow
```

## 📊 **Test Results Summary**

### **Mock Provider Test Results**
```bash
# Run complete mock test suite
./test-complete-flow.sh

# Expected output:
✅ Health Check: PASS
✅ User Registration: PASS
✅ OTP Initiate: PASS
✅ OTP Verify: PASS
✅ User Sync: PASS
✅ KYC Presign: PASS
✅ KYC Validate: PASS
✅ KYC Callback: PASS
✅ Email Notification: PASS
✅ SMS Notification: PASS
✅ OTP Notification: PASS
✅ Payment Intent: PASS
✅ Payment Confirm: PASS
✅ Payment Refund: PASS
✅ Lambda Integration: PASS

Total: 15/15 tests passed
```

### **AWS Provider Test Results**
```bash
# Run AWS integration test suite
./test-aws-integration.sh

# Expected output:
✅ AWS Cognito Authentication: PASS
✅ AWS S3 Storage: PASS
✅ AWS SES Notifications: PASS
✅ AWS Lambda Integration: PASS
✅ AWS Step Functions: PASS
✅ Database Persistence: PASS

Total: 6/6 tests passed
```

## 🔗 **Related Documentation**

- [**API Documentation**](API.md) - Complete API reference
- [**Architecture Overview**](ARCHITECTURE.md) - System design and DIP implementation
- [**Deployment Guide**](DEPLOYMENT.md) - Infrastructure setup
- [**Postman Collection**](../postman/CarRental-PoC.postman_collection.json) - API testing

---

**Testing documentation covers comprehensive strategies for both mock and real provider validation.**
