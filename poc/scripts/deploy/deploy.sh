#!/bin/bash

# Car Rental Platform - Complete Deployment with Backend Configuration
# Deploys CDK infrastructure and automatically configures backend for real AWS services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CDK_DIR="cdk"
REGION="ap-southeast-1"
# Get environment from CDK context or default to dev
ENVIRONMENT=$(cd cdk && cdk context --json 2>/dev/null | jq -r '.environment // "dev"' || echo "dev")
STACKS=("CarRental${ENVIRONMENT^}StorageStack" "CarRental${ENVIRONMENT^}FargateStack" "CarRental${ENVIRONMENT^}AuthStack" "CarRental${ENVIRONMENT^}ApiStack")

echo -e "${BLUE}🚀 Car Rental Platform - Complete AWS Deployment${NC}"
echo "========================================================"

# Check if we're in the right directory
if [ ! -d "$CDK_DIR" ]; then
    echo -e "${RED}❌ Error: CDK directory not found. Please run this script from the poc directory.${NC}"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Error: AWS CLI not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if Python virtual environment exists
if [ ! -d "$CDK_DIR/.venv" ]; then
    echo -e "${YELLOW}📦 Creating Python virtual environment...${NC}"
    cd "$CDK_DIR"
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    cd ..
else
    echo -e "${GREEN}✅ Python virtual environment found${NC}"
fi

# Activate virtual environment
echo -e "${YELLOW}🔧 Activating virtual environment...${NC}"
cd "$CDK_DIR"
source .venv/bin/activate

# Set AWS region
export AWS_DEFAULT_REGION="$REGION"
echo -e "${GREEN}✅ AWS Region set to: $REGION${NC}"

# Bootstrap CDK if needed
echo -e "${YELLOW}🔧 Checking CDK bootstrap status...${NC}"
if ! cdk list &> /dev/null; then
    echo -e "${YELLOW}🚀 Bootstrapping CDK...${NC}"
    cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/$REGION
else
    echo -e "${GREEN}✅ CDK already bootstrapped${NC}"
fi

# Deploy stacks
echo -e "${YELLOW}🚀 Deploying CDK stacks...${NC}"
echo "Stacks to deploy: ${STACKS[*]}"

