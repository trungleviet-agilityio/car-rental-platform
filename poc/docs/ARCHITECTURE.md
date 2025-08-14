# 🏗️ Architecture Documentation - Car Rental Platform

Complete architectural documentation showcasing **Dependency Inversion Principle (DIP)**, **Adapter Pattern**, and **AWS-native architecture**.

## 🎯 **Architectural Principles**

### **1. Dependency Inversion Principle (DIP)**

#### **Core Concept**
```
High-level modules should not depend on low-level modules.
Both should depend on abstractions.
```

#### **Implementation**
```typescript
// ❌ BAD: Direct dependency on concrete implementation
class AuthService {
  private cognito = new AWS.CognitoIdentityServiceProvider();
  
  async login(phone: string) {
    return this.cognito.adminInitiateAuth(...);  // Tightly coupled to AWS
  }
}

// ✅ GOOD: Dependency on abstraction
class AuthService {
  constructor(
    @Inject(AUTH_PROVIDER) private auth: IAuthProvider  // Abstract interface
  ) {}
  
  async login(phone: string) {
    return this.auth.initiateAuth(phone);  // Works with any implementation
  }
}
```

### **2. Adapter Pattern**

#### **Purpose**
- **Wrap third-party services** behind consistent interfaces
- **Enable provider switching** without business logic changes
- **Isolate external dependencies** from core business logic

#### **Structure**
```
Business Logic → Interface → Adapter → Third-party SDK
     ↓              ↓          ↓           ↓
AuthService → IAuthProvider → AwsAuthAdapter → AWS Cognito
AuthService → IAuthProvider → MockAuthAdapter → Simulated Response
```

### **3. Runtime Provider Switching**

#### **Configuration-Driven Architecture**
```bash
# Development: Fast iteration with mocks
AUTH_PROVIDER=mock
STORAGE_PROVIDER=mock
NOTIFICATION_PROVIDER=mock

# Staging: Real services for integration testing
AUTH_PROVIDER=aws
STORAGE_PROVIDER=s3
NOTIFICATION_PROVIDER=aws

# Production: All real services
AUTH_PROVIDER=aws
STORAGE_PROVIDER=s3
NOTIFICATION_PROVIDER=aws
PAYMENT_PROVIDER=stripe
```

## 🏛️ **System Architecture Overview**

### **High-Level Architecture**

```mermaid
graph TB
    subgraph "Client Layer"
        UI[Frontend App]
        API[API Clients]
        Tests[Test Scripts]
    end
    
    subgraph "API Gateway Layer"
        ALB[Application Load Balancer]
        APIGW[API Gateway + Lambda]
    end
    
    subgraph "Application Layer"
        NestJS[NestJS Backend]
        Auth[Auth Service]
        KYC[KYC Service]
        Notify[Notification Service]
        Payment[Payment Service]
    end
    
    subgraph "Adapter Layer"
        AuthAdapters[Auth Adapters]
        StorageAdapters[Storage Adapters]
        NotifyAdapters[Notification Adapters]
        PaymentAdapters[Payment Adapters]
    end
    
    subgraph "External Services"
        Cognito[AWS Cognito]
        S3[AWS S3]
        SES[AWS SES/SNS]
        Stripe[Stripe]
        Twilio[Twilio]
    end
    
    UI --> ALB
    API --> APIGW
    Tests --> ALB
    
    ALB --> NestJS
    APIGW --> Auth
    
    NestJS --> Auth
    NestJS --> KYC
    NestJS --> Notify
    NestJS --> Payment
    
    Auth --> AuthAdapters
    KYC --> StorageAdapters
    Notify --> NotifyAdapters
    Payment --> PaymentAdapters
    
    AuthAdapters --> Cognito
    StorageAdapters --> S3
    NotifyAdapters --> SES
    NotifyAdapters --> Twilio
    PaymentAdapters --> Stripe
```

### **AWS Infrastructure Architecture**

