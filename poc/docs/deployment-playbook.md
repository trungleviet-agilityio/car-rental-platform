# Deployment Playbook (Targeted CDK/ECS Updates)

## Goals
- Avoid daily destroys; keep infra, update only what changed
- Use immutable image tags and controlled ECS rollouts
- Use targeted `cdk deploy` for specific stacks

## Day-to-day: Backend app-only change
1) Build and push with immutable tag
```bash
cd poc/backend
SHA=$(git rev-parse --short HEAD)
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGION=ap-southeast-1

docker build -t car-rental-backend:$SHA .
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT.dkr.ecr.$REGION.amazonaws.com

docker tag car-rental-backend:$SHA $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/car-rental-backend:$SHA
docker push $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/car-rental-backend:$SHA
```
2) Roll out to ECS without infra change
- Option A: update task image tag via CDK context (deploy.sh supports IMAGE_TAG):
```bash
cd poc/cdk
source .venv/bin/activate
export AWS_DEFAULT_REGION=ap-southeast-1
cd ..
IMAGE_TAG=$SHA ./scripts/deploy.sh
```
- Option B: keep image tag as `latest`, push new `latest`, then force a new ECS deployment:
```bash
aws ecs update-service \
  --cluster $(aws ecs list-clusters --region ap-southeast-1 --query 'clusterArns[0]' --output text) \
  --service car-rental-alb-service \
  --force-new-deployment \
  --region ap-southeast-1
```

## Day-to-day: Lambda/API-only change
```bash
cd poc/cdk
source .venv/bin/activate
export AWS_DEFAULT_REGION=ap-southeast-1
cdk diff CarRentalApiStack && cdk deploy CarRentalApiStack
cdk diff CarRentalAuthStack && cdk deploy CarRentalAuthStack
```

## Infra changes
- Always run `cdk diff` first, then deploy the specific stack(s)
- Use fast mode to speed PoC when appropriate (no RDS/NAT)
```bash
cd poc
./scripts/deploy.sh fast
```

## Current Fargate settings (reference)
- ALB health check path: `/api` (200–399)
- health_check_grace_period: 120s (fast) / 180s (default)
- circuit_breaker: rollback=true
- Subnets: PUBLIC in fast mode; PRIVATE_WITH_EGRESS otherwise

## Smoke tests (ALB)
```bash
ALB=$(aws elbv2 describe-load-balancers --region ap-southeast-1 --query 'LoadBalancers[?contains(LoadBalancerName, `CarRen-`)].DNSName' --output text | head -n1)
curl -sS http://$ALB/api | jq .
curl -sS -X POST http://$ALB/api/auth/login -H 'Content-Type: application/json' -d '{"action":"initiate_auth","phone_number":"+1234567890"}' | jq .
```

## Rollback
- Re-deploy previous image tag and force new deployment, or re-run CDK with prior context

## When to destroy
- Only when cleaning the sandbox or major infra refactor; otherwise keep stacks running
