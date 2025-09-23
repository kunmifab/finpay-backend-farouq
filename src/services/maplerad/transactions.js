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

module.exports = {
    creditTestWallet,
    transferMoney
}