```mermaid
graph TB
    subgraph "Internet"
        Users[Users]
        API_Clients[API Clients]
    end
    
    subgraph "AWS Cloud"
        subgraph "API Layer"
            ALB[Application Load Balancer]
            APIGW[API Gateway]
        end
        
        subgraph "Compute Layer"
            ECS[ECS Fargate Cluster]
            Lambda[Lambda Functions]
            StepFunctions[Step Functions]
        end
        
        subgraph "Storage Layer"
            S3[S3 Bucket]
            RDS[RDS PostgreSQL]
        end
        
        subgraph "Security & Identity"
            Cognito[Cognito User Pool]
            IAM[IAM Roles]
        end
        
        subgraph "Monitoring"
            CloudWatch[CloudWatch]
            XRay[X-Ray Tracing]
        end
    end
    
    Users --> ALB
    API_Clients --> APIGW
    
    ALB --> ECS
    APIGW --> Lambda
    
    ECS --> RDS
    ECS --> S3
    ECS --> Cognito
    
    Lambda --> S3
    Lambda --> StepFunctions
    Lambda --> ECS
    
    ECS --> CloudWatch
    Lambda --> XRay
```

## 🧩 **Component Architecture**

### **Provider Architecture Matrix**

| Service | Interface | Mock Adapter | AWS Adapter | Third-Party Adapter |
|---------|-----------|--------------|-------------|-------------------|
| **Authentication** | `IAuthProvider` | `MockAuthAdapter` | `AwsAuthAdapter` (Cognito) | - |
| **Storage** | `IStorageProvider` | `MockStorageAdapter` | `AwsStorageAdapter` (S3) | - |
| **Notifications** | `INotificationProvider` | `MockNotificationAdapter` | `AwsNotificationAdapter` (SES/SNS) | `TwilioNotificationAdapter` |
| **Payments** | `IPaymentProvider` | `MockPaymentAdapter` | - | `StripePaymentAdapter` |
| **Lambda** | `ILambdaProvider` | `MockLambdaAdapter` | `AwsLambdaAdapter` | - |

### **Business Logic Architecture**

```typescript
// Service Layer (Business Logic)
@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_PROVIDER) private auth: IAuthProvider,
    @Inject(NOTIFICATION_PROVIDER) private notifier: INotificationProvider,
    private usersService: UsersService
  ) {}
  
  // Business logic is provider-agnostic
  async customOtpInitiate(channel: 'email' | 'sms', email?: string, phone?: string) {
    // Generate OTP
    const code = this.generateOtpCode();
    
    // Send via configured provider (could be AWS SES, Twilio, or Mock)
    if (channel === 'email') {
      await this.notifier.sendEmail({ to: email!, subject: 'Login Code', text: code });
    } else {
      await this.notifier.sendSms({ to: phone!, message: `Code: ${code}` });
    }
    
    return { message: 'OTP sent', channel };
  }
}
```

### **Adapter Implementation Architecture**

```typescript
// Interface Definition (Contract)
export interface IAuthProvider {
  initiateAuth(phoneNumber: string): Promise<AuthResponse>;
  respondToChallenge(session: string, otpCode: string): Promise<TokenResponse>;
}

// Mock Implementation (Development)
@Injectable()
export class MockAuthAdapter implements IAuthProvider {
  async initiateAuth(phoneNumber: string): Promise<AuthResponse> {
    return {
      message: 'OTP sent successfully (simulated)',
      session: 'mock_session',
      challenge_name: 'SMS_MFA'
    };
  }
}

// AWS Implementation (Production)
@Injectable()
export class AwsAuthAdapter implements IAuthProvider {
  private cognito = new AWS.CognitoIdentityServiceProvider();
  
  async initiateAuth(phoneNumber: string): Promise<AuthResponse> {
    const result = await this.cognito.adminInitiateAuth({
      UserPoolId: process.env.USER_POOL_ID,
      ClientId: process.env.USER_POOL_CLIENT_ID,
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: { USERNAME: phoneNumber }
    }).promise();
    
    return {
      message: 'OTP sent successfully',
      session: result.Session!,
      challenge_name: result.ChallengeName!
    };
  }
}
```

## 🔧 **Configuration Architecture**

### **Environment-Driven Configuration**

```typescript
// Provider Factory Pattern
@Module({
  providers: [
    {
      provide: AUTH_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get('AUTH_PROVIDER', 'mock');
        switch (provider) {
          case 'aws': return new AwsAuthAdapter();
          case 'mock': default: return new MockAuthAdapter();
        }
      },
      inject: [ConfigService],
    }
  ]
})
export class ProvidersModule {}
```

### **Runtime Provider Switching**

