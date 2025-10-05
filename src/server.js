const { createApp } = require('./app');
const { startExchangeRateJob } = require('./job/exchangeRateJob');
const { logger } = require('./utils/logger');

const app = createApp();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  startExchangeRateJob();
}

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server is running');
});
