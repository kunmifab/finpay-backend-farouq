const base = require('./jest.config.base');

module.exports = {
  ...base,
  testMatch: ['**/__tests__/integration/**/*.test.js'],
  globalSetup: '<rootDir>/test/globalSetup.js',
};

