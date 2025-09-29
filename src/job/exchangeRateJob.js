const cron = require('node-cron');
const { getChildLogger } = require('../utils/logger');
const { exchangeRateQueue } = require('./queues');
const { runExchangeRateSync } = require('./tasks/exchangeRateTask');

const log = getChildLogger({ module: 'exchange-rate-job' });

const enqueueExchangeRateSync = async (meta = {}) => {
    await exchangeRateQueue.add(
        'exchange-rate-sync',
        {
            triggeredAt: new Date().toISOString(),
            ...meta,
        },
        {
            jobId: `exchange-rate:${Date.now()}`,
        }
    );
    log.info('Exchange rate sync job enqueued');
};

const startExchangeRateJob = () => {
    cron.schedule('0 * * * *', async () => {
        try {
            await enqueueExchangeRateSync({ source: 'cron' });
        } catch (err) {
            log.error({ err }, 'Failed to enqueue exchange rate sync job');
        }
    });
    log.info('Exchange rate scheduler started. It will run every hour.');
};

module.exports = {
    startExchangeRateJob,
    enqueueExchangeRateSync,
    runExchangeRateSync,
};
