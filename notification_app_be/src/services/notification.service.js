const Notification = require('../models/notification.model');
const { Log } = require('custom-logging-middleware');

class NotificationService {
    async createNotification(data) {
        Log('backend', 'info', 'service', 'Initiating notification creation in service layer');
        try {
            Log('backend', 'debug', 'db', 'Executing database insert for new notification');
            const newNotification = new Notification(data);
            const savedNotification = await newNotification.save();
            Log('backend', 'info', 'service', `Notification created successfully with ID: ${savedNotification._id}`);
            return savedNotification;
        } catch (error) {
            Log('backend', 'error', 'db', `Database error during notification creation: ${error.message}`);
            throw error;
        }
    }

    async getAllNotifications() {
        Log('backend', 'info', 'service', 'Fetching all notifications from service layer');
        try {
            Log('backend', 'debug', 'db', 'Querying database for all notifications');
            const notifications = await Notification.find().sort({ createdAt: -1 });
            Log('backend', 'info', 'service', `Successfully retrieved ${notifications.length} notifications`);
            return notifications;
        } catch (error) {
            Log('backend', 'error', 'db', `Database error while fetching notifications: ${error.message}`);
            throw error;
        }
    }

    async markAsRead(id) {
        Log('backend', 'info', 'service', `Marking notification ${id} as read in service layer`);
        try {
            Log('backend', 'debug', 'db', `Executing database update for notification ${id}`);
            const updatedNotification = await Notification.findByIdAndUpdate(
                id,
                { isRead: true },
                { new: true }
            );
            
            if (!updatedNotification) {
                Log('backend', 'warn', 'service', `Notification ${id} not found for update`);
                return null;
            }
            
            Log('backend', 'info', 'service', `Notification ${id} successfully marked as read`);
            return updatedNotification;
        } catch (error) {
            Log('backend', 'error', 'db', `Database error during notification update: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new NotificationService();
