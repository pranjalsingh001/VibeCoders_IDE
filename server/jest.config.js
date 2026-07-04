module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/Test/**/*.test.js',
    '<rootDir>/Test/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    'routes/**/*.js',
    '!**/node_modules/**'
  ],
  setupFilesAfterEnv: [],
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
