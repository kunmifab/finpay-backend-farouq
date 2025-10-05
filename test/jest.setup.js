process.env.NODE_ENV = 'test';

const path = require('path');
const fs = require('fs');

const dotenvPath = path.resolve(process.cwd(), '.env.test');
try {
  require('dotenv').config({ path: dotenvPath });
} catch (err) {
  // ignore missing env
}

jest.mock('ioredis', () => require('ioredis-mock'));

const STATE_FILE = path.resolve(__dirname, '.testcontainer-state.json');
if (!process.env.DATABASE_URL && fs.existsSync(STATE_FILE)) {
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  process.env.DATABASE_URL = state.connectionUri;
}

jest.setTimeout(30000);
