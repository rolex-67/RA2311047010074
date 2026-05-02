const express = require('express');
const axios = require('axios');
const { Log } = require('affordmed-logging-middleware');
require('dotenv').config({ path: '../.env' }); 

const app = express();
const PORT = 3002;
const NOTIFICATION_API_URL = 'http://20.207.122.201/evaluation-service/notifications';

function getWeight(type) {
    switch (type) {
        case 'Placement': return 3;
        case 'Result': return 2;
        case 'Event': return 1;
        default: return 0;
    }
}

app.get('/priority-inbox', async (req, res) => {
    // MANDATORY LOGGING RULE: First function logic must invoke the middleware
    Log('backend', 'info', 'route', 'Init Priority Inbox API Request');

    const token = process.env.ACCESS_TOKEN;
    if (!token) {
        Log('backend', 'error', 'config', 'ACCESS_TOKEN not found');
        return res.status(500).json({ success: false, error: "ACCESS_TOKEN missing in .env" });
    }

    try {
        Log('backend', 'debug', 'route', 'Fetching notifications');
        
        const response = await axios.get(NOTIFICATION_API_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const notifications = response.data.notifications;
        Log('backend', 'info', 'route', `Fetched ${notifications.length} notifs`);

        Log('backend', 'debug', 'route', 'Sorting notifications');
        
        notifications.sort((a, b) => {
            const weightA = getWeight(a.Type);
            const weightB = getWeight(b.Type);

            if (weightA !== weightB) {
                return weightB - weightA;
            }

            const timeA = new Date(a.Timestamp).getTime();
            const timeB = new Date(b.Timestamp).getTime();
            return timeB - timeA;
        });

        const top10 = notifications.slice(0, 10);
        Log('backend', 'info', 'route', 'Calculated top 10');
        
        // Return JSON for Postman
        res.status(200).json({
            success: true,
            count: top10.length,
            priority_inbox: top10
        });

    } catch (error) {
        Log('backend', 'error', 'route', `Fetch failed: ${error.message}`.substring(0, 48));
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Priority Inbox API running on http://localhost:${PORT}/priority-inbox`);
});
