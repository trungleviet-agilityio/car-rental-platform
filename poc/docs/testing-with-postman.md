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
- ALB - KYC Presign (returns pre-signed PUT URL if `S3_BUCKET_NAME` configured on Fargate)

## Tips
- For KYC upload: use the returned `uploadUrl` in a new Postman request:
  - Method: PUT
  - URL: `uploadUrl` value
  - Headers: `Content-Type` should match you requested (e.g., `image/jpeg`)
  - Body: binary → select a small image file
- Expected 200/204 from S3 on success.
