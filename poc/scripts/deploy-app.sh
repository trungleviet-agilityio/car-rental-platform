#!/bin/bash

# Car Rental Platform - Fast App Deployment
# Deploy only the NestJS app, no infrastructure changes
# Uses ECS force-new-deployment for speed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="ap-southeast-1"
CLUSTER_NAME="car-rental-cluster"
SERVICE_NAME="car-rental-alb-service"

echo -e "${BLUE}🐳 Car Rental Platform - Fast App Deployment${NC}"
echo "=================================================="

# Check if we're in the right directory structure
if [ ! -f "package.json" ] && [ ! -d "../backend" ]; then
    echo -e "${RED}❌ Error: Run this from poc/backend directory or poc directory${NC}"
    exit 1
fi

# Navigate to backend directory if not already there
if [ -f "package.json" ]; then
    BACKEND_DIR="."
else
    BACKEND_DIR="backend"
    cd backend
fi

# Get git SHA for immutable tagging
SHA=$(git rev-parse --short HEAD)
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
IMAGE_URI="$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/car-rental-backend:$SHA"

echo -e "${YELLOW}📋 Build Info:${NC}"
echo "  Git SHA: $SHA"
echo "  Image URI: $IMAGE_URI"
echo "  Region: $REGION"
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Error: AWS CLI not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Build Docker image
echo -e "${YELLOW}🔨 Building Docker image...${NC}"
docker build -t car-rental-backend:$SHA . --quiet

# Login to ECR
echo -e "${YELLOW}🔐 Logging into ECR...${NC}"
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT.dkr.ecr.$REGION.amazonaws.com

# Tag and push image
echo -e "${YELLOW}📤 Pushing image to ECR...${NC}"
docker tag car-rental-backend:$SHA $IMAGE_URI
docker push $IMAGE_URI

# Update ECS service task definition with new image
echo -e "${YELLOW}🚀 Updating ECS service with new image...${NC}"

# Get current task definition
TASK_DEF_ARN=$(aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $REGION \
    --query 'services[0].taskDefinition' \
    --output text)

if [ "$TASK_DEF_ARN" == "None" ] || [ -z "$TASK_DEF_ARN" ]; then
    echo -e "${RED}❌ Error: ECS service not found. Please deploy infrastructure first.${NC}"
    exit 1
fi

# Get task definition JSON and update image
TASK_DEF_JSON=$(aws ecs describe-task-definition --task-definition $TASK_DEF_ARN --region $REGION)

# Extract and modify task definition
NEW_TASK_DEF=$(echo $TASK_DEF_JSON | jq --arg IMAGE_URI "$IMAGE_URI" '
  .taskDefinition | 
  del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy) |
  .containerDefinitions[0].image = $IMAGE_URI
')

# Register new task definition
echo -e "${YELLOW}📝 Registering new task definition...${NC}"
NEW_TASK_DEF_ARN=$(echo $NEW_TASK_DEF | aws ecs register-task-definition \
    --region $REGION \
    --cli-input-json file:///dev/stdin \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

# Update service with new task definition
echo -e "${YELLOW}🔄 Updating ECS service...${NC}"
aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --task-definition $NEW_TASK_DEF_ARN \
    --region $REGION \
    --query 'service.serviceName' \
    --output text

# Wait for deployment to complete
echo -e "${YELLOW}⏳ Waiting for deployment to stabilize...${NC}"
echo "This may take 2-3 minutes for health checks to pass..."

aws ecs wait services-stable \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $REGION

# Get ALB DNS for testing
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --region $REGION \
    --query 'LoadBalancers[?contains(LoadBalancerName, `CarRen-`)].DNSName' \
    --output text | head -n1)

echo -e "${GREEN}✅ App deployed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "  Image: $IMAGE_URI"
echo "  Task Definition: $NEW_TASK_DEF_ARN"
echo "  ALB DNS: $ALB_DNS"
echo ""
echo -e "${YELLOW}🧪 Quick Health Check:${NC}"
echo "curl -sS http://$ALB_DNS/api"
echo ""
echo -e "${YELLOW}💡 To rollback, run:${NC}"
echo "./scripts/deploy-app.sh --rollback"

# Perform quick health check
if [ -n "$ALB_DNS" ]; then
    echo -e "${YELLOW}🏥 Performing health check...${NC}"
    if curl -sS -f --max-time 10 http://$ALB_DNS/api > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check pending... (ALB may still be updating)${NC}"
        echo "Check manually: curl http://$ALB_DNS/api"
    fi
fi
