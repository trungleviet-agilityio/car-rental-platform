#!/bin/bash

# Car Rental Platform - Smoke Tests
# Quick health checks for deployed infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="ap-southeast-1"
TIMEOUT=10

echo -e "${BLUE}🧪 Car Rental Platform - Smoke Tests${NC}"
echo "=================================================="

# Helper function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    local method=${4:-GET}
    local data=${5:-""}
    
    echo -n "Testing $name... "
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "%{http_code}" -o /dev/null --max-time $TIMEOUT \
            -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "%{http_code}" -o /dev/null --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
    fi
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✅ $response${NC}"
        return 0
    else
        echo -e "${RED}❌ $response (expected $expected_code)${NC}"
        return 1
    fi
}

# Get infrastructure endpoints
echo -e "${YELLOW}🔍 Discovering endpoints...${NC}"

# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --region $REGION \
    --query 'LoadBalancers[?contains(LoadBalancerName, `CarRen-`)].DNSName' \
    --output text 2>/dev/null | head -n1)

# Get API Gateway URL
API_URL=$(aws cloudformation describe-stacks \
    --stack-name CarRentalApiStack \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")

# Get S3 Bucket
S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name CarRentalStorageStack \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`StorageBucketName`].OutputValue' \
    --output text 2>/dev/null || echo "")

echo -e "${BLUE}📋 Discovered Endpoints:${NC}"
echo "  ALB DNS: ${ALB_DNS:-"Not found"}"
echo "  API Gateway: ${API_URL:-"Not found"}"
echo "  S3 Bucket: ${S3_BUCKET:-"Not found"}"
echo ""

# Test results tracking
TESTS_PASSED=0
TESTS_TOTAL=0

# ALB Tests (Fargate/NestJS)
if [ -n "$ALB_DNS" ]; then
    echo -e "${YELLOW}🐳 Testing ALB/Fargate Endpoints:${NC}"
    
    # Health check endpoint
    ((TESTS_TOTAL++))
    if test_endpoint "Health Check" "http://$ALB_DNS/api" 200; then
        ((TESTS_PASSED++))
    fi
    
    # Auth endpoint
    ((TESTS_TOTAL++))
    if test_endpoint "Auth Login" "http://$ALB_DNS/api/auth/login" 200 POST '{"action":"initiate_auth","phone_number":"+1234567890"}'; then
        ((TESTS_PASSED++))
    fi
    
    # Users sync endpoint (simulated Cognito trigger)
    ((TESTS_TOTAL++))
    if test_endpoint "Users Sync" "http://$ALB_DNS/api/users/sync" 200 POST '{"cognitoSub":"test-123","username":"testuser","phoneNumber":"+1234567890","email":"test@example.com"}'; then
        ((TESTS_PASSED++))
    fi
    
    # KYC presign endpoint
    ((TESTS_TOTAL++))
    if test_endpoint "KYC Presign" "http://$ALB_DNS/api/kyc/presign" 200 POST '{"cognitoSub":"test-123","contentType":"image/jpeg"}'; then
        ((TESTS_PASSED++))
    fi
    
    echo ""
else
    echo -e "${YELLOW}⚠️  ALB not found - skipping Fargate tests${NC}"
    echo ""
fi

# API Gateway Tests (Lambda)
if [ -n "$API_URL" ]; then
    echo -e "${YELLOW}🌐 Testing API Gateway Endpoints:${NC}"
    
    # Login endpoint
    ((TESTS_TOTAL++))
    if test_endpoint "Lambda Login" "${API_URL}auth/login" 200 POST '{"action":"initiate_auth","phone_number":"+1234567890"}'; then
        ((TESTS_PASSED++))
    fi
    
    echo ""
else
    echo -e "${YELLOW}⚠️  API Gateway not found - skipping Lambda tests${NC}"
    echo ""
fi

# AWS Services Tests
echo -e "${YELLOW}☁️  Testing AWS Services:${NC}"

# S3 Bucket access
if [ -n "$S3_BUCKET" ]; then
    ((TESTS_TOTAL++))
    if aws s3api head-bucket --bucket "$S3_BUCKET" --region $REGION 2>/dev/null; then
        echo -e "S3 Bucket Access... ${GREEN}✅${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "S3 Bucket Access... ${RED}❌${NC}"
    fi
else
    echo -e "S3 Bucket... ${YELLOW}⚠️  Not found${NC}"
fi

# Cognito User Pool
((TESTS_TOTAL++))
USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name CarRentalAuthStack \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ -n "$USER_POOL_ID" ] && aws cognito-idp describe-user-pool --user-pool-id "$USER_POOL_ID" --region $REGION &>/dev/null; then
    echo -e "Cognito User Pool... ${GREEN}✅${NC}"
    ((TESTS_PASSED++))
else
    echo -e "Cognito User Pool... ${RED}❌${NC}"
fi

# ECS Service Status
((TESTS_TOTAL++))
ECS_STATUS=$(aws ecs describe-services \
    --cluster car-rental-cluster \
    --services car-rental-alb-service \
    --region $REGION \
    --query 'services[0].status' \
    --output text 2>/dev/null || echo "")

if [ "$ECS_STATUS" = "ACTIVE" ]; then
    echo -e "ECS Service Status... ${GREEN}✅ ACTIVE${NC}"
    ((TESTS_PASSED++))
else
    echo -e "ECS Service Status... ${RED}❌ ${ECS_STATUS:-"Not found"}${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}📊 Test Summary:${NC}"
echo "=================================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}/$TESTS_TOTAL"

if [ $TESTS_PASSED -eq $TESTS_TOTAL ]; then
    echo -e "${GREEN}🎉 All tests passed! System is healthy.${NC}"
    exit_code=0
elif [ $TESTS_PASSED -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some tests failed. Check the issues above.${NC}"
    exit_code=1
else
    echo -e "${RED}❌ All tests failed. System may not be deployed or accessible.${NC}"
    exit_code=2
fi

echo ""
echo -e "${BLUE}💡 Useful Commands:${NC}"
if [ -n "$ALB_DNS" ]; then
    echo "  Manual ALB test: curl http://$ALB_DNS/api"
fi
if [ -n "$API_URL" ]; then
    echo "  Manual API test: curl ${API_URL}auth/login"
fi
echo "  Check ECS logs: aws logs tail /ecs/car-rental-backend --follow --region $REGION"
echo "  Check stacks: aws cloudformation list-stacks --region $REGION"

exit $exit_code