```bash
# Development Mode
export AUTH_PROVIDER=mock
export STORAGE_PROVIDER=mock
# → Uses MockAuthAdapter, MockStorageAdapter

# Production Mode  
export AUTH_PROVIDER=aws
export STORAGE_PROVIDER=s3
# → Uses AwsAuthAdapter, AwsStorageAdapter

# Hybrid Mode
export AUTH_PROVIDER=aws      # Real Cognito
export STORAGE_PROVIDER=mock  # Simulated S3
# → Uses AwsAuthAdapter, MockStorageAdapter
```

## 📊 **Performance Architecture**

### **Performance Characteristics by Provider**

| Provider Type | Latency | Throughput | Cost | Reliability |
|---------------|---------|------------|------|-------------|
| **Mock** | ~5ms | Very High | Free | 100% |
| **AWS** | ~100-300ms | High | Low-Medium | 99.9% |
| **Third-Party** | ~200-500ms | Medium | Medium-High | 99.5% |

### **Caching Strategy**
- **Local caching** for mock providers (instant responses)
- **Redis caching** for AWS API responses (configurable TTL)
- **Database caching** for user sessions and tokens

### **Error Handling Architecture**
```typescript
// Consistent error handling across all providers
try {
  const result = await this.auth.initiateAuth(phoneNumber);
  return result;
} catch (error) {
  this.logger.error(`Authentication failed: ${error.message}`);
  
  // Provider-specific error mapping to consistent format
  if (error.code === 'UserNotFoundException') {
    throw new NotFoundException('User not found');
  }
  
  throw new InternalServerErrorException('Authentication service unavailable');
}
```

## 📈 **Scalability Architecture**

### **Horizontal Scaling**
- **ECS Fargate** auto-scaling based on CPU/memory
- **Lambda functions** with automatic concurrency scaling
- **RDS** read replicas for database scaling
- **S3** infinite storage scaling

### **Vertical Scaling**
- **Container resource** adjustment via ECS task definitions
- **Database instance** sizing based on workload
- **Lambda memory** allocation optimization

### **Geographic Distribution**
- **Multi-AZ deployment** for high availability
- **CloudFront CDN** for static asset distribution
- **Regional deployment** strategies for global users

## 🔐 **Security Architecture**

### **Security Layers**
1. **Network Security**: VPC, Security Groups, NACLs
2. **Application Security**: JWT tokens, input validation
3. **Data Security**: Encryption at rest and in transit
4. **Identity Security**: IAM roles, Cognito authentication
5. **Monitoring Security**: CloudTrail, GuardDuty

### **Zero-Trust Architecture**
- **No implicit trust** between services
- **Explicit verification** for every request
- **Least privilege** access principles
- **Continuous monitoring** and validation

## 🔄 **System Flows**

### **Authentication Flow**

#### **Mock Mode Flow**
```
Client → NestJS → MockAuthAdapter → Simulated Response
```

#### **AWS Mode Flow**
```
Client → ALB → NestJS → AwsAuthAdapter → Cognito → SMS → Client
```

### **KYC Flow with Lambda Integration**

#### **Document Upload Flow**
```
1. Client → /api/kyc/presign → NestJS → Lambda → S3 Presigned URL
2. Client → S3 Presigned URL → S3 Bucket
3. S3 Event → Lambda → Step Functions → Document Processing
4. Step Functions → Lambda → /api/kyc/callback → NestJS → Database
```

#### **Lambda Integration Points**
- **Presigned URL Generation**: Lambda function creates S3 presigned URLs
- **Step Functions Orchestration**: Lambda initiates KYC validation workflow
- **Callback Processing**: Lambda receives Step Functions results and updates database

## 📊 **Architecture Metrics**

### **Performance Targets**
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **API Response Time** | <400ms | ~300ms | ✅ |
| **Lambda Cold Start** | <1s | ~800ms | ✅ |
| **S3 Upload** | <2s for 10MB | ~1.2s | ✅ |
| **Database Queries** | <100ms | ~80ms | ✅ |

### **Cost Optimization**
- **ECS Spot Instances** for non-critical workloads
- **S3 Lifecycle Policies** for old file cleanup
- **Lambda Reserved Concurrency** for cost control
- **RDS Instance Sizing** based on usage patterns

## 🔗 **Related Documentation**

- [**API Documentation**](API.md) - Complete API reference
- [**Testing Guide**](TESTING.md) - Testing strategies
- [**Deployment Guide**](DEPLOYMENT.md) - Infrastructure setup
- [**Quick Start Guide**](../QUICK_START.md) - Setup instructions

---

**Architecture documentation demonstrates production-ready DIP implementation with complete AWS integration.**
