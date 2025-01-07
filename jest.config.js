module.exports = {
    projects: [
      {
        displayName: 'frontend',
        testEnvironment: 'jsdom',
        testMatch: ['<rootDir>/frontend/src/**/*.test.{js,jsx}'],
        moduleNameMapper: {
          '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
          '^@/(.*)$': '<rootDir>/frontend/src/$1'
        },
        setupFilesAfterEnv: ['<rootDir>/frontend/src/__tests__/setup/jest.setup.js'],
        transform: {
          '^.+\\.(js|jsx)$': 'babel-jest'
        }
      },
      {
        displayName: 'backend',
        testEnvironment: 'node',
        testMatch: ['<rootDir>/backend/tests/**/*.test.js'],
        setupFilesAfterEnv: ['<rootDir>/myproject-backend/tests/setup/jest.setup.js']
      }
    ]
  };