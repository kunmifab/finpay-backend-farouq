// src/services/flutterwaveCustomers.js
// Create or find a Flutterwave v4 Customer to obtain the required customer id

const { mapleradAxios } = require('../../utils/mapleradClient');
const db = require('../../utils/db/prisma');

/**
 * Create a new maplerad customer (v1)
 * POST /customers
 * Minimum required is email (Maplerad recommends name/phone too)
 */
async function createCustomer({ email, name }) {
  const first_name = (name || '').split(' ')[0] || 'User';
  const last_name  = (name || '').split(' ').slice(1).join(' ') || first_name;
  const payload = {
    email,
    first_name,
    last_name,
    country: 'NG'
  };

  const res = await mapleradAxios.post('customers', payload, {
    headers: { 
        accept: 'application/json', 
        'content-type': 'application/json'
     },
  });

  return res.data.data; // { id, email, name, ... }
}

/**
 * Upgrade a new maplerad customer to tier 1 (v1)
 * PATCH /customers/upgrade/tier1
 * Minimum required is customer_id (Maplerad recommends dob/gender/phone/address/identification_number too)
 */
async function upgradeCustomerTier1(data) {
  const payload = {
    customer_id: data.customerId,
    dob: data.dob,
    gender: data.gender,
    phone: {
      phone_country_code: data.phone.phone_country_code,
      phone_number: data.phone.phone_number
    },
    address: {
      street: data.address.street,
      city: data.address.city,
      state: data.address.state,
      country: data.address.country,
      postal_code: data.address.postal_code
    },
    identification_number: data.identification_number
  };

  const res = await mapleradAxios.patch('customers/upgrade/tier1', payload, {
    headers: { 
        accept: 'application/json', 
        'content-type': 'application/json'
     },
  });

  return "tier1";
}

/**
 * Get-or-create customer id for a given user object from your DB.
 * We do NOT require any schema change: we search by email; if not found, we create.
 */
async function getOrCreateCustomerId(user, db) {
  // 1) try search by email
  const mapleradCustomerId = user.mapleradCustomerId;
  if (mapleradCustomerId) return mapleradCustomerId;

  // 2) create
  const created = await createCustomer({
    email: user.email,
    name: user.name
  });

  if(created && created.id) {
    user.mapleradCustomerId = created.id;
    await db.user.update({
      where: { id: user.id },
      data: { mapleradCustomerId: created.id },
    });
  } else {
    throw new Error('Failed to create customer');
  }

  return created.id;
}

module.exports = {
  getOrCreateCustomerId,
  upgradeCustomerTier1
};
