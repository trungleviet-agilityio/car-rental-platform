# 🚀 Deployment Playbook (Optimized for Daily Development)

## 🎯 Goals
- **Zero daily infrastructure destruction** - Keep stacks running
- **Fast iteration cycles** - 2-3 minute app deployments vs 15-20 minutes
- **Targeted deployments** - Change only what needs changing
- **Immutable deployments** - Git SHA-based image tags for rollbacks

## 📋 Daily Development Workflow

### 1. **Start Development Day** (30 seconds)
```bash
cd poc
./scripts/health-check.sh
```
**What it does:** Verifies all infrastructure is healthy and ready

### 2. **App Code Changes** (2-3 minutes) - **90% of daily work**
```bash
# After making changes to backend/src/
cd poc
./scripts/deploy-app.sh
```
**What it does:**
- Builds Docker image with git SHA tag
- Pushes to ECR
- Updates ECS task definition
- Forces new deployment
- Waits for health checks
- **No CDK infrastructure changes**

### 3. **Lambda/API Changes** (1-2 minutes)
```bash
cd poc
./scripts/deploy-stack.sh CarRentalApiStack
# or
./scripts/deploy-stack.sh CarRentalAuthStack
```

### 4. **Infrastructure Changes** (3-15 minutes)
```bash
# Check what changed first
cd poc
./scripts/diff.sh

# Deploy specific stack
./scripts/deploy-stack.sh CarRentalFargateStack
# or deploy all with fast mode
./scripts/deploy.sh fast
```

## 🔍 Change Detection & Decision Matrix

| Change Type | Files Changed | Command | Time | Risk |
|-------------|---------------|---------|------|------|
| **App code** | `backend/src/**` | `./scripts/deploy-app.sh` | 2-3 min | Low |
| **Lambda code** | `lambda/**` | `./scripts/deploy-stack.sh ApiStack` | 1-2 min | Low |
| **Environment vars** | `fargate_stack.py` | `./scripts/deploy-stack.sh FargateStack` | 3-5 min | Low |
| **New AWS resources** | `cdk/stacks/**` | `./scripts/deploy-stack.sh <StackName>` | 5-15 min | Medium |
| **VPC/Security** | `fargate_stack.py` (VPC) | `./scripts/deploy.sh fast` | 10-20 min | High |

### 🎯 Smart Change Detection
```bash
# Before any deployment, check what changed
cd poc
./scripts/diff.sh

# Shows exactly which files changed and recommends the right deployment method
```

## 🧪 Testing & Validation

### **Automated Health Checks**
```bash
# Start of day health check
./scripts/health-check.sh

# Full smoke test after changes
./scripts/smoke-test.sh
```

### **Manual Testing**
```bash
# Get current endpoints
ALB=$(aws elbv2 describe-load-balancers --region ap-southeast-1 --query 'LoadBalancers[?contains(LoadBalancerName, `CarRen-`)].DNSName' --output text | head -n1)

# Test endpoints
curl -sS http://$ALB/api
curl -sS -X POST http://$ALB/api/auth/login -H 'Content-Type: application/json' -d '{"action":"initiate_auth","phone_number":"+1234567890"}'
```

## 🔄 Rollback Strategies

### **App Rollback** (fastest)
```bash
# Find previous working image
aws ecr describe-images --repository-name car-rental-backend --region ap-southeast-1 --query 'imageDetails[*].imageTags' --output table

# Deploy previous version
./scripts/deploy-stack.sh CarRentalFargateStack --image-tag <previous-sha>
```

### **Stack Rollback**
```bash
# View stack history
aws cloudformation describe-stack-events --stack-name CarRentalFargateStack --region ap-southeast-1

# Rollback to previous template (manual via console for complex changes)
```

## 📊 Infrastructure Lifecycle

### **Daily Routine** ✅
- **Morning**: `./scripts/health-check.sh`
- **Development**: `./scripts/deploy-app.sh` for code changes
- **Evening**: Optional - check CloudWatch logs

### **Weekly Routine**
- **Monday**: Review infrastructure costs
- **Friday**: Clean up old ECR images
```bash
# Keep only last 10 images
aws ecr list-images --repository-name car-rental-backend --region ap-southeast-1
```

### **When to Destroy** ⚠️
- **Never for daily development**
- **Only for major refactoring** (VPC changes, region migration)
- **End of project/milestone** (cleanup sandbox)

## ⚡ Fast Mode Configuration
- **RDS**: Disabled (uses in-memory SQLite)
- **NAT Gateway**: Disabled (uses public subnets)
- **Health checks**: 120s grace period
- **Subnets**: PUBLIC mode with public IPs

```bash
# Enable fast mode for any deployment
./scripts/deploy.sh fast
./scripts/deploy-stack.sh CarRentalFargateStack fast
```

## 🚨 Troubleshooting

### **ECS Deployment Stuck**
```bash
# Check service status
aws ecs describe-services --cluster car-rental-cluster --services car-rental-alb-service --region ap-southeast-1

# Check task health
aws ecs describe-tasks --cluster car-rental-cluster --region ap-southeast-1 --tasks $(aws ecs list-tasks --cluster car-rental-cluster --service car-rental-alb-service --region ap-southeast-1 --query 'taskArns[0]' --output text)

# Force restart
./scripts/deploy-app.sh
```

### **CDK Stack Stuck**
```bash
# Check what's happening
./scripts/diff.sh

# Manual deletion if needed (last resort)
aws cloudformation delete-stack --stack-name CarRentalFargateStack --region ap-southeast-1
```

## 🎯 Performance Optimizations

### **Daily Deployment Time Reduction**
- **Before**: 15-20 minutes (full CDK deploy)
- **After**: 2-3 minutes (app-only deploy)
- **Savings**: 85% time reduction

### **ECR Image Management**
- Use git SHA for immutable tags
- Automatic cleanup of old images
- Layer caching for faster builds

### **ECS Optimizations**
- Circuit breaker for safe rollouts
- Health check tuning
- Rolling updates (100% min healthy)
