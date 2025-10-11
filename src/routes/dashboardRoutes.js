const express = require('express');
const router = express.Router();
const db = require('../utils/db/prisma');
const { totalBalance } = require('../utils/totalBalance');

router.get('/users/balances', async (req, res) => {
    try {
        const balances = await db.balance.findMany({
            where: {
                userId: req.user.id
            }
        });
    
        let total = await totalBalance(req.user.id);
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
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message,
            success: false,
            status: 500
        });
    }
});

router.get('/accounts', async (req, res) => {
    try {
        const accounts = await db.account.findMany({
            where: {
                userId: req.user.id
            },
            select: {
                id: true,
                accountHolder: true,
                bankName: true,
                accountNumber: true,
                routingNumber: true,
                accountType: true,
                address: true,
                currency: true
            }
        });

        res.status(200).json({
            message: 'All accounts retrieved successfully',
            success: true,
            status: 200,
            data: accounts
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message,
            success: false,
            status: 500
        });
    }
});

router.get('/accounts/:id', async (req, res) => {
    try {
        const account = await db.account.findUnique({
            where: {
                id: req.params.id
            },
            select: {
                id: true,
                accountHolder: true,
                bankName: true,
                accountNumber: true,
                routingNumber: true,
                accountType: true,
                address: true,
                currency: true
            }
        });

        res.status(200).json({
            message: 'Account retrieved successfully',
            success: true,
            status: 200,
            data: account
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message,
            success: false,
            status: 500
        });
    }
});

router.get('/rates', async (req, res) => {
    try {
        const rates = await db.exchangeRate.findUnique({
            where: {
                base: 'USD'
            },
            select: {
                gbp: true,
                eur: true,
                ngn: true,
                cad: true,
                effectiveAt: true
            }
        });

        let rateData = {
            currency: 'USD',
            rates: [
                {
                    currency: 'GBP',
                    buyPrice: rates.gbp,
                    sellPrice: rates.gbp
                },
                {
                    currency: 'EUR',
                    buyPrice: rates.eur,
                    sellPrice: rates.eur
                },
                {
                    currency: 'NGN',
                    buyPrice: rates.ngn,
                    sellPrice: rates.ngn
                },
                {
                    currency: 'CAD',
                    buyPrice: rates.cad,
                    sellPrice: rates.cad
                }
            ]
        }


        res.status(200).json({
            message: 'Exchange rates retrieved successfully',
            success: true,
            status: 200,
            data: rateData
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message,
            success: false,
            status: 500
        });
    }
});

router.get('/currentUser', async (req, res) => {
    try {
        const user = await db.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                phoneNumber: true,
                accountType: true,
                countryCode: true,
                country: true,
                state: true,
                address: true
            }
        });
        if(!user) {
            return res.status(400).json({
                message: 'User not found',
                success: false,
                status: 400
            });
        }
        return res.status(200).json({
            message: 'User fetched successfully',
            success: true,
            status: 200,
            data: user
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message,
            success: false,
            status: 500
        });
    }
});

module.exports = router;