const express = require('express');
const router = express.Router();
const db = require('../utils/db/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/signup', async (req, res) => {
    if(!req.body) {
        return res.status(400).json(
            { message: 'Please provide all fields',
                success: false,
                status: 400
            });
    }
    if(!req.body.email || !req.body.password || !req.body.first_name || !req.body.last_name || !req.body.phone) {
        return res.status(400).json(
            { message: 'All fields are required',
                success: false,
                status: 400
            });
    }
    const { email, password, first_name, last_name, phone } = req.body;
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
        if (typeof phone !== 'string') {
            phone = String(phone);
          }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await db.user.create({
            data: { email, password: hashedPassword, first_name, last_name, phone }
        }); 
        res.status(201).json(
            { message: 'User created successfully',
                success: true,
                status: 201,
                data: user
            });
    } catch (error) {
        console.log(error);
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
                id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, phone: user.phone 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRATION
        });

        const userData = {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
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

router.post('/logout', async (req, res) => {
    const { token } = req.body;
    const user = await db.user.findUnique({ where: { token } });
    if(!user) {
        return res.status(401).json({ message: 'Invalid credentials', success: false, status: 401 });
    }
});

module.exports = router;