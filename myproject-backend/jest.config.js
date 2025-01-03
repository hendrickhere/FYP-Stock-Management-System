module.exports = {
    testEnvironment: 'node',
    rootDir: '.',
    testMatch: ['<rootDir>/tests/**/*.test.js'],
    setupFilesAfterEnv: ['<rootDir>/myproject-backend/tests/setup/setup.js']  
};