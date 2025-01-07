module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/__tests__/setup/fileMock.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^axios$': require.resolve('axios')
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './.babelrc' }]
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/__tests__/setup/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(axios)/)'
  ],
  moduleDirectories: ['node_modules', 'src'],
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.{js,jsx}'
  ],
  verbose: true
};