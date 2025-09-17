// Provider switch:
// - FINANCIAL_PROVIDER=flutterwave => create v4 Customer, then Virtual Accounts (NGN & USD)
// - FINANCIAL_PROVIDER=stripe_treasury => (your existing Stripe path)
// - else => pending fallback

const db = require('../utils/db/prisma');
const stripe = require('../utils/stripe');

const { getOrCreateCustomerId } = require('./flutterwaveCustomers');
const { createUserVirtualAccounts } = require('./flutterwaveVirtualAccounts');

const PROVIDER = (process.env.FINANCIAL_PROVIDER || '').toLowerCase();

async function ensureConnectAccount(user) {
  if (user.stripeConnectId) return user.stripeConnectId;
  const account = await stripe.accounts.create({
    country: 'US',
    type: 'express',
    email: user.email,
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true }
    },
    business_type: 'individual',
  });
  return account.id;
}

// Optional helper to upsert your Account row
async function upsertAccountRow({ userId, currency, status, details, provider, providerRef, meta }) {
  await db.account.upsert({
    where: { userId_currency: { userId, currency } },
    update: {
      accountHolder: details?.beneficiary || null,
      bankName: details?.bankName || details?.bank_name || details?.account_bank_name || null,
      accountNumber: details?.accountNumber || details?.account_number || null,
      routingNumber: details?.routingNumber || details?.routing_number || null,
      accountType: 'checking',
      provider,
      providerRef: providerRef || details?.id || null,
      status,
      meta: meta || details || {},
    },
    create: {
      userId,
      currency,
      accountHolder: details?.beneficiary || null,
      bankName: details?.bankName || details?.bank_name || null,
      accountNumber: details?.accountNumber || details?.account_number || null,
      routingNumber: details?.routingNumber || details?.routing_number || null,
      accountType: 'checking',
      provider,
      providerRef: providerRef || details?.id || null,
      status,
      meta: meta || details || {},
    },
  });
}

async function ensureUserFinancialSetup(user) {
  const connectAccountId = await ensureConnectAccount(user);

  if (PROVIDER === 'flutterwave') {
    // 1) Customer id (create/search, and persist if schema has flutterwaveCustomerId)
    const customerId = await getOrCreateCustomerId(user, db);

    // 2) Create NGN+USD virtual accounts
    const { ngn, usd } = await createUserVirtualAccounts({ customerId });

    // 3) Upsert DB Accounts (provider='flutterwave')
    await upsertAccountRow({
      userId: user.id,
      currency: 'NGN',
      status: 'active',
      details: ngn,
      provider: 'flutterwave',
    });
    await upsertAccountRow({
      userId: user.id,
      currency: 'USD',
      status: 'active',
      details: usd,
      provider: 'flutterwave',
    });

    return {
      connectAccountId,
      financialAccountId: null,
      pending: false,
      provider: 'flutterwave',
    };
  }

  if (PROVIDER === 'stripe_treasury') {
    // keep your existing behavior (or pending if not enabled)
    for (const c of ['USD', 'EUR', 'GBP', 'NGN']) {
      await upsertAccountRow({
        userId: user.id,
        currency: c,
        status: 'pending',
        details: {},
        provider: 'stripe',
        providerRef: null,
        meta: { reason: 'treasury_not_enabled_or_skipped' },
      });
    }
    return { connectAccountId, financialAccountId: null, pending: true, provider: 'stripe_treasury' };
  }

  // fallback: pending
  for (const c of ['USD', 'EUR', 'GBP', 'NGN']) {
    await upsertAccountRow({
      userId: user.id,
      currency: c,
      status: 'pending',
      details: {},
      provider: 'unknown',
      providerRef: null,
      meta: { reason: 'no_provider' },
    });
  }
  return { connectAccountId, financialAccountId: null, pending: true, provider: 'none' };
}

module.exports = {
  ensureUserFinancialSetup,
  ensureConnectAccount,
};
