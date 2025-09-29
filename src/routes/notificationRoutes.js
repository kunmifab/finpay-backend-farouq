const express = require('express');
const router = express.Router();
const db = require('../utils/db/prisma');
const { log } = require('../utils/logger');

router.get('/count', async (req, res) => {
    try {
        const totalNotifications = await db.notification.findMany({
            where: {
                userId: req.user.id
            }
        });

        const unreadNotifications = totalNotifications.filter(notification => notification.isRead === false);

        res.status(200).json({
            message: 'Retrieved notification successfully',
            success: true,
            status: 200,
            data: {
                total: totalNotifications.length,
                unread: unreadNotifications.length
            }
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false,
            status: 500
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const notification = await db.notification.findUnique({
            where: {
                userId: req.user.id,
                id: req.params.id
            }
        });

        if(!notification) {
            return res.status(404).json({
                message: 'Notification not found',
                success: false,
                status: 404
            });
        }

        const notificationData = {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            isRead: notification.isRead,
            link: notification.link
        };
        res.status(200).json({
            message: 'Retrieved notification successfully',
            success: true,
            status: 200,
            data: notificationData
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false,
            status: 500
        });
    }
});

router.put('/:id', async (req, res) => {
    if(!req.body || req.body === undefined) {
        return res.status(400).json({
            message: 'Please provide isRead',
            success: false,
            status: 400
        });
    }

    const { isRead } = req.body;

    if(typeof isRead !== 'boolean' || isRead === undefined) {
        return res.status(400).json({
            message: 'isRead must be a boolean',
            success: false,
            status: 400
        });
    }

    try {
        const notification = await db.notification.update({
            where: {
                userId: req.user.id,
                id: req.params.id
            },
            data: {
                isRead: isRead
            }
        });

        if(!notification) {
            return res.status(404).json({
                message: 'Failed to update notification',
                success: false,
                status: 404
            });
        }

        res.status(200).json({
            message: 'Notification updated successfully',
            success: true,
            status: 200,
            data: {
                id: notification.id,
                title: notification.title,
                message: notification.message,
                isRead: notification.isRead,
                link: notification.link
            }
        });
    } catch (error) {
        log.error({ err: error }, 'Failed to retrieve notification');
        res.status(500).json({
            message: error.message,
            success: false,
            status: 500
        });
    }
});

router.delete('/', async (req, res) => {
    try {
        const notifications = await db.notification.findMany({
            where: {
                userId: req.user.id
            }
        });

       if(notifications.length === 0) {
        return res.status(404).json({
            message: 'No notifications found',
            success: false,
            status: 404
        });
       }

       await db.notification.deleteMany({
        where: {
            userId: req.user.id
        }
       });

        res.status(200).json({
            message: 'Notifications deleted successfully',
            success: true,
            status: 200,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false,
            status: 500
        });
    }
});


module.exports = router;