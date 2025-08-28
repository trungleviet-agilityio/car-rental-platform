# ⚙️ Environment Configuration Guide

This guide covers all environment variables and configuration options for the Car Rental Platform.

## 📋 Configuration Overview

The platform uses environment variables for configuration, supporting multiple environments:
- **Development**: Local development with hot reload
- **Testing**: Automated testing environment
- **Staging**: Pre-production testing
- **Production**: Live production environment

## 🔧 Environment Files

### **File Priority**
1. `.env.local` (highest priority, local overrides)
2. `.env.development` (development specific)
3. `.env.staging` (staging specific)
4. `.env.production` (production specific)
5. `.env` (default fallback)

### **Setup Steps**
```bash
# Copy the example file
cp env.example .env

# Edit with your values
nano .env

# For Docker development
cp docker.env .env.docker
```

## 🔑 Configuration Sections

### **Application Settings**
```bash
# =================
# APPLICATION CONFIG
# =================
NODE_ENV=development          # development | staging | production
PORT=3000                     # Server port
LOG_LEVEL=info               # error | warn | info | debug
API_VERSION=v1               # API version prefix
```

### **Database Configuration**
```bash
# =================
# DATABASE CONFIG
# =================
DB_HOST=localhost            # Database host
DB_PORT=5432                # Database port
DB_USER=postgres            # Database username
DB_PASSWORD=postgres        # Database password
DB_NAME=car_rental         # Database name
DB_SSL=false               # Enable SSL for database

# Prisma connection string (auto-generated from above)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/car_rental"
```

### **Redis Configuration**
```bash
# =================
# REDIS CONFIG
# =================
REDIS_HOST=localhost        # Redis host
REDIS_PORT=6379            # Redis port
REDIS_PASSWORD=            # Redis password (optional)
REDIS_DB=0                 # Redis database number
```

### **JWT Authentication**
```bash
# =================
# JWT CONFIG
# =================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h         # Token expiration (1h, 24h, 7d, etc.)
JWT_REFRESH_EXPIRES_IN=7d  # Refresh token expiration
```

### **AWS Services**
```bash
# =================
# AWS CONFIGURATION
# =================
AWS_REGION=ap-southeast-1                    # AWS region
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE      # AWS access key
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Cognito
COGNITO_USER_POOL_ID=ap-southeast-1_XXXXXXXXX
COGNITO_CLIENT_ID=abcdefghijklmnopqrstuvwxyz

# Step Functions
ONBOARDING_STATE_MACHINE_ARN=arn:aws:states:ap-southeast-1:123456789:stateMachine:OnboardingFlow

# S3
S3_KYC_BUCKET=your-kyc-documents-bucket

# SES
SES_FROM_EMAIL=noreply@yourdomain.com
SES_FROM_NAME=Car Rental Platform
```

### **Twilio Integration**
```bash
# =================
# TWILIO CONFIG
# =================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **Service Providers**
```bash
# =================
# SERVICE PROVIDERS
# =================
NOTIFICATION_PROVIDER=mock    # mock | twilio
AUTH_PROVIDER=mock           # mock | cognito
WORKFLOW_PROVIDER=mock       # mock | step-functions
STORAGE_PROVIDER=mock        # mock | s3
```

### **Rate Limiting**
```bash
# =================
# RATE LIMITING
# =================
RATE_LIMIT_TTL=60           # Time window in seconds
RATE_LIMIT_MAX=100          # Max requests per window
RATE_LIMIT_GLOBAL_MAX=1000  # Global rate limit
```

### **Email Configuration**
```bash
# =================
# EMAIL CONFIG
# =================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🌍 Environment-Specific Configurations

### **Development Environment**
```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/car_rental_dev"

# Enable development features
ENABLE_SWAGGER=true
ENABLE_CORS=true
ENABLE_PLAYGROUND=true

# Mock all external services
NOTIFICATION_PROVIDER=mock
AUTH_PROVIDER=mock
WORKFLOW_PROVIDER=mock
```

