# Car Rental Platform

A modern, scalable car rental platform built with AWS CDK, NestJS, and microservices architecture.

## 🚀 Project Overview

This project demonstrates a production-ready car rental platform with:
- **OTP-based Authentication** using AWS Cognito
- **Serverless Architecture** with Lambda functions
- **Containerized Backend** with NestJS on ECS Fargate
- **Infrastructure as Code** using AWS CDK
- **Secure File Storage** with S3 for KYC documents

## 📁 Project Structure

```
car-rental-platform/
├── poc/                          # Proof of Concept
│   ├── cdk/                      # AWS CDK Infrastructure
│   │   ├── stacks/              # CDK Stack definitions
│   │   │   ├── auth_stack.py    # Cognito User Pool & Identity
│   │   │   ├── api_stack.py     # API Gateway & Lambda
│   │   │   ├── fargate_stack.py # ECS Fargate & Load Balancer
│   │   │   └── storage_stack.py # S3 Bucket for file storage
│   │   ├── app.py               # CDK App entry point
│   │   └── requirements.txt     # Python dependencies
│   ├── lambda/                   # AWS Lambda Functions
│   │   └── login_handler/       # OTP-based login handler
│   ├── backend/                  # NestJS Backend (Phase 2)
│   ├── docs/                     # Documentation
│   ├── tests/                    # Test files
│   └── docker/                   # Docker configurations
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## 🏗️ Architecture

### Phase 1: Infrastructure (✅ Completed)
- **AWS Cognito**: User authentication with OTP-based login
- **API Gateway**: RESTful API endpoints
- **Lambda Functions**: Serverless authentication handlers
- **S3 Storage**: Secure file storage for KYC documents
- **ECS Fargate**: Containerized backend deployment

### Phase 2: Backend Development (🔄 In Progress)
- **NestJS Application**: Modular backend framework
- **Docker Containerization**: Production-ready containers
- **Database Integration**: User data management
- **API Integration**: Cognito and AWS services

### Phase 3: Frontend & Deployment (📋 Planned)
- **React/Next.js Frontend**: Modern web application
- **CI/CD Pipeline**: Automated deployment
- **Monitoring & Logging**: CloudWatch integration
- **Security Hardening**: Additional security measures

## 🚀 Quick Start

### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js 18+ and npm
- Python 3.10+ and pip
- Docker (for containerization)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd car-rental-platform
```

### 2. Deploy Infrastructure
```bash
cd poc/cdk
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cdk bootstrap aws://ACCOUNT-ID/REGION
cdk deploy CarRentalAuthStack CarRentalApiStack
```

### 3. Test the API
```bash
# Test OTP initiation
curl -X POST https://YOUR-API-GATEWAY-URL/prod/auth/login \
  -H "Content-Type: application/json" \
  -d '{"action": "initiate_auth", "phone_number": "+1234567890"}'

# Test OTP validation
curl -X POST https://YOUR-API-GATEWAY-URL/prod/auth/login \
  -H "Content-Type: application/json" \
  -d '{"action": "respond_to_challenge", "session": "mock_session", "otp_code": "123456"}'
```

## 📊 Current Status

### ✅ Phase 1: Infrastructure (Completed)
- [x] CDK Infrastructure deployed
- [x] Cognito User Pool with OTP authentication
- [x] API Gateway with Lambda integration
- [x] S3 bucket for file storage
- [x] ECS Fargate stack ready
- [x] Working API endpoints tested

### 🔄 Phase 2: Backend Development (In Progress)
- [ ] NestJS project setup
- [ ] Authentication module
- [ ] Docker containerization
- [ ] Database integration
- [ ] API testing

### 📋 Phase 3: Frontend & Deployment (Planned)
- [ ] React/Next.js frontend
- [ ] CI/CD pipeline
- [ ] Monitoring setup
- [ ] Security hardening

## 🔧 Technical Stack

### Backend
- **NestJS**: Modern Node.js framework
- **TypeScript**: Type-safe development
- **Docker**: Containerization
- **PostgreSQL**: Database (planned)

### Infrastructure
- **AWS CDK**: Infrastructure as Code
- **AWS Cognito**: Authentication
- **AWS Lambda**: Serverless functions
- **AWS API Gateway**: REST API
- **AWS S3**: File storage
- **AWS ECS Fargate**: Container orchestration

### Development
- **Node.js**: Runtime environment
- **Python**: CDK development
- **Git**: Version control
- **Docker**: Containerization

## 📈 Performance Metrics

- **API Response Time**: <400ms (target achieved)
- **Lambda Cold Start**: ~732ms
- **Lambda Execution**: ~715ms
- **CORS**: Properly configured
- **Security**: IAM roles and policies

## 🔐 Security Features

- **Multi-Factor Authentication**: OTP-based login
- **IAM Roles**: Least privilege access
- **CORS Configuration**: Secure cross-origin requests
- **S3 Encryption**: Server-side encryption
- **API Gateway**: Request validation

## 📚 Documentation

- [Phase 1 Summary](poc/PHASE1_SUMMARY.md): Detailed infrastructure deployment
- [API Documentation](poc/docs/api.md): API endpoints and usage
- [Architecture Diagrams](poc/docs/architecture.md): System design
- [Setup Guide](poc/docs/setup.md): Development environment setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions or support, contact:
- **Email**: [trung.leviet@asnet.com.vn](mailto:trung.leviet@asnet.com.vn)
- **Team**: Backend Development Team

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Last Updated**: August 7, 2025
**Status**: Phase 1 Complete ✅ | Phase 2 In Progress 🔄
