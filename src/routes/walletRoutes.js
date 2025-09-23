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

        return res.status(201).json({
            message: 'Balance retrieved successfully',
            success: true,
            status: 201,
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

        return res.status(201).json({
            message: 'Accounts retrieved successfully',
            success: true,
            status: 201,
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
                bank_code: bankCode
            });

            await db.balance.update({
                where: { id: balance.id },
                data: { amount: { decrement: amount } }
            });

            if(!creditWallet) {
                return res.status(400).json({
                    message: 'Failed to send money',
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

            await db.$transaction(async (tx) => {
                const newAddr = await tx.address.create({
                    data: {
                        street: street,
                        city: city,
                        state: state,
                        country: country,
                        postalCode: postalCode
                    }
                });
            
                await tx.transferBeneficiary.upsert({
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
                        createdAt: new Date(),    
                        addressId: newAddr.id
                    }
                });
            });
  
            

            return res.status(201).json({
                message: 'Transfer in progress',
                success: true,
                status: 201,
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

router.post('/withdraw', async (req, res) => {
    if(!req.body) {
        return res.status(400).json({
            message: 'Invalid request body',
            success: false,
            status: 400
        });
    }

    const { amount, currency, recievingCurrency, accountNumber, accountHolder, bankName } = req.body;
    if(!accountNumber || !accountHolder || !bankName || !amount || !currency || !recievingCurrency) {
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
            bank_code: bankCode
        });

        await db.balance.update({
            where: { id: balance.id },
            data: { amount: { decrement: amount } }
        });

        if(!creditWallet) {
            return res.status(400).json({
                message: 'Failed to withdraw money',
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
                recipientName: "Self",
                description: 'Withdrawal',
                reference: creditWallet.id,
                createdAt: new Date(),
                type: 'debit'
            }
        });            

        return res.status(201).json({
            message: 'Withdrawal in progress',
            success: true,
            status: 201,
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

        return res.status(201).json({
            message: 'Wallet funded successfully',
            success: true,
            status: 201,
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

        return res.status(201).json({
            message: 'Expenses and income retrieved successfully',
            success: true,
            status: 201,
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

router.post('/convert', async (req, res) => {
    if(!req.body) {
        return res.status(400).json({
            message: 'Invalid request body',
            success: false,
            status: 400
        });
    }
    const { amount, fromCurrency, toCurrency } = req.body;
    if(!amount || !fromCurrency || !toCurrency) {
        return res.status(400).json({
            message: 'All fields are required',
            success: false,
            status: 400
        });
    }
    if(fromCurrency != 'USD' && fromCurrency != 'NGN' && toCurrency != 'USD' && toCurrency != 'NGN') {
        return res.status(400).json({
            message: 'Invalid currency',
            success: false,
            status: 400
        });
    }
    if(fromCurrency == toCurrency) {
        return res.status(400).json({
            message: 'From and to currency cannot be the same',
            success: false,
            status: 400
        });
    }
    if(amount <= 0) {
        return res.status(400).json({
            message: 'Amount must be greater than 0',
            success: false,
            status: 400
        });
    }
    try {
        const convertedAmount = amount * 100; //in cents
        const fromBalance = await db.balance.findFirst({
            where: {
                userId: req.user.id,
                currency: fromCurrency
            }
        });
        if(!fromBalance) {
            return res.status(400).json({
                message: 'Balance not found',
                success: false,
                status: 400
            });
        }
        if(fromBalance.amount < amount) {
            return res.status(400).json({
                message: 'Insufficient balance',
                success: false,
                status: 400
            });
        }
        const convertCurrency = await mapleradService.convertCurrency({ amount: convertedAmount, fromCurrency, toCurrency });
        if(!convertCurrency) {
            return res.status(400).json({
                message: 'Failed to convert currency',
                success: false,
                status: 400
            });
        }
        await db.balance.update({
            where: { id: fromBalance.id },
            data: { amount: { decrement: amount } }
        });

        const toBalance = await db.balance.findFirst({
            where: {
                userId: req.user.id,
                currency: toCurrency
            }
        });
        if(!toBalance) {
            await db.balance.create({
                data: {
                    userId: req.user.id,
                    currency: toCurrency,
                    amount: parseFloat(convertCurrency.target.amount / 100)
                }
            });
        }

        await db.balance.update({
            where: { id: toBalance.id },
            data: { amount: { increment: parseFloat(convertCurrency.target.amount / 100) } }
        });

        await db.transaction.create({
            data: {
                userId: req.user.id,
                amount: parseFloat(convertCurrency.target.amount / 100),
                currency: toCurrency,
                status: 'successful',
                type: 'convert_currency',
                recipientName: 'Self',
                createdAt: new Date(),
                meta: {
                    fromCurrency: fromCurrency,
                    toCurrency: toCurrency,
                    rate: convertCurrency.rate
                }
            }
        });

        return res.status(201).json({
            message: 'Currency converted successfully',
            success: true,
            status: 201,
            data: {
                amount: parseFloat(convertCurrency.target.amount / 100),
                currency: toCurrency,
                rate: convertCurrency.rate
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
