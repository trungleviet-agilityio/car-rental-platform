# Testing with Postman

## Import Collection
1. Open Postman.
2. Import file: `poc/postman/CarRental-PoC.postman_collection.json`.

## Set Variables
Create a Postman environment (or use collection variables) with:
- `api_gateway_base`: e.g., `https://84qkccpqzf.execute-api.ap-southeast-1.amazonaws.com/prod`
- `alb_base`: e.g., `http://CarRen-CarRe-zaalzSGsst3V-564137089.ap-southeast-1.elb.amazonaws.com`

## Requests
- API Gateway - Initiate Login
- API Gateway - Respond OTP
- ALB - Health
- ALB - Initiate Login
- ALB - Respond OTP
- ALB - Users Sync (with email)
- ALB - KYC Presign (returns pre-signed PUT URL if `S3_BUCKET_NAME` configured on Fargate)
- ALB - KYC Validate (start Step Functions)
- ALB - KYC Callback (simulate)

## Tips
- For KYC upload: use the returned `uploadUrl` in a new Postman request:
  - Method: PUT
  - URL: `uploadUrl` value
  - Headers: `Content-Type` should match you requested (e.g., `image/jpeg`)
  - Body: binary → select a small image file
- Expected 200/204 from S3 on success.

## Bodies
- Sign up/confirm via AWS CLI (creates Cognito user and triggers sync on confirm)
```
REGION=ap-southeast-1
POOL_ID=ap-southeast-1_yxpT8GqB7
CLIENT_ID=4laht6e08tmov66rpsfoo7t5sg
PHONE="+84xxxxxxxxx"

aws cognito-idp admin-create-user \
  --region $REGION \
  --user-pool-id $POOL_ID \
  --username $PHONE \
  --user-attributes Name=phone_number,Value=$PHONE Name=phone_number_verified,Value=true

aws cognito-idp admin-set-user-password \
  --region $REGION \
  --user-pool-id $POOL_ID \
  --username $PHONE \
  --password 'dummy_password' \
  --permanent
```

- Users Sync
```
{ "cognitoSub": "uuid", "username": "name", "phoneNumber": "+123", "email": "user@example.com" }
```

- KYC Presign
```
{ "cognitoSub": "uuid", "contentType": "image/jpeg" }
```

- KYC Validate
```
{ "cognitoSub": "uuid", "key": "kyc/...jpg" }
```

- KYC Callback (simulate)
```
{ "cognitoSub": "uuid", "key": "kyc/...jpg", "status": "verified" }
```

## Environment variables to set in Postman
- `api_gateway_base`: `https://10cfmotrh3.execute-api.ap-southeast-1.amazonaws.com/prod`
- `alb_base`: `http://CarRen-CarRe-Td7VZnrzQil5-127104625.ap-southeast-1.elb.amazonaws.com`

## Expected results
- All requests return 200/201
- First API GW initiate may take up to ~2s (cold start), others <400ms on average
