const NotificationService = require('../services/notification.service');
const { Log } = require('affordmed-logging-middleware');

class NotificationController {
    async createNotification(req, res) {
        Log('backend', 'info', 'controller', 'Received request to create a new notification');
        try {
            const { title, message, type } = req.body;
            
            if (!title || !message) {
                Log('backend', 'warn', 'handler', 'Validation failed: Missing title or message in request body');
                return res.status(400).json({ error: 'Title and message are required' });
            }

            const newNotification = await NotificationService.createNotification({ title, message, type });
            Log('backend', 'info', 'controller', 'Successfully processed create notification request');
            
            res.status(201).json(newNotification);
        } catch (error) {
            Log('backend', 'error', 'controller', `Error processing create request: ${error.message}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getNotifications(req, res) {
        Log('backend', 'info', 'controller', 'Received request to fetch all notifications');
        try {
            const notifications = await NotificationService.getAllNotifications();
            Log('backend', 'info', 'controller', `Returning ${notifications.length} notifications to client`);
            
            res.status(200).json(notifications);
        } catch (error) {
            Log('backend', 'error', 'controller', `Error processing fetch request: ${error.message}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async markNotificationAsRead(req, res) {
        const { id } = req.params;
        Log('backend', 'info', 'controller', `Received request to mark notification ${id} as read`);
        
        try {
            const updatedNotification = await NotificationService.markAsRead(id);
            
            if (!updatedNotification) {
                Log('backend', 'warn', 'handler', `Cannot mark as read: Notification ${id} not found`);
                return res.status(404).json({ error: 'Notification not found' });
            }

            Log('backend', 'info', 'controller', `Successfully marked notification ${id} as read`);
            res.status(200).json(updatedNotification);
        } catch (error) {
            Log('backend', 'error', 'controller', `Error processing update request: ${error.message}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new NotificationController();
