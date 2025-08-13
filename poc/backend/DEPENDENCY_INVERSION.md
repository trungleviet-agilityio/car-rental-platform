# Dependency Inversion Principle (DIP) Implementation
## Car Rental Platform - NestJS Backend

This document explains how we implement the Dependency Inversion Principle to abstract third-party services, allowing easy switching between mock and real implementations.

## 🎯 Overview

Following SOLID principles, specifically **Dependency Inversion Principle (DIP)**:
- **High-level modules** (business logic) depend on **abstractions** (interfaces)
- **Low-level modules** (third-party SDKs) implement those abstractions
- Both depend on abstractions, not concretions

## 🏗️ Architecture

```
Business Logic (Controllers/Services)
         ↓ depends on
    Interfaces (Ports)
         ↑ implemented by
  Adapters (Mock/Real providers)
         ↓ may use
   Third-party SDKs (AWS, Stripe, etc.)
```

## 📁 Project Structure

```
src/
├── modules/
│   ├── auth/                    # Business logic
│   ├── kyc/                     # Business logic
│   ├── notify/                  # Business logic
│   └── providers/               # DI Configuration
│       └── providers.module.ts  # Provider Factory
├── services/
│   ├── ports/                   # Interfaces (Abstractions)
│   │   ├── auth.interface.ts
│   │   ├── storage.interface.ts
│   │   ├── kyc.interface.ts
│   │   ├── notification.interface.ts
│   │   └── tokens.ts            # DI Tokens
│   ├── mocks/                   # Mock Implementations
│   │   ├── mock-auth.provider.ts
│   │   ├── mock-storage.provider.ts
│   │   ├── mock-kyc.provider.ts
│   │   └── mock-notification.provider.ts
│   └── aws/                     # Real AWS Implementations
│       └── adapters/
│           ├── aws-auth.adapter.ts
│           ├── aws-storage.adapter.ts
│           └── aws-kyc.adapter.ts
```

## 🔧 Current Implementations

### 1. Authentication Service (`IAuthProvider`)

**Interface**: `src/services/ports/auth.interface.ts`
```typescript
export interface IAuthProvider {
  initiateAuth(phoneNumber: string): Promise<AuthResponse>;
  respondToChallenge(session: string, otpCode: string, phoneNumber?: string): Promise<TokenResponse>;
  passwordAuth(username: string, password: string): Promise<TokenResponse>;
}
```

**Implementations**:
- **Mock**: `MockAuthProvider` - Returns simulated responses
- **Real**: `AwsAuthAdapter` - Wraps AWS Cognito SDK

### 2. Storage Service (`IStorageProvider`)

**Interface**: `src/services/ports/storage.interface.ts`
```typescript
export interface IStorageProvider {
  createPresignedPutUrl(bucket: string, key: string, contentType?: string, expiresSeconds?: number): Promise<PresignedUrlResponse>;
}
```

**Implementations**:
- **Mock**: `MockStorageProvider` - Returns mock URLs
- **Real**: `AwsStorageAdapter` - Wraps AWS S3 SDK

### 3. KYC Workflow Service (`IKycWorkflow`)

**Interface**: `src/services/ports/kyc.interface.ts`
```typescript
export interface IKycWorkflow {
  startKycValidation(stateMachineArn: string, input: KycInput): Promise<ExecutionResponse>;
}
```

**Implementations**:
- **Mock**: `MockKycProvider` - Returns mock execution ARN
- **Real**: `AwsKycAdapter` - Wraps AWS Step Functions SDK

### 4. Notification Service (`INotificationProvider`)

**Interface**: `src/services/ports/notification.interface.ts`
```typescript
export interface INotificationProvider {
  sendEmail(params: EmailParams): Promise<MessageResponse>;
  sendSms(params: SmsParams): Promise<MessageResponse>;
}
```

**Implementations**:
- **Mock**: `MockNotificationProvider` - Returns mock message IDs
- **Real**: `AwsService` methods - Uses AWS SES/SNS

## ⚙️ Configuration

### Environment-Based Provider Selection

The `ProvidersModule` uses factory functions to select implementations:

```typescript
// src/modules/providers/providers.module.ts
{
  provide: AUTH_PROVIDER,
  inject: [ConfigService, AwsService],
  useFactory: (cfg: ConfigService, aws: AwsService) =>
    cfg.get('PROVIDER_MODE', 'mock') === 'aws' 
      ? new AwsAuthAdapter(aws) 
      : new MockAuthProvider(),
}
```

### Environment Variables

| Variable | Values | Purpose |
|----------|--------|---------|
| `PROVIDER_MODE` | `mock` \| `aws` | Core DIP switch - determines which implementations to inject |
| `USER_POOL_ID` | AWS Cognito Pool ID | Required when `PROVIDER_MODE=aws` |
| `USER_POOL_CLIENT_ID` | AWS Cognito Client ID | Required when `PROVIDER_MODE=aws` |
| `S3_BUCKET_NAME` | S3 Bucket Name | Required when `PROVIDER_MODE=aws` |
| `KYC_SFN_ARN` | Step Functions ARN | Required when `PROVIDER_MODE=aws` |

