// src/job/postSignupWorker.js
const { Worker } = require('bullmq');
const { connection, POST_SIGNUP_QUEUE } = require('./queues');
const db = require('../utils/db/prisma');
const { ensureUserFinancialSetup } = require('../services/financialAccounts.service');
const { ensureUserFinancialSetupMaplerad } = require('../services/maplerad/financialAccounts.service');
require('dotenv').config();

const worker = new Worker(
  POST_SIGNUP_QUEUE,
  async (job) => {
    const { userId } = job.data;

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(`User ${userId} not found`);

    const result = await ensureUserFinancialSetup(user);
    const mapleradResult = await ensureUserFinancialSetupMaplerad(user);
    // Persist Connect id if newly created
    if (!user.stripeConnectId && result.connectAccountId) {
      await db.user.update({
        where: { id: user.id },
        data: { stripeConnectId: result.connectAccountId },
      });
    }

    return {
      userId,
      provider: result.provider,
      connectAccountId: result.connectAccountId || null,
      mapleradCustomerId: mapleradResult.customerId || null,
      mapleradTier: mapleradResult.upgradedCustomer || null,
      financialAccountId: result.financialAccountId || null,
      pending: !!result.pending,
    };
  },
  { connection, concurrency: 3 }
);

worker.on('completed', (job) => {
  console.log(`[post-signup.worker] completed ${job.id}`);
});
worker.on('failed', (job, err) => {
  console.error(`[post-signup.worker] failed ${job?.id}`, err);
});

module.exports = worker;
