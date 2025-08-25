#!/bin/bash

# Car Rental Platform - Complete Postman Collection Automated Testing
# Tests all flows from CarRental-PoC-Updated.postman_collection.json
# Auto-validates responses and tracks test car/booking IDs

set -e

# Configuration
BASE_URL="http://localhost:3000/car-rental/v1"
TIMEOUT=10
TEST_DATA_FILE="/tmp/car_rental_test_data.json"

# Authentication tokens for testing
USER_TOKEN="mock-auth-token-123"
OWNER_TOKEN="mock-owner-token-456"
USER_COGNITO_SUB="mock-auth-token-123"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Initialize test data storage
echo '{"test_car_id":"","test_booking_id":"","document_key":"","payment_intent_id":"","debug_otp":""}' > $TEST_DATA_FILE

echo -e "${BLUE}🧪 Car Rental Platform - Complete Automated Testing${NC}"
echo -e "${BLUE}Testing all flows from Postman collection with auto-validation${NC}"
echo "=============================================================="
echo -e "Base URL: ${CYAN}$BASE_URL${NC}"
echo -e "Test Data: ${CYAN}$TEST_DATA_FILE${NC}"
echo ""

# Helper function to save test data
save_test_data() {
    local key="$1"
    local value="$2"
    
    if command -v jq >/dev/null 2>&1; then
        temp_file=$(mktemp)
        jq ".$key = \"$value\"" "$TEST_DATA_FILE" > "$temp_file" && mv "$temp_file" "$TEST_DATA_FILE"
    else
        echo "Warning: jq not found, test data not saved"
    fi
}

# Helper function to get test data
get_test_data() {
    local key="$1"
    
    if command -v jq >/dev/null 2>&1 && [ -f "$TEST_DATA_FILE" ]; then
        jq -r ".$key // \"\"" "$TEST_DATA_FILE"
    else
        echo ""
    fi
}

# Enhanced test function with validation and authentication
run_test() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="${5:-200}"
    local validation_field="$6"
    local expected_value="$7"
    local save_field="$8"
    local save_key="$9"
    local auth_token="${10:-}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${YELLOW}Test $TOTAL_TESTS: $test_name${NC}"
    echo -e "${CYAN}→ $method $endpoint${NC}"
    
    # Prepare curl command with authentication
    if [ "$method" = "GET" ]; then
        if [ -n "$auth_token" ]; then
            response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
                -H "Authorization: Bearer $auth_token" \
                "$BASE_URL$endpoint" 2>/dev/null || echo -e "\n000")
        else
            response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
                "$BASE_URL$endpoint" 2>/dev/null || echo -e "\n000")
        fi
    else
        if [ -n "$auth_token" ]; then
            response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
                -X "$method" "$BASE_URL$endpoint" \
                -H 'Content-Type: application/json' \
                -H "Authorization: Bearer $auth_token" \
                -d "$data" 2>/dev/null || echo -e "\n000")
        else
            response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
                -X "$method" "$BASE_URL$endpoint" \
                -H 'Content-Type: application/json' \
                -d "$data" 2>/dev/null || echo -e "\n000")
        fi
    fi
    
    # Parse response and status code
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    echo -e "${PURPLE}Status: $status_code${NC}"
    
    # Status code validation
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ HTTP Status: PASS${NC} ($status_code)"
    else
        echo -e "${RED}❌ HTTP Status: FAIL${NC} (expected $expected_status, got $status_code)"
        echo -e "${RED}Response: $response_body${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
    
    # Field validation (if specified)
    if [ -n "$validation_field" ] && [ -n "$expected_value" ] && command -v jq >/dev/null 2>&1; then
        actual_value=$(echo "$response_body" | jq -r ".$validation_field // \"null\"" 2>/dev/null)
        if [ "$actual_value" = "$expected_value" ]; then
            echo -e "${GREEN}✅ Field Validation: PASS${NC} ($validation_field = $expected_value)"
        else
            echo -e "${RED}❌ Field Validation: FAIL${NC} ($validation_field expected=$expected_value, actual=$actual_value)"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return 1
        fi
    fi
    
    # Save field for later use (if specified)
    if [ -n "$save_field" ] && [ -n "$save_key" ] && command -v jq >/dev/null 2>&1; then
        saved_value=$(echo "$response_body" | jq -r ".$save_field // \"\"" 2>/dev/null)
        if [ -n "$saved_value" ] && [ "$saved_value" != "null" ] && [ "$saved_value" != "" ]; then
            save_test_data "$save_key" "$saved_value"
            echo -e "${CYAN}💾 Saved $save_key: $saved_value${NC}"
        fi
    fi
    
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✅ OVERALL: PASS${NC}"
}

