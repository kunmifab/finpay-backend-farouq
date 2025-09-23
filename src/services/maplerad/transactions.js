const { mapleradAxios } = require('../../utils/mapleradClient');

async function creditTestWallet(data) {
    const { amount, currency } = data;

    const res = await mapleradAxios.post('test/wallet/credit', {
        amount,
        currency
    }, {
        headers: {
            accept: 'application/json',
            'content-type': 'application/json'
        }
    });

    return res.data;
}

async function transferMoney(data) {
    const { amount, currency = 'NGN', account_number, bank_code, reference } = data;
    const res = await mapleradAxios.post('transfers', {
        amount,
        currency,
        account_number,
        bank_code,
        reference
    }, {
        headers: {
            accept: 'application/json',
            'content-type': 'application/json'
        }
    });

    return res.data.data;
}

async function convertCurrency(data) {
    const { amount, fromCurrency, toCurrency } = data;
    const res = await mapleradAxios.post('fx/quote', {
        amount,
        source_currency: fromCurrency,
        target_currency: toCurrency,
    });

    const reference = res?.data?.data?.reference ?? null;
    if(!reference) {
        return null;
    }
    const exchange = await mapleradAxios.post('fx', {
        quote_reference: reference
    });

    return exchange.data.data;
}

module.exports = {
    creditTestWallet,
    transferMoney,
    convertCurrency
}