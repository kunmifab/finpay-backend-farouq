const express = require('express');
const router = express.Router();
const db = require('../utils/db/prisma');

const buildDateFilter = (startDate, endDate) => {
    const createdAt = {};

    if (startDate) {
        createdAt.gte = startDate;
    }

    if (endDate) {
        createdAt.lte = endDate;
    }

    return Object.keys(createdAt).length ? { createdAt } : {};
};

const buildSearchFilter = (term) => {
    if (!term) {
        return {};
    }

    return {
        OR: [
            { recipientName: { contains: term } },
            { description: { contains: term } },
            { reference: { contains: term } },
            { currency: { contains: term } },
            { type: { contains: term } }
        ]
    };
};

const toResponseDto = (transaction) => {
    return {
        id: transaction.id,
        receivingCurrency: transaction.currency,
        status: transaction.status,
        amount: transaction.amount,
        recipientName: transaction.recipientName,
        description: transaction.description,
        type: transaction.type,
        transactionDate: transaction.createdAt ? transaction.createdAt.toISOString().split('T')[0] : null
    };
};

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const status = req.query.status || 'all';
        const search = req.query.search || '';
        const startDateParam = req.query.startDate;
        const endDateParam = req.query.endDate;
        const skip = (page - 1) * limit;

        let startDate = null;
        let endDate = null;

        if (startDateParam) {
            const parsedStart = new Date(startDateParam);
            if (Number.isNaN(parsedStart.getTime())) {
                return res.status(400).json({
                    message: 'Invalid startDate. Use an ISO 8601 string.',
                    success: false,
                    status: 400
                });
            }
            startDate = parsedStart;
        }

        if (endDateParam) {
            const parsedEnd = new Date(endDateParam);
            if (Number.isNaN(parsedEnd.getTime())) {
                return res.status(400).json({
                    message: 'Invalid endDate. Use an ISO 8601 string.',
                    success: false,
                    status: 400
                });
            }
            endDate = parsedEnd;
        }

        if (startDate && endDate && startDate > endDate) {
            return res.status(400).json({
                message: 'startDate cannot be later than endDate.',
                success: false,
                status: 400
            });
        }

        const filters = [
            { userId: req.user.id },
            status !== 'all' ? { status } : {},
            buildDateFilter(startDate, endDate),
            buildSearchFilter(search)
        ].filter((filter) => Object.keys(filter).length);

        const whereClause = filters.length ? { AND: filters } : { userId: req.user.id };

        const total = await db.transaction.count({
            where: whereClause
        });

        const transactions = await db.transaction.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limit
        });

        const transactionData = transactions.map(toResponseDto);

        res.status(200).json({
            message: 'All transactions retrieved successfully',
            success: true,
            status: 200,
            totalFetched: transactions.length,
            transactionStatus: status,
            transactionTotal: total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            data: transactionData
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

router.get('/:id', async (req, res) => {
    if(!req.params.id) {
        return res.status(400).json({
            message: 'Transaction ID is required',
            success: false,
            status: 400
        });
    }
    try {
        const transaction = await db.transaction.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!transaction) {
            return res.status(404).json({
                message: 'Transaction not found',
                success: false,
                status: 404
            });
        }

        res.status(200).json({
            message: 'Transaction retrieved successfully',
            success: true,
            status: 200,
            data: toResponseDto(transaction)
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
