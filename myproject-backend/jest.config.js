module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chai-as-promised|check-error)/)'
  ],
  setupFilesAfterEnv: ['./tests/helpers/jest.setup.js'],
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'service/**/*.js',
    'models/**/*.js',
    'errors/**/*.js',
    'config/**/*.js',
    '!**/node_modules/**'
  ]
};