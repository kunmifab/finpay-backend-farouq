const base = require('./jest.config.base');

module.exports = {
  ...base,
  testMatch: ['**/__tests__/unit/**/*.test.js'],
};
