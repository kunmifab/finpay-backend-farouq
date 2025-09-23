const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../utils/db/prisma');
const cardService = require('../services/maplerad/cardService');
const { getVirtualAccountById, checkAccountRequestStatus } = require('../services/maplerad/mapleradCustomers');

require('dotenv').config();



function getWebhookSignature(svixId, svixTimestamp, body){
    // The 'body' parameter MUST be the raw request body as a string.
    const bodyString = Buffer.isBuffer(body) ? body.toString('utf8') : String(body || '');

    const signedContent = `${svixId}.${svixTimestamp}.${bodyString}`
    const secret = process.env.MAPLERAD_WEBHOOK_SECRET;
    if (!secret) {
        throw new Error('MAPLERAD_WEBHOOK_SECRET is not set');
    }
                    
    const secretPart = secret.includes('_') ? secret.split('_')[1] : secret;
    const secretBytes = Buffer.from(secretPart, "base64");                  

    const signature = crypto
                .createHmac('sha256', secretBytes)
                .update(signedContent)
                .digest('base64');

    return signature;
}

function extractV1(sigHeader) {                                            
    const h = String(sigHeader || '').trim();                              
    if (!h) return null;                                                   
    const tokens = h.split(' ').map(t => t.trim()).filter(Boolean);        
    for (const t of tokens) {                                              
        if (t.startsWith('v1,')) return t.slice(3);                        
        if (t.startsWith('v1=')) return t.slice(3);                        
        if (t === 'v1') continue; // edge case                             
    }                                                                        
    if (h.startsWith('v1,')) return h.slice(3);                            
    if (h.startsWith('v1=')) return h.slice(3);                            
    return null;                                                           
}                                                                          

async function webhookController(req, res){

    const rawBody = req.body
    const svixId = req.headers["svix-id"]
    const svixTimestamp = req.headers["svix-timestamp"]
    const svixSignatureHeader = req.headers["svix-signature"]

    if (!svixId || !svixTimestamp || !svixSignatureHeader) {
        return res.status(400).json({
            message: 'Missing required Svix headers',
            success: false,
            status: 400
        });
    }

    const svixSignature = extractV1(svixSignatureHeader);
    if (!svixSignature) {
        //Add logging
        return res.status(400).json({
            message: 'Missing v1 signature',
            success: false,
            status: 400
        });
    }

    let computed;
    try {
        computed = getWebhookSignature(svixId, svixTimestamp, rawBody);
    } catch (e) {
        return res.status(500).json({
            message: e.message || 'Failed to compute signature',
            success: false,
            status: 500
        });
    }

    const a = Buffer.from(computed, 'base64');
    const b = Buffer.from(svixSignature, 'base64');
    const valid = (a.length === b.length) && crypto.timingSafeEqual(a, b);

    if(!valid){
        return res.status(400).json({
            message: 'Invalid signature',
            success: false,
            status: 400
        });
    }

    let body;
    try {
        body = JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody || ''));
    } catch (e) {
        return res.status(400).json({
            message: 'Invalid JSON body',
            success: false,
            status: 400
        });
    }

    if(body.event === 'issuing.created.successful'){
        const reference = body.reference;
    
        console.log('Getting card');
        const getMapleradCard = await cardService.getCard({
            card_id: reference
        });
    
        let addr = null;
        if(getMapleradCard){
            const mapleradCard = getMapleradCard.data;
    
            if (mapleradCard?.address && Object.keys(mapleradCard.address).length > 0){
                addr = {
                    street: mapleradCard.address.street,
                    city: mapleradCard.address.city,
                    state: mapleradCard.address.state,
                    country: mapleradCard.address.country,
                    postalCode: mapleradCard.address.postal_code
                };
            }
    
            const fullPan = mapleradCard?.card_number ?? null;
            const firstSix = fullPan ? fullPan.slice(0, 6) : null;  
            const lastFour = fullPan ? fullPan.slice(-4) : null;
    
            const data = {
                status: mapleradCard?.status ? mapleradCard.status.toLowerCase() : null,
                cardNumber: mapleradCard.card_number ?? null,
                maskedPan: mapleradCard.masked_pan ?? null,
                expiry: mapleradCard.expiry ?? null,
                cvv: mapleradCard.cvv ?? null,
                balance: mapleradCard.balance ?? null,
                firstSix,
                lastFour,
                expiry_month: mapleradCard?.expiry?.split('/')?.[0] ?? null,
                expiry_year: mapleradCard?.expiry?.split('/')?.[1] ?? null
            };
    
            console.log('Updating card');
    
            // CHANGED: Resolve the card's ID first, allowing either `reference` or `card_reference`
            const card = await db.card.findFirst({ // CHANGED
                where: {                          // CHANGED
                    OR: [                         // CHANGED
                        { reference: reference }, // CHANGED
                        { card_reference: reference } // CHANGED
                    ]                             // CHANGED
                }                                 // CHANGED
            });                                   // CHANGED
    
            if (!card) {                          // CHANGED
                console.warn('No Card found for reference:', reference); // CHANGED
                // If you want to auto-create here, you need holder_name, userId, and createdAt.
                // See note below. For now, just exit gracefully to avoid P2025.
                return;                           // CHANGED
            }                                     // CHANGED
    
            // CHANGED: Update by unique `id`, and keep nested address upsert
            await db.card.update({                // CHANGED
                where: { id: card.id },           // CHANGED
                data: {                           // CHANGED
                    ...data,                      // CHANGED
                    ...(addr ? {                  // CHANGED
                        address: {                // CHANGED
                            upsert: {             // CHANGED
                                create: { ...addr },
                                update: { ...addr }
                            }
                        }
                    } : {})
                }
            });                                    // CHANGED
    
            console.log('Card updated successfully');
        }
    }else if(body.event === 'account.creation.successful'){
        console.log('Account creation successful', body);
        const reference = body.reference;
        const accountId = body.id;
        const virtualAccount = await db.account.findFirst({
            where: { providerRef: reference }
        });
        if(virtualAccount && virtualAccount.status == 'pending' && virtualAccount.currency == 'USD'){
            try {
                const account = await getVirtualAccountById(accountId);
                if(account){
                    await db.account.update({
                        where: { id: virtualAccount.id },
                        data: { 
                            status: 'active', 
                            accountHolder: account.account_name,
                            bankName: account.bank_name,
                            accountNumber: account.account_number,
                            routingNumber: null,
                            accountType: 'checkings',
                            meta: account
                        }
                    });
                }
            } catch (error) {
                console.log(error);
            }
        }
    }else if(body.event === 'transfer.successful'){
        console.log('Transfer successful', body);
        const reference = body.id;
        const transaction = await db.transaction.findFirst({
            where: { reference: reference }
        });
        if(transaction){
            await db.transaction.update({
                where: { id: transaction.id },
                data: { status: 'successful' }
            });

        }
    }else{
        console.log('Webhook received', body.event);
    }
    
    
    res.status(200).json({
        message: 'Webhook received successfully',
        success: true,
        status: 200
    });
}

router.post('/', (req, res) => {
    webhookController(req, res);
});

module.exports = router;