echo -e "${BLUE}🚀 Starting Automated Test Suite...${NC}"

# ============================================================================
# 1. SYSTEM HEALTH & LAMBDA STATUS
# ============================================================================
echo -e "\n${PURPLE}📊 Section 1: System Health & Lambda Status${NC}"

run_test "Health Check with Lambda Provider" \
    "GET" "/" "" "200" \
    "status" "ok"

run_test "Health Readiness Check" \
    "GET" "/health/readiness" "" "200" \
    "status" "ready"

run_test "Health Liveness Check" \
    "GET" "/health/liveness" "" "200" \
    "status" "alive"

run_test "System Info Check" \
    "GET" "/info" "" "200" \
    "name" "car-rental-backend"

run_test "Debug Endpoint Check" \
    "GET" "/debug" "" "200" \
    "message" "Debug endpoint working"

# ============================================================================
# 2. CAR MANAGEMENT (INTERNAL CATALOG)
# ============================================================================
echo -e "\n${PURPLE}🚗 Section 2: Car Management (Internal Catalog)${NC}"

run_test "Add Test Car" \
    "POST" "/cars" \
    '{
        "make": "Toyota",
        "model": "Camry",
        "seats": 5,
        "pricePerDayCents": 5000,
        "depositCents": 50000,
        "owner": {
            "email": "owner@example.com",
            "phone": "+12345678901"
        }
    }' \
    "201" \
    "" "" \
    "id" "test_car_id" \
    "$OWNER_TOKEN"

run_test "List Available Cars" \
    "GET" "/cars" "" "200" \
    "" "" \
    "" "" \
    "$USER_TOKEN"

# Get the test car ID for booking tests
TEST_CAR_ID=$(get_test_data "test_car_id")
echo -e "${CYAN}🔗 Using Test Car ID: $TEST_CAR_ID${NC}"

# ============================================================================
# 3. COMPLETE BOOKING FLOW WITH LAMBDA INTEGRATION
# ============================================================================
echo -e "\n${PURPLE}📒 Section 3: Complete Booking Flow with Lambda Integration${NC}"

