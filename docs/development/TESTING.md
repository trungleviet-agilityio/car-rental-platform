# 🧪 Testing Guide

Comprehensive testing guide for the Car Rental Platform, covering unit tests, integration tests, and end-to-end testing strategies.

## 📋 Testing Overview

Our testing strategy follows the **Testing Pyramid** approach:
- **Unit Tests**: Fast, isolated tests for individual components
- **Integration Tests**: API endpoints and database interactions
- **End-to-End Tests**: Complete user workflows

### **Testing Stack**
- **Framework**: Jest + Supertest
- **Database**: Test database with transactions
- **Mocking**: Mock external services (AWS, Twilio)
- **Coverage**: NYC/Istanbul for code coverage
- **CI/CD**: Automated testing in GitHub Actions

## 🏗️ Test Structure

### **Directory Structure**
```
test/
├── unit/                 # Unit tests
│   ├── services/         # Service layer tests
│   ├── controllers/      # Controller tests
│   └── entities/         # Entity tests
├── integration/          # Integration tests
│   ├── auth/             # Authentication flow tests
│   ├── api/              # API endpoint tests
│   └── database/         # Database integration tests
├── e2e/                  # End-to-end tests
│   ├── onboarding/       # Complete onboarding flow
│   └── workflows/        # Business workflow tests
├── fixtures/             # Test data and fixtures
└── utils/                # Test utilities and helpers
```

## 🚀 Quick Start

### **Run All Tests**
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode for development
npm run test:watch
```

### **Run Specific Tests**
```bash
# Run auth-related tests
npm test -- auth

# Run specific test file
npm test -- auth.service.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create user"
```

## 🔬 Unit Testing

### **Service Layer Testing**

#### **Example: AuthService Tests**
```typescript
// test/unit/services/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/modules/auth/application/services/auth.service';
import { PrismaService } from '../../../src/shared/database/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        // Mock external services
        {
          provide: 'PHONE_VERIFICATION_SERVICE',
          useValue: {
            sendVerificationCode: jest.fn(),
            verifyCode: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('signup', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const signupDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
      };

      const mockUser = {
        id: 'user-123',
        email: signupDto.email,
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
      };

      prismaService.$transaction = jest.fn().mockResolvedValue(mockUser);

      // Act
      const result = await service.signup(signupDto);

      // Assert
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('nextStep', 'PHONE_VERIFICATION');
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      const signupDto = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      prismaService.user.findUnique = jest.fn().mockResolvedValue({ id: 'existing-user' });

      // Act & Assert
      await expect(service.signup(signupDto)).rejects.toThrow('Email already exists');
    });
  });

  describe('verifyPhoneCode', () => {
    it('should verify phone code successfully', async () => {
      // Test implementation
    });

    it('should handle invalid verification code', async () => {
      // Test implementation
    });
  });
});
```

### **Entity Testing**
```typescript
// test/unit/entities/user.entity.spec.ts
import { User } from '../../../src/core/entities/user.entity';
import { UserRole, KYCStatus } from '@prisma/client';

describe('User Entity', () => {
  describe('constructor', () => {
    it('should create user entity with valid data', () => {
      // Arrange
      const userData = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.RENTER,
        kycStatus: KYCStatus.UNVERIFIED,
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Act
      const user = new User(userData);

      // Assert
      expect(user.id).toBe(userData.id);
      expect(user.email).toBe(userData.email);
      expect(user.fullName).toBe('John Doe');
      expect(user.isVerified).toBe(false);
    });
  });

  describe('fullName getter', () => {
    it('should return combined first and last name', () => {
      // Test implementation
    });
  });

  describe('canRentVehicles method', () => {
    it('should return true for verified active user', () => {
      // Test implementation
    });

    it('should return false for unverified user', () => {
      // Test implementation
    });
  });
});
```

## 🔗 Integration Testing

### **API Endpoint Testing**

#### **Example: Auth Controller Integration**
```typescript
// test/integration/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/shared/database/prisma.service';

