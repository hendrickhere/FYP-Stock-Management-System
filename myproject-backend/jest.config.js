module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    setupFilesAfterEnv: ['./tests/setup/jest.setup.js'],
    transform: {
        '^.+\\.js$': ['babel-jest', { configFile: './babel.config.js' }]
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(chai|sinon).*)'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    },
    testTimeout: 10000
};