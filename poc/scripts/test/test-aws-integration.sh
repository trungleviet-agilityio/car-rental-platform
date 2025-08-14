#!/bin/bash

# Test AWS Provider Integration
# Tests the backend with real AWS services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api"

echo -e "${BLUE}🧪 Testing AWS Provider Integration${NC}"
echo "=========================================="

# Check if .env.aws exists
if [ ! -f "../backend/.env.aws" ]; then
    echo -e "${RED}❌ Error: .env.aws file not found${NC}"
    echo -e "${YELLOW}💡 Run the deployment script first: ../deploy.sh deploy${NC}"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Error: AWS CLI not configured${NC}"
    echo -e "${YELLOW}💡 Run: aws configure${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Load AWS environment variables
echo -e "${YELLOW}📋 Loading AWS environment configuration...${NC}"
export $(grep -v '^#' ../backend/.env.aws | xargs)

echo -e "${GREEN}✅ Environment loaded${NC}"
echo "  AUTH_PROVIDER: $AUTH_PROVIDER"
echo "  STORAGE_PROVIDER: $STORAGE_PROVIDER"
echo "  NOTIFICATION_PROVIDER: $NOTIFICATION_PROVIDER"
echo "  LAMBDA_PROVIDER: $LAMBDA_PROVIDER"
echo "  AWS_REGION: $AWS_REGION"

# Function to run test
run_test() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_field="$5"
    local expected_value="$6"
    
    echo -e "\n${YELLOW}🧪 $test_name${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s "$BASE_URL$endpoint")
    else
        response=$(curl -s -X "$method" "$BASE_URL$endpoint" \
            -H 'Content-Type: application/json' \
            -d "$data")
    fi
    
    if [ $? -eq 0 ]; then
        if [ -n "$expected_field" ] && [ -n "$expected_value" ]; then
            actual_value=$(echo "$response" | jq -r ".$expected_field" 2>/dev/null)
            if [ "$actual_value" = "$expected_value" ]; then
                echo -e "${GREEN}✅ PASS${NC}: $test_name"
                return 0
            else
                echo -e "${RED}❌ FAIL${NC}: $test_name (Expected: $expected_value, Got: $actual_value)"
                return 1
            fi
        else
            echo -e "${GREEN}✅ PASS${NC}: $test_name (Response received)"
            return 0
        fi
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name (Request failed)"
        return 1
    fi
    
    # Show relevant response data
    echo "   📊 Response: $(echo "$response" | jq -c . 2>/dev/null || echo "$response")"
}

# Start tests
echo -e "\n${BLUE}📊 Testing AWS Provider Integration${NC}"
echo "=========================================="

TOTAL_TESTS=0
PASSED_TESTS=0

# Test 1: Health check with AWS providers
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Health Check (AWS Providers)" "GET" "/" "" "providers.auth" "aws"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Test 2: AWS Auth - OTP initiation
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "AWS Auth - OTP Initiate" "POST" "/auth/login" \
    '{"action":"otp_initiate","channel":"email","email":"test@example.com"}' \
    "message" "OTP sent"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Test 3: AWS Storage - KYC presign
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "AWS Storage - KYC Presign" "POST" "/kyc/presign" \
    '{"cognitoSub":"test-user-123","contentType":"image/jpeg"}' \
    "method" "PUT"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Test 4: AWS Lambda - KYC validation
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "AWS Lambda - KYC Validation" "POST" "/kyc/validate" \
    '{"cognitoSub":"test-user-123","key":"kyc/test-user-123/document.jpg"}' \
    "status" "RUNNING"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Test 5: AWS Notifications - Email
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "AWS Notifications - Email" "POST" "/notify/email" \
    '{"to":"test@example.com","subject":"AWS Test","text":"Testing AWS SES integration"}' \
    "success" "true"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Test 6: AWS Notifications - SMS
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "AWS Notifications - SMS" "POST" "/notify/sms" \
    '{"to":"+1234567890","message":"Testing AWS SNS integration"}' \
    "success" "true"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Final results
echo -e "\n${BLUE}📊 Test Results${NC}"
echo "================"
echo -e "Total Tests: ${YELLOW}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! AWS integration is working!${NC}"
    echo -e "${GREEN}✅ The backend is successfully using real AWS services${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Check the logs above.${NC}"
    echo -e "${YELLOW}💡 Common issues:${NC}"
    echo "  - AWS credentials not configured"
    echo "  - Environment variables not set correctly"
    echo "  - AWS services not deployed"
    echo "  - Network connectivity issues"
    exit 1
fi
