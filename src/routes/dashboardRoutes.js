const express = require('express');
const router = express.Router();
const db = require('../utils/db/prisma');
const { totalBalance } = require('../utils/totalBalance');

router.get('/users/balances', async (req, res) => {
    const balances = await db.balance.findMany({
        where: {
            userId: req.user.id
        }
    });

    let total = await totalBalance(req.user.id);
    console.log(total);
    let balanceData = {
        usd: balances.find(balance => balance.currency === "USD")?.amount || 0,
        eur: balances.find(balance => balance.currency === "EUR")?.amount || 0,
        ngn: balances.find(balance => balance.currency === "NGN")?.amount || 0,
        gbp: balances.find(balance => balance.currency === "GBP")?.amount || 0,
        total: total,
        currency: "USD"
    }
    res.status(200).json({
        message: 'Balances fetched successfully',
        success: true,
        status: 200,
        data: balanceData
    });
});

module.exports = router;