describe('Auth Controller (Integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prismaService.user.deleteMany();
    await prismaService.phoneVerification.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/signup/start', () => {
    it('should create user successfully', async () => {
      // Arrange
      const signupData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup/start')
        .send(signupData)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('nextStep', 'PHONE_VERIFICATION');
      
      // Verify user created in database
      const user = await prismaService.user.findUnique({
        where: { email: signupData.email },
      });
      expect(user).toBeTruthy();
      expect(user.firstName).toBe(signupData.firstName);
    });

    it('should return 400 for invalid email', async () => {
      // Test implementation
    });

    it('should return 409 for duplicate email', async () => {
      // Test implementation
    });
  });

  describe('POST /api/v1/auth/phone/verify', () => {
    it('should verify phone and return access token', async () => {
      // Create user first
      const user = await prismaService.user.create({
        data: {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          cognitoSub: 'cognito-123',
          role: 'RENTER',
          kycStatus: 'UNVERIFIED',
        },
      });

      // Create verification record
      await prismaService.phoneVerification.create({
        data: {
          userId: user.id,
          phone: '+1234567890',
          verificationSid: 'VA123456',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/phone/verify')
        .send({
          phoneNumber: '+1234567890',
          code: '123456', // Mock code
        })
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.nextStep).toBe('PROFILE_COMPLETION');
    });
  });
});
```

### **Database Integration Testing**
```typescript
// test/integration/database/prisma.integration.spec.ts
describe('Database Integration', () => {
  let prismaService: PrismaService;

  beforeAll(async () => {
    // Setup test database connection
  });

  describe('User Operations', () => {
    it('should create user with all relationships', async () => {
      // Test complex database operations
    });

    it('should enforce foreign key constraints', async () => {
      // Test referential integrity
    });
  });

  describe('Geospatial Queries', () => {
    it('should find vehicles within radius', async () => {
      // Test PostGIS functionality
    });
  });
});
```

## 🌐 End-to-End Testing

### **Complete Onboarding Flow Test**
```typescript
// test/e2e/onboarding/complete-flow.e2e.spec.ts
describe('Complete Onboarding Flow (E2E)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    // Setup application
  });

  it('should complete full 4-phase onboarding', async () => {
    const userEmail = `test.${Date.now()}@example.com`;
    let accessToken: string;
    let userId: string;

    // Phase 1: User Registration
    const signupResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/signup/start')
      .send({
        email: userEmail,
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
      })
      .expect(201);

    userId = signupResponse.body.userId;
    expect(signupResponse.body.nextStep).toBe('PHONE_VERIFICATION');

    // Phase 2: Phone Verification
    const verifyResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/phone/verify')
      .send({
        phoneNumber: '+1234567890',
        code: '123456', // Mock verification code
      })
      .expect(200);

    accessToken = verifyResponse.body.accessToken;
    expect(verifyResponse.body.nextStep).toBe('PROFILE_COMPLETION');

    // Phase 3: Profile Completion
    await request(app.getHttpServer())
      .post('/api/v1/auth/profile/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        driverLicense: 'DL123456789',
        dateOfBirth: '1990-01-01',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          zipCode: '12345',
          country: 'US',
        },
      })
      .expect(200);

    // Phase 4: KYC Document Upload
    const presignedResponse = await request(app.getHttpServer())
      .post('/api/v1/kyc/presigned-url')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        documentType: 'DRIVER_LICENSE',
        fileName: 'license.jpg',
        fileSize: 1024000,
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/kyc/upload-documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        documents: [
          {
            type: 'DRIVER_LICENSE',
            frontImageUrl: 'https://s3.example.com/license_front.jpg',
            backImageUrl: 'https://s3.example.com/license_back.jpg',
          },
        ],
      })
      .expect(200);

    // Verify final state
    const statusResponse = await request(app.getHttpServer())
      .get('/api/v1/users/onboarding/progress')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(statusResponse.body.overallProgress).toBe(100);
    expect(statusResponse.body.canAccessPlatform).toBe(true);
  });
});
```

## 🎭 Mocking External Services

### **AWS Services Mock**
```typescript
// test/utils/mocks/aws.mock.ts
export const mockCognitoService = {
  createUser: jest.fn().mockResolvedValue({
    success: true,
    cognitoSub: 'cognito-123',
  }),
  updateUserAttributes: jest.fn().mockResolvedValue({
    success: true,
  }),
};

