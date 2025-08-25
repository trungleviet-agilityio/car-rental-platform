# 🚀 Deployment Guide - Car Rental Platform

Complete deployment and infrastructure documentation for the Car Rental Platform with **AWS integration** and **Infrastructure as Code (IaC)**.

## 🎯 **Deployment Architecture**

### **Infrastructure Components**

#### **AWS Infrastructure (CDK)**
- **🔐 AWS Cognito** - User authentication and management
- **📦 AWS S3** - File storage with presigned URLs
- **⚡ AWS Lambda** - Serverless function execution
- **🔄 AWS Step Functions** - Workflow orchestration
- **🌐 ECS Fargate** - Container orchestration
- **🗄️ RDS PostgreSQL** - Managed database service
- **🚪 API Gateway** - Serverless API endpoints
- **⚖️ Application Load Balancer** - Traffic distribution

#### **Container Platform**
- **🐳 Docker** - Application containerization
- **📦 ECR** - Container registry
- **🎛️ ECS** - Container orchestration
- **🔄 Fargate** - Serverless containers

## 🛠️ **Deployment Methods**

### **1. Complete AWS Deployment (Recommended)**
```bash
# One-command deployment with auto-configuration
cd poc
./scripts/deploy-with-backend-config.sh

# What it does:
# ✅ Deploys all CDK infrastructure
# ✅ Extracts resource IDs automatically
# ✅ Configures backend environment
# ✅ Creates deployment summary
```

### **2. Manual Step-by-Step Deployment**
```bash
# 1. Deploy infrastructure
cd poc
./scripts/deploy.sh

# 2. Extract outputs manually
aws cloudformation describe-stacks --stack-name CarRentalAuthStack

# 3. Configure backend environment
cp backend/env.example backend/.env.aws
# Edit with actual resource IDs

# 4. Deploy backend application
./scripts/deploy-app.sh
```

### **3. Local Development Setup**
```bash
# Quick local setup with mock providers
cd poc/backend
npm install
npm run start:dev

# Test with mock providers
curl http://localhost:3000/car-rental/v1
```

## 📊 **Environment Configuration**

### **Environment Matrix**
| Environment | Purpose | Providers | Database | Infrastructure |
|-------------|---------|-----------|----------|----------------|
| **Local** | Development | Mock | PostgreSQL | Docker Compose |
| **Development** | Integration Testing | Mixed | RDS | AWS CDK |
| **Staging** | Pre-production | Real AWS | RDS | AWS CDK |
| **Production** | Live System | Real AWS | RDS Multi-AZ | AWS CDK |

### **Provider Configuration by Environment**
```bash
# Local Development
AUTH_PROVIDER=mock
STORAGE_PROVIDER=mock
NOTIFICATION_PROVIDER=mock
PAYMENT_PROVIDER=mock
LAMBDA_PROVIDER=mock

# Development/Staging
AUTH_PROVIDER=aws
STORAGE_PROVIDER=s3
NOTIFICATION_PROVIDER=aws
PAYMENT_PROVIDER=mock
LAMBDA_PROVIDER=aws

# Production
AUTH_PROVIDER=aws
STORAGE_PROVIDER=s3
NOTIFICATION_PROVIDER=aws
PAYMENT_PROVIDER=stripe
LAMBDA_PROVIDER=aws
```

## 🔧 **Deployment Tools**

### **Automation Scripts**
| Script | Purpose | Usage |
|--------|---------|-------|
| `deploy-with-backend-config.sh` | Complete deployment + config | Production ready |
| `deploy.sh` | Infrastructure only | Manual configuration |
| `deploy-app.sh` | Backend application only | App updates |
| `deploy-stack.sh` | Single stack deployment | Targeted updates |
| `destroy.sh` | Complete cleanup | Environment teardown |

### **CDK Infrastructure**
```bash
# Individual stack management
cd poc/cdk
source .venv/bin/activate

# Deploy specific stacks
cdk deploy CarRentalStorageStack
cdk deploy CarRentalFargateStack  
cdk deploy CarRentalAuthStack
cdk deploy CarRentalApiStack

# View stack status
cdk list
cdk diff
```

### **Application Deployment**
```bash
# Build and deploy backend
cd poc/backend
docker build -t car-rental-backend .

# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin ECR_URL
docker tag car-rental-backend:latest ECR_URL/car-rental-backend:latest
docker push ECR_URL/car-rental-backend:latest

# Update ECS service
aws ecs update-service --cluster car-rental-cluster --service car-rental-service --force-new-deployment
```

## 📈 **Deployment Monitoring**

### **Health Checks**
```bash
# System health verification
curl https://your-alb-dns/car-rental/v1
curl https://your-api-gateway-url/car-rental/v1

# Provider status check
curl https://your-alb-dns/car-rental/v1 | jq '.providers'
```

### **Deployment Verification**
```bash
# Infrastructure verification
aws cloudformation describe-stacks
aws ecs describe-services --cluster car-rental-cluster
aws rds describe-db-instances

# Application verification  
cd poc/backend
./test-aws-integration.sh
```

