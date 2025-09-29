const { createWorker, EXCHANGE_RATE_QUEUE } = require('./queues');
const { runExchangeRateSync } = require('./tasks/exchangeRateTask');
const { getChildLogger } = require('../utils/logger');

const baseLogger = getChildLogger({ module: 'exchange-rate-worker' });

const worker = createWorker(
  EXCHANGE_RATE_QUEUE,
  async (job) => {
    const log = baseLogger.child({ jobId: job.id });
    log.info('Running exchange rate sync');
    await runExchangeRateSync();
    log.info('Exchange rate sync finished');
    return { success: true };
  },
  {
    concurrency: Number(process.env.EXCHANGE_RATE_WORKER_CONCURRENCY || 1),
    lockDuration: Number(process.env.EXCHANGE_RATE_WORKER_LOCK_DURATION || 60000)
  }
);

module.exports = worker;
