# Setup Guide (PoC)

## Prerequisites
- AWS CLI configured (`aws configure`)
- Node.js 18+, Docker
- Python 3.10+, AWS CDK CLI

## Deploy Infrastructure
```bash
cd poc
./scripts/deploy.sh
```

## Build & Push Backend Image
```bash
cd poc/backend
docker build -t car-rental-backend:latest .
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin $ACCOUNT.dkr.ecr.ap-southeast-1.amazonaws.com
docker tag car-rental-backend:latest $ACCOUNT.dkr.ecr.ap-southeast-1.amazonaws.com/car-rental-backend:latest
docker push $ACCOUNT.dkr.ecr.ap-southeast-1.amazonaws.com/car-rental-backend:latest
```

## Redeploy Fargate (if needed)
```bash
cd poc/cdk
source .venv/bin/activate
export AWS_DEFAULT_REGION=ap-southeast-1
cdk deploy CarRentalFargateStack
```

## Test Endpoints
```bash
# API Gateway (Lambda)
API=$(aws cloudformation describe-stacks --stack-name CarRentalApiStack --region ap-southeast-1 --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' --output text)
curl -X POST ${API}auth/login -H 'Content-Type: application/json' -d '{"action":"initiate_auth","phone_number":"+1234567890"}'

# ALB (Fargate)
ALB=$(aws elbv2 describe-load-balancers --region ap-southeast-1 --query 'LoadBalancers[?contains(LoadBalancerName, `CarRen-`)].DNSName' --output text | head -n1)
curl -X GET http://$ALB/api
curl -X POST http://$ALB/api/auth/login -H 'Content-Type: application/json' -d '{"action":"initiate_auth","phone_number":"+1234567890"}'
```

## Destroy Infrastructure
```bash
cd poc
./scripts/destroy.sh
# Confirm with 'yes'
```
