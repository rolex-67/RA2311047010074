const express = require('express');
const NotificationController = require('../controllers/notification.controller');
const { Log } = require('affordmed-logging-middleware');

const router = express.Router();

function initializeRoutes() {
    Log('backend', 'info', 'route', 'Registering notification API routes');
    
    // POST /api/notifications
    router.post('/', NotificationController.createNotification);
    
    // GET /api/notifications
    router.get('/', NotificationController.getNotifications);
    
    // PATCH /api/notifications/:id/read
    router.patch('/:id/read', NotificationController.markNotificationAsRead);
    
    Log('backend', 'debug', 'route', 'Notification API routes registered successfully');
}

initializeRoutes();

module.exports = router;
