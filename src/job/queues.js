const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { getChildLogger } = require('../utils/logger');

try { require('dotenv').config(); } catch {}

const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

const log = getChildLogger({ module: 'queues' });

const workerCache = new Set();
const queueCache = new Map();
const dlqCache = new Map();

const defaultJobOptions = {
    attempts: Number(process.env.QUEUE_DEFAULT_ATTEMPTS || 5),
    backoff: {
        type: process.env.QUEUE_BACKOFF_TYPE || 'exponential',
        delay: Number(process.env.QUEUE_BACKOFF_DELAY || 10000),
    },
    removeOnComplete: process.env.QUEUE_REMOVE_ON_COMPLETE !== 'false',
    removeOnFail: process.env.QUEUE_REMOVE_ON_FAIL === 'true',
    timeout: Number(process.env.QUEUE_TIMEOUT || 60000),
};

const dlqEnabled = process.env.QUEUE_DLQ_ENABLED !== 'false';

const createQueue = (queueName, options = {}) => {
    if (queueCache.has(queueName)) {
        return queueCache.get(queueName);
    }

    const { defaultJobOptions: jobOptions = {}, ...restOptions } = options;

    const queue = new Queue(queueName, {
        connection,
        ...restOptions,
        defaultJobOptions: {
            ...defaultJobOptions,
            ...jobOptions,
        },
    });

    queueCache.set(queueName, queue);
    log.info({ queueName }, 'Queue initialized');
    return queue;
};

const getDeadLetterQueueName = (queueName) => `${queueName}:dlq`;

const getDeadLetterQueue = (queueName) => {
    if (!dlqEnabled) {
        return null;
    }

    if (dlqCache.has(queueName)) {
        return dlqCache.get(queueName);
    }

    const dlqName = getDeadLetterQueueName(queueName);
    const dlq = createQueue(dlqName, {
        defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: true,
            attempts: 1
        }
    });

    dlqCache.set(queueName, dlq);
    log.info({ queueName, dlqName }, 'Dead-letter queue initialized');
    return dlq;
};

const registerWorkerEvents = (worker, queueName) => {
    worker.on('active', (job) => {
        log.info({ queueName, jobId: job.id }, 'Job started');
    });

    worker.on('completed', (job, result) => {
        log.info({ queueName, jobId: job.id, returnvalue: result }, 'Job completed');
    });

    worker.on('failed', (job, err) => {
        log.error({ queueName, jobId: job?.id, err }, 'Job failed');

        if (!job || !dlqEnabled) {
            return;
        }

        const attemptsAllowed = job.opts?.attempts || defaultJobOptions.attempts;
        if (job.attemptsMade >= attemptsAllowed) {
            const dlq = getDeadLetterQueue(queueName);
            if (!dlq) {
                return;
            }
            (async () => {
                await dlq.add('failed-job', {
                    originalQueue: queueName,
                    jobId: job.id,
                    name: job.name,
                    data: job.data,
                    failedReason: err?.message || job.failedReason,
                    stacktrace: err?.stack || job.stacktrace,
                    attemptsMade: job.attemptsMade,
                    startedOn: job.processedOn,
                    finishedOn: job.finishedOn || Date.now(),
                });
                log.warn({ queueName, jobId: job.id }, 'Job moved to dead-letter queue');
            })().catch((dlqErr) => {
                log.error({ queueName, jobId: job.id, err: dlqErr }, 'Failed to write job to dead-letter queue');
            });
        }
    });

    worker.on('error', (err) => {
        log.error({ queueName, err }, 'Worker encountered an error');
    });
};

const createWorker = (queueName, processor, options = {}) => {
    const worker = new Worker(queueName, processor, {
        connection,
        ...options,
    });

    registerWorkerEvents(worker, queueName);

    workerCache.add(worker);
    log.info({ queueName }, 'Worker initialized');
    return worker;
};

const closeAllWorkers = async () => {
    log.info('Shutting down workers');
    const closePromises = [];

    workerCache.forEach((worker) => {
        closePromises.push(
            worker
                .close()
                .then(() => log.info({ queueName: worker.name }, 'Worker closed'))
                .catch((err) => {
                    log.error({ queueName: worker.name, err }, 'Error closing worker');
                })
        );
    });

    await Promise.all(closePromises);
    workerCache.clear();

    const queuePromises = [];
    queueCache.forEach((queue, queueName) => {
        queuePromises.push(
            queue
                .close()
                .then(() => log.info({ queueName }, 'Queue closed'))
                .catch((err) => log.error({ queueName, err }, 'Error closing queue'))
        );
    });

    await Promise.all(queuePromises);
    queueCache.clear();
    dlqCache.clear();

    await connection.quit();
    log.info('Redis connection closed');
};

const setupGracefulShutdown = () => {
    const signals = ['SIGINT', 'SIGTERM'];

    signals.forEach((signal) => {
        process.once(signal, async () => {
            log.info({ signal }, 'Received shutdown signal');
            try {
                await closeAllWorkers();
                process.exit(0);
            } catch (err) {
                log.error({ err }, 'Error during graceful shutdown');
                process.exit(1);
            }
        });
    });
};

const POST_SIGNUP_QUEUE = 'post-signup';
const postSignupQueue = createQueue(POST_SIGNUP_QUEUE);

const EXCHANGE_RATE_QUEUE = 'exchange-rate';
const exchangeRateQueue = createQueue(EXCHANGE_RATE_QUEUE, {
    defaultJobOptions: {
        ...(process.env.EXCHANGE_RATE_QUEUE_ATTEMPTS ? { attempts: Number(process.env.EXCHANGE_RATE_QUEUE_ATTEMPTS) } : {}),
    },
});

setupGracefulShutdown();

module.exports = {
    connection,
    createQueue,
    createWorker,
    defaultJobOptions,
    setupGracefulShutdown,
    closeAllWorkers,
    getDeadLetterQueueName,
    POST_SIGNUP_QUEUE,
    postSignupQueue,
    EXCHANGE_RATE_QUEUE,
    exchangeRateQueue,
};