for stack in "${STACKS[@]}"; do
    echo -e "${BLUE}📦 Deploying $stack...${NC}"
    
    # Check if stack is in a failed state and needs cleanup
    STACK_STATUS=$(aws cloudformation describe-stacks \
        --stack-name $stack \
        --region $REGION \
        --query 'Stacks[0].StackStatus' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [[ "$STACK_STATUS" =~ (ROLLBACK_COMPLETE|CREATE_FAILED|UPDATE_FAILED) ]]; then
        echo -e "${YELLOW}⚠️  Stack $stack is in $STACK_STATUS state${NC}"
        echo -e "${YELLOW}🗑️  Cleaning up failed stack before redeployment...${NC}"
        cdk destroy $stack --force || true
        echo -e "${GREEN}✅ Failed stack cleaned up${NC}"
    fi
    
    if cdk deploy "$stack" --require-approval never; then
        echo -e "${GREEN}✅ $stack deployed successfully${NC}"
    else
        echo -e "${RED}❌ $stack deployment failed${NC}"
        exit 1
    fi
done

# Extract CDK outputs
echo -e "${YELLOW}📊 Extracting CDK outputs...${NC}"
cd ..

# Function to get stack output
get_stack_output() {
    local stack_name=$1
    local output_key=$2
    aws cloudformation describe-stacks \
        --stack-name $stack_name \
        --region $REGION \
        --query "Stacks[0].Outputs[?OutputKey=='$output_key'].OutputValue" \
        --output text 2>/dev/null || echo ""
}

# Get outputs from each stack
USER_POOL_ID=$(get_stack_output "CarRental${ENVIRONMENT^}AuthStack" "UserPoolId")
USER_POOL_CLIENT_ID=$(get_stack_output "CarRental${ENVIRONMENT^}AuthStack" "UserPoolClientId")
S3_BUCKET_NAME=$(get_stack_output "CarRental${ENVIRONMENT^}StorageStack" "BucketName")
KYC_STATE_MACHINE_ARN=$(get_stack_output "CarRental${ENVIRONMENT^}FargateStack" "KycStateMachineArn")
LOAD_BALANCER_DNS=$(get_stack_output "CarRental${ENVIRONMENT^}FargateStack" "LoadBalancerDNS")
API_GATEWAY_URL=$(get_stack_output "CarRental${ENVIRONMENT^}ApiStack" "ApiGatewayUrl")

echo -e "${GREEN}✅ CDK Outputs extracted:${NC}"
echo "  User Pool ID: $USER_POOL_ID"
echo "  User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "  S3 Bucket: $S3_BUCKET_NAME"
echo "  KYC State Machine ARN: $KYC_STATE_MACHINE_ARN"
echo "  Load Balancer DNS: $LOAD_BALANCER_DNS"
echo "  API Gateway URL: $API_GATEWAY_URL"

# Create backend environment configuration
echo -e "${YELLOW}🔧 Creating backend environment configuration...${NC}"

# Create .env file for backend with real AWS configuration
cat > backend/.env.aws << EOF
# =================================================================
# Car Rental Platform - AWS Production Configuration
# Auto-generated from CDK deployment
# =================================================================

# =================
# APPLICATION CONFIG
# =================
NODE_ENV=production
PORT=3000

# =================
# PROVIDERS (AWS Services)
# =================
AUTH_PROVIDER=aws
STORAGE_PROVIDER=s3
NOTIFICATION_PROVIDER=aws
PAYMENT_PROVIDER=mock
LAMBDA_PROVIDER=aws

# =================
# DATABASE CONFIG
# =================
DB_DISABLE=false
DB_HOST=${LOAD_BALANCER_DNS}
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=car_rental
DB_SSL=false

# =================
# AWS CONFIGURATION
# =================
AWS_REGION=${REGION}

# AUTH (AWS Cognito)
USER_POOL_ID=${USER_POOL_ID}
USER_POOL_CLIENT_ID=${USER_POOL_CLIENT_ID}

# STORAGE (AWS S3)
S3_BUCKET_NAME=${S3_BUCKET_NAME}

# KYC (AWS Step Functions)
KYC_STATE_MACHINE_ARN=${KYC_STATE_MACHINE_ARN}

# NOTIFICATIONS (AWS SES/SNS)
EMAIL_FROM=no-reply@carrentalplatform.com
SMS_SENDER_ID=CarRental

# Lambda Configuration
GENERATE_PRESIGNED_URL_LAMBDA=GeneratePresignedUrl

# =================
# SECURITY & CORS
# =================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=*

# =================
# DEBUG
# =================
DEBUG=false
DEBUG_INCLUDE_OTP=false
EOF

echo -e "${GREEN}✅ Backend environment file created: backend/.env.aws${NC}"

# Create deployment summary
echo -e "${YELLOW}📋 Creating deployment summary...${NC}"

cat > DEPLOYMENT_SUMMARY.md << EOF
# 🚀 Car Rental Platform - AWS Deployment Summary

## ✅ Deployment Status: SUCCESS

### 📊 Infrastructure Deployed
- **Cognito User Pool**: \`${USER_POOL_ID}\`
- **Cognito User Pool Client**: \`${USER_POOL_CLIENT_ID}\`
- **S3 Storage Bucket**: \`${S3_BUCKET_NAME}\`
- **KYC Step Functions**: \`${KYC_STATE_MACHINE_ARN}\`
- **Application Load Balancer**: \`${LOAD_BALANCER_DNS}\`
- **API Gateway**: \`${API_GATEWAY_URL}\`

### 🔧 Backend Configuration
The backend is configured to use real AWS services. Environment file: \`backend/.env.aws\`

### 🧪 Testing Commands

#### Test API Gateway (Lambda-based auth)
\`\`\`bash
# Test OTP initiation
curl -X POST ${API_GATEWAY_URL}auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"action": "initiate_auth", "phone_number": "+1234567890"}'

# Test OTP validation
curl -X POST ${API_GATEWAY_URL}auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"action": "respond_to_challenge", "session": "mock_session", "otp_code": "123456"}'
\`\`\`

#### Test Fargate Backend (Full DIP architecture)
\`\`\`bash
# Health check
curl http://${LOAD_BALANCER_DNS}/api

# Test KYC presign
curl -X POST http://${LOAD_BALANCER_DNS}/api/kyc/presign \\
  -H "Content-Type: application/json" \\
  -d '{"cognitoSub": "test-user-123", "contentType": "image/jpeg"}'

# Test KYC validation
curl -X POST http://${LOAD_BALANCER_DNS}/api/kyc/validate \\
  -H "Content-Type: application/json" \\
  -d '{"cognitoSub": "test-user-123", "key": "kyc/test-user-123/document.jpg"}'
\`\`\`

### 🔐 AWS Credentials Required
Make sure your AWS credentials are configured:
\`\`\`bash
aws configure
\`\`\`

### 🐳 Deploy Backend to ECS
\`\`\`bash
cd poc
./scripts/deploy-app.sh
\`\`\`

### 🧹 Cleanup
To destroy all infrastructure:
\`\`\`bash
cd poc
./scripts/destroy.sh
\`\`\`

---
*Generated on: $(date)*
*Region: ${REGION}*
EOF

echo -e "${GREEN}✅ Deployment summary created: DEPLOYMENT_SUMMARY.md${NC}"

echo -e "${GREEN}🎉 Complete AWS deployment successful!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Review DEPLOYMENT_SUMMARY.md for testing commands"
echo "2. Deploy backend to ECS: ./scripts/deploy-app.sh"
echo "3. Test the API endpoints"
echo ""
echo -e "${YELLOW}💡 Backend is configured for real AWS services in: backend/.env.aws${NC}"
