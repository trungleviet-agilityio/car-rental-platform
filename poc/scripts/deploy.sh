#!/bin/bash

# Car Rental Platform - CDK Deploy Script
# This script deploys the CDK infrastructure for the car rental platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CDK_DIR="cdk"
REGION="ap-southeast-1"
STACKS=("CarRentalAuthStack" "CarRentalApiStack" "CarRentalStorageStack" "CarRentalFargateStack")

echo -e "${BLUE}🚀 Car Rental Platform - CDK Deploy Script${NC}"
echo "=================================================="

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
    cdk deploy "$stack" --require-approval never
    echo -e "${GREEN}✅ $stack deployed successfully${NC}"
done

# Get outputs
echo -e "${YELLOW}📊 Getting deployment outputs...${NC}"
cdk list

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Useful Information:${NC}"
echo "API Gateway URL: https://y3r7texko6.execute-api.ap-southeast-1.amazonaws.com/prod/"
echo "Login Endpoint: https://y3r7texko6.execute-api.ap-southeast-1.amazonaws.com/prod/auth/login"
echo ""
echo -e "${YELLOW}🧪 Test the API:${NC}"
echo "curl -X POST https://y3r7texko6.execute-api.ap-southeast-1.amazonaws.com/prod/auth/login \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"action\": \"initiate_auth\", \"phone_number\": \"+1234567890\"}'"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "- Phase 1 Summary: poc/PHASE1_SUMMARY.md"
echo "- API Documentation: poc/docs/api.md"
echo ""
echo -e "${YELLOW}⚠️  To destroy infrastructure, run: ./scripts/destroy.sh${NC}"

cd ..