## 🚀 Usage Examples

### Business Logic (Always the same)

```typescript
// src/modules/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(@Inject(AUTH_PROVIDER) private readonly auth: IAuthProvider) {}

  async login(phone: string) {
    // Business logic doesn't know if it's mock or real!
    return this.auth.initiateAuth(phone);
  }
}
```

### Switching Providers

#### Development/Testing (Mock Mode)
```bash
export PROVIDER_MODE=mock
npm run start:dev
# Uses MockAuthProvider, MockStorageProvider, etc.
```

#### Production (Real AWS Mode)
```bash
export PROVIDER_MODE=aws
export USER_POOL_ID=ap-southeast-1_xxxxxxx
export USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxx
export S3_BUCKET_NAME=car-rental-storage
npm run start:prod
# Uses AwsAuthAdapter, AwsStorageAdapter, etc.
```

## 🧪 Testing Benefits

### Unit Tests
```typescript
describe('AuthService', () => {
  beforeEach(() => {
    const mockAuth: IAuthProvider = {
      initiateAuth: jest.fn().mockResolvedValue({ session: 'test' }),
      // ... other methods
    };
    
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AUTH_PROVIDER, useValue: mockAuth }
      ]
    }).compile();
  });
  
  // Tests are isolated from AWS dependencies
});
```

### Integration Tests
```typescript
// Set PROVIDER_MODE=mock for fast, reliable tests
process.env.PROVIDER_MODE = 'mock';
// All external services are mocked automatically
```

## 🔮 Future Extensions

### Adding New Providers

To add a new payment service following DIP:

1. **Define Interface**:
```typescript
// src/services/ports/payment.interface.ts
export interface IPaymentProvider {
  createPaymentIntent(amount: number, currency: string): Promise<PaymentIntent>;
  confirmPayment(paymentId: string): Promise<PaymentResult>;
}
```

2. **Create Mock Implementation**:
```typescript
// src/services/mocks/mock-payment.provider.ts
export class MockPaymentProvider implements IPaymentProvider {
  async createPaymentIntent(amount: number, currency: string) {
    return { id: 'mock_payment_intent', amount, currency };
  }
  
  async confirmPayment(paymentId: string) {
    return { status: 'succeeded', paymentId };
  }
}
```

3. **Create Real Implementation**:
```typescript
// src/services/adapters/stripe-payment.adapter.ts
export class StripePaymentAdapter implements IPaymentProvider {
  constructor(private stripe: Stripe) {}
  
  async createPaymentIntent(amount: number, currency: string) {
    const intent = await this.stripe.paymentIntents.create({ amount, currency });
    return { id: intent.id, amount, currency };
  }
  
  // ... implement other methods
}
```

4. **Configure in ProvidersModule**:
```typescript
{
  provide: PAYMENT_PROVIDER,
  inject: [ConfigService],
  useFactory: (cfg: ConfigService) =>
    cfg.get('PAYMENT_PROVIDER', 'mock') === 'stripe' 
      ? new StripePaymentAdapter(new Stripe(cfg.get('STRIPE_SECRET_KEY')))
      : new MockPaymentProvider(),
}
```

### Planned Services

- **Payment**: Stripe, PayPal adapters
- **Insurance**: Liberty, AXA adapters  
- **GPS/Mapping**: Google Maps, Mapbox adapters
- **Push Notifications**: Firebase, OneSignal adapters

## ✅ Benefits Achieved

### 🏃 **Fast Development**
- Start with mocks immediately
- No external service setup required
- Instant feedback loops

### 🔄 **Easy Provider Switching**
- Change one environment variable
- Zero code changes required
- A/B test different providers

### 🧪 **Reliable Testing**
- No external dependencies in tests
- Consistent, fast test execution
- Easy edge case simulation

### 🔧 **Maintainable Code**
- Clear separation of concerns
- Business logic independent of vendors
- Easy to extend with new providers

### 💰 **Cost Effective**
- Develop with free mocks
- Pay for real services only in production
- Optimize provider costs by switching

## 🔍 Verification Commands

```bash
# Test mock mode
curl -X POST http://localhost:3000/api/auth/login \
-H 'Content-Type: application/json' \
-d '{"action":"otp_initiate","channel":"email","email":"test@example.com"}'

# Check current provider mode
curl -X GET http://localhost:3000/api/health
# Returns current PROVIDER_MODE in response

# Test notification endpoints
curl -X POST http://localhost:3000/api/notify/email \
-H 'Content-Type: application/json' \
-d '{"to":"test@example.com","subject":"Test","text":"Hello"}'
```

This implementation fully supports the **Dependency Inversion Principle**, making our Car Rental Platform flexible, testable, and vendor-agnostic.
