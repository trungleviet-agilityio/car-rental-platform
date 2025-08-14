#!/bin/bash

# Car Rental Platform - Daily Health Check
# Quick infrastructure status check for development start

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="ap-southeast-1"

echo -e "${BLUE}🏥 Car Rental Platform - Health Check${NC}"
echo "=================================================="

# Helper function for status checks
check_status() {
    local service=$1
    local status=$2
    local expected=$3
    
    if [ "$status" = "$expected" ]; then
        echo -e "  $service: ${GREEN}✅ $status${NC}"
        return 0
    else
        echo -e "  $service: ${RED}❌ $status${NC} (expected: $expected)"
        return 1
    fi
}

# Check AWS CLI connectivity
echo -e "${YELLOW}🔍 Checking AWS connectivity...${NC}"
if aws sts get-caller-identity --region $REGION &>/dev/null; then
    ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    echo -e "  AWS Account: ${GREEN}✅ $ACCOUNT${NC}"
else
    echo -e "  AWS CLI: ${RED}❌ Not configured${NC}"
    echo -e "${YELLOW}💡 Run: aws configure${NC}"
    exit 1
fi

echo ""

# Check CloudFormation stacks
echo -e "${YELLOW}📚 Checking CloudFormation stacks...${NC}"
STACKS=(
    "CarRentalStorageStack"
    "CarRentalFargateStack" 
    "CarRentalAuthStack"
    "CarRentalApiStack"
)

HEALTHY_STACKS=0
for stack in "${STACKS[@]}"; do
    STATUS=$(aws cloudformation describe-stacks \
        --stack-name $stack \
        --region $REGION \
        --query 'Stacks[0].StackStatus' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    if check_status "$stack" "$STATUS" "CREATE_COMPLETE" || check_status "$stack" "$STATUS" "UPDATE_COMPLETE"; then
        ((HEALTHY_STACKS++))
    fi
done

echo ""

# Check ECS service
echo -e "${YELLOW}🐳 Checking ECS service...${NC}"
ECS_STATUS=$(aws ecs describe-services \
    --cluster car-rental-cluster \
    --services car-rental-alb-service \
    --region $REGION \
    --query 'services[0].status' \
    --output text 2>/dev/null || echo "NOT_FOUND")

RUNNING_TASKS=$(aws ecs describe-services \
    --cluster car-rental-cluster \
    --services car-rental-alb-service \
    --region $REGION \
    --query 'services[0].runningCount' \
    --output text 2>/dev/null || echo "0")

check_status "ECS Service" "$ECS_STATUS" "ACTIVE"
check_status "Running Tasks" "$RUNNING_TASKS" "1"

echo ""

# Check ALB health
echo -e "${YELLOW}🌐 Checking Load Balancer...${NC}"
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --region $REGION \
    --query 'LoadBalancers[?contains(LoadBalancerName, `CarRen-`)].DNSName' \
    --output text 2>/dev/null | head -n1)

if [ -n "$ALB_DNS" ]; then
    echo -e "  ALB DNS: ${GREEN}✅ $ALB_DNS${NC}"
    
    # Quick endpoint test
    if curl -s --max-time 5 "http://$ALB_DNS/api" > /dev/null 2>&1; then
        echo -e "  Health Endpoint: ${GREEN}✅ Responding${NC}"
    else
        echo -e "  Health Endpoint: ${YELLOW}⚠️  Not responding${NC}"
    fi
else
    echo -e "  ALB: ${RED}❌ Not found${NC}"
fi

echo ""

# Overall status
echo -e "${BLUE}📊 Overall Status:${NC}"
echo "=================================================="

if [ $HEALTHY_STACKS -eq 4 ] && [ "$ECS_STATUS" = "ACTIVE" ] && [ "$RUNNING_TASKS" = "1" ]; then
    echo -e "${GREEN}🎉 System is healthy! Ready for development.${NC}"
    
    echo ""
    echo -e "${BLUE}🚀 Quick development commands:${NC}"
    echo "  Deploy app changes: ./scripts/deploy-app.sh"
    echo "  Check differences:  ./scripts/diff.sh"
    echo "  Run smoke tests:    ./scripts/smoke-test.sh"
    
    if [ -n "$ALB_DNS" ]; then
        echo "  Test endpoint:      curl http://$ALB_DNS/api"
    fi
    
    exit 0
    
elif [ $HEALTHY_STACKS -lt 4 ]; then
    echo -e "${RED}❌ Infrastructure incomplete. Missing stacks.${NC}"
    echo ""
    echo -e "${YELLOW}💡 To deploy missing infrastructure:${NC}"
    echo "  ./scripts/deploy.sh deploy fast"
    exit 1
    
else
    echo -e "${YELLOW}⚠️  Infrastructure exists but services may be starting.${NC}"
    echo ""
    echo -e "${YELLOW}💡 Troubleshooting:${NC}"
    echo "  Check ECS tasks: aws ecs list-tasks --cluster car-rental-cluster --region $REGION"
    echo "  Check logs: aws logs tail /ecs/car-rental-backend --follow --region $REGION"
    echo "  Restart service: ./scripts/deploy-app.sh"
    exit 1
fi
