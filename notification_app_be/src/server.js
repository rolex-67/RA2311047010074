require('dotenv').config();
const mongoose = require('mongoose');
const { Log } = require('custom-logging-middleware');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Evaluation_notifications';

async function startServer() {
    Log('backend', 'info', 'config', 'Starting server initialization process');
    
    try {
        Log('backend', 'info', 'db', 'Attempting database connection');
        await mongoose.connect(MONGO_URI);
        Log('backend', 'info', 'db', 'Successfully connected to MongoDB');

        app.listen(PORT, () => {
            Log('backend', 'info', 'config', `Server successfully running on port ${PORT}`);
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        Log('backend', 'fatal', 'db', `Critical database connection failure: ${error.message}`);
        console.error('Database connection failed', error);
        process.exit(1);
    }
}

startServer();
