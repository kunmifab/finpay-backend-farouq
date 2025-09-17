const stripe = require('../utils/stripe');

/**
 * Create a Stripe Connect account for the user if missing.
 * In test for Treasury, docs say to use a US connected account.
 */
async function ensureConnectAccount(user) {
    if (user.stripeConnectId) {
        return user.stripeConnectId;
    }
    const account = await stripe.accounts.create({
        country: 'US',
        email: user.email,
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true }
        },
        controller: {
            fees: {
              payer: 'application',
            },
            losses: {
              payments: 'application',
            },
            stripe_dashboard: {
              type: 'express',
            },
        },
        business_type: 'individual',
    });
    return account.id;
}

/**
 * Create a Treasury Financial Account on the user's connected account.
 * In test, Stripe requires supported_currencies[]=usd.
 */

async function createFinancialAccountOnConnect({connectAccountId}) {
    const fa = await stripe.treasury.financialAccounts.create(
        { supported_currencies: ['usd'] },
        { stripeAccount: connectAccountId }
    );
    return fa;
}

/**
 * Fetch/create financial addresses (e.g., ABA for US) so you get routing/account numbers.
 * For US USD accounts, enable/check 'financial_addresses.aba' feature on FA.
 * We simply re-retrieve the FA; in test it comes with an ABA address when feature active.
 */

async function getUsAbaDetails({ financialAccountId, connectAccountId }) {
    const fa = await stripe.treasury.financialAccounts.retrieve(
      financialAccountId,
      { stripeAccount: connectAccountId }
    );
  
    const aba = fa.financial_addresses?.find(a => a.supported_networks?.includes('ach'));
    // Fallback if structure differs in your program:
    const details = {
      bankName: aba?.bank_name || 'Stripe Treasury Bank Partner',
      accountNumber: aba?.account_number || aba?.account || null,
      routingNumber: aba?.routing_number || null,
      raw: aba || fa,
    };
    return details;
}

module.exports = {
    ensureConnectAccount,
    createFinancialAccountOnConnect,
    getUsAbaDetails
  };