#!/bin/bash

# Car Rental Platform - CDK Destroy Script
# This script destroys the CDK infrastructure for the car rental platform

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
STACKS=("CarRentalFargateStack" "CarRentalApiStack" "CarRentalStorageStack" "CarRentalAuthStack")

echo -e "${RED}🗑️  Car Rental Platform - CDK Destroy Script${NC}"
echo "=================================================="
echo -e "${YELLOW}⚠️  WARNING: This will destroy ALL infrastructure!${NC}"
echo ""

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

# Confirmation prompt
echo -e "${YELLOW}⚠️  This will destroy the following AWS resources:${NC}"
echo "  - Cognito User Pool and Identity Pool"
echo "  - API Gateway and Lambda Functions"
echo "  - S3 Bucket and all stored data"
echo "  - ECS Fargate Cluster and Services"
echo "  - VPC, Security Groups, and Load Balancers"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${GREEN}✅ Destruction cancelled.${NC}"
    exit 0
fi

echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if Python virtual environment exists
if [ ! -d "$CDK_DIR/.venv" ]; then
    echo -e "${RED}❌ Error: Python virtual environment not found. Please run deploy.sh first.${NC}"
    exit 1
fi

# Activate virtual environment
echo -e "${YELLOW}🔧 Activating virtual environment...${NC}"
cd "$CDK_DIR"
source .venv/bin/activate

# Set AWS region
export AWS_DEFAULT_REGION="$REGION"
echo -e "${GREEN}✅ AWS Region set to: $REGION${NC}"

# Check if stacks exist
echo -e "${YELLOW}🔍 Checking existing stacks...${NC}"
if ! cdk list &> /dev/null; then
    echo -e "${RED}❌ Error: No CDK stacks found. Nothing to destroy.${NC}"
    exit 1
fi

# Destroy stacks in reverse order (dependencies first)
echo -e "${YELLOW}🗑️  Destroying CDK stacks...${NC}"
echo "Stacks to destroy: ${STACKS[*]}"

for stack in "${STACKS[@]}"; do
    echo -e "${BLUE}🗑️  Destroying $stack...${NC}"
    if cdk destroy "$stack" --force; then
        echo -e "${GREEN}✅ $stack destroyed successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  $stack may have already been destroyed or failed${NC}"
    fi
done

# Clean up local files
echo -e "${YELLOW}🧹 Cleaning up local files...${NC}"
if [ -d "cdk.out" ]; then
    rm -rf cdk.out
    echo -e "${GREEN}✅ Removed cdk.out directory${NC}"
fi

if [ -f "cdk.context.json" ]; then
    rm cdk.context.json
    echo -e "${GREEN}✅ Removed cdk.context.json${NC}"
fi

echo -e "${GREEN}🎉 Infrastructure destruction completed!${NC}"
echo ""
echo -e "${BLUE}📋 What was destroyed:${NC}"
echo "✅ Cognito User Pool and Identity Pool"
echo "✅ API Gateway and Lambda Functions"
echo "✅ S3 Bucket and all stored data"
echo "✅ ECS Fargate Cluster and Services"
echo "✅ VPC, Security Groups, and Load Balancers"
echo ""
echo -e "${YELLOW}💡 To redeploy, run: ./scripts/deploy.sh${NC}"

cd ..
