// Jest setup file
import '@testing-library/jest-dom';

// Mock next-auth
jest.mock('next-auth', () => ({
    auth: jest.fn(() => Promise.resolve({ user: null })),
}));

// Mock environment variables for testing
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Silence console during tests (optional - uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Increase timeout for async tests
jest.setTimeout(30000);