export const mockS3Service = {
  generatePresignedUrl: jest.fn().mockResolvedValue({
    uploadUrl: 'https://s3.example.com/upload',
    downloadUrl: 'https://s3.example.com/download',
  }),
};

export const mockStepFunctionsService = {
  startExecution: jest.fn().mockResolvedValue({
    executionArn: 'arn:aws:states:us-east-1:123456:execution:mock',
  }),
};
```

### **Twilio Service Mock**
```typescript
// test/utils/mocks/twilio.mock.ts
export const mockTwilioService = {
  sendVerificationCode: jest.fn().mockResolvedValue({
    success: true,
    verificationSid: 'VA123456',
  }),
  verifyCode: jest.fn().mockResolvedValue({
    success: true,
    status: 'approved',
  }),
};
```

## 📊 Test Data Management

### **Test Fixtures**
```typescript
// test/fixtures/user.fixture.ts
export const createUserFixture = (overrides = {}) => ({
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  password: 'SecurePass123!',
  phoneNumber: '+1234567890',
  ...overrides,
});

export const createVehicleFixture = (overrides = {}) => ({
  make: 'Toyota',
  model: 'Camry',
  year: 2023,
  licensePlate: 'ABC123',
  seats: 5,
  dailyPriceCents: 5000,
  ...overrides,
});
```

### **Database Seeding for Tests**
```typescript
// test/utils/database.setup.ts
export class TestDatabaseSetup {
  constructor(private prismaService: PrismaService) {}

  async seedTestData() {
    // Create test users
    const testUser = await this.prismaService.user.create({
      data: createUserFixture(),
    });

    // Create test vehicles
    const testVehicle = await this.prismaService.vehicle.create({
      data: createVehicleFixture({ ownerId: testUser.id }),
    });

    return { testUser, testVehicle };
  }

  async cleanDatabase() {
    // Clean in correct order due to foreign keys
    await this.prismaService.phoneVerification.deleteMany();
    await this.prismaService.booking.deleteMany();
    await this.prismaService.vehicle.deleteMany();
    await this.prismaService.user.deleteMany();
  }
}
```

## 🔧 Test Configuration

### **Jest Configuration**
```javascript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
    '!src/main.ts',
  ],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### **Test Environment Setup**
```typescript
// test/setup.ts
import { PrismaService } from '../src/shared/database/prisma.service';

let prismaService: PrismaService;

beforeAll(async () => {
  // Setup test database
  prismaService = new PrismaService();
  await prismaService.$connect();
});

beforeEach(async () => {
  // Start transaction for test isolation
  await prismaService.$transaction(async (tx) => {
    // Each test runs in isolation
  });
});

afterAll(async () => {
  await prismaService.$disconnect();
});
```

## 📈 Coverage Reports

### **Coverage Configuration**
```json
{
  "nyc": {
    "extends": "@istanbuljs/nyc-config-typescript",
    "exclude": [
      "**/*.spec.ts",
      "**/*.e2e-spec.ts",
      "dist/**/*",
      "coverage/**/*"
    ],
    "reporter": ["html", "lcov", "text", "json"],
    "report-dir": "coverage"
  }
}
```

### **Coverage Thresholds**
```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## 🚀 Running Tests in CI/CD

### **GitHub Actions Example**
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:15-3.3
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 🛠️ Best Practices

### **Testing Guidelines**
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Test Independence**: Each test should be isolated
3. **Descriptive Names**: Use clear, descriptive test names
4. **Mock External Services**: Don't test external dependencies
5. **Test Edge Cases**: Include boundary conditions and error cases

### **Performance Testing**
```typescript
describe('Performance Tests', () => {
  it('should handle 100 concurrent signups', async () => {
    const promises = Array.from({ length: 100 }, (_, i) =>
      request(app.getHttpServer())
        .post('/api/v1/auth/signup/start')
        .send(createUserFixture({ email: `user${i}@example.com` }))
    );

    const responses = await Promise.all(promises);
    
    expect(responses.every(r => r.status === 201)).toBe(true);
  });
});
```

---

**🧪 Testing setup complete! Ready for comprehensive test coverage and quality assurance.**