### **Logging & Monitoring**
```bash
# View application logs
aws logs tail /ecs/car-rental-backend --follow

# View Lambda logs
aws logs tail /aws/lambda/LoginHandler --follow

# CloudWatch metrics
aws cloudwatch get-metric-statistics
```

## 🔐 **Security & Compliance**

### **Security Configuration**
- **IAM Roles** with least-privilege access
- **VPC Security Groups** with restricted access
- **S3 Bucket Policies** with encryption requirements
- **SSL/TLS** encryption for all communications
- **Secrets Manager** for sensitive configuration

### **Compliance Requirements**
- **Data encryption** at rest and in transit
- **Access logging** for all API calls
- **Audit trails** for administrative actions
- **Regular security updates** and patching

## 🚨 **Troubleshooting**

### **Common Deployment Issues**
| Issue | Symptoms | Solution |
|-------|----------|----------|
| CDK Bootstrap Missing | `cdk deploy` fails | Run `cdk bootstrap` |
| AWS Credentials | Permission denied | Check `aws configure` |
| Stack Dependencies | Deployment order fails | Follow dependency order |
| Environment Variables | API errors | Verify resource IDs |
| Network Connectivity | Timeout errors | Check VPC/Security Groups |

### **Debug Commands**
```bash
# Check AWS configuration
aws sts get-caller-identity
aws configure list

# Verify CDK status
cd poc/cdk
cdk doctor
cdk list

# Check infrastructure
aws cloudformation describe-stacks
aws ecs describe-services --cluster car-rental-cluster

# Check system health
cd poc
./scripts/test.sh health
./scripts/test.sh diff
```

## 📊 **Deployment Metrics**

### **Performance Targets**
| Metric | Target | Monitoring |
|--------|--------|------------|
| **API Response Time** | <400ms | CloudWatch |
| **Lambda Cold Start** | <1s | X-Ray |
| **Database Connections** | <100 concurrent | RDS Metrics |
| **S3 Upload Speed** | <2s for 10MB | CloudWatch |

### **Cost Optimization**
- **ECS Spot Instances** for non-critical workloads
- **S3 Lifecycle Policies** for old file cleanup
- **Lambda Reserved Concurrency** for cost control
- **RDS Instance Sizing** based on usage patterns

## 🔄 **Deployment Workflows**

### **Daily Development Workflow**
```bash
# 1. Start development day (30 seconds)
cd poc
./scripts/test.sh health

# 2. App code changes (2-3 minutes)
./scripts/deploy.sh app

# 3. Lambda/API changes (1-2 minutes)
./scripts/deploy.sh stack CarRentalDevApiStack

# 4. Infrastructure changes (3-15 minutes)
./scripts/deploy.sh stack CarRentalDevFargateStack
```

### **Change Detection & Decision Matrix**
| Change Type | Files Changed | Command | Time | Risk |
|-------------|---------------|---------|------|------|
| **App code** | `backend/src/**` | `./scripts/deploy.sh app` | 2-3 min | Low |
| **Lambda code** | `lambda/**` | `./scripts/deploy.sh stack CarRentalDevApiStack` | 1-2 min | Low |
| **Environment vars** | `fargate_stack.py` | `./scripts/deploy.sh stack CarRentalDevFargateStack` | 3-5 min | Low |
| **New AWS resources** | `cdk/stacks/**` | `./scripts/deploy.sh stack <StackName>` | 5-15 min | Medium |
| **VPC/Security** | `fargate_stack.py` (VPC) | `./scripts/deploy.sh deploy` | 10-20 min | High |

## 🎯 **AWS Integration Setup**

### **Prerequisites**
```bash
# 1. AWS CLI configuration
aws configure

# 2. CDK bootstrap (one-time)
cd poc/cdk
cdk bootstrap

# 3. Python environment
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### **Complete Deployment Process**
```bash
# 1. Deploy all infrastructure
cd poc
./scripts/deploy.sh deploy

# 2. Verify deployment
./scripts/test.sh health

# 3. Test AWS integration
./scripts/test.sh aws
```

### **Resource Outputs**
After deployment, the script automatically extracts:
- **Cognito User Pool ID** and Client ID
- **S3 Bucket Name** and ARN
- **ECS Cluster** and Service ARNs
- **RDS Endpoint** and credentials
- **API Gateway URLs**
- **Step Functions State Machine ARN**

## 🔗 **Related Documentation**

- [**API Documentation**](API.md) - Service endpoints
- [**Architecture Overview**](ARCHITECTURE.md) - System design
- [**Testing Guide**](TESTING.md) - Deployment validation
- [**Quick Start Guide**](../QUICK_START.md) - Setup instructions

## 🔗 **Quick Links**

- [**Scripts Documentation**](../scripts/README.md) - Deployment script details
- [**CDK Stacks**](../cdk/) - Infrastructure code
- [**Environment Examples**](../backend/env.example) - Configuration templates
- [**Docker Configuration**](../backend/Dockerfile) - Container setup

---

**Deployment documentation provides complete infrastructure and application deployment guidance.**
