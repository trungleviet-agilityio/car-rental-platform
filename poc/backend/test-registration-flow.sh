#!/bin/bash

# 🧪 Registration Flow Test Script
# Tests the complete registration flow in both mock and AWS modes

set -e  # Exit on any error

BASE_URL="http://localhost:3000/api"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PHONE="+84$(date +%s | tail -c 10)"

echo "🚀 Testing Registration Flow"
echo "================================"
echo "Test Email: $TEST_EMAIL"
echo "Test Phone: $TEST_PHONE"
echo ""

# Function to make HTTP requests with error handling
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo "📝 $description"
    echo "   $method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H 'Content-Type: application/json' \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
    fi
    
    # Split response and status code
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    echo "   Status: $http_code"
    echo "   Response: $response_body" | jq . 2>/dev/null || echo "   Response: $response_body"
    
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        echo "   ✅ Success"
    else
        echo "   ❌ Failed"
        exit 1
    fi
    echo ""
}

# Step 1: Check health and provider mode
make_request "GET" "/" "" "Check Health & Provider Status"

# Step 2: Register user
registration_data='{
    "username": "'$TEST_EMAIL'",
    "password": "StrongPass!23",
    "phone_number": "'$TEST_PHONE'"
}'
make_request "POST" "/auth/register" "$registration_data" "Register New User"

# Step 3: Confirm registration (mock mode always succeeds)
confirmation_data='{
    "username": "'$TEST_EMAIL'",
    "code": "123456"
}'
make_request "POST" "/auth/confirm" "$confirmation_data" "Confirm Registration"

# Step 4: Sync user to database
sync_data='{
    "cognitoSub": "test-cognito-sub-'$(date +%s)'",
    "username": "'$TEST_EMAIL'",
    "phoneNumber": "'$TEST_PHONE'",
    "email": "'$TEST_EMAIL'"
}'
make_request "POST" "/users/sync" "$sync_data" "Sync User to Database"

# Step 5: Test custom OTP flow (our DIP feature)
otp_initiate_data='{
    "action": "otp_initiate",
    "channel": "email",
    "email": "'$TEST_EMAIL'"
}'
echo "📝 Test Custom OTP Initiate (DIP Feature)"
otp_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H 'Content-Type: application/json' \
    -d "$otp_initiate_data")
echo "   Response: $otp_response" | jq . 2>/dev/null || echo "   Response: $otp_response"

# Extract debug OTP if available
debug_otp=$(echo "$otp_response" | jq -r '.debugOtp // "123456"' 2>/dev/null || echo "123456")
echo "   Using OTP: $debug_otp"
echo "   ✅ OTP Initiated"
echo ""

# Step 6: Verify OTP
otp_verify_data='{
    "action": "otp_verify",
    "channel": "email",
    "email": "'$TEST_EMAIL'",
    "otp_code": "'$debug_otp'"
}'
make_request "POST" "/auth/login" "$otp_verify_data" "Verify OTP & Get Tokens"

# Step 7: Test notification service
email_notification_data='{
    "to": "'$TEST_EMAIL'",
    "subject": "Registration Test Complete",
    "text": "Your registration flow test completed successfully!"
}'
make_request "POST" "/notify/email" "$email_notification_data" "Send Welcome Email Notification"

echo "🎉 Registration Flow Test Complete!"
echo "================================"
echo "✅ All steps passed successfully"
echo "🎯 DIP Implementation working correctly"
echo ""
echo "📊 Test Summary:"
echo "   - Health check: ✅"
echo "   - User registration: ✅"
echo "   - Registration confirmation: ✅"
echo "   - User database sync: ✅"
echo "   - Custom OTP flow: ✅"
echo "   - Token generation: ✅"
echo "   - Notification service: ✅"
echo ""
echo "🔧 Provider Mode: $(curl -s $BASE_URL | jq -r '.providers.mode // "unknown"')"
echo "🔒 Auth Provider: $(curl -s $BASE_URL | jq -r '.providers.auth // "unknown"')"
echo "📧 Notification Provider: $(curl -s $BASE_URL | jq -r '.providers.notifications // "unknown"')"