### **Testing Environment**
```bash
# .env.test
NODE_ENV=test
LOG_LEVEL=error
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/car_rental_test"

# Test-specific settings
DISABLE_AUTH=false
MOCK_EXTERNAL_APIS=true
TEST_TIMEOUT=30000
```

### **Production Environment**
```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=warn
PORT=3000

# Security settings
JWT_SECRET=super-secure-production-secret
ENABLE_CORS=false
ENABLE_SWAGGER=false

# Real service providers
NOTIFICATION_PROVIDER=twilio
AUTH_PROVIDER=cognito
WORKFLOW_PROVIDER=step-functions
```

## 🔒 Security Considerations

### **Sensitive Variables**
These variables should never be committed to version control:
- `JWT_SECRET`
- `DATABASE_URL` (with credentials)
- `AWS_SECRET_ACCESS_KEY`
- `TWILIO_AUTH_TOKEN`
- `SMTP_PASS`

### **Environment Variable Security**
```bash
# Use strong, random secrets
JWT_SECRET=$(openssl rand -base64 64)

# Rotate secrets regularly
# Use AWS Secrets Manager in production
# Encrypt environment files
# Use least-privilege access
```

### **Docker Secrets** (Production)
```yaml
# docker-compose.prod.yml
secrets:
  jwt_secret:
    external: true
  db_password:
    external: true
```

## 🧪 Validation

The application validates all environment variables on startup:

```typescript
// Validation schema example
const envSchema = {
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').required(),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
}
```

### **Validation Errors**
```bash
# Missing required variable
Error: Environment validation failed: "JWT_SECRET" is required

# Invalid format
Error: Environment validation failed: "PORT" must be a valid port number

# Invalid value
Error: Environment validation failed: "NODE_ENV" must be one of [development, staging, production]
```

## 🔧 Configuration Loading

### **Loading Order**
1. Process environment variables
2. .env files (by priority)
3. Default values
4. Validation
5. Type conversion

### **Dynamic Configuration**
```typescript
// config/app.config.ts
export const appConfig = () => ({
  app: {
    port: parseInt(process.env.PORT, 10) || 3000,
    environment: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true',
  },
});
```

## 📊 Configuration Management

### **Best Practices**
1. **Environment Separation**: Different configs per environment
2. **Secret Management**: Use secret management services
3. **Validation**: Validate all configurations on startup
4. **Documentation**: Document all environment variables
5. **Defaults**: Provide sensible defaults where possible

### **Tools & Services**
- **Development**: dotenv, env-cmd
- **Staging/Production**: AWS Parameter Store, HashiCorp Vault
- **Kubernetes**: ConfigMaps and Secrets
- **Docker**: Environment files and secrets

## 🛠️ Troubleshooting

### **Common Issues**

1. **Database Connection Failed**
   ```bash
   # Check DATABASE_URL format
   DATABASE_URL="postgresql://user:password@host:port/database"
   
   # Verify database is running
   pg_isready -h localhost -p 5432
   ```

2. **JWT Errors**
   ```bash
   # Ensure JWT_SECRET is set and strong
   JWT_SECRET=$(openssl rand -base64 64)
   ```

3. **AWS Service Errors**
   ```bash
   # Verify AWS credentials
   aws sts get-caller-identity
   
   # Check region configuration
   AWS_REGION=ap-southeast-1
   ```

### **Debug Configuration**
```bash
# Enable debug logging
LOG_LEVEL=debug

# Print loaded configuration (development only)
DEBUG_CONFIG=true
```

## 📝 Configuration Templates

### **Complete .env Template**
```bash
# Copy from env.example and customize
cp env.example .env
```

### **Docker Environment**
```bash
# Docker-specific overrides
cp docker.env .env.docker
```

### **Kubernetes ConfigMap**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: car-rental-config
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "warn"
```

---

**⚡ Ready to configure your environment? Follow the setup guides and customize your configuration!**
