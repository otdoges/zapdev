// Jest setup file
import { jest } from '@jest/globals';

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Set up required environment variables for tests
process.env.POLAR_ACCESS_TOKEN = "test_token_" + Math.random();
process.env.POLAR_ORGANIZATION_ID = "test_org_" + Math.random();
process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_PRO = "test_product_" + Math.random();
process.env.POLAR_WEBHOOK_SECRET = "test_secret_" + Math.random();