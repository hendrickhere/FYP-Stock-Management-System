module.exports = {
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
      '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__tests__/setup/fileMock.js',
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/jest.setup.js'],
    transform: {
      '^.+\\.(js|jsx)$': 'babel-jest'
    }
  };