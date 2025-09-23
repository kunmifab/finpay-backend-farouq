const express = require('express');
const router = express.Router();
const db = require('../utils/db/prisma');

router.get('/balance', async (req, res) => {
    const currency = req.query.currency ?? 'USD';

    try {
        const balances = await db.balance.findMany({
            where: {
                userId: req.user.id,
                currency: currency
            }
        });
        if(!balances || balances.length === 0) {
            return res.status(404).json({
                message: 'Balance not found',
                success: false,
                status: 404
            });
        }

        return res.status(200).json({
            message: 'Balance retrieved successfully',
            success: true,
            status: 200,
            data: {
                balance: balances[0].amount,
                currency: balances[0].currency
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message,
            success: false,
            status: 500
        });
    }
});


module.exports = router;
