const express = require('express');
const router = express.Router();
const db = require('../utils/db/prisma');
const mapleradService = require('../services/maplerad/transactions');

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

router.get('/accounts', async (req, res) => {
    const currency = req.query.currency ?? 'USD';
    try {
        const accounts = await db.account.findMany({
            where: {
                userId: req.user.id,
                currency: currency
            },
            select: {
                id: true,
                accountHolder: true,
                bankName: true,
                accountNumber: true,
                routingNumber: true,
                accountType: true,
                currency: true
            }
        });

        if(!accounts || accounts.length === 0) {
            return res.status(404).json({
                message: 'Accounts not found',
                success: false,
                status: 404
            });
        }

        return res.status(200).json({
            message: 'Accounts retrieved successfully',
            success: true,
            status: 200,
            data: accounts
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

router.post('/send', async (req, res) => {
    if(!req.body) {
        return res.status(400).json({
            message: 'Invalid request body',
            success: false,
            status: 400
        });
    }

    const { amount, accountType , currency, recievingCurrency, description = '', agentPhoneNumber = null } = req.body;
    const { street, state , city, country, postalCode } = req.body;
    let accountNumber = null, accountHolder = null, bankName = null;
    if(accountType == 'individual') {
        accountNumber = req.body.accountNumber;
        accountHolder = req.body.accountHolder;
        bankName = req.body.bankName;

        if(!accountNumber || !accountHolder || !bankName || !street || !state || !city || 
            !country || !postalCode || !amount || !currency || !recievingCurrency) {
            return res.status(400).json({
                message: 'All fields are required',
                success: false,
                status: 400
            });
        }

        const bankCode = currency == 'NGN' ? '825' : '825';
        try {
            const balance = await db.balance.findFirst({
                where: {
                    userId: req.user.id,
                    currency: currency
                }
            });
            if(!balance) {
                return res.status(400).json({
                    message: 'Balance not found',
                    success: false,
                    status: 400
                });
            }
            if(balance.amount < amount) {
                return res.status(400).json({
                    message: 'Insufficient balance',
                    success: false,
                    status: 400
                });
            }
            const convertedAmount = amount * 100; //in cents
            const creditWallet = await mapleradService.transferMoney({ 
                amount: convertedAmount, 
                currency, 
                account_number: accountNumber, 
                bank_code: bankCode,
                // reference: description
            });

            await db.balance.update({
                where: { id: balance.id },
                data: { amount: { decrement: amount } }
            });

            if(!creditWallet) {
                return res.status(400).json({
                    message: 'Failed to fund wallet',
                    success: false,
                    status: 400
                });
            }

            await db.transaction.create({
                data: {
                    userId: req.user.id,
                    amount: parseFloat(amount),
                    currency: currency,
                    status: 'pending',
                    recipientName: accountHolder,
                    description: description,
                    reference: creditWallet.id,
                    createdAt: new Date(),
                    type: 'debit'
                }
            });

            // CHANGED: wrap in a transaction so the address create + upsert stay consistent
            await db.$transaction(async (tx) => { // CHANGED
                // CHANGED: create the address first and use its id in the create branch
                const newAddr = await tx.address.create({ // CHANGED
                data: {                                   // CHANGED
                    street: street,                         // CHANGED
                    city: city,                             // CHANGED
                    state: state,                           // CHANGED
                    country: country,                       // CHANGED
                    postalCode: postalCode                  // CHANGED
                }                                         // CHANGED
                });                                         // CHANGED
            
                await tx.transferBeneficiary.upsert({ // CHANGED: tx.*
                where: {
                    userId_accountHolder_accountNumber_bankName: {
                    userId: req.user.id,
                    accountHolder: accountHolder,
                    accountNumber: accountNumber,
                    bankName: bankName
                    }
                },
                update: {
                    currency: currency,
                    // keep relation update as a nested write
                    address: {
                    upsert: {
                        create: {
                        street: street,
                        city: city,
                        state: state,
                        country: country,
                        postalCode: postalCode
                        },
                        update: {
                        street: street,
                        city: city,
                        state: state,
                        country: country,
                        postalCode: postalCode
                        }
                    }
                    }
                },
                create: {
                    userId: req.user.id,
                    accountHolder: accountHolder,
                    accountNumber: accountNumber,
                    bankName: bankName,
                    currency: currency,
                    createdAt: new Date(),              // CHANGED: required by your schema
                    addressId: newAddr.id               // CHANGED: use FK instead of nested { address: { create: ... } }
                }
                });
            }); // CHANGED
  
            

            return res.status(200).json({
                message: 'Transfer in progress',
                success: true,
                status: 200,
                data: {
                    amount: parseFloat(amount),
                    currency: currency
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
    }

    return res.status(400).json({
        message: 'Invalid account type',
        success: false,
        status: 400
    });
    
});

router.post('/fund', async (req, res) => {
    if(!req.body) {
        return res.status(400).json({
            message: 'Invalid request body',
            success: false,
            status: 400
        });
    }
    const { amount, currency } = req.body;
    if(!amount || !currency) {
        return res.status(400).json({
            message: 'All fields are required',
            success: false,
            status: 400
        });
    }
    if(currency != 'USD' && currency != 'NGN') {
        return res.status(400).json({
            message: 'Invalid currency',
            success: false,
            status: 400
        });
    }

    try {
        const convertedAmount = amount * 100; //in cents
        const creditWallet = await mapleradService.creditTestWallet({ amount: convertedAmount, currency });
        if(!creditWallet) {
            return res.status(400).json({
                message: 'Failed to fund wallet',
                success: false,
                status: 400
            });
        }

        const balance = await db.balance.findMany({
            where: {
                userId: req.user.id,
                currency: currency
            }
        });
        if(!balance || balance.length === 0) {
            await db.balance.create({
                data: {
                    userId: req.user.id,
                    currency: currency,
                    amount: parseFloat(amount)
                }
            });
        } else {
            await db.balance.update({
                where: {
                    id: balance[0].id
                },
                data: {
                    amount: parseFloat(balance[0].amount) + parseFloat(amount)
                }
            });
        }

        await db.transaction.create({
            data: {
                userId: req.user.id,
                amount: parseFloat(amount),
                currency: currency,
                status: 'successful',
                recipientName: 'Self',
                createdAt: new Date(),
                type: 'credit'
            }
        });

        return res.status(200).json({
            message: 'Wallet funded successfully',
            success: true,
            status: 200,
            data: {
                balance: parseFloat(balance[0].amount) + parseFloat(amount),
                currency: currency
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

router.get('/expenses-income', async (req, res) => {
    const currency = req.query.currency ?? 'USD';
    try {
        const expenses = await db.transaction.findMany({
            where: {
                userId: req.user.id,
                type: 'debit',
                currency: currency
            }
        });
        
        const income = await db.transaction.findMany({
            where: {
                userId: req.user.id,
                type: 'credit',
                currency: currency
            }
        });

        let totalExpenses = 0;
        let totalIncome = 0;
        expenses.forEach(expense => {
            totalExpenses += expense.amount;
        });
        income.forEach(income => {
            totalIncome += income.amount;
        });

        return res.status(200).json({
            message: 'Expenses and income retrieved successfully',
            success: true,
            status: 200,
            data: {
                expenses: totalExpenses,
                income: totalIncome,
                currency: currency
            }
        });
    }catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message,
            success: false,
            status: 500
        });
    }
});

module.exports = router;
