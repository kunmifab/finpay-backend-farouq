// src/services/flutterwaveVirtualAccounts.js
// Create Virtual Accounts in v4 using the required "customer" id

const { flwAxios } = require('../utils/flutterwaveClient');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a virtual account for a given currency and FW customer id.
 * v4 endpoint: POST /virtual-accounts
 * Required: customer (id), currency (e.g., "NGN", "USD")
 * Optional: type (STATIC | DYNAMIC). We'll default to STATIC.
 */
async function createVirtualAccount({ customerId, currency, type = 'STATIC' }) {
  const payload = {
    reference: uuidv4(),
    customer_id: customerId,
    currency,
    amount: 20000000,
    account_type: 'dynamic',
  };

  const res = await flwAxios.post('virtual-accounts', payload, {
    headers: { 'X-Idempotency-Key': uuidv4() },
    accept: 'application/json', 
    'content-type': 'application/json'
  });

  // Expect data to contain: id, account_number, bank_name, status, etc.
  return res.data.data;
}

/**
 * Convenience helper: create NGN & USD VAs for one user/customer.
 */
async function createUserVirtualAccounts({ customerId }) {
  const ngn = await createVirtualAccount({ customerId, currency: 'NGN' });
//   const usd = await createVirtualAccount({ customerId, currency: 'USD' });
  return { ngn };
}

module.exports = {
  createVirtualAccount,
  createUserVirtualAccounts,
};
