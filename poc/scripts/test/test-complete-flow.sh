#!/bin/bash

# Complete Flow Testing Script for Car Rental Platform DIP Architecture
# Tests all 12 main scenarios from the updated Postman collection

set -e

BASE_URL="http://localhost:3000/api"
TOTAL_TESTS=0
PASSED_TESTS=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Car Rental Platform - Complete Flow Testing${NC}"
echo -e "${BLUE}Testing all scenarios from updated Postman collection${NC}"
echo "============================================="

# Function to run test and validate
run_test() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_field="$5"
    local expected_value="$6"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${YELLOW}Test $TOTAL_TESTS: $test_name${NC}"
    
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
                PASSED_TESTS=$((PASSED_TESTS + 1))
                
                # Save important values for later tests
                case "$test_name" in
                    "OTP Initiate"*)
                        DEBUG_OTP=$(echo "$response" | jq -r '.debugOtp' 2>/dev/null)
                        export DEBUG_OTP
                        echo "   📝 Saved DEBUG_OTP: $DEBUG_OTP"
                        ;;
                    "User Sync"*)
                        USER_ID=$(echo "$response" | jq -r '.id' 2>/dev/null)
                        export USER_ID
                        echo "   📝 Saved USER_ID: $USER_ID"
                        ;;
                    "KYC Presign"*)
                        DOCUMENT_KEY=$(echo "$response" | jq -r '.key' 2>/dev/null)
                        export DOCUMENT_KEY
                        echo "   📝 Saved DOCUMENT_KEY: $DOCUMENT_KEY"
                        ;;
                    "Payment Intent"*)
                        PAYMENT_INTENT_ID=$(echo "$response" | jq -r '.id' 2>/dev/null)
                        export PAYMENT_INTENT_ID
                        echo "   📝 Saved PAYMENT_INTENT_ID: $PAYMENT_INTENT_ID"
                        ;;
                esac
            else
                echo -e "${RED}❌ FAIL${NC}: $test_name (Expected: $expected_value, Got: $actual_value)"
            fi
        else
            echo -e "${GREEN}✅ PASS${NC}: $test_name (Response received)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        fi
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name (Request failed)"
    fi
    
    # Show relevant response data
    echo "   📊 Response: $(echo "$response" | jq -c . 2>/dev/null || echo "$response")"
}

# Start tests following the Postman collection order

echo -e "\n${BLUE}📊 SYSTEM HEALTH${NC}"
echo "=================="

run_test "Health Check" "GET" "/" "" "status" "ok"

echo -e "\n${BLUE}🔐 AUTHENTICATION FLOW${NC}"
echo "========================"

run_test "Register User" "POST" "/auth/register" \
    '{"username":"test@example.com","password":"StrongPass!23","phone_number":"+84123456789"}' \
    "message" "Sign up initiated (simulated). User automatically confirmed in mock mode."

run_test "OTP Initiate (Email)" "POST" "/auth/login" \
    '{"action":"otp_initiate","channel":"email","email":"test@example.com"}' \
    "message" "OTP sent"

# Use the debug OTP from previous request
run_test "OTP Verify" "POST" "/auth/login" \
    "{\"action\":\"otp_verify\",\"channel\":\"email\",\"email\":\"test@example.com\",\"otp_code\":\"$DEBUG_OTP\"}" \
    "message" "Login successful"

run_test "User Sync" "POST" "/users/sync" \
    '{"cognitoSub":"mock-cognito-sub-123","username":"test@example.com","phoneNumber":"+84123456789","email":"test@example.com"}' \
    "cognitoSub" "mock-cognito-sub-123"

echo -e "\n${BLUE}📄 KYC DOCUMENT FLOW${NC}"
echo "======================"

run_test "KYC Presign Upload URL" "POST" "/kyc/presign" \
    '{"cognitoSub":"mock-cognito-sub-123","contentType":"image/jpeg"}' \
    "method" "PUT"

# Use the document key from previous request
run_test "KYC Callback (Simulate Verification)" "POST" "/kyc/callback" \
    "{\"cognitoSub\":\"mock-cognito-sub-123\",\"key\":\"$DOCUMENT_KEY\",\"status\":\"verified\"}" \
    "kycStatus" "verified"

echo -e "\n${BLUE}📧 NOTIFICATION SERVICES${NC}"
echo "========================="

run_test "Email Notification" "POST" "/notify/email" \
    '{"to":"test@example.com","subject":"Car Rental Confirmation","text":"Your car rental booking has been confirmed. Thank you for choosing our service!"}' \
    "success" "true"

run_test "SMS Notification" "POST" "/notify/sms" \
    '{"to":"+84123456789","message":"Your car rental is confirmed! Pickup time: 2PM today. Location: 123 Main St. Enjoy your ride!"}' \
    "success" "true"

run_test "OTP Notification (Unified)" "POST" "/notify/otp" \
    '{"channel":"email","to":"test@example.com","code":"123456"}' \
    "success" "true"

echo -e "\n${BLUE}💳 PAYMENT PROCESSING${NC}"
echo "======================"

run_test "Payment Intent Creation" "POST" "/payment/intent" \
    '{"amount":5000,"currency":"usd","metadata":{"bookingId":"booking-123","carModel":"Tesla Model 3","rentalDays":"3"}}' \
    "status" "requires_payment_method"

# Use the payment intent ID from previous request
run_test "Payment Confirmation" "POST" "/payment/confirm" \
    "{\"paymentIntentId\":\"$PAYMENT_INTENT_ID\",\"paymentMethodId\":\"pm_mock_card_visa\"}" \
    "status" "succeeded"

echo -e "\n${BLUE}📊 FINAL RESULTS${NC}"
echo "================"
echo -e "Total Tests: ${YELLOW}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! The DIP architecture is working perfectly!${NC}"
    echo -e "${GREEN}✅ All 12 main scenarios from the Postman collection are validated${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the logs above.${NC}"
    exit 1
fi