if [ -n "$TEST_CAR_ID" ] && [ "$TEST_CAR_ID" != "" ]; then
            run_test "Create Booking (Triggers Lambda Owner Notification)" \
        "POST" "/bookings" \
        "{
            \"cognitoSub\": \"$USER_COGNITO_SUB\",
            \"carId\": \"$TEST_CAR_ID\",
            \"startDate\": \"2030-01-01T10:00:00Z\",
            \"endDate\": \"2030-01-02T10:00:00Z\",
            \"totalPrice\": 5000
        }" \
        "201" \
        "" "" \
        "booking.id" "test_booking_id" \
        "$USER_TOKEN"
    
    # Get the test booking ID for decision tests
    TEST_BOOKING_ID=$(get_test_data "test_booking_id")
    echo -e "${CYAN}🔗 Using Test Booking ID: $TEST_BOOKING_ID${NC}"
    
    if [ -n "$TEST_BOOKING_ID" ] && [ "$TEST_BOOKING_ID" != "" ]; then
                    run_test "Owner Decision (Accept) - Triggers Lambda Renter Notification" \
            "POST" "/bookings/decision" \
            "{
                \"bookingId\": \"$TEST_BOOKING_ID\",
                \"decision\": \"accepted\",
                \"renter\": {
                    \"email\": \"renter@example.com\",
                    \"phone\": \"+84056667777\"
                }
            }" \
            "201" \
            "" "" \
            "" "" \
            "$OWNER_TOKEN"
        
        run_test "Create Payment Intent for Accepted Booking" \
            "POST" "/bookings/$TEST_BOOKING_ID/payment/intent" \
            "" "201" \
            "" "" \
            "id" "payment_intent_id" \
            "$USER_TOKEN"
        
        # Get the payment intent ID
        PAYMENT_INTENT_ID=$(get_test_data "payment_intent_id")
        echo -e "${CYAN}🔗 Using Payment Intent ID: $PAYMENT_INTENT_ID${NC}"
        
        if [ -n "$PAYMENT_INTENT_ID" ] && [ "$PAYMENT_INTENT_ID" != "" ]; then
            run_test "Confirm Payment" \
                "POST" "/bookings/$TEST_BOOKING_ID/payment/confirm" \
                "{
                    \"paymentIntentId\": \"$PAYMENT_INTENT_ID\",
                    \"paymentMethodId\": \"pm_mock_card_visa\"
                }" \
                "201" \
                "" "" \
                "" "" \
                "$USER_TOKEN"
        fi
        
        run_test "Get User Bookings" \
            "GET" "/bookings/$USER_COGNITO_SUB" "" "200" \
            "" "" \
            "" "" \
            "$USER_TOKEN"
    fi
else
    echo -e "${RED}⚠️ Skipping booking flow tests - no car ID available${NC}"
fi

# ============================================================================
# 4. KYC FLOW WITH LAMBDA INTEGRATION
# ============================================================================
echo -e "\n${PURPLE}📄 Section 4: KYC Flow with Lambda Integration${NC}"

# First, create the user for KYC testing
run_test "Create User for KYC Testing" \
    "POST" "/users/sync" \
    '{
        "cognitoSub": "'$USER_COGNITO_SUB'",
        "username": "testuser",
        "phoneNumber": "+84123456789",
        "email": "test@example.com"
    }' \
    "201" \
    "" "" \
    "" "" \
    "$USER_TOKEN"

run_test "KYC Presign URL (via Lambda)" \
    "POST" "/kyc/presign" \
    '{
        "cognitoSub": "'$USER_COGNITO_SUB'",
        "contentType": "image/jpeg"
    }' \
    "201" \
    "" "" \
    "key" "document_key" \
    "$USER_TOKEN"

# Get the document key for validation
DOCUMENT_KEY=$(get_test_data "document_key")
echo -e "${CYAN}🔗 Using Document Key: $DOCUMENT_KEY${NC}"

if [ -n "$DOCUMENT_KEY" ] && [ "$DOCUMENT_KEY" != "" ]; then
    run_test "KYC Validate (via Step Functions + Lambda)" \
        "POST" "/kyc/validate" \
        "{
            \"cognitoSub\": \"$USER_COGNITO_SUB\",
            \"key\": \"$DOCUMENT_KEY\"
        }" \
        "200" \
        "" "" \
        "" "" \
        "$USER_TOKEN"
    
    run_test "KYC Callback (Lambda → NestJS)" \
        "POST" "/kyc/callback" \
        "{
            \"cognitoSub\": \"$USER_COGNITO_SUB\",
            \"key\": \"$DOCUMENT_KEY\",
            \"status\": \"verified\"
        }" \
        "200"
else
    echo -e "${RED}⚠️ Skipping KYC validation tests - no document key available${NC}"
fi

# ============================================================================
# 5. AUTHENTICATION FLOW (CORRECTED ENDPOINTS)
# ============================================================================
echo -e "\n${PURPLE}🔐 Section 5: Authentication Flow${NC}"

