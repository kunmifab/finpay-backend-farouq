const express = require('express');
const router = express.Router();
const db = require('../utils/db/prisma');

router.post('/', async (req, res) => {
    const { currency, items, customer } = req.body;
    let { issueDate, dueDate } = req.body;
    if(!currency || !issueDate || !dueDate || !items || !customer) {
        return res.status(400).json({
            message: 'All fields are required',
            success: false,
            status: 400
        });
    }

    if(items.length === 0 || items.some(item => !item.description || !item.quantity || !item.amount)) {
        return res.status(400).json({
            message: 'Items are required',
            success: false,
            status: 400
        });
    }

    if(!customer.name || !customer.email || !customer.address) {
        return res.status(400).json({
            message: 'All customer fields are required',
            success: false,
            status: 400
        });
    }

    if(isNaN(Date.parse(issueDate)) || isNaN(Date.parse(dueDate))) {
        return res.status(400).json({
            message: 'Invalid date format for issue date or due date',
            success: false,
            status: 400
        });
    }

    issueDate = new Date(issueDate);
    dueDate = new Date(dueDate);

    let today = new Date();

    let status = 'pending';
    if(dueDate > today) {
        status = 'overdue';
    }
    if(dueDate == today) {
        status = 'due';
    }
    try {
        const invoice = await db.invoice.create({
            data: {
                userId: req.user.id,
                currency: currency,
                issueDate: issueDate,
                dueDate: dueDate,
                items: {
                    create: items.map(item => ({
                        description: item.description,
                        quantity: parseInt(item.quantity),
                        amount: parseFloat(item.amount)
                    }))
                },
                customer: {
                    create: {
                        name: customer.name,
                        email: customer.email,
                        country: customer.address?.country ?? null,
                        state: customer.address?.state ?? null,
                        address: customer.address?.address ?? null
                    }
                },
                status: 'pending'
            }
        });
    
        let sharableUrl = `${process.env.FRONTEND_URL}/invoices/${invoice.id}`;
        await db.invoice.update({
            where: { id: invoice.id },
            data: { sharableUrl: sharableUrl }
        });

        const invoiceWithRelations = await db.invoice.findUnique({
            where: { id: invoice.id },
            include: {
                items: {
                    select: {
                        description: true,
                        quantity: true,
                        amount: true
                    }
                },
                customer: {
                    select: {
                        name: true,
                        email: true,
                        country: true,
                        state: true,
                        address: true
                    }
                }
            }
        });

        const invoiceData = {
            id: invoiceWithRelations.id,
            currency: invoiceWithRelations.currency,
            issueDate: invoiceWithRelations.issueDate.toISOString().split('T')[0],
            dueDate: invoiceWithRelations.dueDate.toISOString().split('T')[0],
            items: invoiceWithRelations.items,
            customer: {
                name: invoiceWithRelations.customer[0].name,
                email: invoiceWithRelations.customer[0].email,
                address: {
                    country: invoiceWithRelations.customer[0].country,
                    state: invoiceWithRelations.customer[0].state,
                    address: invoiceWithRelations.customer[0].address
                }
            },
            sharableUrl: sharableUrl
        }

        res.status(201).json({
            message: 'Invoice created successfully',
            success: true,
            status: 201,
            data: invoiceData
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

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || 'all';
        const filter = req.query.filter || 'all';
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        const searchConditions = search ? {
            OR: [
                {
                    items: {
                        some: {
                            description: {
                                contains: search,
                            },
                        },
                    },
                },
                {
                    
                    customer: {
                        some: {
                            name: {
                                contains: search,
                            },
                        },
                    },
                },
            ],
        }
        : {};

        const dateConditions =
            filter !== 'all'
                ? {
                    OR: [
                        { issueDate: { gte: new Date(filter) } },
                        { dueDate: { lte: new Date(filter) } },
                    ],
                }
                : {};

        const total = await db.invoice.count({
            where: {
                userId: req.user.id,
                status: status === 'all' ? undefined : status,
                ...dateConditions,
                ...searchConditions
            }
        });

        const invoices = await db.invoice.findMany({
            where: {
                userId: req.user.id,
                status: status === 'all' ? undefined : status,
                ...dateConditions,
                ...searchConditions
            },
            include: {
                items: {
                    select: {
                        description: true,
                        quantity: true,
                        amount: true
                    }
                },
                customer: {
                    select: {
                        name: true,
                        email: true,
                        country: true,
                        state: true,
                        address: true
                    }
                }
            },
            orderBy: {
                issueDate: 'desc'
            },
            skip: skip,
            take: limit
        });

        const invoiceData = invoices.map(invoice => {
            // 🔧 CHANGED: `customer` is an ARRAY; pick first or return null
            const cust = Array.isArray(invoice.customer) ? invoice.customer[0] : invoice.customer;

            return {
                id: invoice.id,
                currency: invoice.currency,
                issueDate: invoice.issueDate ? invoice.issueDate.toISOString().split('T')[0] : null,
                dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : null,
                items: invoice.items,
                customer: cust ? {
                    name: cust.name,
                    email: cust.email,
                    address: {
                        country: cust.country,
                        state: cust.state,
                        address: cust.address
                    }
                } : null
            };
        });

        res.status(200).json({
            message: 'All invoices retrieved successfully',
            success: true,
            status: 200,
            totalFetched: invoices.length,
            invoiceStatus: status,
            invoiceTotal: total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(total / limit),
            data: invoiceData
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

router.delete('/:id', async (req, res) => {
    if(!req.params.id) {
        return res.status(400).json({
            message: 'Invoice ID is required',
            success: false,
            status: 400
        });
    }
    try {
        const invoice = await db.invoice.findUnique({
            where: { id: req.params.id, userId: req.user.id }
        });
        if(!invoice) {
            return res.status(400).json({
                message: 'Invoice not found',
                success: false,
                status: 400
            });
        }
        await db.invoiceItem.deleteMany({
            where: { invoiceId: req.params.id }
        });
        await db.invoiceCustomer.deleteMany({
            where: { invoiceId: req.params.id }
        });
        await db.invoice.delete({
            where: { id: req.params.id, userId: req.user.id }
        });
        res.status(200).json({
            message: 'Invoice deleted successfully',
            success: true,
            status: 200,
            data: {}
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

router.get('/summary', async (req, res) => {
    try {
        const summary = await db.invoice.findMany({
            where: { userId: req.user.id }
        });
        const dueInvoices = summary.filter(invoice => invoice.status == 'due');
        const overdueInvoices = summary.filter(invoice => invoice.status == 'overdue');
        const pendingInvoices = summary.filter(invoice => invoice.status == 'pending');
        res.status(200).json({
            message: 'Invoice summary retrieved successfully',
            success: true,
            status: 200,
            data: {
                invoices: {
                    due: dueInvoices.length,
                    overdue: overdueInvoices.length,
                    pending: pendingInvoices.length
                }
            }
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