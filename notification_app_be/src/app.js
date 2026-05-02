const express = require('express');
const cors = require('cors');
const { Log, requestLogger } = require('affordmed-logging-middleware');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

// Log application initialization as the first meaningful function
function initializeApp() {
    Log('backend', 'info', 'config', 'Initializing Express application setup');
    
    app.use(cors());
    app.use(express.json());
    
    // Add our custom request logger middleware
    app.use(requestLogger);

    // Routes
    app.use('/api/notifications', notificationRoutes);

    // Catch-all for unhandled routes
    app.use((req, res, next) => {
        Log('backend', 'warn', 'route', `Route not found: ${req.originalUrl}`);
        res.status(404).json({ message: 'Route not found' });
    });
}

initializeApp();

module.exports = app;
