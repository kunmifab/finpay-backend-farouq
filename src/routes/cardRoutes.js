const express = require('express');
const router = express.Router();
const db = require('../utils/db/prisma');
const cardService = require('../services/maplerad/cardService');

router.post('/', async (req, res) => {
    const { currency, brand = 'VISA', walletId = null, fees = 0, type = 'VIRTUAL' } = req.body;
    if(!currency) {
        return res.status(400).json({
            message: 'All fields are required',
            success: false,
            status: 400
        });
    }

    try {
        const user = await db.user.findUnique({
            where: { id: req.user.id }
        });
        if(!user) {
            return res.status(400).json({
                message: 'User not found',
                success: false,
                status: 400
            });
        }
        if(!user.mapleradCustomerId) {
            return res.status(400).json({
                message: 'User not linked to Maplerad',
                success: false,
                status: 400
            });
        }
        const createMapleradCard = await cardService.createCard({
            customer_id: user.mapleradCustomerId,
            auto_approve: true,
            currency: currency,
            brand: brand,
            type: type,
            amount: 200 // $2 or 2NGN
        });

        if(!createMapleradCard) {
            return res.status(400).json({
                message: 'Failed to create card',
                success: false,
                status: 400
            });
        }

        const card = await db.card.create({
            data: {
                userId: req.user.id,
                holder_name: req.user.name,
                reference: createMapleradCard.data.reference,
                currency: currency,
                type: type,
                brand: brand,
                status: 'in_progress',
                createdAt: new Date()
            }
        });        

        const cardData = {
            id: card.id,
            currency: card.currency,
            status: card.status,
            type: card.type,
            brand: card.brand,
            reference: card.reference,
            card_reference: card.card_reference
        }

        res.status(201).json({
            message: 'Card creation in progress',
            success: true,
            status: 201,
            data: cardData
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
        const pageSize = parseInt(req.query.page_size) || 10;
        const skip = (page - 1) * pageSize;
        const limit = parseInt(req.query.limit) || pageSize;

        let cards = [];
        if(req.query.limit){
            cards = await db.card.findMany({
                where: { userId: req.user.id, status: 'active' },
                take: limit,
                skip: skip
            });
        }else{
            cards = await db.card.findMany({
                where: { userId: req.user.id, status: { not: 'deleted' } },
                take: pageSize,
                skip: skip
            });
        }
        

        if(!cards.length) {
            return res.status(400).json({
                message: 'No cards found',
                success: false,
                status: 400
            });
        }

        res.status(200).json({
            message: 'Retrieved all paginated cards successfully',
            success: true,
            status: 200,
            data: cards
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
    try {
        const card = await db.card.findUnique({
            where: { id: req.params.id, userId: req.user.id }
        });

        if(!card) {
            return res.status(400).json({
                message: 'Card not found',
                success: false,
                status: 400
            });
        }

        res.status(200).json({
            message: 'Card retrieved successfully',
            success: true,
            status: 200,
            data: card
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
            message: 'Card ID is required',
            success: false,
            status: 400
        });
    }
    try {
        const card = await db.card.findUnique({
            where: { id: req.params.id, userId: req.user.id }
        });
        if(!card) {
            return res.status(400).json({
                message: 'Card not found',
                success: false,
                status: 400
            });
        }
        if(card.cardNumber){
            const freezeMapleradCard = await cardService.freezeCard({
                card_id: card.cardNumber
            });
            if(!freezeMapleradCard) {
                return res.status(400).json({
                    message: 'Failed to freeze card',
                    success: false,
                    status: 400
                });
            }
        }
        
        await db.card.update({
            where: { id: req.params.id, userId: req.user.id },
            data: { status: 'deleted' }
        });
        res.status(200).json({
            message: 'Card deleted successfully"',
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

module.exports = router;