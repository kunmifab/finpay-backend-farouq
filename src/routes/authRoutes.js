const express = require('express');
const router = express.Router();
const db = require('../utils/db/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/mailers');
const { renderTemplate } = require('../utils/templateEngine');
const authenticate = require('../middlewares/authenticate');
const { getRequestLogger } = require('../utils/logger');

const { postSignupQueue } = require('../job/queues');
router.post('/register', async (req, res) => {
    const log = getRequestLogger({ module: 'auth', handler: 'register' });
    if(!req.body) {
        return res.status(400).json(
            { message: 'Please provide all fields',
                success: false,
                status: 400
            });
    }
    if(!req.body.email || !req.body.password || !req.body.name || !req.body.phoneNumber) {
        return res.status(400).json(
            { message: 'All fields are required',
                success: false,
                status: 400
            });
    }
    const { 
        email, password, name, phoneNumber, accountType = "Freelancer",  
        countryCode = null , state = null , 
        address = null, country = null 
    } = req.body;

    if(await db.user.findUnique({ where: { email } })) {
        return res.status(400).json(
            { message: 'User already exists',
                success: false,
                status: 400
            });
    }
    try {
        if (typeof password !== 'string') {
            password = String(password);
        }
        if (typeof phoneNumber !== 'string') {
            phoneNumber = String(phoneNumber);
          }
        const hashedPassword = await bcrypt.hash(password, 10);
        const verify_email_code = Math.floor(1000 + Math.random() * 9000)
        const user = await db.user.create({
            data: { email, password: hashedPassword, name, phoneNumber, accountType, countryCode, state, address, country, verify_email_code }
        }); 

        try {
            let to = user.email;

            let html = renderTemplate("verify-email", {
                name: user.name,
                code: verify_email_code
            });
            await sendEmail({
                to: to,
                subject: "🎉 Verify your email",
                html: html
            });
        
        } catch (err) {
            log.warn({ err, userId: user.id }, 'Email send failed');
        }
        const token = jwt.sign({ 
                id: user.id, email: user.email, name: user.name, phone: user.phoneNumber 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRATION 
        });

        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phoneNumber,
            accountType: user.accountType,
            countryCode: user.countryCode,
            state: user.state,
            address: user.address,
            country: user.country
        };

        //create default balances
        const balance = await db.balance.createMany({
            data: [ {
                userId: user.id,
                currency: "USD",
                amount: 0
            },
            {
                userId: user.id,
                currency: "EUR",
                amount: 0
            },
            {
                userId: user.id,
                currency: "GBP",
                amount: 0
            },
            {
                userId: user.id,
                currency: "NGN",
                amount: 0
            }]
        });

        await postSignupQueue.add('post-signup', { userId: user.id });

        res.status(201).json({ 
            message: 'User registered successfully',
            success: true,
            status: 201,
            data: {
                token,
                user: userData
            }
        });
    } catch (error) {
        log.error({ err }, 'Registeration failed');
        res.status(500).json(
            { message: error.message,
                success: false,
                status: 500
            });
    }
});

router.post('/login', async (req, res) => {
    if(!req.body) {
        return res.status(400).json({
             message: 'Please provide email and password', 
             success: false, 
             status: 400 
            });
    }
    if(!req.body.email || !req.body.password) {
        return res.status(400).json({
             message: 'Please provide email and password!', 
             success: false, 
             status: 400 
            });
    }
    const { email, password } = req.body;

    try {
        const user = await db.user.findUnique({ where: { email } });
        if(!user) {
            return res.status(400).json(
                { 
                    message: 'Invalid credentials', 
                    success: false, 
                    status: 400 
            });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid) {
            return res.status(400).json({
                message: 'Invalid credentials', 
                success: false, 
                status: 400 
            });
        }
        const token = jwt.sign({ 
                id: user.id, email: user.email, name: user.name, phone: user.phone 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRATION
        });

        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone
        };
        res.status(200).json({ 
            message: 'Login successfully', 
            success: true, 
            status: 200,
            data: {
                token,
                user: userData
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

router.post('/logout', authenticate, async (req, res) => {
    const user = await db.user.findUnique({ where: { id: req.user.id } });
    if(!user) {
        return res.status(400).json({ 
            message: 'Invalid credentials', 
            success: false, 
            status: 400 
        });
    }
    const tokenBlacklist = [];
    tokenBlacklist.push(req.headers['x-auth-token']);
    return res.status(200).json({ 
        message: 'Logout successfully', 
        success: true, 
        status: 200 
    });
});

router.post('/verify-email', authenticate, async (req, res) => {
    if(!req.body || !req.body.code) {
        return res.status(400).json({ 
            message: 'Please provide code', 
            success: false, 
            status: 400 
        });
    }
    const { code } = req.body;

    if(typeof code !== 'number') {
        return res.status(400).json({ 
            message: 'Code must be a number', 
            success: false, status: 400 });
    }
    try {
        const user = await db.user.findUnique({ where: { id: req.user.id } });
        if(!user.verify_email_code || user.verify_email_code !== code) {
            return res.status(400).json({ 
                message: 'Invalid code', 
                success: false, status: 400 });
        }
        await db.user.update({ where: { id: req.user.id }, data: { verify_email: 1 } });
        return res.status(200).json({ 
            message: 'Email verified successfully', 
            success: true, 
            status: 200 
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

router.post('/password/reset', async (req, res) => {
    if(!req.body || !req.body.email || !req.body.old_password || !req.body.new_password) {
        return res.status(400).json({
            message: 'Please provide email, old password and new password',
            success: false,
            status: 400
        });
    }
    const { email, old_password, new_password } = req.body;
    const user = await db.user.findUnique({ where: { email } });
    
    bcrypt.compare(old_password, user.password, (err, result) => {
        if(err || !result) {
            return res.status(401).json({ 
                message: 'Invalid credentials', 
                success: false, 
                status: 401 
            });
        }
    });
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.user.update({ where: { email }, data: { password: hashedPassword } });
    const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        accountType: user.accountType,
        countryCode: user.countryCode,
        state: user.state,
        address: user.address,
        country: user.country
    };
    return res.status(200).json({ 
        message: 'Password reset successfully', 
        success: true, 
        status: 200,
        data: userData
    });
});

router.post('/send-verify-email', authenticate, async (req, res) => {
    
    const user = await db.user.findUnique({where: {id: req.user.id}});
    if(!user){
        return res.status(404).json({
            message: "User not found",
            status_code: 404
        });
    }

    if(user.verify_email == 1){
        return res.status(400).json({
            message: "Email already verified",
            status_code: 400
        });
    }

    let verify_email_code;
    if(!user.verify_email_code){
        verify_email_code = Math.floor(1000 + Math.random() * 9000)
        await db.user.update({where: {id: req.user.id}, data: {verify_email_code: verify_email_code}});
    }else{
        verify_email_code = user.verify_email_code;
    }
    
    //send verify email
    try {
        let to = user.email;

        let html = renderTemplate("verify-email", {
                name: user.name,
            code: verify_email_code
        });
        await sendEmail({
            to: to,
            subject: "🎉 Verify your email",
            html: html
        });
        console.log("Email sent successfully");
        return res.status(200).json({  
            success: true,
            message: "Verification code sent to your email. Please check your email and enter the code to continue",
            status_code: 200
        });
    } catch (err) {
        console.error("Email send failed:", err);
        return res.status(500).json({
            success: false,
            message: "Email send failed",
            status_code: 500
        });
    }
});

module.exports = router;