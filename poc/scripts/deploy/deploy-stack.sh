#!/bin/bash

# Car Rental Platform - Single Stack Deployment
# Deploy specific CDK stack only

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
VALID_STACKS=("CarRental${ENVIRONMENT^}StorageStack" "CarRental${ENVIRONMENT^}FargateStack" "CarRental${ENVIRONMENT^}AuthStack" "CarRental${ENVIRONMENT^}ApiStack")

# Parse arguments
STACK_NAME=""
CONTEXT_ARGS=""

show_usage() {
    echo -e "${BLUE}Usage: $0 <stack-name> [options]${NC}"
    echo ""
    echo -e "${YELLOW}Valid stack names:${NC}"
    for stack in "${VALID_STACKS[@]}"; do
        echo "  - $stack"
    done
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  fast              Enable fast mode (no RDS/NAT)"
    echo "  --image-tag TAG   Use specific image tag"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 CarRentalFargateStack"
    echo "  $0 CarRentalFargateStack fast"
    echo "  $0 CarRentalFargateStack --image-tag abc123"
}

# Validate arguments
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Error: Stack name required${NC}"
    show_usage
    exit 1
fi

STACK_NAME=$1
shift

# Validate stack name
if [[ ! " ${VALID_STACKS[@]} " =~ " ${STACK_NAME} " ]]; then
    echo -e "${RED}❌ Error: Invalid stack name: $STACK_NAME${NC}"
    show_usage
    exit 1
fi

# Parse additional arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        fast)
            CONTEXT_ARGS="$CONTEXT_ARGS -c fast=true"
            echo -e "${YELLOW}⚡ Fast mode enabled${NC}"
            shift
            ;;
        --image-tag)
            if [ -n "$2" ]; then
                CONTEXT_ARGS="$CONTEXT_ARGS -c imageTag=$2"
                echo -e "${YELLOW}🖼  Using image tag: $2${NC}"
                shift 2
            else
                echo -e "${RED}❌ Error: --image-tag requires a value${NC}"
                exit 1
            fi
            ;;
        *)
            echo -e "${RED}❌ Error: Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🚀 Car Rental Platform - Stack Deployment${NC}"
echo "=================================================="
echo -e "${YELLOW}Target Stack: $STACK_NAME${NC}"
echo -e "${YELLOW}Context Args: ${CONTEXT_ARGS:-"none"}${NC}"
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

# Activate virtual environment
echo -e "${YELLOW}🔧 Activating CDK environment...${NC}"
cd "$CDK_DIR"
source .venv/bin/activate
export AWS_DEFAULT_REGION="$REGION"

# Check if CDK is bootstrapped
echo -e "${YELLOW}🔧 Checking CDK bootstrap status...${NC}"
if ! cdk list &> /dev/null; then
    echo -e "${YELLOW}🚀 Bootstrapping CDK...${NC}"
    cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/$REGION
else
    echo -e "${GREEN}✅ CDK already bootstrapped${NC}"
fi

# Show what will change
echo -e "${YELLOW}🔍 Checking changes for $STACK_NAME...${NC}"
DIFF_OUTPUT=$(cdk diff $CONTEXT_ARGS $STACK_NAME 2>&1 || true)

if echo "$DIFF_OUTPUT" | grep -q "There were no differences"; then
    echo -e "${GREEN}✅ No changes detected${NC}"
    echo -e "${BLUE}💡 Stack is already up to date${NC}"
else
    echo -e "${YELLOW}📝 Changes to be deployed:${NC}"
    echo "$DIFF_OUTPUT"
    echo ""
    
    # Confirmation for major changes
    if echo "$DIFF_OUTPUT" | grep -q -E "(CREATE|DELETE|REPLACE)"; then
        echo -e "${YELLOW}⚠️  Major changes detected (CREATE/DELETE/REPLACE)${NC}"
        read -p "Continue with deployment? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}ℹ️  Deployment cancelled${NC}"
            exit 0
        fi
    fi
fi

# Deploy the stack
echo -e "${YELLOW}🚀 Deploying $STACK_NAME...${NC}"
START_TIME=$(date +%s)

if cdk deploy $CONTEXT_ARGS $STACK_NAME --require-approval never; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo -e "${GREEN}✅ $STACK_NAME deployed successfully!${NC}"
    echo -e "${BLUE}⏱️  Deployment time: ${DURATION}s${NC}"
    
    # Get stack outputs
    echo -e "${YELLOW}📊 Stack outputs:${NC}"
    aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey && OutputValue].[OutputKey,OutputValue]' \
        --output table 2>/dev/null || echo "No outputs available"
    
    # Provide next steps based on stack type
    echo ""
    case $STACK_NAME in
        "CarRentalFargateStack")
            echo -e "${BLUE}🎯 Next Steps for Fargate Stack:${NC}"
            echo "  1. Test app endpoints: ./scripts/smoke-test.sh"
            echo "  2. Deploy app changes: ./scripts/deploy-app.sh"
            ;;
        "CarRentalApiStack")
            echo -e "${BLUE}🎯 Next Steps for API Stack:${NC}"
            echo "  1. Test API Gateway: ./scripts/smoke-test.sh"
            echo "  2. Check Lambda logs in CloudWatch"
            ;;
        "CarRentalAuthStack")
            echo -e "${BLUE}🎯 Next Steps for Auth Stack:${NC}"
            echo "  1. Test Cognito integration"
            echo "  2. Check user pool configuration"
            ;;
        "CarRentalStorageStack")
            echo -e "${BLUE}🎯 Next Steps for Storage Stack:${NC}"
            echo "  1. Test S3 bucket access"
            echo "  2. Verify KYC upload endpoints"
            ;;
    esac
    
else
    echo -e "${RED}❌ Deployment failed${NC}"
    echo -e "${YELLOW}💡 Troubleshooting tips:${NC}"
    echo "  1. Check CloudFormation events in AWS Console"
    echo "  2. Review error messages above"
    echo "  3. Try: cdk diff $STACK_NAME to see pending changes"
    echo "  4. For stuck stacks: manually delete from console then retry"
    exit 1
fi

cd ..
