const { Queue } = require('bullmq');
const IORedis = require('ioredis');
try { require('dotenv').config(); } catch {}

const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

const POST_SIGNUP_QUEUE = 'post-signup';

const postSignupQueue = new Queue(POST_SIGNUP_QUEUE, { 
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    }
});

module.exports = {
    postSignupQueue,
    POST_SIGNUP_QUEUE,
    connection
};