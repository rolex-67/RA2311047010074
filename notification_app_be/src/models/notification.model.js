const mongoose = require('mongoose');
const { Log } = require('custom-logging-middleware');

// We log that the schema definition is starting, to adhere to logging rules
function initSchema() {
    Log('backend', 'debug', 'domain', 'Initializing Notification database schema');
    
    const notificationSchema = new mongoose.Schema({
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['info', 'alert', 'success', 'warning'],
            default: 'info'
        },
        isRead: {
            type: Boolean,
            default: false
        }
    }, {
        timestamps: true
    });

    return mongoose.model('Notification', notificationSchema);
}

module.exports = initSchema();
