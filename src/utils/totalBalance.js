const db = require('./db/prisma');

const totalBalance = async (userId) => {
    const exchangeRate = await db.exchangeRate.findUnique({
        where: {
            base: 'USD'
        }
    });

    if (!exchangeRate) {
        console.error('No USD-based exchange rate found in the database.');
        return null;
    }

    const balances = await db.balance.findMany({
        where: {
            userId: userId,
            amount: {
                not: 0
            }
        }
    });
    
    if (balances.length === 0) {
        return 0;
    }

    let totalBalanceInUsd = 0;

    for (const balance of balances) {
        if (balance.currency === 'USD') {
            totalBalanceInUsd += balance.amount;
        } else {
            const conversionRate = exchangeRate[balance.currency.toLowerCase()];

            if (conversionRate != null) {
                const convertedAmount = balance.amount / conversionRate;
                totalBalanceInUsd += convertedAmount;
            } else {
                console.error(`Exchange rate for ${balance.currency} not found.`);
            }
        }
    }

    return parseFloat(totalBalanceInUsd.toFixed(2));
};

module.exports = { totalBalance };