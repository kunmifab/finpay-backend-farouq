const request = require('supertest');
const { createApp } = require('../../../src/app');

let app;

module.exports = () => {
  if (!app) {
    app = createApp();
  }
  return request(app);
};
