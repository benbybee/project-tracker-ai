import { beforeAll, afterAll, afterEach } from 'vitest';

// Mock environment variables
beforeAll(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  process.env.NEXTAUTH_SECRET = 'test-secret';
  process.env.OPENAI_API_KEY = 'sk-test-key';
});

// Clean up after each test
afterEach(() => {
  // Reset any state if needed
});

afterAll(() => {
  // Clean up resources
});
