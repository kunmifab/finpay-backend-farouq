const db = require('../../utils/db/prisma');

const { getOrCreateCustomerId, upgradeCustomerTier1 } = require('./mapleradCustomers');


async function ensureUserFinancialSetupMaplerad(user) {

    // 1) Customer id (create/search, and persist if schema has mapleradCustomerId)
    const customerId = await getOrCreateCustomerId(user, db);
    let data = {
      'customerId': customerId,
      "dob": "24-05-1983",
      'gender': "male",
      "phone": {
        "phone_country_code": "+234",
        "phone_number": "8123456789"
      },
      "address": {
        "street": "63 banana island",
        "city": "Isolo",
        "state": "Lagos",
        "country": "NG",
        "postal_code": "770835"
      },
      'identification_number': "1234567890",
      'country': "NG",
      'postal_code': "12345",
      'state': "Lagos",
      'street': "123 Main St"
    }
    const upgradedCustomer = await upgradeCustomerTier1(data);

  return { customerId, upgradedCustomer };
}

module.exports = {
  ensureUserFinancialSetupMaplerad,
};
