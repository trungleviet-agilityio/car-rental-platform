# 🚀 Getting Started - Car Rental Platform

## Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit .env with your values (see below for development values)
nano .env
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

### 4. Start Development Server
```bash
npm run start:dev
```

🎉 **Your API is now running at:** `http://localhost:3000/api/v1`
📚 **Swagger Docs available at:** `http://localhost:3000/api/docs`

---

## 🔧 Development Environment Values

For quick testing, use these values in your `.env` file:

```env
# Database (Docker PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/carrentals"

# Application
PORT=3000
NODE_ENV=development

# JWT (Development only - change in production!)
JWT_SECRET="dev-jwt-secret-key-12345"
JWT_EXPIRES_IN="24h"

# Mock Services (Set these to any value for development)
AWS_REGION="us-east-1"
COGNITO_USER_POOL_ID="us-east-1_MOCKVALUE"
COGNITO_CLIENT_ID="MOCKVALUE"
ONBOARDING_STATE_MACHINE_ARN="arn:aws:states:us-east-1:123456:stateMachine:mock"
SES_FROM_EMAIL="dev@example.com"
S3_KYC_BUCKET="dev-kyc-bucket"

TWILIO_ACCOUNT_SID="MOCK_ACCOUNT_SID"
TWILIO_AUTH_TOKEN="MOCK_AUTH_TOKEN"
TWILIO_VERIFY_SERVICE_SID="MOCK_SERVICE_SID"

# Redis (Optional for development)
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

---

## 🐳 Quick Database Setup with Docker

```bash
# Start PostgreSQL with Docker
docker run -d \
  --name carrentals-postgres \
  -e POSTGRES_DB=carrentals \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15

# Verify connection
docker logs carrentals-postgres
```

---

## 🧪 Testing the API Flow

### 1. User Signup
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup/start \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "phoneNumber": "+1234567890",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 2. Phone Verification (Development Mode)
In development, the mock service will show the verification code in the logs.
Look for: `[MOCK] Verification code generated for +1234567890: XXXX`

```bash
curl -X POST http://localhost:3000/api/v1/auth/phone/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "code": "7890"
  }'
```

### 3. Complete Profile (Use JWT from step 2)
```bash
curl -X POST http://localhost:3000/api/v1/auth/profile/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  }'
```

---

## 🔍 API Documentation

Visit `http://localhost:3000/api/docs` for interactive API documentation with:
- Complete endpoint documentation
- Request/response examples
- Try-it-out functionality
- Authentication flow examples

---

## 📁 Project Structure

```
src/
├── modules/
│   └── auth/                    # Authentication & Onboarding
│       ├── interfaces/          # Service abstractions (DIP)
│       ├── services/           # Concrete implementations
│       ├── dto/                # Data transfer objects
│       ├── guards/             # Authentication guards
│       └── strategies/         # Passport strategies
├── prisma/                     # Database layer
├── config/                     # Configuration management
└── common/                     # Shared utilities
```

---

## 🎯 Key Features Implemented

✅ **Dependency Inversion Principle (DIP)**
- Service abstractions for easy testing
- Mock services for development
- Production services for real integrations

✅ **Complete Onboarding Flow**
- User signup with Cognito integration
- Phone verification via Twilio/Mock
- Profile completion with validation
- Step Functions workflow orchestration

✅ **Production-Ready Features**
- JWT authentication
- Input validation
- Error handling
- Swagger documentation
- Audit logging
- Rate limiting ready

✅ **Developer Experience**
- TypeScript strict mode
- Auto-generated types
- Comprehensive logging
- Easy testing setup

---

## 🔄 Development vs Production

The application automatically switches service implementations based on `NODE_ENV`:

- **Development**: Uses mock services (no external dependencies)
- **Production**: Uses real services (Twilio, Cognito, Step Functions)

This is implemented through the Dependency Inversion Principle, making testing and development seamless.

---

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View database logs
docker logs carrentals-postgres

# Restart database
docker restart carrentals-postgres
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Prisma Issues
```bash
# Reset database and regenerate
npm run prisma:generate
npm run prisma:migrate
```

---

## 🚀 Next Steps

1. **KYC Module**: Document upload and verification
2. **Notifications**: Email and SMS notifications
3. **Rate Limiting**: Production rate limiting implementation
4. **Monitoring**: Health checks and metrics
5. **Testing**: Unit and integration tests

Ready to start building! 🎉
