const { Worker } = require('bullmq');
const { connection, POST_SIGNUP_QUEUE } = require('./queues');
const db = require('../utils/db/prisma');
const { ensureUserFinancialSetup } = require('../services/financialAccounts.service');
const { ensureUserFinancialSetupMaplerad } = require('../services/maplerad/financialAccounts.service');
const { createVirtualAccountNGN, createVirtualAccountUSD } = require('../services/maplerad/mapleradCustomers');
const { getChildLogger } = require('../utils/logger');
require('dotenv').config();

const baseLogger = getChildLogger({ module: 'post-signup-worker' });

const worker = new Worker(
  POST_SIGNUP_QUEUE,
  async (job) => {
    const log = baseLogger.child({ jobId: job.id });
    const { userId } = job.data;
    log.info({ userId }, 'Processing post-signup job');

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      log.error({ userId }, 'User not found for post-signup job');
      throw new Error(`User ${userId} not found`);
    }

    const result = await ensureUserFinancialSetup(user);
    const mapleradResult = await ensureUserFinancialSetupMaplerad(user);
    try {
      await createVirtualAccountNGN(mapleradResult.customerId, user);
      await createVirtualAccountUSD(mapleradResult.customerId, user);
    } catch (error) {
      log.error({ err: error }, 'Failed to create virtual accounts');
      throw new Error('Failed to create virtual account');
    }

    if (!user.stripeConnectId && result.connectAccountId) {
      await db.user.update({
        where: { id: user.id },
        data: { stripeConnectId: result.connectAccountId },
      });
    }

    log.info({ userId }, 'Post-signup job completed successfully');

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
  baseLogger.info({ jobId: job.id }, 'Post-signup job completed');
});

worker.on('failed', (job, err) => {
  baseLogger.error({ jobId: job?.id, err }, 'Post-signup job failed');
});

module.exports = worker;