run_test "Sign Up User" \
    "POST" "/auth/signup" \
    '{
        "email": "test@example.com",
        "password": "StrongPass!23",
        "phone": "+84123456789"
    }' \
    "201"

run_test "Confirm Sign Up" \
    "POST" "/auth/signup/confirm" \
    '{
        "email": "test@example.com",
        "code": "123456"
    }' \
    "201"

run_test "OTP Initiate (Phone)" \
    "POST" "/auth/otp/initiate" \
    '{
        "phoneNumber": "+84123456789"
    }' \
    "201" \
    "" "" \
    "debugOtp" "debug_otp"

# Get the debug OTP for verification
DEBUG_OTP=$(get_test_data "debug_otp")
echo -e "${CYAN}🔗 Using Debug OTP: $DEBUG_OTP${NC}"

if [ -n "$DEBUG_OTP" ] && [ "$DEBUG_OTP" != "" ]; then
    run_test "OTP Verify" \
        "POST" "/auth/otp/verify" \
        "{
            \"phoneNumber\": \"+84123456789\",
            \"code\": \"$DEBUG_OTP\"
        }" \
        "201"
else
    run_test "OTP Verify (fallback)" \
        "POST" "/auth/otp/verify" \
        '{
            "phoneNumber": "+84123456789",
            "code": "123456"
        }' \
        "201"
fi

run_test "Sign In" \
    "POST" "/auth/signin" \
    '{
        "email": "test@example.com",
        "password": "StrongPass!23"
    }' \
    "201"

# ============================================================================
# 6. NOTIFICATION SERVICES
# ============================================================================
echo -e "\n${PURPLE}📧 Section 6: Notification Services${NC}"

run_test "Email Notification" \
    "POST" "/notify/email" \
    '{
        "to": "test@example.com",
        "subject": "Car Rental Confirmation",
        "text": "Your car rental booking has been confirmed. Thank you for choosing our service!"
    }' \
    "201" \
    "" "" \
    "" "" \
    "$USER_TOKEN"

run_test "SMS Notification" \
    "POST" "/notify/sms" \
    '{
        "to": "+84123456789",
        "message": "Your car rental is confirmed! Pickup time: 2PM today. Location: 123 Main St. Enjoy your ride!"
    }' \
    "201" \
    "" "" \
    "" "" \
    "$USER_TOKEN"

run_test "OTP Notification" \
    "POST" "/notify/otp" \
    '{
        "to": "+84123456789",
        "code": "123456"
    }' \
    "201" \
    "" "" \
    "" "" \
    "$USER_TOKEN"

# ============================================================================
# SUMMARY REPORT
# ============================================================================
echo -e "\n${BLUE}📊 TEST SUMMARY REPORT${NC}"
echo "=============================================================="
echo -e "Total Tests: ${CYAN}$TOTAL_TESTS${NC}"
echo -e "Passed Tests: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed Tests: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! System is fully functional.${NC}"
    exit_code=0
elif [ $PASSED_TESTS -gt $FAILED_TESTS ]; then
    echo -e "\n${YELLOW}⚠️ Some tests failed, but majority passed.${NC}"
    exit_code=1
else
    echo -e "\n${RED}❌ Many tests failed. System may have issues.${NC}"
    exit_code=2
fi

echo -e "\nSuccess Rate: ${CYAN}$(( PASSED_TESTS * 100 / TOTAL_TESTS ))%${NC}"

# Cleanup
if [ -f "$TEST_DATA_FILE" ]; then
    echo -e "\n${CYAN}📋 Test Data Summary:${NC}"
    if command -v jq >/dev/null 2>&1; then
        cat "$TEST_DATA_FILE" | jq .
    else
        cat "$TEST_DATA_FILE"
    fi
fi

echo -e "\n${BLUE}💡 Useful Commands:${NC}"
echo "  Re-run tests: $0"
echo "  Health check: curl $BASE_URL"
echo "  API docs: http://localhost:3000/car-rental/v1/docs"
echo "  Test data: cat $TEST_DATA_FILE"

exit $exit_code
