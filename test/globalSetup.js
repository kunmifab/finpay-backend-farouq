const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenvPath = path.resolve(process.cwd(), '.env.test');

module.exports = async () => {
  if (fs.existsSync(dotenvPath)) {
    require('dotenv').config({ path: dotenvPath });
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set in .env.test for integration tests');
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  });
};
