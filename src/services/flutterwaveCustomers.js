// src/services/flutterwaveCustomers.js
// Create or find a Flutterwave v4 Customer to obtain the required customer id

const { flwAxios } = require('../utils/flutterwaveClient');
const db = require('../utils/db/prisma');
const { v4: uuidv4 } = require('uuid');

/**
 * Try to find an existing customer by email using v4 "Search customers" endpoint.
 * POST /customers/search
 */
async function searchCustomerByEmail(email) {
  try {
    const res = await flwAxios.post(
      'customers/search',
      { email },
      { headers: { 'X-Idempotency-Key': uuidv4() } }
    );
    // Some v4 responses nest results in data, sometimes array; we handle both gracefully
    const data = res.data && res.data.data;
    if (Array.isArray(data) && data.length > 0) return data[0];
    if (data && data.id) return data;
    return null;
  } catch (err) {
    // Not fatal—if search fails, we’ll proceed to create.
    return null;
  }
}

/**
 * Create a new FW customer (v4)
 * POST /customers
 * Minimum required is email (Flutterwave recommends name/phone too)
 */
async function createCustomer({ email, name, phoneNumber, address, country }) {
  const payload = {
    email,
    name: {
        first: name
    },
    phone: {
        country_code: '234',
        number: phoneNumber
    },
  };

  const res = await flwAxios.post('customers', payload, {
    headers: { 
        'X-Idempotency-Key': uuidv4(),
        accept: 'application/json', 
        'content-type': 'application/json'
     },
  });

  return res.data.data; // { id, email, name, ... }
}

/**
 * Get-or-create customer id for a given user object from your DB.
 * We do NOT require any schema change: we search by email; if not found, we create.
 */
async function getOrCreateCustomerId(user) {
  // 1) try search by email
  const flutterwaveCustomerId = user.flutterwaveCustomerId;
  if (flutterwaveCustomerId) return flutterwaveCustomerId;

  // 2) create
  const created = await createCustomer({
    email: user.email,
    name: user.name,
    phoneNumber: user.phoneNumber,
    address: user.address,
    country: user.country,
  });

  if(created && created.id) {
    user.flutterwaveCustomerId = created.id;
    await db.user.update({
      where: { id: user.id },
      data: { flutterwaveCustomerId: created.id },
    });
  } else {
    throw new Error('Failed to create customer');
  }

  return created.id;
}

module.exports = {
  getOrCreateCustomerId,
};
