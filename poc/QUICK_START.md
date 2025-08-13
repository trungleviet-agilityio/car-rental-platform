# 🚀 Quick Start Guide - Optimized Deployment

## 📋 One-Time Setup (First Deploy)

### 1. Deploy Infrastructure (15-20 minutes, one time only)
```bash
cd poc
./scripts/deploy.sh fast
```

### 2. Build & Push Initial App Image
```bash
./scripts/deploy-app.sh
```

### 3. Verify Everything Works
```bash
./scripts/smoke-test.sh
```

## 🎯 Daily Development Workflow (2-3 minutes per cycle)

### 1. Start Your Day
```bash
cd poc
./scripts/health-check.sh
```

### 2. Make Code Changes
Edit files in `backend/src/` as needed.

### 3. Deploy Your Changes
```bash
./scripts/deploy-app.sh
```

### 4. Test Your Changes
```bash
./scripts/smoke-test.sh
```

**That's it! No more 15-20 minute deployments for code changes.**

## 🔧 Advanced Workflows

### For Lambda/API Changes
```bash
./scripts/deploy-stack.sh CarRentalApiStack
```

### For Infrastructure Changes  
```bash
# Check what changed first
./scripts/diff.sh

# Deploy specific stack
./scripts/deploy-stack.sh CarRentalFargateStack
```

### For Major Changes
```bash
./scripts/deploy.sh fast
```

## 🚨 Troubleshooting

### If deployment fails:
```bash
# Check what's happening
./scripts/diff.sh

# Check health
./scripts/health-check.sh

# Manual cleanup (last resort)
cd cdk
export AWS_DEFAULT_REGION=ap-southeast-1
cdk destroy CarRentalFargateStack --force
cd ..
./scripts/deploy.sh fast
```

## 📊 Time Savings

| Operation | Before | After | Savings |
|-----------|--------|-------|---------|
| Daily code deploy | 15-20 min | 2-3 min | **85%** |
| Lambda changes | 15-20 min | 1-2 min | **90%** |
| Infrastructure health check | Manual | 30 sec | **Automated** |

## 🎯 Key Benefits

✅ **No daily infrastructure destruction**
✅ **85% faster development cycles**  
✅ **Automated health checks**
✅ **Smart change detection**
✅ **Easy rollbacks with git SHA tags**
✅ **Comprehensive smoke tests**

---

**Need help?** Check the full [Deployment Playbook](docs/deployment-playbook.md) for detailed strategies.
