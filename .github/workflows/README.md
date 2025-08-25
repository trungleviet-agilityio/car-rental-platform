# 🚗 Car Rental Platform - CI/CD Workflows

This directory contains GitHub Actions workflows for the Car Rental Platform POC.

## 📁 Available Workflows

### 1. **poc-simple.yml** ⭐ (Recommended for POC)
**Main POC development workflow** - Simplified and optimized for POC development cycle.

**Triggers:**
- ✅ Push to `poc` branch → Auto-deploy to dev environment
- ✅ Pull requests to `poc` → Build and test only
- ✅ Manual dispatch → Choose deployment type

**Features:**
- Fast build and deploy cycle (2-3 minutes for app changes)
- Smart deployment detection (infrastructure vs app changes)
- Basic smoke tests
- Clear summary reports

### 2. **ci-cd-enhanced.yml** 🔧 (Advanced)
**Full-featured enterprise workflow** - Comprehensive security and testing for production readiness.

**Features:**
- Security scanning (SAST, DAST, container scanning)
- Comprehensive testing (unit, integration, performance)
- Multiple environments (dev, staging)
- Advanced monitoring and alerting
- Infrastructure validation

**Use when:** Moving to production or need comprehensive security scanning.

## 🚀 POC Development Workflow

### Daily Development Cycle

1. **Feature Development**
   ```bash
   # Create feature branch from poc
   git checkout poc
   git pull origin poc
   git checkout -b feature/new-feature
   
   # Make changes
   # ... code changes ...
   
   # Push feature branch
   git push origin feature/new-feature
   ```
   
   **Result:** ✅ Build & test only (no deployment)

2. **Merge to POC**
   ```bash
   # Create PR to poc branch
   # After review and approval, merge to poc
   ```
   
   **Result:** 🚀 Auto-deploy to dev environment

3. **Manual Deployment**
   - Go to Actions tab in GitHub
   - Select "Car Rental POC - Simple Workflow"
   - Click "Run workflow"
   - Choose deployment type:
     - `smart`: Auto-detect changes (recommended)
     - `full`: Deploy all infrastructure
     - `app-only`: Deploy only application code

## 🎯 Branch Strategy for POC

```
poc (main POC branch)
├── feature/auth-improvements
├── feature/kyc-enhancements  
├── bugfix/api-timeout
└── hotfix/security-patch
```

### Branch Rules:
- **`poc`**: Auto-deploys to dev environment
- **`feature/*`**: Build & test only
- **`feat/*`**: Build & test only  
- **`bugfix/*`**: Build & test only
- **`hotfix/*`**: Build & test only

### Force Deploy Feature Branches:
If you need to deploy a feature branch for testing:
1. Go to Actions → "Car Rental POC - Enhanced CI/CD"
2. Click "Run workflow"
3. Enable "Force deployment even for feature branches"

## 🔧 Configuration

### Required GitHub Secrets:
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_ACCOUNT_ID=123456789012
SLACK_WEBHOOK_URL=https://hooks.slack.com/... (optional)
```

### Optional Secrets for Advanced Features:
```bash
STAGING_CERT_ARN=arn:aws:acm:... (for SSL)
STAGING_DOMAIN_NAME=staging-api.example.com
PROD_CERT_ARN=arn:aws:acm:...
PROD_DOMAIN_NAME=api.example.com
```

## 📊 Deployment Times

| Change Type | Simple Workflow | Enhanced Workflow |
|-------------|----------------|-------------------|
| App code only | ~3 minutes | ~5 minutes |
| Infrastructure | ~8 minutes | ~15 minutes |
| Full deploy | ~10 minutes | ~20 minutes |

## 🧪 Testing the Deployment

After successful deployment, test your changes:

```bash
# Get the application URL from workflow summary
# Then test:

# Health check
curl https://your-app-url/api

# Auth endpoint
curl -X POST https://your-app-url/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"action":"initiate_auth","phone_number":"+1234567890"}'

# KYC endpoint
curl -X POST https://your-app-url/api/kyc/presign \
  -H 'Content-Type: application/json' \
  -d '{"cognitoSub":"test-user","contentType":"image/jpeg"}'
```

## 🚨 Troubleshooting

### Common Issues:

1. **Deployment Fails**
   - Check AWS credentials are correct
   - Verify ECR repository exists
   - Check CDK bootstrap status

2. **Health Check Fails**
   - Wait 2-3 minutes for ECS tasks to stabilize
   - Check ECS service logs in AWS console
   - Verify security group settings

3. **Docker Build Fails**
   - Check `poc/backend/package.json` for correct scripts
   - Verify Dockerfile syntax
   - Check for missing dependencies

### Getting Help:

1. **Check Workflow Logs**: Click on failed step in GitHub Actions
2. **AWS Console**: Check ECS, CloudFormation, ECR for detailed errors
3. **Local Testing**: Run `poc/scripts/test/smoke-test.sh` locally

## 🔄 Migration to Production Workflow

When ready to move beyond POC:

1. Create `main` and `develop` branches
2. Update workflow triggers in `ci-cd-enhanced.yml`
3. Configure production environments
4. Set up proper DNS and SSL certificates
5. Enable all security features

---

**Need help?** Check the workflow run summaries for detailed information and testing commands.
