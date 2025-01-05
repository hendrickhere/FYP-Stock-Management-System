import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.location
delete window.location;
window.location = {
  href: '',
  pathname: '',
};

// Mock console methods to prevent noise in test output
global.console = {
  ...console,
  // Uncomment to debug tests
  // log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};