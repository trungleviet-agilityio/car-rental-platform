import 'reflect-metadata';

// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DB_DISABLE = 'true';
  process.env.AUTH_PROVIDER = 'mock';
  process.env.NOTIFICATION_PROVIDER = 'mock';
  process.env.STORAGE_PROVIDER = 'mock';
  process.env.PAYMENT_PROVIDER = 'mock';
  process.env.LAMBDA_PROVIDER = 'mock';
});

// Global test teardown
afterAll(() => {
  // Clean up any global resources
});
